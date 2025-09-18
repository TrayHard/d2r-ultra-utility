import { invoke } from "@tauri-apps/api/core";

export interface EnsureWritableResult {
  path: string;
  is_readonly: boolean;
  removed_readonly: boolean;
  granted_acl: boolean;
  writable: boolean;
  error?: string | null;
}

export async function ensureWritable(
  paths: string[],
): Promise<EnsureWritableResult[]> {
  try {
    const res = await invoke<EnsureWritableResult[]>("ensure_writable", {
      paths,
    });
    return res;
  } catch (e) {
    // If backend not available, return synthetic failures
    return paths.map((p) => ({
      path: p,
      is_readonly: false,
      removed_readonly: false,
      granted_acl: false,
      writable: false,
      error: e instanceof Error ? e.message : String(e),
    }));
  }
}

export function summarizeEnsureResults(results: EnsureWritableResult[]): {
  ok: string[];
  failed: EnsureWritableResult[];
} {
  const ok: string[] = [];
  const failed: EnsureWritableResult[] = [];
  results.forEach((r) => {
    if (r.writable) ok.push(r.path);
    else failed.push(r);
  });
  return { ok, failed };
}
