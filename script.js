import * as THREE from 'three';

// 1. 구글 앱스 스크립트 배포 URL (본인 주소로 교체 필수!)
const URL = 'https://script.google.com/macros/s/AKfycbyjCfC8bveePORuC9JmtOhxDmoI9CskIeuPz1JLCdWmuDHf5rPJpNyTFskPkkO4s33Jbg/exec'; 

// ==========================================
// 2. Three.js 3D 배경 로직
// ==========================================
let rx = 0, ry = 0;

const initThree = () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 35;

    // 기하학적 형상 (TorusKnot)
    const geo = new THREE.TorusKnotGeometry(10, 3, 150, 16);
    const mat = new THREE.MeshBasicMaterial({ 
        color: 0xFF8C00, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.2 
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // 마우스 및 터치 이동 반응
    const handleMove = (e) => {
        const p = e.touches ? e.touches[0] : e;
        ry = (p.clientX - window.innerWidth / 2) * 0.0007;
        rx = (p.clientY - window.innerHeight / 2) * 0.0007;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: true });

    function animate() {
        requestAnimationFrame(animate);
        mesh.rotation.y += (ry - mesh.rotation.y) * 0.05 + 0.005;
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
// 3. 전화번호 자동 하이픈 로직
// ==========================================
const initPhoneMask = () => {
    document.addEventListener('input', (e) => {
        if (e.target.name === 'phone') {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            if (v.length > 10) {
                v = v.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
            } else if (v.length > 6) {
                v = v.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
            } else if (v.length > 3) {
                v = v.replace(/(\d{3})(\d+)/, '$1-$2');
            }
            e.target.value = v;
        }
    });
};

// ==========================================
// 4. 지원서 제출 로직 (apply.html)
// ==========================================
const initApplyForm = () => {
    const form = document.getElementById('applyForm');
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button');
        const originalText = btn.innerText;
        
        btn.innerText = "INITIALIZING...";
        btn.disabled = true;

        const data = Object.fromEntries(new FormData(form));
        data.action = 'submit';

        try {
            const res = await fetch(URL, { method: 'POST', body: JSON.stringify(data) });
            if (res.ok) {
                btn.innerText = "COMPLETED";
                alert("성공적으로 제출되었습니다! 행운을 빕니다.");
                location.href = 'index.html';
            }
        } catch (err) {
            alert("제출 중 오류 발생! 네트워크를 확인하세요.");
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };
};

// ==========================================
// 5. 결과 조회 및 상세 확인 (check.html)
// ==========================================
window.checkStatus = async () => {
    const id = document.getElementById('cId').value;
    const div = document.getElementById('statusRes');
    const content = document.getElementById('detailContent');
    const cancelArea = document.getElementById('cancelArea');
    
    if (!id) return alert("학번을 입력해주세요.");

    div.style.display = 'block';
    div.innerHTML = "<p>데이터를 조회 중입니다...</p>";

    try {
        const res = await fetch(`${URL}?action=check&id=${id}`).then(r => r.json());
        
        if (res.found) {
            div.innerHTML = `
                <div id="detailContent" style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: left;">
                    <h3 style="color:var(--o)">${res.name}님의 지원 정보</h3>
                    <p><strong>합격 여부:</strong> ${res.status}</p>
                    <p><strong>면접 안내:</strong> ${res.interview}</p>
                    <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
                    <p><strong>자기소개:</strong> ${res.intro}</p>
                    <p><strong>가입사유:</strong> ${res.reason}</p>
                    <p><strong>AI활용계획:</strong> ${res.aiPlan}</p>
                </div>
                <div id="cancelArea" style="text-align: center;">
                    ${res.status !== "지원 취소" ? 
                        `<p style="font-size: 0.8rem; color: #888;">* 지원을 철회하려면 아래 버튼을 누르세요.</p>
                         <button type="button" onclick="cancelApplication()" class="btn" style="border-color: #ff4444; color: #ff4444; width: 100%;">WITHDRAW APPLICATION</button>` 
                        : `<p style="color: #ff4444; font-weight: bold;">이미 취소된 지원서입니다.</p>`
                    }
                </div>
            `;
        } else {
            div.innerHTML = "<p>일치하는 학번 정보가 없습니다.</p>";
        }
    } catch (err) {
        div.innerHTML = "<p>조회 중 오류가 발생했습니다.</p>";
    }
};

// ==========================================
// 6. 지원 취소 로직 (check.html 내 버튼 전용)
// ==========================================
window.cancelApplication = async () => {
    const id = document.getElementById('cId').value;
    if (!confirm("정말로 지원을 취소하시겠습니까? 시트에서 합격 여부가 '지원 취소'로 변경됩니다.")) return;

    try {
        const res = await fetch(URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'cancel', studentId: id })
        }).then(r => r.text());

        if (res === "CANCEL_OK") {
            alert("지원이 정상적으로 취소되었습니다.");
            location.reload();
        } else {
            alert("취소 처리 중 문제가 발생했습니다.");
        }
    } catch (err) {
        alert("네트워크 오류로 취소하지 못했습니다.");
    }
};

// ==========================================
// 7. 초기화 및 관리자 단축키
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    initThree();
    initPhoneMask();
    initApplyForm();
});

window.addEventListener('keydown', (e) => {
    if(e.ctrlKey && e.altKey && e.key.toLowerCase() === 'l') location.href = 'admin.html';
});
