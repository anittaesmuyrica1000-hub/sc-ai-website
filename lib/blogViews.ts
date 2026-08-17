import { createClient } from "@supabase/supabase-js";

// 서버 전용: 쿠키 동의와 무관한 서버측 트래픽 지표.
// 블로그 상세는 increment_post_views RPC로 조회수를 DB에 직접 세므로, 배너에서 '허용'을 누르지
// 않아 GA4에서 사라지는 방문자도 posts.views에는 남는다(2026-08-17 점검: GA4는 실제의 5~23%만 집계).
// 누적값만으로는 추이를 볼 수 없어, 크론이 매일 스냅샷을 남기고 그 차이를 "일별 증가분"으로 쓴다.
// 스냅샷 테이블(blog_view_snapshots)이 없으면 조용히 건너뛴다 — 누적 총합은 그대로 보고한다.
// service_role 키는 절대 클라이언트/깃에 노출 금지 — Vercel 환경변수(SUPABASE_SERVICE_ROLE_KEY)에만.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type BlogViews = {
  available: boolean;      // posts 조회 성공 여부
  total: number;           // 현재 누적 조회수
  postsCount: number;      // 공개 글 수
  delta: number | null;    // 직전 스냅샷 대비 증가분 (스냅샷 없으면 null)
  hours: number | null;    // 직전 스냅샷과의 간격(시간)
  perDay: number | null;   // 최근 최대 7개 스냅샷 구간의 일 평균 증가분
};

const EMPTY: BlogViews = { available: false, total: 0, postsCount: 0, delta: null, hours: null, perDay: null };

// 오늘 날짜(KST) — 스냅샷 1일 1행 기준
function kstToday(): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export async function collectBlogViews(): Promise<BlogViews> {
  if (!SUPABASE_URL || !SERVICE_KEY) return EMPTY;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // 1. 현재 누적 조회수 — 글 수십 건 규모라 전량 조회 후 합산(SUM용 RPC 불필요)
  const posts = await admin.from("posts").select("views,published");
  if (posts.error) {
    console.warn("blog views fetch failed:", posts.error.message);
    return EMPTY;
  }
  const rowsAll = posts.data ?? [];
  const total = rowsAll.reduce((a, r) => a + (r.views ?? 0), 0);
  const postsCount = rowsAll.filter((r) => r.published).length;
  const base: BlogViews = { available: true, total, postsCount, delta: null, hours: null, perDay: null };

  const today = kstToday();
  const now = Date.now();

  // 2. 직전 스냅샷(오늘 행 제외 — 같은 날 재실행 시 자기 자신과 비교하지 않도록)
  const prevRows = await admin
    .from("blog_view_snapshots")
    .select("snapshot_at,views_total")
    .lt("snapshot_date", today)
    .order("snapshot_date", { ascending: false })
    .limit(7);

  if (prevRows.error) {
    // 테이블 미생성(42P01) 등 — 스냅샷 기능만 비활성, 누적 총합은 유지
    console.warn("blog view snapshots unavailable:", prevRows.error.message);
    return base;
  }

  const snaps = prevRows.data ?? [];
  if (snaps.length) {
    const last = snaps[0];
    base.delta = total - (last.views_total ?? 0);
    base.hours = Math.round(((now - new Date(last.snapshot_at).getTime()) / 3_600_000) * 10) / 10;

    // 일 평균: 가장 오래된 스냅샷(최대 7개 전)부터 지금까지의 증가분 ÷ 경과 일수
    const oldest = snaps[snaps.length - 1];
    const days = (now - new Date(oldest.snapshot_at).getTime()) / 86_400_000;
    if (days >= 1) base.perDay = Math.round(((total - (oldest.views_total ?? 0)) / days) * 10) / 10;
  }

  // 3. 오늘 스냅샷 기록(하루 1행 upsert) — 실패해도 보고는 계속한다
  const up = await admin
    .from("blog_view_snapshots")
    .upsert(
      { snapshot_date: today, snapshot_at: new Date(now).toISOString(), views_total: total, posts_count: postsCount },
      { onConflict: "snapshot_date" }
    );
  if (up.error) console.warn("blog view snapshot write failed:", up.error.message);

  return base;
}
