import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const backendDir = path.join(repoRoot, "backend");
const venvDir = path.join(backendDir, ".venv");

function run(cmd, args, opts = {}) {
  const silent = Boolean(opts.silent);
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd ?? backendDir,
    stdio: silent ? "ignore" : "inherit",
    shell: Boolean(opts.shell),
    env: process.env,
  });
  return r.status ?? 1;
}

function pickPython() {
  const isWin = process.platform === "win32";
  const variants = isWin
    ? [
        { cmd: "py", args: ["-3"] },
        { cmd: "python", args: [] },
      ]
    : [
        { cmd: "python3", args: [] },
        { cmd: "python", args: [] },
      ];

  for (const { cmd, args } of variants) {
    const r = spawnSync(cmd, [...args, "-c", "import sys; print(sys.executable)"], {
      stdio: ["ignore", "pipe", "ignore"],
      shell: false,
    });
    if (r.status === 0) {
      const out = String(r.stdout ?? "").trim();
      return { cmd, args, exe: out || cmd };
    }
  }
  return null;
}

function venvPython() {
  const isWin = process.platform === "win32";
  const rel = isWin ? path.join("Scripts", "python.exe") : path.join("bin", "python");
  return path.join(venvDir, rel);
}

function ensureEnvFile() {
  const example = path.join(backendDir, ".env.example");
  const target = path.join(backendDir, ".env");
  if (!existsSync(target) && existsSync(example)) {
    copyFileSync(example, target);
  }
}

function ensureFrontendEnv() {
  const example = path.join(repoRoot, "frontend", ".env.example");
  const target = path.join(repoRoot, "frontend", ".env");
  if (!existsSync(target) && existsSync(example)) {
    copyFileSync(example, target);
  }
}

function writeMarker(ok, message) {
  const marker = path.join(venvDir, ".backend-install.json");
  try {
    mkdirSync(venvDir, { recursive: true });
    writeFileSync(marker, JSON.stringify({ ok, message, at: new Date().toISOString() }, null, 2), "utf8");
  } catch {
    /* ignore */
  }
}

function readMarker() {
  const marker = path.join(venvDir, ".backend-install.json");
  if (!existsSync(marker)) return null;
  try {
    return JSON.parse(readFileSync(marker, "utf8"));
  } catch {
    return null;
  }
}

export function isBackendReady() {
  const py = venvPython();
  if (!existsSync(py)) return false;
  const marker = readMarker();
  if (!marker?.ok) return false;
  const verify = run(py, ["-c", "import fastapi, sqlalchemy, alembic"], { silent: true });
  return verify === 0;
}

export function installBackend({ silent = false } = {}) {
  const log = silent ? () => {} : console.log;
  const warn = silent ? () => {} : console.warn;

  ensureEnvFile();
  ensureFrontendEnv();

  const picked = pickPython();
  if (!picked) {
    warn("[install-backend] Python을 찾지 못했습니다. 백엔드는 건너뜁니다.");
    writeMarker(false, "python-not-found");
    return false;
  }

  log(`[install-backend] Python: ${picked.exe}`);

  if (!existsSync(venvDir)) {
    log("[install-backend] venv 생성 중...");
    const code = run(picked.cmd, [...picked.args, "-m", "venv", venvDir], { cwd: repoRoot, silent });
    if (code !== 0) {
      warn("[install-backend] venv 생성 실패");
      writeMarker(false, "venv-failed");
      return false;
    }
  }

  const vpy = venvPython();
  if (!existsSync(vpy)) {
    warn("[install-backend] venv python을 찾을 수 없습니다.");
    writeMarker(false, "venv-python-missing");
    return false;
  }

  log("[install-backend] pip install -r requirements.txt ...");
  run(vpy, ["-m", "pip", "install", "--upgrade", "pip"], { silent });
  const pipInstall = run(vpy, ["-m", "pip", "install", "-r", "requirements.txt"], { silent });
  if (pipInstall !== 0) {
    warn(
      "[install-backend] pip install 실패. Windows 32-bit Python이면 greenlet 빌드가 필요할 수 있습니다. 64-bit Python을 권장합니다.",
    );
    writeMarker(false, "pip-install-failed");
    return false;
  }

  const verify = run(vpy, ["-c", "import fastapi, sqlalchemy, alembic"], { silent });
  if (verify !== 0) {
    warn("[install-backend] 설치 검증(import) 실패");
    writeMarker(false, "import-check-failed");
    return false;
  }

  log("[install-backend] alembic upgrade head (SQLite 스키마) ...");
  const mig = run(vpy, ["-m", "alembic", "upgrade", "head"], { silent });
  if (mig !== 0) {
    warn("[install-backend] alembic upgrade 실패. backend 폴더에서 `alembic upgrade head` 를 수동 실행해 주세요.");
    writeMarker(false, "alembic-failed");
    return false;
  }

  writeMarker(true, "ok");
  log("[install-backend] 완료");
  return true;
}

const invokedDirectly = Boolean(
  process.argv[1]?.replaceAll("\\", "/").endsWith("/scripts/install-backend.mjs") ||
    process.argv[1]?.replaceAll("\\", "/").endsWith("install-backend.mjs"),
);

if (invokedDirectly) {
  try {
    installBackend({ silent: false });
  } catch (e) {
    console.warn("[install-backend] 오류:", e);
  }
  process.exit(0);
}
