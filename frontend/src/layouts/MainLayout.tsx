import type { ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { InstagramLogo } from "@/components/common/Logo";
import { BRAND_NAME, BRAND_UI_LINE } from "@/config/brand";
import { Avatar } from "@/components/common/Avatar";
import {
  IconComment,
  IconExplore,
  IconHeart,
  IconHome,
  IconMenu,
  IconPlusSquare,
  IconReels,
  IconSearch,
} from "@/components/icons/Icons";
import { SuggestionsPanel } from "@/components/layout/SuggestionsPanel";
import styles from "./MainLayout.module.css";
import navStyles from "./Nav.module.css";

function NavIcon({
  to,
  label,
  children,
  end,
}: {
  to: string;
  label: string;
  children: (active: boolean) => ReactNode;
  end?: boolean;
}) {
  return (
    <NavLink to={to} end={end} className={navStyles.link} aria-label={label}>
      {({ isActive }) => children(isActive)}
    </NavLink>
  );
}

export function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const showRightRail = location.pathname === "/";
  const loginState = { from: `${location.pathname}${location.search}` };

  return (
    <div className={styles.shell}>
      <aside className={[navStyles.sidebar, styles.desktop].join(" ")} aria-label="주요 메뉴">
        <div className={navStyles.sidebarInner}>
          <NavLink to="/" className={navStyles.logoLink} aria-label={`${BRAND_NAME} 홈`}>
            <InstagramLogo />
          </NavLink>
          <nav className={navStyles.navList}>
            <NavIcon to="/" label="홈" end>
              {(a) => <IconHome active={a} />}
            </NavIcon>
            <NavIcon to="/search" label="검색">
              {(a) => <IconSearch active={a} />}
            </NavIcon>
            <NavIcon to="/explore" label="탐색 탭">
              {(a) => <IconExplore active={a} />}
            </NavIcon>
            <NavIcon to="/explore" label="릴스">
              {(a) => <IconReels active={a} />}
            </NavIcon>
            <NavIcon to="/direct" label="메시지">
              {() => <IconComment />}
            </NavIcon>
            <NavIcon to="/notifications" label="알림">
              {(a) => <IconHeart active={a} />}
            </NavIcon>
            <NavIcon to="/accounts" label="설정">
              {() => <IconMenu />}
            </NavIcon>
            <NavIcon to="/create" label="새 게시물">
              {() => <IconPlusSquare />}
            </NavIcon>
            {user ? (
              <NavIcon to={`/${user.username}`} label="프로필">
                {(active) => (
                  <span className={navStyles.profileRing} data-active={active}>
                    <Avatar src={user.avatarUrl} alt="" size="sm" ring="none" />
                  </span>
                )}
              </NavIcon>
            ) : (
              <NavLink to="/login" state={loginState} className={navStyles.link} aria-label="로그인">
                <span className={navStyles.guestAvatar} aria-hidden />
              </NavLink>
            )}
          </nav>
          <div className={navStyles.sidebarFooter}>
            <span className={navStyles.compactHint}>{BRAND_UI_LINE}</span>
            {user?.isAdmin ? (
              <NavLink
                to="/admin"
                className={navStyles.compactHint}
                style={{ display: "block", marginTop: 10, fontWeight: 600, color: "var(--ig-link)", textDecoration: "none" }}
              >
                관리자 콘솔
              </NavLink>
            ) : null}
            {user ? (
              <button
                type="button"
                className={navStyles.logout}
                onClick={() => {
                  logout();
                  navigate("/", { replace: true });
                }}
              >
                로그아웃
              </button>
            ) : (
              <NavLink to="/login" state={loginState} className={navStyles.loginBtn}>
                로그인
              </NavLink>
            )}
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.contentRow}>
          <main className={styles.content}>
            <Outlet />
          </main>
          <aside className={[styles.rightRail, showRightRail ? styles.rightRailVisible : ""].join(" ")}>
            <SuggestionsPanel />
          </aside>
        </div>
      </div>

      <nav className={navStyles.bottom} aria-label="하단 메뉴">
        <NavIcon to="/" label="홈" end>
          {(a) => <IconHome active={a} />}
        </NavIcon>
        <NavIcon to="/explore" label="탐색">
          {(a) => <IconExplore active={a} />}
        </NavIcon>
        <NavIcon to="/create" label="만들기">
          {() => <IconPlusSquare />}
        </NavIcon>
        <NavIcon to="/direct" label="메시지">
          {() => <IconComment />}
        </NavIcon>
        {user ? (
          <NavIcon to="/accounts" label="설정">
            {() => <IconMenu />}
          </NavIcon>
        ) : null}
        {user ? (
          <NavIcon to={`/${user.username}`} label="프로필">
            {(active) => (
              <span className={navStyles.profileRingSm} data-active={active}>
                <Avatar src={user.avatarUrl} alt="" size="xs" ring="none" />
              </span>
            )}
          </NavIcon>
        ) : (
          <NavLink to="/login" state={loginState} className={navStyles.link} aria-label="로그인">
            <span className={navStyles.guestAvatarSm} aria-hidden />
          </NavLink>
        )}
      </nav>
    </div>
  );
}
