// 리드 폼(도입문의 /apply · 소개서신청 /brochure) 공용 검증·선택지 — 단일 출처(SSOT).
// 클라이언트 폼과 서버 API(send-brochure)가 같은 규칙을 쓰도록 여기 한 곳에만 정의한다.

export const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// 개인용 무료 메일·일회용 메일 도메인 — B2B 리드 품질을 위해 "회사 이메일"만 받는다.
// 여기에 걸리면 폼 제출 자체를 막는다(경고가 아니라 차단).
//
// 이건 **클라이언트 즉시 피드백용 짧은 목록**이다. 서버(lib/leadGuard.ts)가 공개 목록
// 4,466개(무료 제공자) + 8,792개(일회용)로 한 번 더 거른다 — 그쪽이 최종 방어선.
// 국내 제공자는 공개 목록에 빠진 게 많아(daum.net·kakao.com·nate.com 등) 여기서 직접 관리한다.
const PERSONAL_EMAIL_DOMAINS = new Set([
  // 국내
  "naver.com", "naver.net", "naver.co.kr", "hanmail.net", "hanmail.com", "hanmail.co.kr",
  "daum.net", "daum.com", "nate.com", "nate.co.kr", "kakao.com", "kakaomail.com",
  "hanmir.com", "korea.com", "dreamwiz.com", "empas.com", "paran.com", "chol.com",
  "netsgo.com", "lycos.co.kr", "freechal.com", "unitel.co.kr",
  // 글로벌
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.co.kr", "hotmail.co.jp",
  "hotmail.co.uk", "hotmail.fr", "hotmail.de", "outlook.com", "outlook.kr", "outlook.co.kr",
  "outlook.jp", "live.com", "live.co.kr", "live.kr", "live.jp", "msn.com",
  "yahoo.com", "yahoo.co.kr", "yahoo.co.jp", "yahoo.co.uk", "ymail.com", "rocketmail.com",
  "icloud.com", "me.com", "mac.com", "aol.com",
  "proton.me", "protonmail.com", "protonmail.ch", "pm.me",
  "zoho.com", "mail.com", "email.com", "gmx.com", "gmx.net", "gmx.de", "web.de",
  "yandex.com", "yandex.ru", "yandex.kz", "mail.ru", "inbox.com", "list.ru", "bk.ru",
  "qq.com", "163.com", "126.com", "sina.com", "sina.cn", "foxmail.com", "aliyun.com",
  "fastmail.com", "hushmail.com", "tutanota.com", "tuta.io", "tutamail.com",
  "rediffmail.com", "seznam.cz",
  // 일회용(임시) 메일 — 대표적인 것만. 전체 대조는 서버(leadGuard)에서.
  "mailinator.com", "10minutemail.com", "guerrillamail.com", "sharklasers.com",
  "temp-mail.org", "tempmail.com", "yopmail.com", "throwawaymail.com",
  "trashmail.com", "maildrop.cc", "getnada.com", "dispostable.com",
]);

/**
 * 도메인과 그 상위 도메인들 — `mail.naver.com` → ["mail.naver.com", "naver.com", "com"].
 * 제공자들이 서브도메인을 흩뿌리기 때문에(`x.yopmail.com`) 정확히 일치만 봐선 샌다.
 */
export function domainChain(domain: string): string[] {
  const parts = domain.split(".");
  const out: string[] = [];
  for (let i = 0; i < parts.length - 1; i++) out.push(parts.slice(i).join("."));
  return out;
}

function emailDomain(v: string): string {
  return v.trim().toLowerCase().split("@")[1] || "";
}

export function isValidEmail(v: string): boolean {
  return emailRe.test(v.trim());
}

/** 개인용·일회용 메일 도메인인지 (회사 이메일이 아님) */
export function isPersonalEmail(v: string): boolean {
  return domainChain(emailDomain(v)).some((d) => PERSONAL_EMAIL_DOMAINS.has(d));
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

/** 연락처 — 숫자만 남긴다. +82는 0으로 환산. */
export function normalizePhone(v: string): string {
  const s = v.trim().replace(/^\+?82[\s-]?/, "0");
  return s.replace(/\D/g, "");
}

// 국내 번호 체계 화이트리스트 — 국번(중간자리) 첫 글자는 0이 될 수 없다는 규칙을 함께 건다.
// 이게 010-0000-0000 같은 대표적 더미 번호를 1차로 걸러준다.
const PHONE_PATTERNS: RegExp[] = [
  /^010[1-9]\d{7}$/,              // 휴대폰 010 — 11자리 고정
  /^01[16789][1-9]\d{6,7}$/,      // 구 휴대폰 011·016~019 — 10~11자리
  /^02[1-9]\d{6,7}$/,             // 서울 — 9~10자리
  /^0(3[1-3]|4[1-4]|5[1-5]|6[1-4])[1-9]\d{6,7}$/, // 그 외 지역번호 — 10~11자리
  /^070[1-9]\d{7}$/,              // 인터넷전화
  /^050\d[1-9]\d{6,7}$/,          // 안심번호·평생번호
  /^080[1-9]\d{6,7}$/,            // 수신자부담
  /^1[5-9]\d{2}\d{4}$/,           // 대표번호 1544·1588 등 — 8자리
];

/** 짧은 조각의 반복으로 이루어졌는지 — 12121212(2자리), 12341234(4자리) */
function isRepeatingUnit(d: string): boolean {
  for (let k = 1; k <= d.length / 2; k++) {
    if (d.length % k) continue;
    const unit = d.slice(0, k);
    if (d.match(new RegExp(`.{${k}}`, "g"))!.every((c) => c === unit)) return true;
  }
  return false;
}

/**
 * 사람이 대충 채워 넣은 더미 번호인지. 아래를 모두 본다.
 *   00000000 전부 같은 숫자 · 12345678 오름/내림 연속
 *   12121212·12341234 짧은 조각 반복 · 11112222 앞뒤 네 자리가 각각 한 숫자
 *
 * 8자리 기준 여기 걸리는 조합은 약 1만개(전체의 0.01%)뿐이라 진짜 번호를 막을 위험은 사실상 없다.
 */
function isDummyDigits(d: string): boolean {
  if (isRepeatingUnit(d)) return true; // 전부 같은 숫자도 여기 포함(단위 1자리)
  let asc = true, desc = true;
  for (let i = 1; i < d.length; i++) {
    const diff = d.charCodeAt(i) - d.charCodeAt(i - 1);
    if (diff !== 1) asc = false;
    if (diff !== -1) desc = false;
  }
  if (asc || desc) return true;
  // 1111-2222 처럼 국번·가입자번호가 각각 한 숫자로만 된 경우
  if (d.length === 8) {
    const half = (x: string) => /^(\d)\1{3}$/.test(x);
    if (half(d.slice(0, 4)) && half(d.slice(4))) return true;
  }
  return false;
}

/**
 * 실제로 연락 가능한 형태의 번호인지. 자릿수만 세던 예전 규칙으론
 * 01000000000·010-1234-5678 같은 가짜 번호가 그대로 통과했다(2026-09-12 소개서 리드).
 */
export function isValidPhone(v: string): boolean {
  const d = normalizePhone(v);
  if (!PHONE_PATTERNS.some((re) => re.test(d))) return false;
  // 접두(010·02 등)를 뺀 국번+가입자번호가 통짜 더미면 차단
  const body = d.startsWith("02") ? d.slice(2) : d.slice(3);
  return !isDummyDigits(body) && !isDummyDigits(d);
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
