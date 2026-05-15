import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { InstagramLogo } from "@/components/common/Logo";
import styles from "./AuthPages.module.css";

export function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const from = (location.state as { from?: string } | null)?.from;
  const afterSignupPath =
    from && from.startsWith("/") && !from.startsWith("/login") && !from.startsWith("/signup") ? from : "/";

  return (
    <div className={styles.splitSingle}>
      <div className={styles.card}>
        <InstagramLogo className={styles.logoCenter} />
        <p className={styles.lead}>친구들의 사진과 동영상을 보려면 가입하세요.</p>
        <p className={styles.testHint}>서버에 계정이 생성되며, 같은 이메일·사용자 이름은 다시 가입할 수 없습니다.</p>
        <form
          className={styles.form}
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            const fd = new FormData(e.currentTarget);
            const joinEmail = String(fd.get("joinEmail") ?? "").trim();
            const joinUsername = String(fd.get("joinUsername") ?? "").trim();
            const joinPassword = String(fd.get("joinPassword") ?? "");
            const joinName = String(fd.get("joinName") ?? "").trim();
            if (!joinEmail || !joinUsername || !joinPassword) {
              setError("이메일, 사용자 이름, 비밀번호를 모두 입력해 주세요.");
              setLoading(false);
              return;
            }
            const res = await register({
              email: joinEmail,
              username: joinUsername,
              password: joinPassword,
              displayName: joinName || joinUsername,
            });
            setLoading(false);
            if (!res.ok) {
              setError(res.message);
              return;
            }
            navigate(afterSignupPath, { replace: true });
          }}
        >
          <input name="joinEmail" className={styles.input} placeholder="휴대폰 번호 또는 이메일 주소" type="email" />
          <input name="joinName" className={styles.input} placeholder="성명" />
          <input name="joinUsername" className={styles.input} placeholder="사용자 이름" autoComplete="username" />
          <input
            name="joinPassword"
            className={styles.input}
            type="password"
            placeholder="비밀번호"
            autoComplete="new-password"
          />
          {error ? <p className={styles.fieldError}>{error}</p> : null}
          <p className={styles.terms}>
            저희 서비스에 가입하면 <strong>이용 약관</strong> 및 <strong>개인정보처리방침</strong>에 동의하게 됩니다.
          </p>
          <button type="submit" className={styles.primaryBtn} disabled={loading}>
            {loading ? "처리 중…" : "가입"}
          </button>
        </form>
      </div>
      <div className={styles.cardMuted}>
        계정이 있으신가요? <Link to="/login">로그인</Link>
      </div>
    </div>
  );
}
