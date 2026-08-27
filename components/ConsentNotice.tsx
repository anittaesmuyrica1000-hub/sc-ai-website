import { RETENTION_NOTICE } from "@/lib/retention";

/**
 * 폼 동의 체크박스 옆 개인정보 수집·이용 요약 고지(3줄).
 *
 * 처리방침 전문 링크만 두면 "이 폼이 나에게서 무엇을, 왜, 얼마나 가져가는지"가
 * 제출 시점에 보이지 않는다. 수집 항목·목적은 폼마다 다르므로 props로 받고,
 * 보유기간은 방침 제2조 하나로 묶여 있으므로 lib/retention.ts에서 가져온다.
 *
 * ⚠️ 문구는 개인정보처리방침(legal_docs DB)과 반드시 일치해야 한다.
 *    방침이 개정되면 이 컴포넌트에 넘기는 항목·목적과 RETENTION_NOTICE를 함께 고친다.
 */
export default function ConsentNotice({ items, purpose }: { items: string; purpose: string }) {
  return (
    <dl className="consent-notice">
      <div><dt>수집 항목</dt><dd>{items}</dd></div>
      <div><dt>이용 목적</dt><dd>{purpose}</dd></div>
      <div><dt>보유 기간</dt><dd>{RETENTION_NOTICE}</dd></div>
    </dl>
  );
}
