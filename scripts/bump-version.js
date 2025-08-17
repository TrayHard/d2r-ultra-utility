import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const bumpTypeArg = (process.argv[2] || "patch").toLowerCase();
const allowed = new Set(["major", "minor", "patch"]);
const bumpType = allowed.has(bumpTypeArg) ? bumpTypeArg : "patch";

async function readJson(filePath) {
	const data = await fsp.readFile(filePath, "utf8");
	return JSON.parse(data);
}

async function writeJson(filePath, obj) {
	const json = JSON.stringify(obj, null, 2) + "\n";
	await fsp.writeFile(filePath, json, "utf8");
}

function bumpVersionString(version, type) {
	const [majorStr, minorStr, patchStr] = String(version).split(".");
	let major = parseInt(majorStr || "0", 10) || 0;
	let minor = parseInt(minorStr || "0", 10) || 0;
	let patch = parseInt((patchStr || "0").split("-")[0], 10) || 0;

	if (type === "major") {
		major += 1;
		minor = 0;
		patch = 0;
	} else if (type === "minor") {
		minor += 1;
		patch = 0;
	} else {
		patch += 1;
	}

	return `${major}.${minor}.${patch}`;
}

async function main() {
	const pkgPath = path.join(projectRoot, "package.json");
	const lockPath = path.join(projectRoot, "package-lock.json");
	const tauriConfPath = path.join(projectRoot, "src-tauri", "tauri.conf.json");

	const pkg = await readJson(pkgPath);
	const tauriConf = await readJson(tauriConfPath);

	const baseVersion = tauriConf?.version || pkg?.version;
	if (!baseVersion) {
		console.error("No base version found in tauri.conf.json or package.json");
		process.exit(1);
	}

	const newVersion = bumpVersionString(baseVersion, bumpType);

	// Update package.json
	pkg.version = newVersion;
	await writeJson(pkgPath, pkg);

	// Update package-lock.json (both top-level and root entry)
	if (fs.existsSync(lockPath)) {
		try {
			const lock = await readJson(lockPath);
			lock.version = newVersion;
			if (lock.packages && lock.packages[""]) {
				lock.packages[""].version = newVersion;
			}
			await writeJson(lockPath, lock);
		} catch {
			// ignore lock update failures
		}
	}

	// Update tauri.conf.json
	if (typeof tauriConf === "object") {
		tauriConf.version = newVersion;
		await writeJson(tauriConfPath, tauriConf);
	}

	// Print only the new version for capturing in .bat
	process.stdout.write(newVersion);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});


