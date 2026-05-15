import { useState } from "react";
import { Link } from "react-router-dom";
import { InstagramLogo } from "@/components/common/Logo";
import { ApiError } from "@/api/client";
import { requestPasswordReset } from "@/api/endpoints";
import styles from "./AuthPages.module.css";

function resetPathFromUrl(resetUrl: string): string {
  try {
    const u = new URL(resetUrl);
    return `${u.pathname}${u.search}`;
  } catch {
    return "/reset-password";
  }
}

export function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ message: string; resetUrl?: string | null } | null>(null);

  return (
    <div className={styles.splitSingle}>
      <div className={styles.card}>
        <InstagramLogo className={styles.logoCenter} />
        <p className={styles.lead}>비밀번호 찾기</p>
        <p className={styles.testHint}>
          가입 시 사용한 <strong>이메일</strong> 또는 <strong>사용자 이름</strong>을 입력하세요. 데모 환경에서는 재설정 링크가
          아래에 표시됩니다.
        </p>
        {done ? (
          <div className={styles.form}>
            <p className={styles.testHint} style={{ marginTop: 0 }}>
              {done.message}
            </p>
            {done.resetUrl ? (
              <Link
                to={resetPathFromUrl(done.resetUrl)}
                className={styles.primaryBtn}
                style={{ textDecoration: "none", display: "inline-block", marginTop: 8 }}
              >
                비밀번호 재설정하기
              </Link>
            ) : null}
            {done.resetUrl ? (
              <p className={styles.terms}>
                링크가 동작하지 않으면 주소를 복사해 브라우저에 붙여 넣으세요.
                <br />
                <code style={{ fontSize: 11, wordBreak: "break-all" }}>{done.resetUrl}</code>
              </p>
            ) : null}
            <Link to="/login" className={styles.forgot}>
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <form
            className={styles.form}
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setLoading(true);
              const fd = new FormData(e.currentTarget);
              const login = String(fd.get("login") ?? "").trim();
              try {
                const res = await requestPasswordReset(login);
                setDone({ message: res.message, resetUrl: res.reset_url ?? undefined });
              } catch (err) {
                setError(err instanceof ApiError ? err.message : "요청에 실패했습니다.");
              } finally {
                setLoading(false);
              }
            }}
          >
            <label className={styles.srLabel} htmlFor="fpLogin">
              이메일 또는 사용자 이름
            </label>
            <input
              id="fpLogin"
              name="login"
              className={styles.input}
              placeholder="이메일 또는 사용자 이름"
              autoComplete="username"
              required
            />
            {error ? <p className={styles.fieldError}>{error}</p> : null}
            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? "처리 중…" : "재설정 안내 받기"}
            </button>
          </form>
        )}
        <div className={styles.cardMuted} style={{ marginTop: 12 }}>
          <Link to="/login">로그인</Link> · <Link to="/signup">가입하기</Link>
        </div>
      </div>
    </div>
  );
}
