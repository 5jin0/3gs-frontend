/** 일·주·월 토글 — 분석 API `period` / `granularity`와 동일 값으로 맞출 것 */
export type AdminPeriod = "day" | "week" | "month";

export const ADMIN_PERIOD_OPTIONS: { value: AdminPeriod; label: string }[] = [
  { value: "day", label: "일" },
  { value: "week", label: "주" },
  { value: "month", label: "월" },
];
