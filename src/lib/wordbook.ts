import axios from "axios";
import { api, type ApiSuccessResponse } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

export type SavedWord = {
  term_id: number;
  term: string;
  original_meaning: string;
  definition: string;
  example: string;
  saved_at?: string;
  id?: number;
};

type SaveTermApiData = {
  saved?: boolean;
  already_saved?: boolean;
  term_id?: number;
  saved_id?: number;
  user_id?: number;
};

type SaveTermApiResponse = ApiSuccessResponse<SaveTermApiData>;
type GetMyWordsApiItem = {
  term_id: number;
  term: string;
  originalMeaning?: string;
  original_meaning?: string;
  definition?: string;
  example?: string;
  saved_at?: string;
  id?: number | string;
  saved_id?: number | string;
  wordbook_id?: number | string;
};
type GetMyWordsApiResponse = ApiSuccessResponse<GetMyWordsApiItem[]>;
export type RemoveSavedTermResponse = ApiSuccessResponse<unknown>;

export type SaveTermResult = {
  termId: number;
  saved: boolean;
  alreadySaved: boolean;
};

const SAVE_TERM_ENDPOINT = "/wordbook/save";
const GET_MY_WORDS_ENDPOINT = "/wordbook";
const REMOVE_SAVED_TERM_ENDPOINT = "/wordbook/terms";
const MISSING_TOKEN_ERROR_CODE = "MISSING_ACCESS_TOKEN";

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export async function saveTerm(termId: number): Promise<SaveTermResult> {
  const token = getAccessToken();
  const body = { term_id: termId };
  const requestHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  console.log("[wordbook] saveTerm request", {
    method: "POST",
    url: SAVE_TERM_ENDPOINT,
    body,
    token,
    headers: requestHeaders,
  });

  if (!token) {
    const error = new Error(MISSING_TOKEN_ERROR_CODE);
    (error as Error & { code?: string }).code = MISSING_TOKEN_ERROR_CODE;
    throw error;
  }

  const { data } = await api.post<SaveTermApiResponse>(SAVE_TERM_ENDPOINT, body, {
    headers: requestHeaders,
  });
  console.log("[wordbook] saveTerm response", { url: SAVE_TERM_ENDPOINT, data });

  const payload = data.data ?? {};
  return {
    termId: payload.term_id ?? termId,
    saved: payload.saved === true,
    alreadySaved: payload.already_saved === true,
  };
}

export async function getMyWords(): Promise<SavedWord[]> {
  const { data } = await api.get<GetMyWordsApiResponse>(GET_MY_WORDS_ENDPOINT);
  const items = Array.isArray(data.data) ? data.data : [];

  return items.map((item) => ({
    term_id: item.term_id,
    term: item.term,
    original_meaning: item.originalMeaning ?? item.original_meaning ?? "",
    definition: item.definition ?? "",
    example: item.example ?? "",
    saved_at: item.saved_at,
    id:
      toFiniteNumber(item.id) ??
      toFiniteNumber(item.saved_id) ??
      toFiniteNumber(item.wordbook_id) ??
      item.term_id,
  }));
}

function canTryNextDeleteShape(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 404 || status === 405 || status === 422;
}

export async function removeSavedTerm(
  termId: number,
  savedId?: number,
): Promise<void> {
  const idCandidates = Array.from(
    new Set([savedId, termId].filter((v): v is number => Number.isFinite(v))),
  );

  const attempts: Array<() => Promise<unknown>> = [];
  for (const id of idCandidates) {
    attempts.push(() =>
      api.delete<RemoveSavedTermResponse>(`${REMOVE_SAVED_TERM_ENDPOINT}/${id}`),
    );
  }
  for (const id of idCandidates) {
    attempts.push(() => api.delete<RemoveSavedTermResponse>(`/wordbook/${id}`));
  }
  for (const id of idCandidates) {
    attempts.push(() =>
      api.delete<RemoveSavedTermResponse>(`/wordbook/save/${id}`),
    );
  }
  attempts.push(() =>
    api.delete<RemoveSavedTermResponse>(GET_MY_WORDS_ENDPOINT, {
      data: { term_id: termId, id: savedId },
    }),
  );
  attempts.push(() =>
    api.post<RemoveSavedTermResponse>("/wordbook/remove", {
      term_id: termId,
      id: savedId,
    }),
  );

  let lastError: unknown = null;
  for (const attempt of attempts) {
    try {
      await attempt();
      return;
    } catch (error) {
      lastError = error;
      if (!canTryNextDeleteShape(error)) throw error;
    }
  }

  if (lastError) throw lastError;
}

export function isDuplicateSavedTermError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  if (status === 409) return true;

  const data = error.response?.data;
  if (!data || typeof data !== "object") return false;

  const detail = (data as { detail?: unknown }).detail;
  const text =
    typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map(String).join(" ")
        : "";

  return /이미|중복|already|duplicate/i.test(text);
}

export function isUnauthorizedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export function isMissingTokenError(error: unknown): boolean {
  return (
    error instanceof Error &&
    ((error as Error & { code?: string }).code === MISSING_TOKEN_ERROR_CODE ||
      error.message === MISSING_TOKEN_ERROR_CODE)
  );
}

export function getWordbookErrorMessage(
  error: unknown,
  fallback = "요청 처리 중 오류가 발생했습니다.",
): string {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data;
  if (!data || typeof data !== "object") return fallback;

  const obj = data as Record<string, unknown>;
  const message = obj.message;
  if (typeof message === "string" && message.trim()) return message;

  if (Array.isArray(message)) {
    const merged = message.map(String).join(" ").trim();
    if (merged) return merged;
  }

  const detail = obj.detail;
  if (typeof detail === "string" && detail.trim()) return detail;

  if (Array.isArray(detail)) {
    const merged = detail.map(String).join(" ").trim();
    if (merged) return merged;
  }

  return fallback;
}
