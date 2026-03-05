import * as THREE from 'three';

// [필수] 본인의 구글 앱스 스크립트 배포 URL을 넣으세요.
const URL = 'https://script.google.com/macros/s/AKfycbyydXbPNKVzVMYhyO81BFXNVoHAp0SGoP6FXb59X3m87j4utAiDeLkeP6YexMSoqo2zXg/exec'; 

// 1. Three.js 배경 초기화
const initThree = () => {
    const canvas = document.querySelector('#bg-canvas');
    if (!canvas) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 30;

    const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xFF8C00, wireframe: true, transparent: true, opacity: 0.3 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    function animate() {
        requestAnimationFrame(animate);
        mesh.rotation.x += 0.003;
        mesh.rotation.y += 0.003;
        renderer.render(scene, camera);
    }
    animate();
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

// 2. 전화번호 하이픈 자동생성
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

// 3. 지원서 제출 로직
document.getElementById('applyForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerText = "SENDING..."; btn.disabled = true;
    const data = Object.fromEntries(new FormData(e.target));
    data.action = 'submit';
    
    try {
        await fetch(URL, { method: 'POST', body: JSON.stringify(data) });
        alert("제출이 완료되었습니다!");
        location.href = 'index.html';
    } catch (err) {
        alert("제출 실패! 네트워크를 확인하세요.");
        btn.innerText = "SUBMIT APPLICATION"; btn.disabled = false;
    }
});

// 4. 조회 기능
window.checkStatus = async () => {
    const id = document.getElementById('cId').value;
    if(!id) return alert("학번을 입력하세요.");
    
    const div = document.getElementById('statusRes');
    div.style.display = 'block';
    div.innerHTML = "조회 중...";

    try {
        const res = await fetch(`${URL}?action=check&id=${id}`).then(r => r.json());
        if (res.found) {
            div.innerHTML = `
                <div style="background:rgba(255,255,255,0.05); padding:20px; border-radius:10px; border: 1px solid var(--o);">
                    <h3 style="color:var(--o)">${res.name}님 지원 정보</h3>
                    <p><strong>합격 여부:</strong> ${res.status}</p>
                    <p><strong>면접 안내:</strong> ${res.interview}</p>
                    <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
                    <p style="font-size:0.9rem;"><strong>자기소개:</strong><br>${res.intro}</p>
                    ${res.status !== '지원 취소' ? 
                        `<button onclick="cancelApp('${id}')" style="width:100%; border-color:#ff4444; color:#ff4444; height:45px; font-size:0.8rem; margin-top:15px;">지원 취소하기</button>` 
                        : '<p style="color:red; font-weight:bold;">취소된 지원입니다.</p>'}
                </div>`;
        } else {
            div.innerText = "정보를 찾을 수 없습니다.";
        }
    } catch (err) { div.innerText = "조회 오류 발생."; }
};

// 5. 취소 기능
window.cancelApp = async (id) => {
    if (!confirm("정말로 지원을 취소하시겠습니까?")) return;
    try {
        await fetch(URL, { method: 'POST', body: JSON.stringify({ action: 'cancel', studentId: id }) });
        alert("성공적으로 취소되었습니다.");
        location.reload();
    } catch (err) { alert("취소 실패."); }
};

// 로드 시 실행
window.onload = () => { initThree(); initPhone(); };
