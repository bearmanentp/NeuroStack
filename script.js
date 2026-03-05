import * as THREE from 'three';

const URL = 'https://script.google.com/macros/s/AKfycbxxCwKOjSfmLEQjxdC9wRHpLF_QcAQOEpAeOvCT1aDos8-Ma8-91VdK97MOypdtNuOwdg/exec'; 

// 1. Three.js 배경 (터치/마우스 반응 로직 추가)
const initThree = () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 35;

    // 형상 (TorusKnot)
    const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xFF8C00, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.3 
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // [핵심] 마우스 및 터치 위치 추적 변수
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    // 마우스 이동 이벤트
    const onPointerMove = (event) => {
        // 클라이언트 좌표를 중심점(0,0) 기준으로 -1 ~ 1 사이 값으로 변환
        targetX = (event.clientX - windowHalfX) * 0.001;
        targetY = (event.clientY - windowHalfY) * 0.001;
    };

    // 터치 이동 이벤트 (모바일 대응)
    const onTouchMove = (event) => {
        if (event.touches.length > 0) {
            targetX = (event.touches[0].clientX - windowHalfX) * 0.001;
            targetY = (event.touches[0].clientY - windowHalfY) * 0.001;
        }
    };

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onTouchMove);

    function animate() {
        requestAnimationFrame(animate);

        // 기본 회전 + 마우스 위치에 따른 가중치 회전
        mesh.rotation.x += 0.003 + (targetY * 0.5); 
        mesh.rotation.y += 0.003 + (targetX * 0.5);

        // 부드러운 복귀 효과를 원한다면 감쇠 로직을 넣을 수도 있지만, 
        // 형님 스타일엔 즉각 반응하는 이 방식이 더 날것의 느낌이 날 겁니다.

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

// 2. 나머지 로직 (전화번호, 제출, 조회, 취소) - 기존과 동일하게 유지
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

document.getElementById('applyForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerText = "SENDING..."; btn.disabled = true;
    const data = Object.fromEntries(new FormData(e.target));
    data.action = 'submit';
    try {
        await fetch(URL, { method: 'POST', body: JSON.stringify(data) });
        alert("제출 완료!"); location.href = 'index.html';
    } catch (err) { alert("오류!"); btn.innerText = "SUBMIT"; btn.disabled = false; }
});

window.checkStatus = async () => {
    const id = document.getElementById('cId').value;
    if (!id) return alert("학번 입력 필수!");
    const div = document.getElementById('statusRes');
    div.style.display = 'block';
    div.innerHTML = "<p>조회 중...</p>";
    try {
        const res = await fetch(`${URL}?action=check&id=${id}`).then(r => r.json());
        if (res.found) {
            div.innerHTML = `
                <div style="background:rgba(255,255,255,0.05); padding:20px; border-radius:10px; border:1px solid var(--o);">
                    <h3 style="color:var(--o)">${res.name}님 지원 상세</h3>
                    <p><strong>합격 여부:</strong> ${res.status}</p>
                    <p><strong>면접 안내:</strong> ${res.interview}</p>
                    <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
                    <div style="font-size:0.9rem; line-height:1.6; text-align:left;">
                        <p><strong>🎮 게임개발경험:</strong><br>${res.gameExp || '없음'}</p>
                        <p><strong>📝 자기소개:</strong><br>${res.intro}</p>
                        <p><strong>📜 자격증:</strong><br>${res.license || '없음'}</p>
                        <p><strong>💡 가입사유:</strong><br>${res.reason}</p>
                        <p><strong>🚀 하고싶은것:</strong><br>${res.wishList}</p>
                        <p><strong>🤖 AI활용계획:</strong><br>${res.aiPlan}</p>
                    </div>
                    ${res.status !== '지원 취소' ? `<button onclick="cancelApp('${id}')" style="width:100%; border-color:#ff4444; color:#ff4444; margin-top:20px;">지원 취소하기</button>` : '<p style="color:red; font-weight:bold; margin-top:20px;">취소된 지원입니다.</p>'}
                </div>`;
        } else div.innerText = "정보 없음";
    } catch (err) { div.innerText = "에러!"; }
};

window.cancelApp = async (id) => {
    if (!confirm("정말 취소?")) return;
    try {
        const res = await fetch(URL, { method: 'POST', body: JSON.stringify({ action: 'cancel', studentId: id }) }).then(r => r.text());
        if (res === "CANCEL_OK") { alert("취소됨"); location.reload(); }
    } catch (err) { alert("실패"); }
};

// 모든 페이지 공통 초기화
window.onload = () => {
    initThree();
    initPhone();
};
