import * as THREE from 'three';

// 1. Three.js 설정 (모바일 대응)
const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 35;

// 오브젝트 생성
const geo = new THREE.TorusKnotGeometry(10, 3, 150, 16);
const mat = new THREE.MeshBasicMaterial({ color: 0xFF8C00, wireframe: true, transparent: true, opacity: 0.2 });
const mesh = new THREE.Mesh(geo, mat);
scene.add(mesh);

// 2. 모바일 터치 및 마우스 반응
let targetRotX = 0, targetRotY = 0;
const handleMove = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    targetRotY = (x - window.innerWidth / 2) * 0.001;
    targetRotX = (y - window.innerHeight / 2) * 0.001;
};
window.addEventListener('mousemove', handleMove);
window.addEventListener('touchmove', handleMove);

function animate() {
    requestAnimationFrame(animate);
    mesh.rotation.y += (targetRotY - mesh.rotation.y) * 0.05 + 0.003;
    mesh.rotation.x += (targetRotX - mesh.rotation.x) * 0.05;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 3. API 통신 로직
const SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL'; // 여기에 구글 웹앱 주소 넣으세요!

// 지원서 제출 (apply.html 전용)
const applyForm = document.getElementById('applyForm');
if (applyForm) {
    applyForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.innerText = "전송 중...";
        const data = Object.fromEntries(new FormData(e.target).entries());
        data.action = "submit";
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) });
        alert("지원이 완료되었습니다!");
        location.href = "index.html";
    };
}

// 상태 조회 (check.html 전용)
window.checkStatus = async () => {
    const id = document.getElementById('cId').value;
    const name = document.getElementById('cName').value;
    if(!id || !name) return alert("정보를 입력하세요.");
    
    const div = document.getElementById('statusRes');
    div.style.display = "block";
    div.innerText = "조회 중...";

    const res = await fetch(`${SCRIPT_URL}?action=check&id=${id}&name=${name}`);
    const json = await res.json();
    
    if(json.found) {
        div.innerHTML = `<h3>${name}님 결과: ${json.status}</h3><p>면접 상태: ${json.interview}</p>`;
    } else {
        div.innerText = "정보를 찾을 수 없습니다.";
    }
};

// 관리자 업데이트 (admin.html 전용)
window.updateStatus = async () => {
    const data = {
        action: "adminUpdate",
        targetId: document.getElementById('tId').value,
        interviewStatus: document.getElementById('sInterview').value,
        finalStatus: document.getElementById('sFinal').value
    };
    await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) });
    alert("시트에 반영되었습니다!");
};

// 비밀 단축키 (Ctrl+Alt+L)
window.addEventListener('keydown', (e) => {
    if(e.ctrlKey && e.altKey && e.key === 'l') location.href = 'admin.html';
});
