import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

async function readJsonSafe(filePath) {
	try {
		const data = await fsp.readFile(filePath, "utf8");
		return JSON.parse(data);
	} catch {
		return null;
	}
}

async function getVersion() {
	const tauriConfPath = path.join(projectRoot, "src-tauri", "tauri.conf.json");
	const pkgJsonPath = path.join(projectRoot, "package.json");

	const tauriConf = await readJsonSafe(tauriConfPath);
	if (tauriConf && typeof tauriConf.version === "string" && tauriConf.version.trim() !== "") {
		return tauriConf.version.trim();
	}

	const pkgJson = await readJsonSafe(pkgJsonPath);
	if (pkgJson && typeof pkgJson.version === "string" && pkgJson.version.trim() !== "") {
		return pkgJson.version.trim();
	}

	return null;
}

async function findPortableExe(releaseDir) {
	const entries = await fsp.readdir(releaseDir, { withFileTypes: true });
	const candidates = entries
		.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".exe"))
		.map((e) => e.name)
		// исключаем установщики, если вдруг окажутся в этой директории
		.filter((name) => !name.toLowerCase().includes("-setup") && name.toLowerCase() !== "uninstall.exe");
	return candidates[0] || null;
}

async function renamePortableExe() {
	const version = await getVersion();
	const releaseDir = path.join(projectRoot, "src-tauri", "target", "release");

	try {
		await fsp.access(releaseDir);
	} catch {
		console.log("[postbuild-rename] Release directory not found, skipping");
		return;
	}

	const exeName = await findPortableExe(releaseDir);
	if (!exeName) {
		console.log("[postbuild-rename] No portable .exe found in release dir, skipping");
		return;
	}

	if (!version) {
		console.log("[postbuild-rename] Version not found, skipping rename");
		return;
	}

	const srcPath = path.join(releaseDir, exeName);
	const base = exeName.replace(/\.exe$/i, "");
	const dstName = `${base}_${version}.exe`;
	const dstPath = path.join(releaseDir, dstName);

	if (fs.existsSync(dstPath)) {
		await fsp.unlink(dstPath);
	}

	await fsp.rename(srcPath, dstPath);
	console.log(`[postbuild-rename] Renamed ${exeName} -> ${dstName}`);
}

renamePortableExe().catch((err) => {
	console.error("[postbuild-rename] Failed:", err);
});


