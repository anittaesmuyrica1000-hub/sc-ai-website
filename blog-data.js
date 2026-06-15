/* blog-data.js — 블로그 페이지(blog.html · post.html · admin.html) 공유 데이터 계층
 *
 * apply.html 과 동일한 Supabase 프로젝트/공개키를 사용한다. publishable(공개) 키는
 * RLS 로 보호되므로 노출돼도 안전하다. posts 테이블은 로그인 미적용 단계라
 * anon 에 select/insert/update/delete 를 모두 허용한다(추후 인증 도입 시 정책 강화).
 *
 * 전역으로 노출: window.AIVIEW_DB(supabase client), window.esc, window.fmtDate
 */
(function () {
  var SUPABASE_URL = 'https://ymzlcghqamkynuvotzgh.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_QZ9NGClQjBIuPWz7CR8_wA_Acv9anJQ';

  window.AIVIEW_DB = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

  // HTML 이스케이프 — 사용자/관리자 입력을 화면에 안전하게 출력
  window.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  // 2026. 6. 15. 형식 (한국어 로캘)
  window.fmtDate = function (iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return ''; }
  };
})();
