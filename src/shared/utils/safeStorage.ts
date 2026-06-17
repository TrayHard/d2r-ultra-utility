// Defensive localStorage helpers. WebView2 storage can be blocked/disabled (privacy
// policy, group policy, a corrupted store), and persisted JSON can be partial/old —
// either of which throws. These keep startup reads from ever crashing the first render.

/** localStorage.getItem that returns null instead of throwing when storage is unavailable. */
export const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * JSON.parse a (possibly null) raw string, returning `fallback` on any failure:
 * null/missing input, malformed JSON, or a null result. Non-null scalars and objects
 * pass through, so callers that need an object/array must still validate the shape.
 */
export const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (raw == null) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
};
