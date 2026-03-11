// login3.js
import { loadNativeSelect } from '/_common/select/select.js';

document.addEventListener("DOMContentLoaded", async () => {

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


  // ===== 2. 직업 / 국가 셀렉트 =====
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


  // ===== 3. 생년월일 셀렉트 =====
  const currentYear = new Date().getFullYear();

  const yearOptions = [];
  for (let y = currentYear; y >= 1924; y--) {
    yearOptions.push({ value: String(y), label: `${y}년` });
  }

  const monthOptions = [];
  for (let m = 1; m <= 12; m++) {
    monthOptions.push({ value: String(m), label: `${m}월` });
  }

  function getDayOptions(year, month) {
    const days = new Date(year || 2000, month || 1, 0).getDate();
    const options = [];
    for (let d = 1; d <= days; d++) {
      options.push({ value: String(d), label: `${d}일` });
    }
    return options;
  }

  let yearInstance  = null;
  let monthInstance = null;

  async function refreshDaySelect() {
    const y = yearInstance?.getValue();
    const m = monthInstance?.getValue();
    await loadNativeSelect({
      target: '#birth-day-wrap',
      placeholder: '일',
      options: getDayOptions(y ? Number(y) : null, m ? Number(m) : null)
    });
  }

  yearInstance = await loadNativeSelect({
    target: '#birth-year-wrap',
    placeholder: '연도',
    options: yearOptions,
    onChange: () => refreshDaySelect()
  });

  monthInstance = await loadNativeSelect({
    target: '#birth-month-wrap',
    placeholder: '월',
    options: monthOptions,
    onChange: () => refreshDaySelect()
  });

  await loadNativeSelect({
    target: '#birth-day-wrap',
    placeholder: '일',
    options: getDayOptions(null, null)
  });


  // ===== 4. 닉네임 중복 확인 =====
  const nicknameInput = document.getElementById('nickname');
  const nicknameMsg   = document.getElementById('nickname-msg');
  const checkBtn      = document.getElementById('check-duplicate-btn');
  let isNicknameChecked = false;

  const CAUTION_ICON = `<img src="/media/caution.png" alt="caution" style="width:14px;height:14px;margin-right:1px;margin-top:-2px;vertical-align:middle;">`;

  nicknameInput?.addEventListener('input', () => {
    isNicknameChecked = false;
    nicknameMsg.innerHTML = '';
  });

  checkBtn?.addEventListener('click', () => {
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
    isNicknameChecked = true;
    nicknameMsg.innerHTML = '사용 가능한 닉네임입니다.';
    nicknameMsg.style.color = '#38a169';
  });


  // ===== 5. 다음 버튼 유효성 검사 =====
  window.validateLogin3 = function() {
    if (!isNicknameChecked) {
      nicknameMsg.innerHTML = `${CAUTION_ICON}닉네임 중복 확인을 해주세요.`;
      nicknameMsg.style.color = '#e53e3e';
      return false;
    }
    return true;
  };


  // ===== 6. confirm 모달 초기화 =====
  if (!document.getElementById('modal-root')) {
    const root = document.createElement('div');
    root.id = 'modal-root';
    document.body.appendChild(root);
  }

  await window.includeHTML('#modal-root', '/_common/confirm/confirm.html');


  // ===== 7. 이전으로 돌아가기 =====
  document.getElementById('backBtn')?.addEventListener('click', async () => {
    const result = await window.showConfirm({
      title      : '페이지를 나가시겠습니까?',
      desc       : '입력한 내용이 저장되지 않습니다.',
      confirmText: '확인',
      cancelText : '취소',
    });
    if (result) {
      window.location.href = '/login2/login2.html';
    }
  });

});