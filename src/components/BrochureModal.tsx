"use client";

import { useEffect } from "react";
import BrochureForm from "@/app/brochure/BrochureForm";

/* GNB '서비스 소개서' 클릭 시 열리는 리드 입력 모달(팝업). 폼은 /brochure 와 공유. */
export default function BrochureModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // 열렸을 때 ESC 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="서비스소개서 신청">
      <div className="modal-card apply-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" aria-label="닫기" onClick={onClose}>
          <i className="fa-solid fa-xmark" />
        </button>
        <div className="modal-head">
          <div className="eyebrow"><i className="fa-solid fa-file-lines" /> 서비스소개서</div>
          <h2>AI 면접관 서비스소개서</h2>
          <p>정보를 남겨주시면 소개서를 바로 받아보실 수 있습니다.</p>
        </div>
        <BrochureForm />
      </div>
    </div>
  );
}
