/**
 * Allow only same-origin relative paths to prevent open redirects via ?next=.
 */
export function safeInternalPath(next: string | null | undefined): string | null {
  if (next == null || typeof next !== "string") return null;
  const t = next.trim();
  if (t === "" || !t.startsWith("/") || t.startsWith("//")) return null;
  return t;
}
