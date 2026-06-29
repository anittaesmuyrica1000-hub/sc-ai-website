import type { Metadata } from "next";
import { supabase, type PageSeo } from "./supabase";

// 페이지 경로의 "적용된(published)" SEO 초안 1건을 가져온다.
// 테이블 미적용/초안 없음/에러 시 null → 페이지는 코드 기본값(fallback)을 그대로 사용.
export async function getPageSeo(path: string): Promise<PageSeo | null> {
  try {
    const res = await supabase
      .from("page_seo")
      .select("*")
      .eq("path", path)
      .eq("published", true)
      .maybeSingle();
    if (res.error || !res.data) return null;
    return res.data as PageSeo;
  } catch {
    return null;
  }
}

const v = (s?: string | null) => {
  const t = (s ?? "").trim();
  return t.length ? t : undefined;
};

// 코드 기본 metadata 위에 어드민 초안(seo)을 덮어쓴다.
// 어드민에서 비워 둔 필드는 fallback 값을 유지한다(부분 override).
export function mergeSeo(fallback: Metadata, seo: PageSeo | null): Metadata {
  if (!seo) return fallback;

  const title = v(seo.title) ?? (fallback.title as string | undefined);
  const description = v(seo.description) ?? (fallback.description as string | undefined);
  const ogTitle = v(seo.og_title) ?? title;
  const ogDescription = v(seo.og_description) ?? description;
  const ogImage = v(seo.og_image);

  const fbOg = fallback.openGraph ?? {};
  const fbOgImages = "images" in fbOg ? fbOg.images : undefined;

  const merged: Metadata = {
    ...fallback,
    ...(title !== undefined ? { title } : {}),
    ...(description !== undefined ? { description } : {}),
    openGraph: {
      ...fbOg,
      ...(ogTitle !== undefined ? { title: ogTitle } : {}),
      ...(ogDescription !== undefined ? { description: ogDescription } : {}),
      ...(ogImage !== undefined
        ? { images: [{ url: ogImage }] }
        : fbOgImages !== undefined
          ? { images: fbOgImages }
          : {}),
    },
  };

  if (seo.noindex) merged.robots = { index: false, follow: false };

  return merged;
}

// 한 번에: 경로의 초안을 조회해 fallback 에 병합한 Metadata 반환.
export async function buildPageMetadata(path: string, fallback: Metadata): Promise<Metadata> {
  const seo = await getPageSeo(path);
  return mergeSeo(fallback, seo);
}
