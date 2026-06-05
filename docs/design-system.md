# AIVIEW 디자인 시스템 규격

> 대상: `index.html`, `apply.html` 및 이후 추가되는 모든 정적 페이지
> 원칙: **하드코딩 금지.** 색/반경/그림자/폰트는 아래 토큰(`:root` CSS 변수)을 통해서만 사용한다.
> 빌드 시스템이 없으므로 토큰·컴포넌트 CSS는 각 페이지의 인라인 `<style>`에 동일하게 유지하고, **마크업 단위 재사용은 `partials.js`(GNB/푸터)** 로 한다.

---

## 1. 디자인 토큰 (`:root` 변수)

모든 신규 페이지는 아래 블록을 그대로 복사해 `:root`에 둔다.

```css
:root{
  /* Brand / Blue scale */
  --blue:#2E6CF0;   /* Primary — 버튼, 강조 텍스트, 포커스 */
  --blue-d:#1F54CC; /* Primary hover / 진한 강조 */
  --blue-2:#5B8DF7; /* 보조 블루 — 그라데이션, 포커스 링 */

  /* Surfaces / Tints */
  --soft:#F4F8FF;   /* 옅은 배경 (카드, 섹션) */
  --soft-2:#EAF1FE; /* 칩/뱃지 배경, 섹션 그라데이션 상단 */
  --tint:#DCE8FE;   /* 가장 옅은 강조 면 */

  /* Text / Ink */
  --ink:#142036;    /* 본문 기본 텍스트 / 제목 */
  --slate:#566179;  /* 보조 텍스트 (lead, 설명) */
  --slate-2:#8A93A8;/* 플레이스홀더, 캡션 */
  --line:#E5EBF5;   /* 보더, 구분선 */

  /* Base / Status */
  --bg:#fff;
  --green:#16A34A;  /* 성공 (완료, 체크) */
  --amber:#E0890B;  /* 주의 */
  --red:#E0584A;    /* 오류 / 검증 실패 */

  /* Shape & Elevation */
  --r:16px;                                   /* 기본 radius */
  --shadow:0 18px 48px -22px rgba(20,40,90,.22); /* 카드 그림자 */
}
```

### 색 사용 가이드

| 용도 | 토큰 |
|---|---|
| 주요 CTA 배경 | `--blue` (hover `--blue-d`) |
| 강조 텍스트(`.blue`) | `--blue` |
| 본문 / 제목 | `--ink` |
| 보조 설명 | `--slate` |
| 플레이스홀더·캡션 | `--slate-2` |
| 보더·구분선 | `--line` |
| 카드/옅은 섹션 배경 | `--soft` / `--soft-2` |
| 성공 상태 | `--green` |
| 오류·검증 실패 | `--red` |

### Radius / Elevation
- 버튼: `11px` · 입력 필드: `11px` · 칩/뱃지: `999px`(pill) · 카드: `16~20px`(`--r` 기준)
- 카드 그림자는 항상 `--shadow`. 버튼 그림자는 블루 계열 전용: `0 8px 20px -8px rgba(46,108,240,.6)`.

---

## 2. 타이포그래피

### 폰트 패밀리
- **본문/UI:** Pretendard (CDN: jsdelivr `pretendard@v1.3.9`).
- 폴백 스택(반드시 동일하게):
  ```css
  font-family:'Pretendard','Apple SD Gothic Neo',-apple-system,'Segoe UI',sans-serif;
  ```
- 아이콘: **Font Awesome 6.5.2** (CDN: cdnjs). `<i class="fa-solid fa-...">` / `fa-brands`.
- 기본 `line-height:1.62`, `-webkit-font-smoothing:antialiased`.

### 타입 스케일

| 역할 | 크기 | weight | letter-spacing | 비고 |
|---|---|---|---|---|
| Hero `h1` | `clamp(34px,4.6vw,56px)` | 800 | `-.04em` | line-height 1.15 |
| 페이지 `h1` (apply) | `clamp(30px,3.8vw,46px)` | 800 | `-.035em` | line-height 1.16 |
| 섹션 `h2` | `clamp(28px,3.6vw,44px)` | 800 | `-.03em` | line-height 1.22 |
| 카드 제목 `h3` | `20px` | 800 | `-.02em` | |
| 본문/lead | `18px` | 400~600 | — | `color:--slate` |
| 기본 본문 | `15px` | 400 | — | |
| 라벨 | `13px` | 700 | — | |
| 캡션/eyebrow | `13px` | 800 | `.06em` | UPPERCASE |

> 반응형 제목은 항상 `clamp()`를 쓴다. 고정 px 헤드라인 금지.

---

## 3. 레이아웃

- **컨테이너:** `.wrap{max-width:1140px;margin:0 auto;padding:0 24px}`
- **섹션 세로 패딩:** `section{padding:92px 0}` (모바일에서 컴포넌트별 `@media`로 축소)
- **그리드:** 카드형은 `display:grid` + `grid-template-columns:repeat(N,1fr)` + `gap:20px`.
- **반응형 브레이크포인트(컴포넌트별 `@media`):** 주 단계 **880 / 760 / 560px**, 보조 600 / 480 / 640px.
  - 전역 브레이크포인트 시스템 없음 — 각 컴포넌트 CSS 끝에 개별 규칙을 둔다.

---

## 4. 컴포넌트

### 4.1 버튼 `.btn`
```
.btn        기본 — inline-flex, gap 9px, padding 14px 28px, radius 11px, weight 700, 15px
.btn-blue   Primary — 배경 --blue, hover --blue-d + translateY(-1px), 블루 그림자
.btn-out    Secondary — 흰 배경, 1px --line 보더, hover 보더/텍스트 블루
.btn-white  On-dark — 흰 배경 + --blue-d 텍스트 (어두운/블루 섹션 위)
```
- 화살표 동반 시: `무료 신청하기 <i class="fa-solid fa-arrow-right"></i>`
- 폼 제출 버튼은 `width:100%` + `justify-content:center`.

### 4.2 칩 / Eyebrow
```
.eyebrow   섹션 상단 라벨 — pill, --soft-2 배경, --blue 텍스트, UPPERCASE, 13px/800
.tagchip   히어로 태그 — 흰 배경 + --line 보더 + 옅은 그림자 (index 히어로 전용)
```

### 4.3 카드
- 표준 카드: `background:#fff; border:1px solid --line; border-radius:16~20px; box-shadow:--shadow; padding:28~34px`.
- 옅은 면 카드(valcard 류): `background:--soft; border:1px solid --line; border-radius:--r`.

### 4.4 폼 필드 (apply.html 기준 표준)
```
.field            래퍼 (margin-bottom 16px)
.field label      13px / 700, 필수표시 <span class="req">*</span> (--blue)
.field input/select/textarea
                  width 100%, padding 13px 14px, radius 11px, 1px --line 보더
  :focus          border --blue-2 + box-shadow 0 0 0 3px rgba(91,141,247,.16)
.field-row        2-컬럼 그리드 (gap 14px), 560px↓에서 1컬럼
.field.invalid    보더 --red + 붉은 포커스 링, .err 표시
.field .err       12.5px / --red, 평소 display:none
.agree            동의 체크박스 행 (체크박스 accent-color:--blue)
```
- **검증 규칙:** `required` 속성 + JS. 이메일은 정규식 `/^[^@\s]+@[^@\s]+\.[^@\s]+$/`. 실패 시 필드에 `.invalid` 부여, 입력(`input` 이벤트) 시 해제.

### 4.5 상태 표시
- **성공/완료:** 원형 아이콘(`--soft-2` 배경 + `--green` 체크) + 메시지. (apply.html `.apply-done`)
- **신뢰 요소(reassure):** `<i class="fa-solid fa-circle-check">` + 짧은 문구 리스트. 어두운 섹션에선 `#DCE7FF`, 밝은 섹션에선 `--green` 아이콘 + `--ink` 텍스트.

### 4.6 공유 GNB / 푸터 (partial)
- **`partials.js`** 가 `<site-header></site-header>` / `<site-footer></site-footer>` 커스텀 엘리먼트를 정의한다. 마크업은 이 파일에서만 수정한다.
- 내부에 `<header>` / `<footer>` 태그를 렌더하므로 아래 CSS 셀렉터가 그대로 적용된다 — **모든 페이지의 인라인 `<style>`에 nav/footer CSS를 동일하게 포함**시켜야 한다.
  - GNB: `header`(sticky, blur 배경, 하단 `--line` 보더), `.logo`/`.nav-logo-img`, `.navlinks`(우측 액션). 우측은 **「도입 문의」 버튼(`.nav-btn`, 파란 솔리드) + 햄버거 메뉴 버튼(`.nav-menu-btn`, 흰 아웃라인)** 한 쌍 — 동일 높이(40px)·라운드(11px). 메뉴 버튼은 `.nav-menu` 드롭다운(섹션 링크 + `.nav-menu-cta` 무료 데모 신청)을 토글하며, 토글 로직은 `partials.js`에 위임 바인딩.
  - 푸터: `footer`(다크 그라데이션 `#0C1430→#0E1626`), `.foot-links`(2컬럼), `.foot-col`, `.foot-bottom`, `.foot-logo-img`, `.foot-social`.
- 로고: GNB `supercoder-nav.svg`(파란 락업, h 26px) · 푸터 `supercoder-logo.svg`(흰색 락업, h 24px). 공식 브랜드 가이드에서 추출한 벡터.

---

## 5. 에셋 / 의존성

| 종류 | 값 |
|---|---|
| 폰트 | Pretendard v1.3.9 (jsdelivr CDN) |
| 아이콘 | Font Awesome 6.5.2 (cdnjs CDN) |
| 로고(GNB) | `supercoder-nav.svg` (벡터) |
| 로고(푸터) | `supercoder-logo.svg` (벡터) |
| 제품 데모 | `demo-result.png` |

---

## 6. 신규 페이지 체크리스트

1. `:root` 토큰 블록 복사 + 기본 리셋(`*`, `html`, `body`, `a`, `.wrap`) 포함.
2. 공유 컴포넌트 CSS(`.btn` 계열, `.eyebrow`, **nav CSS, footer CSS**) 포함.
3. 본문은 `<site-header></site-header>` … `<site-footer></site-footer>` 사이에 두고, 끝에 `<script src="partials.js"></script>`.
4. 색·radius·그림자는 토큰만 사용(하드코딩 금지).
5. 반응형은 컴포넌트별 `@media`(880/760/560).
6. 구현 후 Playwright 로컬 테스트 → `screenshots/`에 캡처(데스크톱/모바일).
