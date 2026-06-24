/*
 * Runtime loader for pre-built feature asset bundles produced by
 * scripts/build-feature-assets.cjs. Each bundle is a manifest of relative paths
 * plus one `.gzbin` (gzip-compressed) file per asset under
 * public/features/<feature>/.
 *
 * NOTE on the extension: `.gz` would make Vite's dev static middleware (sirv)
 * inject Content-Encoding: gzip and let the browser transparently decompress
 * the body — DecompressionStream would then choke on the already-decompressed
 * bytes. The `.gzbin` extension keeps the dev path identical to production.
 *
 * Decompression uses the platform DecompressionStream — Tauri's bundled
 * WebView2 supports it, so no JS gzip dependency is needed.
 *
 * Memory is the main constraint: the icons feature is ~110 MiB decompressed
 * across 88 files. The exported `streamFeatureAssets` yields one file at a
 * time so the caller can write-then-free without holding everything in heap.
 */

export type FeatureId = "icons" | "fast-difficulty";

export interface FeatureAssetManifestEntry {
  relPath: string;
  bytes: number;
  gzippedBytes: number;
}

export interface FeatureAssetManifest {
  feature: FeatureId;
  sourceDir: string;
  files: FeatureAssetManifestEntry[];
}

export interface LoadedFeatureFile {
  relPath: string;
  data: Uint8Array;
}

const BASE = import.meta.env.BASE_URL; // "./" per vite.config.ts
const ASSET_EXT = ".gzbin";

async function decompressGzip(input: ArrayBuffer): Promise<Uint8Array> {
  // Wrap in Uint8Array — the Blob constructor's spec wants a BufferSource view,
  // not a raw ArrayBuffer. Both work in WebView2/Chromium, but the view is the
  // standard-compliant form.
  const stream = new Blob([new Uint8Array(input)])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

export async function loadFeatureManifest(
  feature: FeatureId
): Promise<FeatureAssetManifest> {
  const url = `${BASE}features/${feature}.manifest.json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `Не удалось загрузить манифест фичи "${feature}": ${res.status}`
    );
  }
  return (await res.json()) as FeatureAssetManifest;
}

async function fetchAndDecompress(
  feature: FeatureId,
  entry: FeatureAssetManifestEntry
): Promise<Uint8Array> {
  const url = `${BASE}features/${feature}/${entry.relPath}${ASSET_EXT}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Не удалось загрузить ${entry.relPath}: HTTP ${res.status}`);
  }
  const gz = await res.arrayBuffer();
  const data = await decompressGzip(gz);
  if (data.byteLength !== entry.bytes) {
    throw new Error(
      `Размер распакованного ${entry.relPath} (${data.byteLength}) не совпадает с манифестом (${entry.bytes})`
    );
  }
  return data;
}

/**
 * Yields one decompressed file at a time. The caller is expected to write the
 * bytes to disk and let the chunk fall out of scope before consuming the next
 * one, so the 110 MiB icons payload never sits in memory all at once.
 */
export async function* streamFeatureAssets(
  feature: FeatureId
): AsyncGenerator<LoadedFeatureFile, void, unknown> {
  const manifest = await loadFeatureManifest(feature);
  for (const entry of manifest.files) {
    const data = await fetchAndDecompress(feature, entry);
    yield { relPath: entry.relPath, data };
  }
}
