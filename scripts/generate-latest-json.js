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

async function findWindowsArtifact(bundleDir) {
	const nsisDir = path.join(bundleDir, "nsis");
	const msiDir = path.join(bundleDir, "msi");

	// Prefer NSIS .exe for updater URL; fallback to MSI
	if (fs.existsSync(msiDir)) {
		const entries = await fsp.readdir(msiDir);
		const msi = entries.find((n) => n.toLowerCase().endsWith(".msi"));
		if (msi && fs.existsSync(path.join(msiDir, `${msi}.sig`))) {
			return { fileName: msi, sigPath: path.join(msiDir, `${msi}.sig`) };
		}
	}

	if (fs.existsSync(nsisDir)) {
		const entries = await fsp.readdir(nsisDir);
		const exe = entries.find((n) => n.toLowerCase().endsWith("-setup.exe"));
		if (exe && fs.existsSync(path.join(nsisDir, `${exe}.sig`))) {
			return { fileName: exe, sigPath: path.join(nsisDir, `${exe}.sig`) };
		}
	}

	return null;
}

async function generateLatestJson() {
	const bundleDir = path.join(projectRoot, "src-tauri", "target", "release", "bundle");
	try {
		await fsp.access(bundleDir);
	} catch {
		console.log("[generate-latest] Bundle directory not found, skipping");
		return;
	}

	const version = await getVersion();
	if (!version) {
		console.log("[generate-latest] Version not found, skipping");
		return;
	}

	const win = await findWindowsArtifact(bundleDir);
	if (!win) {
		console.log("[generate-latest] No signed Windows artifact found, skipping");
		return;
	}

	const signature = (await fsp.readFile(win.sigPath, "utf8")).trim();

	const latest = {
		version,
		notes: `Release ${version}`,
		pub_date: new Date().toISOString(),
		platforms: {
			"windows-x86_64": {
				signature,
				url: `https://github.com/TrayHard/d2r-ultra-utility/releases/download/v${version}/${win.fileName}`
			}
		}
	};

	const outPath = path.join(bundleDir, "latest.json");
	await fsp.writeFile(outPath, JSON.stringify(latest, null, 2) + "\n", "utf8");
	console.log(`[generate-latest] Wrote ${path.relative(projectRoot, outPath)}`);
}

generateLatestJson().catch((err) => {
	console.error("[generate-latest] Failed:", err);
	process.exitCode = 1;
});


