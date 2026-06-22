import { supabase } from "./supabase";

// 랜딩 FAQ 기본값 — DB(faq 테이블)가 비어있거나 조회 실패 시 폴백.
// faq 테이블 마이그레이션(supabase/admin-setup.sql) 전에도 사이트가 깨지지 않도록 한다.
export const DEFAULT_FAQ: { question: string; answer: string }[] = [
  {
    question: "AI 면접은 어떻게 진행되나요?",
    answer:
      "지원자는 안내에 따라 온라인으로 AI 면접에 응시합니다. AI가 응답을 분석해 역량 평가와 핵심 요약이 담긴 리포트를 생성하며, 채용팀은 리포트를 바탕으로 후보자를 검토합니다.",
  },
  {
    question: "기존 ATS·채용 툴과 연동되나요?",
    answer:
      "리포트는 표준 형식으로 제공되어 기존 채용 프로세스에 바로 활용할 수 있습니다. 상세 연동 방식은 도입 상담에서 안내해 드립니다.",
  },
  {
    question: "도입까지 얼마나 걸리나요?",
    answer: "무료 신청 후 담당자가 도입 방식과 데모를 안내드립니다. 별도 설치 없이 온라인으로 진행할 수 있습니다.",
  },
  {
    question: "지원자 데이터는 안전하게 관리되나요?",
    answer:
      "모든 데이터는 전송 구간 암호화(HTTPS)와 접근 통제 정책 아래 관리됩니다. 수집 항목과 처리 방식은 개인정보처리방침에서 확인하실 수 있습니다.",
  },
  {
    question: "비용은 어떻게 책정되나요?",
    answer:
      "채용 규모와 활용 방식에 맞춰 책정됩니다. 우선 무료로 도입 효과를 확인해 보신 뒤, 상담을 통해 안내해 드립니다.",
  },
];

// 게시된 FAQ를 정렬해 반환. 없거나 오류면 기본값 폴백.
export async function getFaqs(): Promise<{ question: string; answer: string }[]> {
  try {
    const res = await supabase
      .from("faq")
      .select("question, answer")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (res.error) throw res.error;
    if (res.data && res.data.length > 0) {
      return res.data as { question: string; answer: string }[];
    }
  } catch {
    // 테이블 미생성/권한/네트워크 등 — 폴백
  }
  return DEFAULT_FAQ;
}
