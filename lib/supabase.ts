import { createClient } from "@supabase/supabase-js";

// 공개(publishable) 키 — RLS로 보호되므로 클라이언트 노출 안전.
// 값은 환경변수(.env.local / Vercel)에서 주입한다.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // 빌드/런타임에서 누락 시 빠르게 인지 (배포 환경변수 설정 누락 방지)
  console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL / ANON_KEY 가 설정되지 않았습니다.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 예약 발행 필터 — .eq("published", true)와 함께 .or(...)에 넣어 사용.
// publish_at이 NULL(즉시 발행)이거나 이미 지난 글만 공개 노출한다.
export function publishAtVisibleOr(): string {
  return `publish_at.is.null,publish_at.lte.${new Date().toISOString()}`;
}

// 예약 시각이 아직 안 된 글인지 (단건 조회 후 노출 판단용)
export function isScheduledFuture(publishAt?: string | null): boolean {
  return !!publishAt && new Date(publishAt).getTime() > Date.now();
}

// 블로그 포스트 타입
export type Post = {
  id: string;
  created_at: string;
  updated_at?: string | null;
  title: string;
  category?: string | null;
  excerpt?: string | null;
  cover_url?: string | null;
  cover_alt?: string | null;
  content: string;
  author?: string | null;
  published: boolean;
  tags?: string[] | null;
  slug?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  views?: number | null;
  publish_at?: string | null; // 예약 발행 시각(UTC). NULL이면 즉시 발행
};

// 제품 업데이트(릴리즈 노트/체인지로그) 타입 — 어드민 등록 + /update 페이지 렌더(비공개·링크 전용)
export type Update = {
  id: string;
  created_at: string;
  updated_at?: string | null;
  title: string;
  category?: string | null;   // 신규 기능 / 개선 / 버그 수정 / 공지
  excerpt?: string | null;
  content: string;
  published: boolean;
  views?: number | null;
  slug?: string | null;
  publish_date?: string | null; // 배포일(직접 지정, YYYY-MM-DD)
};

// FAQ 타입 (어드민 관리 + 랜딩 노출)
export type Faq = {
  id: string;
  category?: string | null;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
  created_at?: string;
  updated_at?: string | null;
};

// 도입문의(signups) 타입
export type Signup = {
  id: string;
  created_at: string;
  name: string;
  company: string;
  email: string;
  role?: string | null;
  phone?: string | null;
  size?: string | null;
  memo?: string | null;
  status?: string | null;
  admin_note?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_id?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  referrer?: string | null;
};

// 도입문의 상담 상태 값
export const SIGNUP_STATUSES = ["신규", "확인 완료", "상담 진행", "완료", "보류"] as const;

// UTM 추적 파라미터 키(유입 URL에서 읽어 signups·brochure_requests에 저장. lib/utm.ts 참고)
export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_id", "utm_term", "utm_content"] as const;
// UTM 외 유입 추적 필드 — 광고 클릭 ID(구글 자동 태깅 gclid, 메타 fbclid) + utm 없는 유입의 referrer 호스트명
export const TRACKING_KEYS = [...UTM_KEYS, "gclid", "fbclid", "referrer"] as const;
export const UTM_LABEL: Record<string, string> = {
  utm_source: "소스", utm_medium: "매체", utm_campaign: "캠페인",
  utm_id: "캠페인 ID", utm_term: "키워드", utm_content: "콘텐츠",
  gclid: "구글 광고 클릭 ID", fbclid: "메타 광고 클릭 ID", referrer: "유입 사이트",
};

// 서비스소개서 신청 리드(brochure_requests) 타입
export type BrochureRequest = {
  id: string;
  created_at: string;
  name: string;
  company: string;
  email: string;
  role?: string | null;
  phone?: string | null;
  size?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_id?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  referrer?: string | null;
  downloaded_at?: string | null;
  download_count?: number | null;
};

// 약관(법적 문서) 타입 — admin 관리 + 법적 페이지 렌더
export type LegalDoc = {
  id: string;
  slug: string;
  title: string;
  meta?: string | null;
  body: string;
  sort_order: number;
  published: boolean;
  effective_date?: string | null;
  version?: number | null;
  created_at?: string;
  updated_at?: string | null;
};

// 약관 버전 이력(legal_doc_versions) 타입
export type LegalVersion = {
  id: string;
  slug: string;
  version: number;
  title: string;
  meta?: string | null;
  body: string;
  effective_date?: string | null;
  created_at?: string;
};

// 페이지별 SEO 메타데이터(초안) 타입 — 어드민 관리 + 페이지 generateMetadata 반영
export type PageSeo = {
  id: string;
  path: string;            // "/", "/apply" …
  label: string;           // 어드민 표시용 이름
  title?: string | null;
  description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  noindex: boolean;
  published: boolean;      // true 면 실제 페이지에 적용, false 면 초안(미반영)
  sort_order: number;
  created_at?: string;
  updated_at?: string | null;
};

// SEO 관리 대상 페이지(어드민 시드/표시 기준). path 가 page_seo.path 와 매칭된다.
export const SEO_PAGES: { path: string; label: string }[] = [
  { path: "/", label: "홈 (랜딩)" },
  { path: "/apply", label: "도입문의" },
  { path: "/blog", label: "블로그 목록" },
  { path: "/privacy", label: "개인정보처리방침" },
  { path: "/terms", label: "서비스 이용약관(기업)" },
  { path: "/terms-applicant", label: "지원자용 이용약관" },
];

// 루트 경로로 노출되는 예약 slug (그 외 신규 약관은 /legal/[slug])
export const RESERVED_LEGAL_SLUGS: Record<string, string> = {
  privacy: "/privacy",
  terms: "/terms",
  "terms-applicant": "/terms-applicant",
};
export function legalPath(slug: string): string {
  return RESERVED_LEGAL_SLUGS[slug] ?? `/legal/${slug}`;
}
