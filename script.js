import * as THREE from 'three';

// 1. 설정 및 변수
const URL = 'https://script.google.com/macros/s/AKfycbx5Z8E18sLXW2lue_UaiPgI0QfPiODE7AhF_LHUSpRa8hXHbehOb78QZkjk0WqheYLSyQ/exec'; // 여기에 구글 웹앱 URL 반드시 넣으세요!
let rx = 0, ry = 0;

// ==========================================
// 2. Three.js 배경 (모바일 반응형 & 터치)
// ==========================================
const initThree = () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 35;

    const geo = new THREE.TorusKnotGeometry(10, 3, 150, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xFF8C00, wireframe: true, transparent: true, opacity: 0.25 });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const handleMove = (e) => {
        const p = e.touches ? e.touches[0] : e;
        ry = (p.clientX - window.innerWidth / 2) * 0.0008;
        rx = (p.clientY - window.innerHeight / 2) * 0.0008;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: true });

    function animate() {
        requestAnimationFrame(animate);
        mesh.rotation.y += (ry - mesh.rotation.y) * 0.05 + 0.004;
        mesh.rotation.x += (rx - mesh.rotation.x) * 0.05;
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

// ==========================================
// 3. 지원서 제출 및 전화번호 하이픈
// ==========================================
const initFormLogic = () => {
    // 전화번호 자동 하이픈 (010-0000-0000)
    document.addEventListener('input', (e) => {
        if (e.target.name === 'phone') {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            if (v.length > 6) v = v.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
            else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, '$1-$2');
            e.target.value = v;
        }
    });

    // 지원 제출 (apply.html)
    const applyForm = document.getElementById('applyForm');
    if (applyForm) {
        applyForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            btn.innerText = "제출 중...";
            btn.disabled = true;
            
            const data = { ...Object.fromEntries(new FormData(e.target)), action: 'submit' };
            try {
                await fetch(URL, { method: 'POST', body: JSON.stringify(data) });
                alert("제출 완료! 3월 10일에 연락드립니다.");
                location.href = 'index.html';
            } catch (err) {
                alert("제출 실패. 다시 시도해주세요.");
                btn.innerText = "SUBMIT";
                btn.disabled = false;
            }
        };
    }
};

// ==========================================
// 4. 조회 및 관리자 기능 (조회 후 수정 로직 포함)
// ==========================================

// 지원자 결과 조회 (check.html)
window.checkStatus = async () => {
    const id = document.getElementById('cId').value;
    const name = document.getElementById('cName').value;
    const div = document.getElementById('statusRes');
    if (!id || !name) return alert("정보를 모두 입력하세요.");
    
    div.style.display = 'block'; div.innerText = "조회 중...";
    try {
        const res = await fetch(`${URL}?action=check&id=${id}&name=${name}`).then(r => r.json());
        div.innerHTML = res.found ? `<h3>${name}님 결과: ${res.status}</h3><p>면접 상태: ${res.interview}</p>` : "정보를 찾을 수 없습니다.";
    } catch(e) { div.innerText = "에러 발생"; }
};

// [ADMIN] 현재 상태 불러오기 (admin.html)
window.fetchCurrentStatus = async () => {
    const id = document.getElementById('tId').value;
    if(!id) return alert("학번을 입력하세요.");

    const res = await fetch(`${URL}?action=adminFetch&id=${id}`);
    const data = await res.json();

    if(data.found) {
        document.getElementById('edit-area').style.display = 'block';
        document.getElementById('targetName').innerText = `대상자: ${data.name} (현재: ${data.interview} / ${data.status})`;
        document.getElementById('sInterview').value = data.interview;
        document.getElementById('sFinal').value = data.status;
    } else {
        alert("해당 학번의 지원자를 찾을 수 없습니다.");
        document.getElementById('edit-area').style.display = 'none';
    }
};

// [ADMIN] 상태 업데이트 (admin.html)
window.updateStatus = async () => {
    const targetId = document.getElementById('tId').value;
    const data = {
        action: 'adminUpdate',
        targetId: targetId,
        interviewStatus: document.getElementById('sInterview').value,
        finalStatus: document.getElementById('sFinal').value
    };

    if(!confirm("수정하시겠습니까?")) return;

    try {
        await fetch(URL, { method: 'POST', body: JSON.stringify(data) });
        alert("업데이트 완료!");
        location.reload();
    } catch (e) { alert("업데이트 실패"); }
};

// ==========================================
// 5. 공통 초기화 및 단축키
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    initThree();
    initFormLogic();
});

window.addEventListener('keydown', (e) => {
    if(e.ctrlKey && e.altKey && e.key.toLowerCase() === 'l') location.href = 'admin.html';
});
