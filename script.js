import * as THREE from 'three';

// 1. Three.js 배경 (모든 페이지 공통)
const canvas = document.getElementById('bg-canvas');
if (canvas) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geo = new THREE.TorusKnotGeometry(10, 3, 100, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xFF8C00, wireframe: true, transparent: true, opacity: 0.1 });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    camera.position.z = 30;

    function animate() {
        requestAnimationFrame(animate);
        mesh.rotation.y += 0.002;
        renderer.render(scene, camera);
    }
    animate();
}

// 2. API 로직
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw6lfyrYcxbzOo1QYkMrjH94R7k4YlaqhfkDAwntaBTz91RzwkVGJDiHUggNgfNwT7pbA/exec';

// 지원 제출
const applyForm = document.getElementById('applyForm');
if (applyForm) {
    applyForm.onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        data.action = "submit";
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(data) });
        alert("지원이 완료되었습니다!");
        location.href = "index.html";
    };
}

// 상태 조회
window.checkStatus = async () => {
    const id = document.getElementById('cId').value;
    const name = document.getElementById('cName').value;
    const res = await fetch(`${SCRIPT_URL}?action=check&id=${id}&name=${name}`);
    const json = await res.json();
    const div = document.getElementById('statusRes');
    div.style.display = "block";
    div.innerHTML = json.found ? `<h3>${name}님 결과: ${json.status}</h3><p>면접 상태: ${json.interview}</p>` : "일치하는 정보가 없습니다.";
};
