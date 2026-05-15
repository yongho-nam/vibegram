import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.join(__dirname, "..", "backend");
const isWin = process.platform === "win32";
const py = path.join(backendDir, isWin ? ".venv/Scripts/python.exe" : ".venv/bin/python");
const args = ["scripts/migrate.py", ...process.argv.slice(2)];

const r = spawnSync(py, args, { cwd: backendDir, stdio: "inherit", env: process.env });
process.exit(r.status ?? 1);
