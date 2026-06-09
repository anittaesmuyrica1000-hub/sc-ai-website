/* partials.js — 공유 GNB(헤더)/푸터
 * index.html 과 apply.html 이 함께 재사용한다. 마크업은 이 파일 한 곳에서만 관리한다.
 * 빌드 시스템이 없고 file:// 로도 열리므로 fetch include 대신 커스텀 엘리먼트로 주입한다.
 * 내부에 기존 <header>/<footer> 태그를 그대로 렌더해 현재 inline CSS 셀렉터가 그대로 적용된다.
 *
 * 사용: <site-header></site-header> / <site-footer></site-footer>
 *       그리고 페이지 하단에 <script src="partials.js"></script>
 */
(function () {
  var HEADER = '' +
    '<header>' +
    '  <nav class="wrap">' +
    '    <a href="index.html" class="logo">' +
    '      <img src="supercoder-nav.svg" alt="Supercoder" class="nav-logo-img nav-logo--base">' +
    '      <img src="supercoder-nav-color.png" alt="Supercoder" class="nav-logo-img nav-logo--color">' +
    '    </a>' +
    '    <div class="navlinks">' +
    '      <a href="apply.html" class="btn btn-blue nav-btn">도입 문의</a>' +
    '      <div class="nav-menu-wrap">' +
    '        <button type="button" class="nav-menu-btn" aria-label="메뉴" aria-haspopup="true" aria-expanded="false" aria-controls="navMenu">' +
    '          <span class="nav-burger"><span></span><span></span><span></span></span>' +
    '        </button>' +
    '        <div class="nav-menu" id="navMenu" hidden>' +
    '          <a href="index.html#value">왜 AI 면접인가</a>' +
    '          <a href="index.html#how">작동 방식</a>' +
    '          <a href="index.html#proof">도입 효과</a>' +
    '          <a href="index.html#voices">고객 후기</a>' +
    '          <a href="apply.html" class="nav-menu-cta">무료 체험하기</a>' +
    '        </div>' +
    '      </div>' +
    '    </div>' +
    '  </nav>' +
    '</header>';

  var FOOTER = '' +
    '<footer>' +
    '  <div class="wrap">' +
    '    <div class="foot-top">' +
    '      <div class="foot-brand">' +
    '        <img src="supercoder-nav.svg" class="foot-logo-img" alt="Supercoder">' +
    '      </div>' +
    '      <div class="foot-links">' +
    '        <div class="foot-col">' +
    '          <h4>AI 면접관</h4>' +
    '          <ul>' +
    '            <li><a href="#">개인정보처리 방침</a></li>' +
    '            <li><a href="#">기업용 서비스 이용약관</a></li>' +
    '            <li><a href="#">지원자용 서비스 이용약관</a></li>' +
    '          </ul>' +
    '        </div>' +
    '        <div class="foot-col">' +
    '          <h4>글로벌 인재 채용</h4>' +
    '          <ul>' +
    '            <li><a href="#">개인정보처리 방침</a></li>' +
    '            <li><a href="#">서비스 이용약관</a></li>' +
    '          </ul>' +
    '        </div>' +
    '      </div>' +
    '    </div>' +
    '    <div class="foot-bottom">' +
    '      <p class="foot-copy">© 2025 Second Team. All rights reserved.</p>' +
    '    </div>' +
    '  </div>' +
    '</footer>';

  function define(name, html) {
    if (customElements.get(name)) return;
    customElements.define(name, class extends HTMLElement {
      connectedCallback() { this.innerHTML = html; }
    });
  }

  define('site-header', HEADER);
  define('site-footer', FOOTER);

  /* GNB 메뉴(햄버거) 토글 — 커스텀 엘리먼트가 innerHTML로 렌더되므로 위임 방식으로 바인딩 */
  function closeMenu() {
    var menu = document.getElementById('navMenu');
    var btn = document.querySelector('.nav-menu-btn');
    if (menu) menu.setAttribute('hidden', '');
    if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.classList.remove('open'); }
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.nav-menu-btn');
    var menu = document.getElementById('navMenu');
    if (!menu) return;
    if (btn) {
      e.preventDefault();
      var willOpen = menu.hasAttribute('hidden');
      if (willOpen) {
        menu.removeAttribute('hidden');
        btn.setAttribute('aria-expanded', 'true');
        btn.classList.add('open');
      } else {
        closeMenu();
      }
      return;
    }
    if (!e.target.closest('.nav-menu')) closeMenu(); // 바깥 클릭 시 닫기
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* 섹션 인지형 GNB 색상(Notion 식) — 헤더 중앙선 아래에 오는 섹션에 맞춰 테마 토글.
     · 다크 섹션(data-nav="dark") 위  → .nav-invert(흰 콘텐츠·투명 배경)
     · 밝은 섹션 위 + 8px 이상 스크롤 → .nav-solid(흰 배경+블러·어두운 콘텐츠)
     · 밝은 섹션 최상단(≤8px)          → 둘 다 해제(투명·어두운 콘텐츠) */
  function syncHeader() {
    var header = document.querySelector('header');
    if (!header) return;
    var y = window.scrollY, navLine = y + 33; // 헤더(64px) 중앙선의 문서 좌표
    function over(sel) {
      var els = document.querySelectorAll(sel);
      for (var i = 0; i < els.length; i++) {
        var r = els[i].getBoundingClientRect(), top = r.top + y, bottom = top + r.height;
        if (navLine >= top && navLine < bottom) return true;
      }
      return false;
    }
    var overHide = over('[data-nav="hide"]'); // 히어로: 최상단 숨김 → 스크롤 시 흰 GNB
    var overDark = over('[data-nav="dark"]');  // 다크 섹션: 콘텐츠 반전(컬러 로고)
    var hidden = overHide && y < 40;           // 히어로 최상단(40px 이내)에선 GNB 숨김
    header.classList.toggle('nav-hidden', hidden);
    header.classList.toggle('nav-invert', overDark && !hidden);
    header.classList.toggle('nav-solid', !hidden && !overDark && y > 8);
  }
  window.addEventListener('scroll', syncHeader, { passive: true });
  window.addEventListener('resize', syncHeader, { passive: true });
  window.addEventListener('load', syncHeader);
  syncHeader();
})();
