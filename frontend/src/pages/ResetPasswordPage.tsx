import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { InstagramLogo } from "@/components/common/Logo";
import { ApiError } from "@/api/client";
import { resetPasswordWithToken } from "@/api/endpoints";
import styles from "./AuthPages.module.css";

export function ResetPasswordPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => search.get("token")?.trim() ?? "", [search]);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className={styles.splitSingle}>
        <div className={styles.card}>
          <InstagramLogo className={styles.logoCenter} />
          <p className={styles.lead}>링크가 올바르지 않습니다</p>
          <p className={styles.testHint}>비밀번호 찾기를 다시 진행해 주세요.</p>
          <Link to="/forgot-password" className={styles.primaryBtn} style={{ textDecoration: "none", display: "inline-block" }}>
            비밀번호 찾기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.splitSingle}>
      <div className={styles.card}>
        <InstagramLogo className={styles.logoCenter} />
        <p className={styles.lead}>새 비밀번호 설정</p>
        <p className={styles.testHint}>새 비밀번호를 입력한 뒤 저장하세요.</p>
        <form
          className={styles.form}
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            if (pw.length < 3) {
              setError("비밀번호는 3자 이상이어야 합니다.");
              return;
            }
            if (pw !== pw2) {
              setError("비밀번호 확인이 일치하지 않습니다.");
              return;
            }
            setLoading(true);
            try {
              await resetPasswordWithToken(token, pw);
              navigate("/login", { replace: true, state: { passwordReset: true } });
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "재설정에 실패했습니다.");
            } finally {
              setLoading(false);
            }
          }}
        >
          <label className={styles.srLabel} htmlFor="np1">
            새 비밀번호
          </label>
          <input
            id="np1"
            className={styles.input}
            type="password"
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="새 비밀번호"
          />
          <label className={styles.srLabel} htmlFor="np2">
            새 비밀번호 확인
          </label>
          <input
            id="np2"
            className={styles.input}
            type="password"
            autoComplete="new-password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="새 비밀번호 확인"
          />
          {error ? <p className={styles.fieldError}>{error}</p> : null}
          <button type="submit" className={styles.primaryBtn} disabled={loading}>
            {loading ? "처리 중…" : "비밀번호 저장"}
          </button>
        </form>
        <Link to="/login" className={styles.forgot}>
          로그인으로
        </Link>
      </div>
    </div>
  );
}
