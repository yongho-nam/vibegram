import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { installBackend, isBackendReady } from "./install-backend.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const frontendDir = path.join(repoRoot, "frontend");
const backendDir = path.join(repoRoot, "backend");

const isWin = process.platform === "win32";

function findViteEntry() {
  const candidates = [
    path.join(repoRoot, "node_modules", "vite", "bin", "vite.js"),
    path.join(frontendDir, "node_modules", "vite", "bin", "vite.js"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

function venvPython() {
  const rel = isWin ? path.join("Scripts", "python.exe") : path.join("bin", "python");
  return path.join(backendDir, ".venv", rel);
}

async function main() {
  installBackend({ silent: true });
  const backendOk = isBackendReady();

  const viteJs = findViteEntry();
  if (!viteJs) {
    console.error("[dev] vite를 찾을 수 없습니다. 먼저 `npm install`을 실행하세요.");
    process.exit(1);
  }

  const children = [];

  if (backendOk) {
    const py = venvPython();
    const u = spawn(py, ["-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"], {
      cwd: backendDir,
      stdio: "inherit",
      env: {
        ...process.env,
        API_PUBLIC_BASE: "http://localhost:5173",
        FRONTEND_ORIGIN: "http://localhost:5173",
      },
    });
    children.push({ name: "backend", proc: u });
  } else {
    console.warn("");
    console.warn("------------------------------------------------------------");
    console.warn("  백엔드가 비활성화되었습니다. (Python/venv/pip 문제 가능)");
    console.warn("  프론트만 실행합니다: http://localhost:5173/");
    console.warn("------------------------------------------------------------");
    console.warn("");
  }

  const v = spawn(process.execPath, [viteJs, "--port", "5173", "--strictPort"], {
    cwd: frontendDir,
    stdio: "inherit",
    env: { ...process.env },
  });
  children.push({ name: "frontend", proc: v });

  const shutdown = () => {
    for (const { proc } of children) {
      try {
        proc.kill("SIGINT");
      } catch {
        /* ignore */
      }
    }
  };

  process.on("SIGINT", () => {
    shutdown();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    shutdown();
    process.exit(0);
  });

  v.on("exit", (code) => {
    shutdown();
    process.exit(code ?? 0);
  });
}

await main();
