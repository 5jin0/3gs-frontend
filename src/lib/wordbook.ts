import axios from "axios";
import { api, type ApiSuccessResponse } from "@/lib/api";

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

/**
 * Save a glossary term to the current user's wordbook.
 * POST /wordbook/terms — body: { term_id }
 */
export async function saveTerm(termId: number): Promise<SavedWord> {
  const { data } = await api.post<SaveTermResponse>("/wordbook/terms", {
    term_id: termId,
  });
  return data.data;
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
