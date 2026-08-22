// Consent Mode v2 기본값 — 서버(layout)·클라이언트(Analytics) 양쪽에서 쓰므로
// 서버 전용 의존성이 없는 별도 모듈로 둔다(lib/siteTags.ts를 클라이언트가 import하면 안 된다).
//
// 분석 쿠키는 개인정보처리방침 제10조에 따라 전 방문자에게 사용한다
// (2026-08-21 개정 — 「개인정보 보호법」상 분석 쿠키의 사전 동의는 의무가 아니며,
//  거부 수단은 브라우저 설정·GA 차단 부가기능으로 제공). 광고 관련 항목은 계속 denied.
export const CONSENT_DEFAULT_JS =
  "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}" +
  "gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied'," +
  "ad_personalization:'denied',analytics_storage:'granted'});";
