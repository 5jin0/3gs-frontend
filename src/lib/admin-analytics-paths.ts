/**
 * Admin analytics HTTP paths (search funnel, UX, cohorts, retention, user saved counts).
 * Default matches README; override if your API mounts under a different prefix
 * (e.g. `/api/v1/admin/analytics`).
 */
export function getAdminAnalyticsBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_PREFIX?.trim();
  const base = (raw && raw.length > 0 ? raw : "/admin/analytics").replace(/\/$/, "");
  return base.startsWith("/") ? base : `/${base}`;
}

export function adminAnalyticsEndpoint(suffix: string): string {
  const s = suffix.startsWith("/") ? suffix : `/${suffix}`;
  return `${getAdminAnalyticsBasePath()}${s}`;
}

export type AdminAnalyticsKind =
  | "searchFunnel"
  | "searchUx"
  | "accessCohorts"
  | "retention"
  | "userSavedCounts";

/** Shown when the server returns HTTP 404 for an analytics GET. */
export function adminAnalyticsNotFoundMessage(kind: AdminAnalyticsKind): string {
  const base = getAdminAnalyticsBasePath();
  const examples: Record<AdminAnalyticsKind, string> = {
    searchFunnel: `${base}/search-funnel?period=…`,
    searchUx: `${base}/search-ux?period=…`,
    accessCohorts: `${base}/access-cohorts?period=…&group_by=…`,
    retention: `${base}/retention?granularity=…`,
    userSavedCounts: `${base}/user-saved-counts`,
  };
  return (
    `서버가 404를 반환했습니다. 백엔드에 아래 GET이 없거나 경로가 다를 수 있습니다. ` +
    `접두는 .env의 NEXT_PUBLIC_ADMIN_ANALYTICS_PREFIX로 맞출 수 있습니다(현재 기준: ${base}). ` +
    `예: ${examples[kind]}`
  );
}
