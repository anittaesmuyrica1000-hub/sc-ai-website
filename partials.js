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
    '      <img src="supercoder-nav-white.svg" alt="Supercoder" class="nav-logo-img nav-logo--invert">' +
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
    '          <a href="blog.html">블로그</a>' +
    '          <a href="#" id="navBrochure">서비스소개서</a>' +
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
    '        <img src="supercoder-nav-gray.svg" class="foot-logo-img" alt="Supercoder">' +
    '      </div>' +
    '      <div class="foot-links">' +
    '        <div class="foot-col">' +
    '          <h4>AI 면접관</h4>' +
    '          <ul>' +
    '            <li><a href="privacy.html">개인정보처리 방침</a></li>' +
    '            <li><a href="terms.html">기업용 서비스 이용약관</a></li>' +
    '            <li><a href="terms-applicant.html">지원자용 서비스 이용약관</a></li>' +
    '          </ul>' +
    '        </div>' +
    '        <div class="foot-col">' +
    '          <h4>글로벌 인재 채용</h4>' +
    '          <ul>' +
    '            <li><a href="privacy.html">개인정보처리 방침</a></li>' +
    '            <li><a href="terms.html">서비스 이용약관</a></li>' +
    '          </ul>' +
    '        </div>' +
    '      </div>' +
    '    </div>' +
    '    <div class="foot-bottom">' +
    '      <p class="foot-copy">© 2026 Second Team. All rights reserved.</p>' +
    '    </div>' +
    '  </div>' +
    '</footer>';

  // 서비스소개서 리드 모달 — GNB '서비스소개서' 클릭 시 열림. 스타일은 theme.css(.bro-*).
  var BROCHURE_MODAL = '' +
    '<div class="bro-modal" id="broModal" role="dialog" aria-modal="true" aria-label="서비스소개서 신청">' +
    '  <div class="bro-card">' +
    '    <button type="button" class="bro-close" id="broClose" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>' +
    '    <div id="broInner">' +
    '      <div class="bro-head">' +
    '        <div class="eyebrow"><i class="fa-solid fa-file-lines"></i> 서비스소개서</div>' +
    '        <h2>AI 면접관 서비스소개서</h2>' +
    '        <p>정보를 남겨주시면 소개서를 바로 받아보실 수 있습니다.</p>' +
    '      </div>' +
    '      <form id="broForm" novalidate>' +
    '        <div class="b-row">' +
    '          <div class="b-field"><label for="bro-name">이름 <span class="req">*</span></label>' +
    '            <input type="text" id="bro-name" placeholder="홍길동"><div class="b-err">이름을 입력해 주세요.</div></div>' +
    '          <div class="b-field"><label for="bro-company">회사 <span class="req">*</span></label>' +
    '            <input type="text" id="bro-company" placeholder="회사명"><div class="b-err">회사를 입력해 주세요.</div></div>' +
    '        </div>' +
    '        <div class="b-field"><label for="bro-email">업무 이메일 <span class="req">*</span></label>' +
    '          <input type="email" id="bro-email" placeholder="you@company.com"><div class="b-err">올바른 이메일을 입력해 주세요.</div></div>' +
    '        <div class="b-row">' +
    '          <div class="b-field"><label for="bro-role">직무 / 직책</label>' +
    '            <input type="text" id="bro-role" placeholder="예: 인사팀장"></div>' +
    '          <div class="b-field"><label for="bro-phone">연락처</label>' +
    '            <input type="tel" id="bro-phone" placeholder="010-0000-0000"></div>' +
    '        </div>' +
    '        <div class="b-field"><label for="bro-size">연간 채용 규모 <span class="req">*</span></label>' +
    '          <select id="bro-size"><option value="" selected disabled>선택해 주세요</option>' +
    '            <option value="1-10">1~10명</option><option value="11-50">11~50명</option>' +
    '            <option value="51-200">51~200명</option><option value="200+">200명 이상</option></select>' +
    '          <div class="b-err">채용 규모를 선택해 주세요.</div></div>' +
    '        <label class="bro-agree" id="bro-agree-wrap">' +
    '          <input type="checkbox" id="bro-agree"><span><a href="privacy.html" target="_blank" rel="noopener">개인정보 수집·이용</a>에 동의합니다. (필수)</span></label>' +
    '        <div class="bro-formerr" id="broErr"></div>' +
    '        <button type="submit" class="btn btn-blue" id="broSubmit">소개서 받기 <i class="fa-solid fa-download"></i></button>' +
    '      </form>' +
    '    </div>' +
    '  </div>' +
    '</div>';

  function define(name, html) {
    if (customElements.get(name)) return;
    customElements.define(name, class extends HTMLElement {
      connectedCallback() { this.innerHTML = html; }
    });
  }

  define('site-header', HEADER);
  define('site-footer', FOOTER);

  /* 서비스소개서 리드 모달 — body에 1회 주입 후 이벤트 바인딩.
     Supabase REST 로 직접 INSERT(브라우저에서 supabase-js 미로드 페이지에서도 동작). */
  (function setupBrochure() {
    var SUPABASE_URL = 'https://ymzlcghqamkynuvotzgh.supabase.co';
    var SUPABASE_KEY = 'sb_publishable_QZ9NGClQjBIuPWz7CR8_wA_Acv9anJQ';
    var BROCHURE_FILE = 'brochure-aiview.pdf';
    var emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    function ready(fn) {
      if (document.readyState !== 'loading') fn();
      else document.addEventListener('DOMContentLoaded', fn);
    }

    ready(function () {
      if (document.getElementById('broModal')) return;
      var holder = document.createElement('div');
      holder.innerHTML = BROCHURE_MODAL;
      document.body.appendChild(holder.firstChild);

      var modal = document.getElementById('broModal');
      var inner = document.getElementById('broInner');

      function open() { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
      function close() { modal.classList.remove('open'); document.body.style.overflow = ''; }

      // GNB '서비스소개서' 클릭(위임) → 모달 열기
      document.addEventListener('click', function (e) {
        var t = e.target.closest && e.target.closest('#navBrochure');
        if (t) { e.preventDefault(); open(); }
      });
      document.getElementById('broClose').addEventListener('click', close);
      modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });

      var form = document.getElementById('broForm');
      var errBox = document.getElementById('broErr');
      var btn = document.getElementById('broSubmit');

      function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

      form.addEventListener('input', function (e) {
        var box = e.target.closest('.b-field') || e.target.closest('.bro-agree');
        if (box) box.classList.remove('invalid');
      });

      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        errBox.classList.remove('show');
        form.querySelectorAll('.invalid').forEach(function (el) { el.classList.remove('invalid'); });

        var checks = [
          ['bro-name', val('bro-name') !== ''],
          ['bro-company', val('bro-company') !== ''],
          ['bro-email', emailRe.test(val('bro-email'))],
          ['bro-size', val('bro-size') !== '']
        ];
        var valid = true;
        checks.forEach(function (c) {
          if (!c[1]) { valid = false; var el = document.getElementById(c[0]); var box = el && el.closest('.b-field'); if (box) box.classList.add('invalid'); }
        });
        if (!document.getElementById('bro-agree').checked) { valid = false; document.getElementById('bro-agree-wrap').classList.add('invalid'); }
        if (!valid) { var f = form.querySelector('.invalid input, .invalid select'); if (f) f.focus(); return; }

        var payload = {
          name: val('bro-name'), company: val('bro-company'), email: val('bro-email'),
          role: val('bro-role') || null, phone: val('bro-phone') || null, size: val('bro-size')
        };

        btn.disabled = true;
        btn.innerHTML = '전송 중… <i class="fa-solid fa-spinner fa-spin"></i>';
        try {
          var res = await fetch(SUPABASE_URL + '/rest/v1/brochure_requests', {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error('insert failed: ' + res.status);
          inner.innerHTML =
            '<div class="bro-done">' +
            '  <div class="dot"><i class="fa-solid fa-file-arrow-down"></i></div>' +
            '  <h2>소개서가 준비되었습니다.</h2>' +
            '  <p>아래 버튼으로 소개서를 내려받으세요.<br>입력하신 이메일로도 보내드립니다.</p>' +
            '  <a href="' + BROCHURE_FILE + '" download class="btn btn-blue"><i class="fa-solid fa-download"></i> 소개서 다운로드</a>' +
            '  <p class="sub-note">담당자가 도입 관련 안내로 곧 연락드릴 수 있습니다.</p>' +
            '</div>';
        } catch (err) {
          btn.disabled = false;
          btn.innerHTML = '소개서 받기 <i class="fa-solid fa-download"></i>';
          errBox.textContent = '요청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
          errBox.classList.add('show');
          console.error('brochure request failed:', err);
        }
      });
    });
  })();

  /* 채팅 도우미(챗봇) — body에 1회 주입. FAQ 기반 응답 + 도입 문의 연결.
     백엔드 없이 동작(정적/Next 공용). 스타일은 theme.css(.cbot*). */
  (function setupChatbot() {
    // 로컬 esc — blog-data.js(window.esc) 미로드 페이지에서도 동작
    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    var KB = [
      { q: 'AI 면접은 어떻게 진행되나요?', a: '지원자는 안내에 따라 온라인으로 AI 면접에 응시합니다. AIVIEW가 응답을 분석·검증해 역량 평가와 핵심 요약 리포트를 만들고, 채용팀에는 검증을 통과한 상위 후보의 리포트만 전달됩니다.', k: ['면접', '진행', '어떻게', '응시', '방식'] },
      { q: '기존 ATS·채용 툴과 연동되나요?', a: '네, 주요 ATS·채용 툴과의 연동을 지원합니다. 구체적인 연동 방식은 도입 문의 시 환경에 맞게 안내해 드려요.', k: ['ats', '연동', '툴', '통합', '연결'] },
      { q: '도입까지 얼마나 걸리나요?', a: '환경에 따라 다르지만 빠르게 시작하실 수 있습니다. 도입 문의를 남겨주시면 일정과 함께 안내드려요.', k: ['도입', '기간', '얼마나', '시작', '언제', '소요'] },
      { q: '지원자 데이터는 안전한가요?', a: '지원자 데이터는 안전하게 암호화되어 관리되며 관련 법규를 준수합니다. 자세한 보안 정책은 개인정보처리방침에서 확인하실 수 있어요.', k: ['데이터', '보안', '안전', '개인정보', '보호'] },
      { q: '비용은 어떻게 되나요?', a: '채용 규모와 활용 범위에 따라 맞춤 견적으로 안내드립니다. 도입 문의를 남겨주시면 상세 견적을 드려요.', k: ['비용', '가격', '요금', '견적', '얼마'] }
    ];
    var GREETING = '안녕하세요! AIVIEW 도우미예요. 🙂<br>AI 면접 도입에 대해 궁금한 점을 물어보세요.';
    var FALLBACK = '정확한 안내를 위해 <a href="apply.html">도입 문의</a>를 남겨주시면 담당자가 영업일 기준 1일 내 연락드려요. 아래 자주 묻는 질문도 참고해 보세요!';

    var WIDGET = '' +
      '<div class="cbot" id="cbot">' +
      '  <button type="button" class="cbot-fab" id="cbotFab" aria-label="채팅 문의 열기">' +
      '    <span class="cbot-fab-ico"><i class="fa-solid fa-comment-dots"></i></span>' +
      '    <span><span class="cb-t">궁금한 건 채팅으로 문의하세요</span><span class="cb-s">평균 몇 분 내 답변드립니다</span></span>' +
      '  </button>' +
      '  <div class="cbot-panel" id="cbotPanel" hidden>' +
      '    <div class="cbot-head">' +
      '      <div class="cbot-head-id"><span class="cbot-ava"><i class="fa-solid fa-headset"></i></span>' +
      '        <div><div class="cbot-name">AIVIEW 도우미</div><div class="cbot-status">보통 몇 분 내 답변</div></div></div>' +
      '      <button type="button" class="cbot-close" id="cbotClose" aria-label="닫기"><i class="fa-solid fa-xmark"></i></button>' +
      '    </div>' +
      '    <div class="cbot-body" id="cbotBody"></div>' +
      '    <div class="cbot-quick" id="cbotQuick"></div>' +
      '    <form class="cbot-input" id="cbotForm">' +
      '      <input type="text" id="cbotText" placeholder="메시지를 입력하세요" autocomplete="off">' +
      '      <button type="submit" aria-label="전송"><i class="fa-solid fa-paper-plane"></i></button>' +
      '    </form>' +
      '  </div>' +
      '</div>';

    function ready(fn) {
      if (document.readyState !== 'loading') fn();
      else document.addEventListener('DOMContentLoaded', fn);
    }

    ready(function () {
      if (document.getElementById('cbot')) return;
      var holder = document.createElement('div');
      holder.innerHTML = WIDGET;
      document.body.appendChild(holder.firstChild);

      var root = document.getElementById('cbot');
      var fab = document.getElementById('cbotFab');
      var panel = document.getElementById('cbotPanel');
      var body = document.getElementById('cbotBody');
      var quick = document.getElementById('cbotQuick');
      var form = document.getElementById('cbotForm');
      var input = document.getElementById('cbotText');
      var started = false;

      function scrollDown() { body.scrollTop = body.scrollHeight; }
      function addMsg(who, html) {
        var m = document.createElement('div');
        m.className = 'cbot-msg ' + who;
        m.innerHTML = html; // 콘텐츠는 내부 정의(KB)라 안전
        body.appendChild(m);
        scrollDown();
      }
      function botReply(html) { setTimeout(function () { addMsg('bot', html); }, 280); }

      function renderQuick() {
        quick.innerHTML = '';
        KB.forEach(function (item) {
          var b = document.createElement('button');
          b.type = 'button';
          b.textContent = item.q;
          b.addEventListener('click', function () { handle(item.q); });
          quick.appendChild(b);
        });
      }

      function answerFor(text) {
        var t = text.toLowerCase();
        for (var i = 0; i < KB.length; i++) {
          if (t.indexOf(KB[i].q.toLowerCase()) >= 0) return KB[i].a;
        }
        for (var j = 0; j < KB.length; j++) {
          for (var n = 0; n < KB[j].k.length; n++) {
            if (t.indexOf(KB[j].k[n].toLowerCase()) >= 0) return KB[j].a;
          }
        }
        return FALLBACK;
      }
      function handle(text) {
        addMsg('user', esc(text));
        botReply(answerFor(text));
      }

      function open() {
        root.classList.add('open');
        panel.removeAttribute('hidden');
        if (!started) {
          started = true;
          botReply(GREETING);
          renderQuick();
        }
        setTimeout(function () { input.focus(); }, 120);
      }
      function close() { root.classList.remove('open'); panel.setAttribute('hidden', ''); }

      fab.addEventListener('click', open);
      document.getElementById('cbotClose').addEventListener('click', close);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = input.value.trim();
        if (!v) return;
        input.value = '';
        handle(v);
      });
    });
  })();

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
