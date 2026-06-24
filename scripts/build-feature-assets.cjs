/*
 * Pre-compresses tweakable game-asset features into the Vite `public/` tree so
 * the desktop bundle can ship them and apply/revert without re-fetching at runtime.
 *
 * Input  (gitignored): nogit/features/<Russian feature name>/data/**\/*
 * Output (committed):  public/features/<feature-id>/<rel-path>.gzbin   (one gzipped file each)
 *                      public/features/<feature-id>.manifest.json     ({ feature, files: [{ relPath, bytes, gzippedBytes }] })
 *
 * The `.gzbin` extension is deliberate: Vite's dev static middleware (sirv)
 * auto-strips a literal `.gz` suffix and injects Content-Encoding: gzip, which
 * makes the browser transparently decompress the body before our code sees it.
 * Using an extension Vite/sirv doesn't recognize keeps the bytes we receive
 * over the wire EQUAL to the raw gzip stream that DecompressionStream needs
 * to inflate. Production via tauri://localhost has no such middleware, so the
 * same name works there too.
 *
 * Heavy lifting at runtime stays minimal: fetch the manifest, fetch each
 * `.gzbin`, DecompressionStream('gzip') it, write the bytes to game files.
 *
 * Run manually after editing nogit/features/. The output IS committed because
 * other contributors don't have the nogit/ sources.
 */

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const REPO_ROOT = path.resolve(__dirname, "..");
const FEATURES_SRC_ROOT = path.join(REPO_ROOT, "nogit", "features");
const PUBLIC_OUT_ROOT = path.join(REPO_ROOT, "public", "features");
const OUT_EXT = ".gzbin";

// Map: target feature id (used in code) → source directory name in nogit/features/
const FEATURES = [
  { id: "icons", srcDir: "Иконки над головами" },
  { id: "fast-difficulty", srcDir: "Быстрый выбор сложности" },
];

function walk(dir, prefix = "") {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...walk(abs, rel));
    } else if (entry.isFile()) {
      out.push({ abs, rel });
    }
  }
  return out;
}

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
    const abs = path.join(p, entry.name);
    if (entry.isDirectory()) rmrf(abs);
    else fs.unlinkSync(abs);
  }
  fs.rmdirSync(p);
}

function buildFeature({ id, srcDir }) {
  const featureSrc = path.join(FEATURES_SRC_ROOT, srcDir);
  if (!fs.existsSync(featureSrc)) {
    throw new Error(`Feature source not found: ${featureSrc}`);
  }
  // Walk from inside data/ so manifest paths are relative to the mod's data dir
  // (which matches MOD_ROOT in src/shared/constants.ts).
  const walkRoot = path.join(featureSrc, "data");
  if (!fs.existsSync(walkRoot)) {
    throw new Error(`Feature source has no data/ dir: ${featureSrc}`);
  }

  const outDir = path.join(PUBLIC_OUT_ROOT, id);
  fs.mkdirSync(outDir, { recursive: true });

  const files = walk(walkRoot).sort((a, b) => a.rel.localeCompare(b.rel));
  const manifestFiles = [];
  let totalRaw = 0;
  let totalGz = 0;

  for (const f of files) {
    const raw = fs.readFileSync(f.abs);
    const compressed = zlib.gzipSync(raw, { level: 9 });
    const outFile = path.join(outDir, `${f.rel}${OUT_EXT}`);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, compressed);
    manifestFiles.push({
      relPath: f.rel,
      bytes: raw.length,
      gzippedBytes: compressed.length,
    });
    totalRaw += raw.length;
    totalGz += compressed.length;
  }

  const manifest = {
    feature: id,
    sourceDir: srcDir,
    files: manifestFiles,
  };
  const manifestPath = path.join(PUBLIC_OUT_ROOT, `${id}.manifest.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  console.log(
    `[${id}] ${manifestFiles.length} files: ${(totalRaw / 1024).toFixed(1)} KiB → ${(totalGz / 1024).toFixed(1)} KiB`
  );
}

function main() {
  if (!fs.existsSync(FEATURES_SRC_ROOT)) {
    console.error(`Missing source root: ${FEATURES_SRC_ROOT}`);
    process.exit(1);
  }
  // Wipe the whole output tree so a removed/renamed feature id doesn't leave
  // stale per-file blobs and a stale manifest sitting in the dist bundle.
  rmrf(PUBLIC_OUT_ROOT);
  fs.mkdirSync(PUBLIC_OUT_ROOT, { recursive: true });
  for (const f of FEATURES) buildFeature(f);
  console.log("Done.");
}

main();
