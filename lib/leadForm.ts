// 리드 폼(도입문의 /apply · 소개서신청 /brochure) 공용 검증·선택지 — 단일 출처(SSOT).
// 클라이언트 폼과 서버 API(send-brochure)가 같은 규칙을 쓰도록 여기 한 곳에만 정의한다.

export const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// 개인용 무료 메일·일회용 메일 도메인 — B2B 리드 품질을 위해 "회사 이메일"만 받는다.
// 여기에 걸리면 폼 제출 자체를 막는다(경고가 아니라 차단).
const PERSONAL_EMAIL_DOMAINS = new Set([
  // 국내
  "naver.com", "hanmail.net", "daum.net", "nate.com", "kakao.com", "hanmir.com",
  "korea.com", "dreamwiz.com", "empas.com", "paran.com", "chol.com", "netsgo.com",
  // 글로벌
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.co.kr", "outlook.com",
  "outlook.kr", "live.com", "live.co.kr", "msn.com", "yahoo.com", "yahoo.co.kr",
  "ymail.com", "rocketmail.com", "icloud.com", "me.com", "mac.com", "aol.com",
  "proton.me", "protonmail.com", "pm.me", "zoho.com", "mail.com", "gmx.com",
  "gmx.net", "yandex.com", "yandex.ru", "mail.ru", "qq.com", "163.com", "126.com",
  "sina.com", "foxmail.com", "fastmail.com", "hushmail.com", "tutanota.com", "tuta.io",
  // 일회용(임시) 메일
  "mailinator.com", "10minutemail.com", "guerrillamail.com", "sharklasers.com",
  "temp-mail.org", "tempmail.com", "yopmail.com", "throwawaymail.com",
  "trashmail.com", "maildrop.cc", "getnada.com", "dispostable.com",
]);

function emailDomain(v: string): string {
  return v.trim().toLowerCase().split("@")[1] || "";
}

export function isValidEmail(v: string): boolean {
  return emailRe.test(v.trim());
}

/** 개인용·일회용 메일 도메인인지 (회사 이메일이 아님) */
export function isPersonalEmail(v: string): boolean {
  return PERSONAL_EMAIL_DOMAINS.has(emailDomain(v));
}

/** 형식이 올바르고 회사 도메인인 이메일만 통과 */
export function isBusinessEmail(v: string): boolean {
  return isValidEmail(v) && !isPersonalEmail(v);
}

/** 이메일 오류 사유 — 폼에서 안내 문구를 나눠 보여주기 위해 사용 */
export function emailError(v: string): "empty" | "format" | "personal" | null {
  const s = v.trim();
  if (!s) return "empty";
  if (!isValidEmail(s)) return "format";
  if (isPersonalEmail(s)) return "personal";
  return null;
}

export const EMAIL_ERROR_MSG: Record<"empty" | "format" | "personal", string> = {
  empty: "회사 이메일을 입력해 주세요.",
  format: "올바른 이메일 형식으로 입력해 주세요.",
  personal: "naver, gmail 등 개인 메일은 사용할 수 없습니다. 회사 이메일을 입력해 주세요.",
};

/** 연락처 — 숫자만 9~11자리(02-123-4567 ~ 010-1234-5678). +82는 0으로 환산. */
export function normalizePhone(v: string): string {
  const s = v.trim().replace(/^\+?82[\s-]?/, "0");
  return s.replace(/\D/g, "");
}

export function isValidPhone(v: string): boolean {
  const d = normalizePhone(v);
  return d.length >= 9 && d.length <= 11;
}

// 유입 경로(어떻게 알게 되셨나요) — utm·referrer가 안 잡히는 유입(카톡·메일·인앱브라우저)을
// 메우기 위해 폼에서 직접 묻는다. value는 DB에 저장되는 안정적인 키.
export const HOW_FOUND_OPTIONS = [
  { v: "search", l: "검색 (네이버·구글 등)" },
  { v: "ad", l: "온라인 광고" },
  { v: "sns", l: "SNS (링크드인·인스타그램 등)" },
  { v: "referral", l: "지인·업계 관계자 추천" },
  { v: "email", l: "메일·뉴스레터" },
  { v: "content", l: "기사·블로그·유튜브" },
  { v: "event", l: "행사·세미나·박람회" },
  { v: "sales", l: "슈퍼코더 담당자 연락" },
  { v: "etc", l: "기타" },
] as const;

export const HOW_FOUND_ETC = "etc";

export const HOW_FOUND_LABEL: Record<string, string> = Object.fromEntries(
  HOW_FOUND_OPTIONS.map((o) => [o.v, o.l])
);

export function isValidHowFound(v: string): boolean {
  return HOW_FOUND_OPTIONS.some((o) => o.v === v);
}

/** 어드민·메일에 표시할 유입경로 문구 ("기타"는 직접 입력값을 함께) */
export function howFoundText(how?: string | null, detail?: string | null): string | null {
  if (!how) return null;
  const label = HOW_FOUND_LABEL[how] || how;
  return how === HOW_FOUND_ETC && detail ? `기타 · ${detail}` : label;
}
