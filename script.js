import * as THREE from 'three';

// [필수] 본인의 구글 앱스 스크립트 배포 URL을 넣으세요.
const URL = 'https://script.google.com/macros/s/AKfycbyydXbPNKVzVMYhyO81BFXNVoHAp0SGoP6FXb59X3m87j4utAiDeLkeP6YexMSoqo2zXg/exec'; 

// 1. Three.js 배경 초기화 (이게 핵심입니다 형님!)
const initThree = () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 35;

    // 형상 (TorusKnot - 주황색 밧줄)
    const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xFF8C00, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.3 
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 마우스 움직임에 반응 (감도 조절)
    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.0005;
        mousey = (e.clientY - window.innerHeight / 2) * 0.0005;
    });

    function animate() {
        requestAnimationFrame(animate);
        mesh.rotation.x += 0.003 + mouseY;
        mesh.rotation.y += 0.003 + mouseX;
        renderer.render(scene, camera);
    }
    animate();

    // 창 크기 조절 대응
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
const initApply = () => {
    const form = document.getElementById('applyForm');
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button');
        btn.innerText = "SENDING...";
        btn.disabled = true;

        const data = Object.fromEntries(new FormData(form));
        data.action = 'submit';

        try {
            await fetch(URL, { method: 'POST', body: JSON.stringify(data) });
            alert("제출이 완료되었습니다! 행운을 빕니다.");
            location.href = 'index.html';
        } catch (err) {
            alert("제출 실패! 네트워크를 확인하세요.");
            btn.innerText = "SUBMIT APPLICATION";
            btn.disabled = false;
        }
    };
};

// 4. 조회 기능 (window객체에 직접 할당해야 HTML onclick에서 인식함)
window.checkStatus = async () => {
    const id = document.getElementById('cId').value;
    if (!id) return alert("학번을 입력하세요.");
    
    const div = document.getElementById('statusRes');
    div.style.display = 'block';
    div.innerHTML = "<p style='color:var(--o)'>데이터를 불러오는 중...</p>";

    try {
        const res = await fetch(`${URL}?action=check&id=${id}`).then(r => r.json());
        if (res.found) {
            div.innerHTML = `
                <div style="background:rgba(255,255,255,0.05); padding:25px; border-radius:15px; border: 1px solid var(--o); box-shadow: 0 0 20px rgba(255,140,0,0.2);">
                    <h3 style="color:var(--o); margin-top:0;">${res.name}님 지원 정보</h3>
                    <p><strong>합격 상태:</strong> <span style="color:${res.status === '지원 취소' ? 'red' : 'var(--o)'}">${res.status}</span></p>
                    <p><strong>면접 안내:</strong> ${res.interview}</p>
                    <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
                    <p style="font-size:0.9rem; line-height:1.6; opacity:0.8;"><strong>자기소개 요약:</strong><br>${res.intro}</p>
                    <p style="font-size:0.9rem; line-height:1.6; opacity:0.8;"><strong>AI 활용 계획:</strong><br>${res.aiPlan}</p>
                    
                    ${res.status !== '지원 취소' ? 
                        `<button type="button" onclick="cancelApp('${id}')" style="width:100%; border-color:#ff4444; color:#ff4444; height:50px; font-size:0.9rem; margin-top:20px; background:rgba(255,68,68,0.1);">WITHDRAW (지원 취소)</button>` 
                        : '<p style="color:#ff4444; font-weight:bold; text-align:center; margin-top:20px;">본 지원서는 취소되었습니다.</p>'}
                </div>`;
        } else {
            div.innerHTML = "<p style='color:red;'>일치하는 학번 정보가 없습니다.</p>";
        }
    } catch (err) {
        div.innerHTML = "<p style='color:red;'>조회 중 오류가 발생했습니다.</p>";
    }
};

// 5. 취소 기능 (실제 데이터 날리는 로직)
window.cancelApp = async (id) => {
    if (!confirm("정말로 지원을 취소하시겠습니까?\n취소 후에는 복구가 불가능합니다.")) return;

    try {
        const res = await fetch(URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'cancel', studentId: id })
        }).then(r => r.text());

        if (res === "OK" || res === "CANCEL_OK") {
            alert("지원이 정상적으로 취소되었습니다.");
            location.reload();
        } else {
            alert("취소 처리 중 문제가 발생했습니다.");
        }
    } catch (err) {
        alert("네트워크 오류로 취소에 실패했습니다.");
    }
};

// [필수] 모든 페이지 공통 초기화 로직
window.addEventListener('DOMContentLoaded', () => {
    initThree(); // 3D 배경 실행
    initPhone(); // 하이픈 로직 실행
    initApply(); // 지원서 제출 로직 실행
});
