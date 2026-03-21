import { api, type ApiSuccessResponse } from "@/lib/api";

/** Single term row returned from the Pangyo glossary search endpoint. */
export type PangyoTerm = {
  /** Glossary term id (when provided by the API). */
  id?: number;
  term_id?: number;
  term: string;
  original_meaning: string;
  definition: string;
  example: string;
};

export type { ApiSuccessResponse } from "@/lib/api";

export type PangyoTermSuggestion = {
  term: string;
};

export type TermSuggestionsResponse = ApiSuccessResponse<PangyoTermSuggestion[]>;
type SuggestionSelectEventResponse = ApiSuccessResponse<unknown>;
type SearchEventResponse = ApiSuccessResponse<unknown>;

const LIST_KEYS = [
  "data",
  "results",
  "items",
  "terms",
  "content",
  "hits",
] as const;

/** Pull an array of term-like objects from common API envelope shapes. */
function extractTermList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const tryObject = (o: Record<string, unknown>): unknown[] | null => {
    for (const key of LIST_KEYS) {
      const v = o[key];
      if (Array.isArray(v)) return v;
    }
    return null;
  };

  const top = tryObject(payload as Record<string, unknown>);
  if (top) return top;

  // e.g. { data: { items: [...] } }
  const dataVal = (payload as Record<string, unknown>).data;
  if (dataVal && typeof dataVal === "object" && !Array.isArray(dataVal)) {
    const nested = tryObject(dataVal as Record<string, unknown>);
    if (nested) return nested;
  }

  return [];
}

function asString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(asString).filter(Boolean).join("\n");
  return "";
}

function asOptionalId(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Map backend field variants onto our PangyoTerm shape. */
export function normalizePangyoTerm(raw: unknown): PangyoTerm | null {
  if (!raw || typeof raw !== "object") return null;

  const r = raw as Record<string, unknown>;

  const termId = asOptionalId(r.term_id ?? r.termId);
  const rowId = asOptionalId(r.id);

  const term = asString(
    r.term ?? r.word ?? r.name ?? r.title ?? r.keyword ?? r.label,
  );
  const original_meaning = asString(
    r.original_meaning ??
      r.originalMeaning ??
      r.original_meaning_text ??
      r.source_meaning,
  );
  const definition = asString(
    r.definition ?? r.meaning ?? r.description ?? r.def ?? r.summary,
  );
  const example = asString(
    r.example ?? r.examples ?? r.sample ?? r.usage,
  );

  if (!term && !original_meaning && !definition && !example) {
    return null;
  }

  return {
    ...(termId != null ? { term_id: termId } : {}),
    ...(rowId != null ? { id: rowId } : {}),
    term: term || "—",
    original_meaning,
    definition,
    example,
  };
}

function normalizeResponse(payload: unknown): PangyoTerm[] {
  return extractTermList(payload)
    .map(normalizePangyoTerm)
    .filter((x): x is PangyoTerm => x !== null);
}

/**
 * Search Pangyo terms by keyword.
 * GET /terms/search?keyword=...
 */
export async function searchTerms(keyword: string): Promise<PangyoTerm[]> {
  const { data } = await api.get<unknown>("/terms/search", {
    params: { keyword },
  });
  return normalizeResponse(data);
}

/**
 * Get Pangyo term suggestions by keyword.
 * GET /terms/suggestions?keyword=...
 */
export async function getTermSuggestions(
  keyword: string,
): Promise<PangyoTermSuggestion[]> {
  const { data } = await api.get<TermSuggestionsResponse>("/terms/suggestions", {
    params: { keyword },
  });

  return Array.isArray(data.data) ? data.data : [];
}

export async function trackSuggestionSelect(keyword: string): Promise<void> {
  await api.post<SuggestionSelectEventResponse>("/terms/events/suggestion-select", {
    keyword,
  });
}

export type SearchFlowStartPayload = {
  session_id: string;
  keyword?: string;
  trigger?: "focus" | "input" | "submit";
};

export type SearchFlowCompletePayload = {
  session_id: string;
  keyword: string;
  result_count: number;
  success: boolean;
};

export type SearchFlowExitPayload = {
  session_id: string;
  keyword?: string;
  had_complete: boolean;
  reason: "route_change" | "pagehide" | "visibility_hidden" | "unmount";
};

export async function trackSearchStart(payload: SearchFlowStartPayload): Promise<void> {
  await api.post<SearchEventResponse>("/terms/events/search-start", payload);
}

export async function trackSearchComplete(payload: SearchFlowCompletePayload): Promise<void> {
  await api.post<SearchEventResponse>("/terms/events/search-complete", payload);
}

export async function trackSearchExit(payload: SearchFlowExitPayload): Promise<void> {
  await api.post<SearchEventResponse>("/terms/events/search-exit", payload);
}
