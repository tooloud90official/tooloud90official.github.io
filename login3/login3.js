// login3.js
import { loadNativeSelect } from '/_common/select/select.js';
import { supabase } from '/_ignore/supabase.js';

document.addEventListener("DOMContentLoaded", async () => {

  // ===== 0. 신규/기존 유저 판단 =====
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (existingUser) {
      window.location.href = '/main1/main1.html';
      return;
    }

    sessionStorage.setItem('signup_email', session.user.email);
  }


  // ===== 1. 다음 버튼 렌더링 =====
  loadButton({
    target: "#signup-button",
    text: "다음",
    variant: "primary",
    size: "md",
    onClick: () => {
      if (window.validateLogin3?.()) {
        window.location.href = "/login4/login4.html";
      }
    }
  });


  // ===== 2. 직업 / 국가 / 연령대 셀렉트 =====
  await loadNativeSelect({
    target: '#job-select-wrap',
    placeholder: '선택 해주세요',
    options: [
      { value: 'developer', label: '개발자' },
      { value: 'designer',  label: '디자이너' },
      { value: 'planner',   label: '기획자' },
      { value: 'marketer',  label: '마케터' },
      { value: 'writer',    label: '작가/크리에이터' },
      { value: 'student',   label: '학생' },
      { value: 'etc',       label: '기타' },
    ]
  });

  await loadNativeSelect({
    target: '#country-select-wrap',
    placeholder: '선택 해주세요',
    options: [
      { value: 'KR',  label: '대한민국' },
      { value: 'US',  label: '미국' },
      { value: 'JP',  label: '일본' },
      { value: 'CN',  label: '중국' },
      { value: 'GB',  label: '영국' },
      { value: 'ETC', label: '기타' },
    ]
  });

  await loadNativeSelect({
    target: '#age-select-wrap',
    placeholder: '선택 해주세요',
    options: [
      { value: '10대', label: '10대' },
      { value: '20대', label: '20대' },
      { value: '30대', label: '30대' },
      { value: '40대', label: '40대' },
      { value: '50대', label: '50대' },
      { value: '60대', label: '60대' },
      { value: '70대', label: '70대' },
    ]
  });


  // ===== 3. 닉네임 중복 확인 =====
  const nicknameInput   = document.getElementById('nickname');
  const nicknameMsg     = document.getElementById('nickname-msg');
  const checkBtn        = document.getElementById('check-duplicate-btn');
  let isNicknameChecked = false;

  const CAUTION_ICON = `<img src="/media/caution.png" alt="caution" style="width:14px;height:14px;margin-right:1px;margin-top:-2px;vertical-align:middle;">`;

  nicknameInput?.addEventListener('input', () => {
    isNicknameChecked = false;
    nicknameMsg.innerHTML = '';
  });

  checkBtn?.addEventListener('click', async () => {
    const val = nicknameInput.value.trim();

    if (!val) {
      nicknameMsg.innerHTML = `${CAUTION_ICON}닉네임을 입력해주세요.`;
      nicknameMsg.style.color = '#e53e3e';
      return;
    }
    if (val.length < 2 || val.length > 12) {
      nicknameMsg.innerHTML = `${CAUTION_ICON}닉네임은 2자 이상 12자 이하로 입력해주세요.`;
      nicknameMsg.style.color = '#e53e3e';
      return;
    }

    checkBtn.disabled = true;
    nicknameMsg.innerHTML = '확인 중...';
    nicknameMsg.style.color = '#888';

    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_name')
        .eq('user_name', val)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        isNicknameChecked = false;
        nicknameMsg.innerHTML = `${CAUTION_ICON}이미 사용 중인 닉네임입니다.`;
        nicknameMsg.style.color = '#e53e3e';
      } else {
        isNicknameChecked = true;
        nicknameMsg.innerHTML = '사용 가능한 닉네임입니다.';
        nicknameMsg.style.color = '#0080ff';
      }
    } catch (err) {
      nicknameMsg.innerHTML = `${CAUTION_ICON}확인 중 오류가 발생했습니다.`;
      nicknameMsg.style.color = '#e53e3e';
      console.error('[닉네임 중복 확인 오류]', err);
    } finally {
      checkBtn.disabled = false;
    }
  });


  // ===== 4. 다음 버튼 유효성 검사 =====
  window.validateLogin3 = function() {
    let isValid = true;

    const CAUTION = `<img src="/media/caution.png" alt="caution" style="width:14px;height:14px;margin-right:1px;margin-top:-2px;vertical-align:middle;">`;

    if (!isNicknameChecked) {
      nicknameMsg.innerHTML = `${CAUTION}닉네임 중복 확인을 해주세요.`;
      nicknameMsg.style.color = '#e53e3e';
      isValid = false;
    }

    const ageSelect = document.querySelector('#age-select-wrap select');
    const ageValue  = ageSelect?.value || '';
    if (!ageValue) {
      let ageMsg = document.getElementById('age-msg');
      if (!ageMsg) {
        ageMsg = document.createElement('p');
        ageMsg.id = 'age-msg';
        ageMsg.className = 'field-msg';
        document.getElementById('age-select-wrap').insertAdjacentElement('afterend', ageMsg);
      }
      ageMsg.innerHTML = `${CAUTION}연령대를 선택해주세요.`;
      ageMsg.style.color = '#e53e3e';
      isValid = false;
    } else {
      const ageMsg = document.getElementById('age-msg');
      if (ageMsg) ageMsg.innerHTML = '';
    }

    const jobSelect = document.querySelector('#job-select-wrap select');
    const jobValue  = jobSelect?.value || '';
    if (!jobValue) {
      let jobMsg = document.getElementById('job-msg');
      if (!jobMsg) {
        jobMsg = document.createElement('p');
        jobMsg.id = 'job-msg';
        jobMsg.className = 'field-msg';
        document.getElementById('job-select-wrap').insertAdjacentElement('afterend', jobMsg);
      }
      jobMsg.innerHTML = `${CAUTION}직업을 선택해주세요.`;
      jobMsg.style.color = '#e53e3e';
      isValid = false;
    } else {
      const jobMsg = document.getElementById('job-msg');
      if (jobMsg) jobMsg.innerHTML = '';
    }

    const countrySelect = document.querySelector('#country-select-wrap select');
    const countryValue  = countrySelect?.value || '';
    if (!countryValue) {
      let countryMsg = document.getElementById('country-msg');
      if (!countryMsg) {
        countryMsg = document.createElement('p');
        countryMsg.id = 'country-msg';
        countryMsg.className = 'field-msg';
        document.getElementById('country-select-wrap').insertAdjacentElement('afterend', countryMsg);
      }
      countryMsg.innerHTML = `${CAUTION}국가를 선택해주세요.`;
      countryMsg.style.color = '#e53e3e';
      isValid = false;
    } else {
      const countryMsg = document.getElementById('country-msg');
      if (countryMsg) countryMsg.innerHTML = '';
    }

    if (isValid) {
      sessionStorage.setItem('signup_nickname', nicknameInput.value.trim());
      sessionStorage.setItem('signup_age',      ageValue);
      sessionStorage.setItem('signup_job',      jobValue);
      sessionStorage.setItem('signup_country',  countryValue);
    }

    return isValid;
  };


  // ===== 5. 이전으로 돌아가기 =====
  document.getElementById('backBtn')?.addEventListener('click', () => {
    const result = confirm('페이지를 나가시겠습니까?\n입력한 내용이 저장되지 않습니다.');
    if (result) window.location.href = '/login2/login2.html';
  });

});