import * as THREE from 'three';

// 1. 설정 (URL 필수 수정)
const URL = 'https://script.google.com/macros/s/AKfycbx5Z8E18sLXW2lue_UaiPgI0QfPiODE7AhF_LHUSpRa8hXHbehOb78QZkjk0WqheYLSyQ/exec'; 
let rx = 0, ry = 0;

// ==========================================
// 2. Three.js (모바일 터치 & 반응형)
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
// 3. 폼 로직 (전화번호 하이픈 & 제출)
// ==========================================
const initForm = () => {
    // 자동 하이픈
    document.addEventListener('input', (e) => {
        if (e.target.name === 'phone') {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            if (v.length > 6) v = v.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
            else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, '$1-$2');
            e.target.value = v;
        }
    });

    // 지원서 제출
    const applyForm = document.getElementById('applyForm');
    if (applyForm) {
        applyForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            btn.innerText = "SENDING..."; btn.disabled = true;
            
            try {
                await fetch(URL, { method: 'POST', body: JSON.stringify({ ...Object.fromEntries(new FormData(e.target)), action: 'submit' }) });
                alert("제출 성공! 3월 10일에 결과가 나옵니다.");
                location.href = 'index.html';
            } catch (err) {
                alert("제출 실패. 권한 설정을 확인하세요.");
                btn.innerText = "SUBMIT"; btn.disabled = false;
            }
        };
    }
};

// ==========================================
// 4. 결과 조회 및 관리자 기능
// ==========================================
window.checkStatus = async () => {
    const id = document.getElementById('cId').value, name = document.getElementById('cName').value;
    const div = document.getElementById('statusRes');
    if (!id || !name) return alert("학번과 이름을 입력하세요.");
    
    div.style.display = 'block'; div.innerText = "조회 중...";
    const res = await fetch(`${URL}?action=check&id=${id}&name=${name}`).then(r => r.json());
    div.innerHTML = res.found ? `<h3>${name}님 결과: ${res.status}</h3><p>면접: ${res.interview}</p>` : "정보 없음";
};

window.fetchCurrentStatus = async () => {
    const id = document.getElementById('tId').value;
    const res = await fetch(`${URL}?action=adminFetch&id=${id}`).then(r => r.json());
    if(res.found) {
        document.getElementById('edit-area').style.display = 'block';
        document.getElementById('targetName').innerText = `대상자: ${res.name}`;
        document.getElementById('sInterview').value = res.interview;
        document.getElementById('sFinal').value = res.status;
    } else alert("조회 실패");
};

window.updateStatus = async () => {
    const data = { action: 'adminUpdate', targetId: document.getElementById('tId').value, 
                   interviewStatus: document.getElementById('sInterview').value, finalStatus: document.getElementById('sFinal').value };
    await fetch(URL, { method: 'POST', body: JSON.stringify(data) });
    alert("수정 완료!"); location.reload();
};

// ==========================================
// 5. 초기화 및 단축키
// ==========================================
window.addEventListener('DOMContentLoaded', () => { initThree(); initForm(); });
window.addEventListener('keydown', (e) => {
    if(e.ctrlKey && e.altKey && e.key.toLowerCase() === 'l') location.href = 'admin.html';
});
