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
    '    <a href="index.html" class="logo"><img src="supercoder-nav.svg" alt="Supercoder" class="nav-logo-img"></a>' +
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
    '        <img src="supercoder-logo.svg" class="foot-logo-img" alt="Supercoder">' +
    '        <p class="foot-copy">© 2025 Second Team. All rights reserved.</p>' +
    '        <div class="foot-social">' +
    '          <a href="mailto:contact@supercoder.co" aria-label="이메일"><i class="fa-solid fa-envelope"></i></a>' +
    '          <a href="#" aria-label="LinkedIn"><i class="fa-brands fa-linkedin-in"></i></a>' +
    '        </div>' +
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
})();
