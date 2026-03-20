import { api } from "@/lib/api";

/** Single term row returned from the Pangyo glossary search endpoint. */
export type PangyoTerm = {
  term: string;
  original_meaning: string;
  definition: string;
  example: string;
};

/**
 * Search Pangyo terms by keyword.
 * GET /terms/search?keyword=...
 */
export async function searchTerms(keyword: string): Promise<PangyoTerm[]> {
  const { data } = await api.get<PangyoTerm[]>("/terms/search", {
    params: { keyword },
  });
  return data;
}
