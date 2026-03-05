import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// 구글 앱스 스크립트 URL
const URL = 'https://script.google.com/macros/s/AKfycbxxCwKOjSfmLEQjxdC9wRHpLF_QcAQOEpAeOvCT1aDos8-Ma8-91VdK97MOypdtNuOwdg/exec'; 

// 1. Three.js 배경 (원본 로직 유지)
const initThree = () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 35;

    const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xFF8C00, wireframe: true, transparent: true, opacity: 0.3 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let targetX = 0, targetY = 0;
    window.addEventListener('mousemove', (e) => {
        targetX = (e.clientX - window.innerWidth / 2) * 0.001;
        targetY = (e.clientY - window.innerHeight / 2) * 0.001;
    });

    function animate() {
        requestAnimationFrame(animate);
        mesh.rotation.x += 0.003 + targetY;
        mesh.rotation.y += 0.003 + targetX;
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

// 2. 전화번호 하이픈 (제공 로직 이식)
const initPhone = () => {
    document.addEventListener('input', (e) => {
        if (e.target.name === 'phone') {
            let v = e.target.value.replace(/\D/g, '').slice(0, 11);
            if (v.length > 6) v = v.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
            else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, '$1-$2');
            e.target.value = v;
        }
    });
};

// 3. 지원서 제출 (제공 로직 이식)
const initApply = () => {
    const form = document.getElementById('applyForm');
    if (!form) return;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button');
        btn.innerText = "SENDING..."; btn.disabled = true;
        const data = Object.fromEntries(new FormData(form));
        data.action = 'submit';
        try {
            await fetch(URL, { method: 'POST', body: JSON.stringify(data) });
            alert("제출 완료!"); location.href = 'index.html';
        } catch (err) { alert("제출 실패!"); btn.innerText = "SUBMIT"; btn.disabled = false; }
    };
};

// 4. 조회 및 취소 (전역 함수 이식)
window.checkStatus = async () => {
    const id = document.getElementById('cId').value;
    if (!id) return alert("학번 입력해라");
    const div = document.getElementById('statusRes');
    div.style.display = 'block';
    div.innerHTML = "<p style='color:var(--o)'>조회 중...</p>";
    try {
        const res = await fetch(`${URL}?action=check&id=${id}`).then(r => r.json());
        if (res.found) {
            div.innerHTML = `
                <div style="background:rgba(255,255,255,0.05); padding:20px; border-radius:10px; border:1px solid var(--o); margin-top:20px;">
                    <h3 style="color:var(--o)">${res.name}님 정보</h3>
                    <p>상태: ${res.status}</p>
                    <p>면접: ${res.interview}</p>
                    <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
                    <div style="font-size:0.8rem; opacity:0.8; text-align:left;">
                        <p>경험: ${res.gameExp}</p>
                        <p>AI계획: ${res.aiPlan}</p>
                    </div>
                    ${res.status !== '지원 취소' ? `<button onclick="cancelApp('${id}')" style="width:100%; color:red; margin-top:15px; height:45px; font-size:0.9rem;">취소하기</button>` : ''}
                </div>`;
        } else div.innerText = "정보 없음";
    } catch (e) { div.innerText = "에러 발생"; }
};

window.cancelApp = async (id) => {
    if (!confirm("진짜 취소?")) return;
    try {
        const res = await fetch(URL, { method: 'POST', body: JSON.stringify({ action: 'cancel', studentId: id }) }).then(r => r.text());
        if (res === "CANCEL_OK") { alert("취소됨"); location.reload(); }
    } catch (e) { alert("취소 실패"); }
};

window.addEventListener('DOMContentLoaded', () => {
    initThree(); 
    initPhone();
    initApply();
});
