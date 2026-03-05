// [주의] import 주소를 아래처럼 명확하게 박아야 에러가 안 납니다.
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const URL = 'https://script.google.com/macros/s/AKfycbxxCwKOjSfmLEQjxdC9wRHpLF_QcAQOEpAeOvCT1aDos8-Ma8-91VdK97MOypdtNuOwdg/exec'; 

// 1. Three.js 배경 (무조건 뜨게 만드는 로직)
const initThree = () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) {
        console.error("캔버스가 없다 새끼야! HTML에 <canvas id='bg-canvas'></canvas> 넣었냐?");
        return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        antialias: true, 
        alpha: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 35;

    // 형상 (TorusKnot - 형님이 보셨던 그 주황색 밧줄)
    const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xFF8C00, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.3 
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 마우스 반응 로직
    let targetX = 0;
    let targetY = 0;
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

// 2. 전화번호 하이픈
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

// 3. 지원서 제출
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

// 4. 조회 및 취소 (전역 함수 등록)
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
                <div style="background:rgba(255,255,255,0.05); padding:20px; border-radius:10px; border:1px solid var(--o);">
                    <h3 style="color:var(--o)">${res.name}님 정보</h3>
                    <p>상태: ${res.status}</p>
                    <p>면접: ${res.interview}</p>
                    <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
                    <div style="font-size:0.8rem; opacity:0.8;">
                        <p>경험: ${res.gameExp}</p>
                        <p>AI계획: ${res.aiPlan}</p>
                    </div>
                    ${res.status !== '지원 취소' ? `<button onclick="cancelApp('${id}')" style="width:100%; color:red; margin-top:15px;">취소하기</button>` : ''}
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

// [필수] 페이지 로드되자마자 실행
window.addEventListener('DOMContentLoaded', () => {
    initThree(); 
    initPhone();
    initApply();
});
