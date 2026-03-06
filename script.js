import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// 구글 앱스 스크립트 URL
const URL = 'https://script.google.com/macros/s/AKfycbxaxRsgUaE1fZZ_T6XglZTyMqIO6_jRwV3L931k9BFMEbQsboXdG7D6iE24U-rMzLdOpg/exec'; 

// 1. Three.js 배경: 뇌 구조(Neural Network Nodes) 스타일
const initThree = () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 15;

    // --- 신경망 노드(Particles) 생성 ---
    const particlesCount = 200; 
    const positions = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount; i++) {
        // 구체 형태로 분포시켜 뇌의 유기적인 구조 형상화
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 8 * Math.pow(Math.random(), 0.7); 
        
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xFF8C00, // NEUROSTACK 오렌지 컬러
        size: 0.12,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // --- 마우스 및 터치 인터랙션 로직 ---
    let targetX = 0, targetY = 0;
    let mouseX = 0, mouseY = 0;

    const handleMove = (x, y) => {
        // 좌표 정규화 (-0.5 ~ 0.5)
        mouseX = (x - window.innerWidth / 2) * 0.005;
        mouseY = (y - window.innerHeight / 2) * 0.005;
    };

    window.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    function animate() {
        requestAnimationFrame(animate);

        // 부드러운 관성 회전 효과
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        particleSystem.rotation.y += 0.0015 + targetX * 0.05;
        particleSystem.rotation.x += 0.001 + targetY * 0.05;

        // 부유하는 느낌의 미세 파동
        const time = Date.now() * 0.001;
        particleSystem.position.y = Math.sin(time * 0.5) * 0.15;

        renderer.render(scene, camera);
    }
    animate();

    // 리사이즈 대응
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

// 2. 전화번호 하이픈 자동 생성
const initPhone = () => {
    document.addEventListener('input', (e) => {
        if (e.target.name === 'phone') {
            let v = e.target.value.replace(/\D/g, '').slice(0, 11);
            if (v.length > 10) v = v.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
            else if (v.length > 6) v = v.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
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
        btn.innerText = "SENDING..."; btn.disabled = true;
        const data = Object.fromEntries(new FormData(form));
        data.action = 'submit';
        try {
            await fetch(URL, { method: 'POST', body: JSON.stringify(data) });
            alert("제출 완료!"); location.href = 'index.html';
        } catch (err) { 
            alert("제출 실패!"); 
            btn.innerText = "SUBMIT"; 
            btn.disabled = false; 
        }
    };
};

// 4. 상태 조회 전역 함수
window.checkStatus = async () => {
    const id = document.getElementById('cId').value;
    if (!id) return alert("학번을 입력해주세요.");
    
    const div = document.getElementById('statusRes');
    div.style.display = 'block';
    div.innerHTML = "<p style='color:var(--o)'>조회 중...</p>";
    
    try {
        const res = await fetch(`${URL}?action=check&id=${id}`).then(r => r.json());
        if (res.found) {
            div.innerHTML = `
                <div style="background:rgba(255,255,255,0.05); padding:20px; border-radius:15px; border:1px solid var(--o); margin-top:20px; backdrop-filter:blur(10px);">
                    <h3 style="color:var(--o); margin-top:0;">${res.name}님 정보</h3>
                    <p>상태: <strong>${res.status}</strong></p>
                    <p>면접일정: 3월 9일 1층 AI융합실</p>
                    <hr style="border:0; border-top:1px solid rgba(255,255,255,0.1); margin:15px 0;">
                    <div style="font-size:0.85rem; opacity:0.8; text-align:left; line-height:1.6;">
                        <p>지원분야: ${res.field || '미지정'}</p>
                    </div>
                    ${res.status !== '지원 취소' ? `<button onclick="cancelApp('${id}')" style="width:100%; color:#ff4444; border-color:#ff4444; margin-top:15px; height:40px; font-size:0.8rem; background:transparent;">지원 취소하기</button>` : ''}
                </div>`;
        } else {
            div.innerHTML = "<p>등록된 지원 정보가 없습니다.</p>";
        }
    } catch (e) { 
        div.innerHTML = "<p>오류가 발생했습니다. 다시 시도해주세요.</p>"; 
    }
};

// 5. 지원 취소 전역 함수
window.cancelApp = async (id) => {
    if (!confirm("정말로 지원을 취소하시겠습니까?")) return;
    try {
        const res = await fetch(URL, { 
            method: 'POST', 
            body: JSON.stringify({ action: 'cancel', studentId: id }) 
        }).then(r => r.text());
        
        if (res === "CANCEL_OK") { 
            alert("지원이 성공적으로 취소되었습니다."); 
            location.reload(); 
        } else {
            alert("취소 처리에 실패했습니다.");
        }
    } catch (e) { 
        alert("네트워크 오류가 발생했습니다."); 
    }
};

// 초기화 실행
window.addEventListener('DOMContentLoaded', () => {
    initThree(); 
    initPhone();
    initApply();
});
