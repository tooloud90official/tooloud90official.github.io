document.addEventListener("DOMContentLoaded", () => {

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const errorBox = document.getElementById("loginError");

    // ✅ 로그인 버튼 렌더링
    loadButton({
        target: '#loginBtn',
        text: '로그인',
        variant: 'primary',
        onClick: handleLogin
    });

    // ✅ 회원가입 버튼 렌더링
    loadButton({
        target: '#signupBtn',
        text: '회원가입',
        variant: 'outline',
        onClick: () => {
            location.href = '/signup.html'; // 경로는 맞게 수정
        }
    });

    function handleLogin() {
        console.log("handleLogin 실행됨");  // ✅ 추가
        console.log("email:", emailInput.value);  // ✅ 추가
        console.log("password:", passwordInput.value);  // ✅ 추가

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        errorBox.textContent = "";

        // =========================
        // 1️⃣ 형식 검증
        // =========================

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const passwordPattern =
            /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
        // 최소 6자 + 문자 + 숫자 포함 (원하면 변경 가능)

        // 1️⃣ 형식 검증 - 각각 따로 체크
        if (!emailPattern.test(email)) {
            errorBox.textContent = "이메일 형식이 올바르지 않습니다.";
            return;
        }

        if (!passwordPattern.test(password)) {
            errorBox.textContent = "비밀번호 형식이 올바르지 않습니다. (6자 이상, 영문+숫자 포함)";
            return;
        }


        // =========================
        // 2️⃣ 로그인 정보 검증 (임시 테스트용)
        // =========================

        const correctEmail = "test@test.com";
        const correctPassword = "123456a";

        if (email !== correctEmail || password !== correctPassword) {
            errorBox.textContent =
                "잘못된 이메일/비밀번호입니다. 다시 시도해주세요.";
            return;
        }

        // =========================
        // 3️⃣ 로그인 성공
        // =========================

        alert("로그인 성공!");
        // location.href = "/main.html";
    }
});