import axios from "axios";
import { api, type ApiSuccessResponse } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

/**
 * A term the user saved to their wordbook (API may add fields; index signature allows extras).
 */
export type SavedWord = {
  id: number;
  term_id: number;
  term: string;
  original_meaning: string;
  definition: string;
  example: string;
  saved_at?: string;
};

export type SaveTermResponse = ApiSuccessResponse<SavedWord>;
export type MyWordsResponse = ApiSuccessResponse<SavedWord[]>;
export type RemoveSavedTermResponse = ApiSuccessResponse<unknown>;
export type SaveTermApiData = {
  saved?: boolean;
  already_saved?: boolean;
  term_id?: number;
  termId?: number;
  id?: number;
} & Partial<SavedWord>;

export type SaveTermApiResponse = ApiSuccessResponse<SaveTermApiData>;
export type SaveTermResult = {
  termId: number;
  saved: boolean;
  alreadySaved: boolean;
  item?: SavedWord;
};
const SAVE_TERM_ENDPOINTS = [
  "/wordbook/terms",
  "/wordbook/save",
  "/terms/save",
] as const;

const MISSING_TOKEN_ERROR_CODE = "MISSING_ACCESS_TOKEN";

/**
 * Save a glossary term to the current user's wordbook.
 * POST /wordbook/terms — body: { term_id }
 */
export async function saveTerm(termId: number): Promise<SaveTermResult> {
  const token = getAccessToken();
  const body = { term_id: termId };
  const requestHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  if (!token) {
    console.log("[wordbook] saveTerm request", {
      method: "POST",
      url: SAVE_TERM_ENDPOINTS[0],
      body,
      token,
      headers: requestHeaders,
    });
    const error = new Error(MISSING_TOKEN_ERROR_CODE);
    (error as Error & { code?: string }).code = MISSING_TOKEN_ERROR_CODE;
    throw error;
  }

  let lastError: unknown = null;

  for (const url of SAVE_TERM_ENDPOINTS) {
    try {
      console.log("[wordbook] saveTerm request", {
        method: "POST",
        url,
        body,
        token,
        headers: requestHeaders,
      });

      const { data } = await api.post<SaveTermApiResponse>(url, body, {
        headers: requestHeaders,
      });
      console.log("[wordbook] saveTerm response", { url, data });

      const payload = data.data ?? {};
      const savedFlag = payload.saved === true;
      const alreadySavedFlag = payload.already_saved === true;
      const resolvedTermId =
        payload.term_id ??
        payload.termId ??
        (typeof payload.id === "number" ? payload.id : undefined) ??
        termId;

      return {
        termId: resolvedTermId,
        saved: savedFlag,
        alreadySaved: alreadySavedFlag,
        item:
          typeof payload.term === "string" && typeof payload.term_id === "number"
            ? (payload as SavedWord)
            : undefined,
      };
    } catch (error) {
      lastError = error;
      if (!axios.isAxiosError(error)) throw error;

      const status = error.response?.status;
      // Endpoint mismatch: try next candidate.
      if (status === 404 || status === 405) {
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error("Save term request failed");
}

/**
 * List the current user's saved terms.
 * GET /wordbook/terms
 */
export async function getMyWords(): Promise<SavedWord[]> {
  const { data } = await api.get<MyWordsResponse>("/wordbook/terms");
  return Array.isArray(data.data) ? data.data : [];
}

/**
 * Remove a saved term from the wordbook.
 * DELETE /wordbook/terms/:termId
 */
export async function removeSavedTerm(termId: number): Promise<void> {
  await api.delete<RemoveSavedTermResponse>(`/wordbook/terms/${termId}`);
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
