import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./AdminLayout.module.css";

const navCls = ({ isActive }: { isActive: boolean }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink);

export function AdminLayout() {
  const { user, ready, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!ready) return null;
  if (!user) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }
  if (!user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <span className={styles.brand}>관리자</span>
        <nav className={styles.nav} aria-label="관리자 메뉴">
          <NavLink to="/admin" end className={navCls}>
            대시보드
          </NavLink>
          <NavLink to="/admin/users" className={navCls}>
            회원
          </NavLink>
          <NavLink to="/admin/posts" className={navCls}>
            게시물
          </NavLink>
          <NavLink to="/" className={styles.siteLink}>
            사이트로
          </NavLink>
          <button
            type="button"
            className={styles.siteLink}
            style={{ border: 0, background: "none", cursor: "pointer", padding: "8px 12px" }}
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            로그아웃
          </button>
        </nav>
      </header>
      <div className={styles.body}>
        <p className={styles.banner} role="status">
          데모용 관리자입니다. 운영 환경에서는 비밀번호 변경·HTTPS·별도 관리자 인증을 적용하세요.
        </p>
        <Outlet />
      </div>
    </div>
  );
}
