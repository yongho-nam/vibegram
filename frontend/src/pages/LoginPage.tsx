import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { InstagramLogo } from "@/components/common/Logo";
import styles from "./AuthPages.module.css";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const from = (location.state as { from?: string; passwordReset?: boolean } | null)?.from;
  const passwordJustReset = Boolean((location.state as { passwordReset?: boolean } | null)?.passwordReset);
  const afterLoginPath =
    from && from.startsWith("/") && !from.startsWith("/login") && !from.startsWith("/signup") ? from : "/";

  return (
    <div className={styles.split}>
      <div className={styles.hero} aria-hidden>
        <div className={styles.phone}>
          <div className={styles.screen} />
        </div>
      </div>
      <div className={styles.panel}>
        <div className={styles.card}>
          <InstagramLogo className={styles.logoCenter} />
          <p className={styles.testHint} data-testid="login-test-hint">
            FastAPI 서버(<code>http://localhost:8000</code>)가 실행 중이어야 로그인됩니다. <code>npm run dev</code>로 백엔드가 함께
            올라옵니다.
          </p>
          {passwordJustReset ? (
            <p className={styles.testHint} role="status">
              비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.
            </p>
          ) : null}
          <p className={styles.testHint}>
            관리자 콘솔: <Link to="/admin">/admin</Link> · 데모 계정 <code>admin</code> / <code>12345</code>
          </p>
          <form
            className={styles.form}
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setLoading(true);
              const fd = new FormData(e.currentTarget);
              const loginId = String(fd.get("loginId") ?? "").trim();
              const password = String(fd.get("password") ?? "");
              try {
                const ok = await login(loginId, password);
                if (!ok) {
                  setError("이메일(또는 사용자 이름) 또는 비밀번호가 올바르지 않습니다.");
                  return;
                }
                navigate(afterLoginPath, { replace: true });
              } finally {
                setLoading(false);
              }
            }}
          >
            <label className={styles.srLabel} htmlFor="loginId">
              전화번호, 사용자 이름 또는 이메일
            </label>
            <input
              id="loginId"
              name="loginId"
              className={styles.input}
              placeholder="전화번호, 사용자 이름 또는 이메일"
              autoComplete="username"
            />
            <label className={styles.srLabel} htmlFor="password">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              className={styles.input}
              type="password"
              placeholder="비밀번호"
              autoComplete="current-password"
            />
            {error ? <p className={styles.fieldError}>{error}</p> : null}
            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? "처리 중…" : "로그인"}
            </button>
          </form>
          <Link to="/forgot-password" className={styles.forgot}>
            비밀번호를 잊으셨나요?
          </Link>
        </div>
        <div className={styles.cardMuted}>
          계정이 없으신가요? <Link to="/signup">가입하기</Link>
        </div>
      </div>
    </div>
  );
}
