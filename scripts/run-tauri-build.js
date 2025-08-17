import { spawn } from "node:child_process";

const child = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "tbuild"], {
	stdio: "inherit",
	env: {
		...process.env,
		// Ensure the password env var is present and empty to avoid interactive prompt
		TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ""
	}
});

child.on("exit", (code) => {
	process.exit(code ?? 1);
});


