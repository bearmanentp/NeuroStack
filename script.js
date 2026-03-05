import * as THREE from 'three';

// 1. 설정 (URL 필수 수정)
const URL = 'https://script.google.com/macros/s/AKfycbxDofOqA81c9gxr0itFIJarHNS8liA2pLIhipAO8JZZjSjrF62L8CZ-uC3Zl45L8cC0Qg/exec'; 
let rx = 0, ry = 0;

// ==========================================
// 2. Three.js 배경 (모바일 터치 대응)
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

    const mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(10, 3, 150, 16), new THREE.MeshBasicMaterial({ color: 0xFF8C00, wireframe: true, transparent: true, opacity: 0.25 }));
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
// 3. 전화번호 자동 하이픈 (010-0000-0000)
// ==========================================
const initPhoneMask = () => {
    document.addEventListener('input', (e) => {
        if (e.target.name === 'phone') {
            let v = e.target.value.replace(/\D/g, ''); // 숫자 이외 제거
            if (v.length > 11) v = v.slice(0, 11); // 최대 11자
            
            // 실시간 포맷팅 로직
            if (v.length > 6) {
                v = v.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
            } else if (v.length > 3) {
                v = v.replace(/(\d{3})(\d+)/, '$1-$2');
            }
            e.target.value = v;
        }
    });
};

// ==========================================
// 4. 지원서 제출 및 관리자/조회 기능
// ==========================================
const initFormLogic = () => {
    const applyForm = document.getElementById('applyForm');
    if (applyForm) {
        applyForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            btn.innerText = "전송 중..."; btn.disabled = true;
            
            const formData = Object.fromEntries(new FormData(e.target));
            formData.action = 'submit';

            try {
                const res = await fetch(URL, { method: 'POST', body: JSON.stringify(formData) });
                if (res.ok) {
                    alert("성공적으로 제출되었습니다!");
                    location.href = 'index.html';
                }
            } catch (err) {
                alert("제출 오류! 권한 설정을 확인하세요.");
                btn.innerText = "SUBMIT"; btn.disabled = false;
            }
        };
    }
};

// 상태 조회 (check.html)
window.checkStatus = async () => {
    const id = document.getElementById('cId').value;
    const res = await fetch(`${URL}?action=check&id=${id}`).then(r => r.json());
    const div = document.getElementById('statusRes');
    div.style.display = 'block';
    div.innerHTML = res.found ? `<h3>결과: ${res.status}</h3><p>면접: ${res.interview}</p>` : "정보 없음";
};

// 관리자 데이터 불러오기 (admin.html)
window.fetchCurrentStatus = async () => {
    const id = document.getElementById('tId').value;
    const res = await fetch(`${URL}?action=adminFetch&id=${id}`).then(r => r.json());
    if(res.found) {
        document.getElementById('edit-area').style.display = 'block';
        document.getElementById('targetName').innerText = `대상자: ${res.name}`;
        document.getElementById('sInterview').value = res.interview;
        document.getElementById('sFinal').value = res.status;
    } else alert("지원자를 찾을 수 없습니다.");
};

// 관리자 업데이트 (admin.html)
window.updateStatus = async () => {
    const data = { 
        action: 'adminUpdate', 
        targetId: document.getElementById('tId').value, 
        interviewStatus: document.getElementById('sInterview').value, 
        finalStatus: document.getElementById('sFinal').value 
    };
    await fetch(URL, { method: 'POST', body: JSON.stringify(data) });
    alert("업데이트 완료!"); location.reload();
};

// 초기화 실행
window.addEventListener('DOMContentLoaded', () => {
    initThree();
    initPhoneMask();
    initFormLogic();
});

// 관리자 단축키
window.addEventListener('keydown', (e) => {
    if(e.ctrlKey && e.altKey && e.key.toLowerCase() === 'l') location.href = 'admin.html';
});
