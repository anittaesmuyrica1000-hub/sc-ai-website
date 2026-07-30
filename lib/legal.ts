import { supabase, type LegalDoc, type LegalVersion } from "@/lib/supabase";

// 법적 페이지 — 공개(게시된) 약관 1건 조회. 실패/부재 시 null(라우트는 정적 폴백).
export async function getLegalDoc(slug: string): Promise<LegalDoc | null> {
  try {
    const res = await supabase
      .from("legal_docs")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (res.error) return null;
    return (res.data as LegalDoc) ?? null;
  } catch {
    return null;
  }
}

// 약관 이전 버전 이력 — 버전 번호 내림차순(최신순). 본문(body) 포함.
export async function getLegalVersions(slug: string): Promise<LegalVersion[]> {
  try {
    const res = await supabase
      .from("legal_doc_versions")
      .select("*")
      .eq("slug", slug)
      .order("version", { ascending: false });
    if (res.error) return [];
    return (res.data as LegalVersion[]) ?? [];
  } catch {
    return [];
  }
}

// HTML 제목에서 태그 제거 — <title> 메타데이터용
export function stripHtml(s: string): string {
  return String(s || "").replace(/<[^>]*>/g, "").trim();
}
