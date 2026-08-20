// 개인정보처리방침 제2조(고객문의 및 고충처리) — "문의, 고충처리 또는 자료 제공 완료일부터 1년"
// 도입문의(signups)·소개서 리드(brochure_requests)의 보유기간 계산 유틸.
// 기산일(basis)은 마지막 처리 시점: 도입문의는 상담 완료일, 소개서는 자료 제공(다운로드) 완료일,
// 아직 완료 기록이 없으면 접수일.

export const RETENTION_YEARS = 1;
export const RETENTION_LABEL = "자료 제공 완료일부터 1년";
export const RETENTION_SOON_DAYS = 30;

export type RetentionRow = {
  created_at: string;
  completed_at?: string | null;
  downloaded_at?: string | null;
};

export function retentionBasis(r: RetentionRow): string {
  return [r.created_at, r.completed_at, r.downloaded_at]
    .filter((v): v is string => !!v)
    .reduce((a, b) => (new Date(b).getTime() > new Date(a).getTime() ? b : a));
}

export function addRetention(iso: string): Date {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + RETENTION_YEARS);
  return d;
}

// 만료 판정 기준일 — 이 시각 이전이 기산일이면 보유기간 경과(파기 대상)
export function retentionCutoffIso(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - RETENTION_YEARS);
  return d.toISOString();
}

export type RetentionInfo = { basis: string; expiresAt: Date; daysLeft: number; expired: boolean; soon: boolean };

export function retentionInfo(r: RetentionRow): RetentionInfo {
  const basis = retentionBasis(r);
  const expiresAt = addRetention(basis);
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / 86400000);
  return { basis, expiresAt, daysLeft, expired: daysLeft <= 0, soon: daysLeft > 0 && daysLeft <= RETENTION_SOON_DAYS };
}

export function isExpired(r: RetentionRow): boolean {
  return retentionInfo(r).expired;
}
