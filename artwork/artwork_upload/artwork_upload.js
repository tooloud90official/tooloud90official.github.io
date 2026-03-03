document.addEventListener("DOMContentLoaded", () => {
    // 공통 버튼 컴포넌트 마운트
    if (typeof loadButton === "function") {
      loadButton({
        target: "#fileUploadMount",
        text: "file upload",
        variant: "primary",
        onClick: () => {
          // TODO: 여기에 파일 선택 로직 연결 (input[type=file] 열기 등)
          alert("파일 업로드 버튼 클릭");
        }
      });
  
      loadButton({
        target: "#toolSelectBtnMount",
        text: "툴 선택하기",
        variant: "primary",
        onClick: () => {
          // ✅ 팝업 기능은 제거했으니,
          // 원하는 방식으로 "툴 선택 페이지/모달"로 연결만 해주면 됨.
          // 예시: location.href = "/tool/select_tool.html";
          alert("툴 선택하기 클릭 (여기에 이동/모달 연결)");
        }
      });
  
      loadButton({
        target: "#cancelBtnMount",
        text: "취소하기",
        variant: "outline",
        onClick: () => history.back()
      });
  
      loadButton({
        target: "#submitBtnMount",
        text: "등록하기",
        variant: "primary",
        onClick: () => {
          const desc = document.querySelector("#description")?.value?.trim() ?? "";
          // TODO: 업로드/등록 로직 연결
          alert(`등록하기 클릭\n설명: ${desc}`);
        }
      });
    }
  
    // ✅ 기존 툴 팝업/툴 아이템 선택 기능은 전부 제거됨
  });