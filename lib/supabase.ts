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

// 블로그 포스트 타입
export type Post = {
  id: string;
  created_at: string;
  updated_at?: string | null;
  title: string;
  category?: string | null;
  excerpt?: string | null;
  cover_url?: string | null;
  content: string;
  author?: string | null;
  published: boolean;
  tags?: string[] | null;
  slug?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
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
};

// 도입문의 상담 상태 값
export const SIGNUP_STATUSES = ["신규", "확인 완료", "상담 진행", "완료", "보류"] as const;

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

// 약관 버전 스냅샷(legal_doc_versions) — 저장할 때마다 1줄 적재
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

// 루트 경로로 노출되는 예약 slug (그 외 신규 약관은 /legal/[slug])
export const RESERVED_LEGAL_SLUGS: Record<string, string> = {
  privacy: "/privacy",
  terms: "/terms",
  "terms-applicant": "/terms-applicant",
};
export function legalPath(slug: string): string {
  return RESERVED_LEGAL_SLUGS[slug] ?? `/legal/${slug}`;
}
