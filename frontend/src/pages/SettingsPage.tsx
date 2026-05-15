import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { IconChevronLeft } from "@/components/icons/Icons";
import styles from "./SettingsPage.module.css";

type Item = {
  to: string;
  label: string;
  description: string;
};

type Section = { id: string; label: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    id: "account",
    label: "계정",
    items: [
      { to: "/accounts/edit", label: "프로필 편집", description: "이름, 사용자 이름, 소개, 웹사이트" },
      { to: "/accounts/password", label: "비밀번호 변경", description: "로그인 비밀번호 업데이트" },
      { to: "/accounts/security", label: "보안 및 로그인", description: "2단계 인증, 로그인 활동" },
      { to: "/accounts/privacy", label: "계정 공개 범위", description: "비공개, 활동 상태, 태그" },
      { to: "/accounts/blocked", label: "차단된 계정", description: "차단 목록 관리" },
    ],
  },
  {
    id: "content",
    label: "콘텐츠",
    items: [{ to: "/accounts/story-archive", label: "보관된 스토리", description: "만료된 스토리 보관함" }],
  },
  {
    id: "notif",
    label: "알림",
    items: [
      { to: "/notifications", label: "알림", description: "좋아요, 댓글, 팔로우 활동" },
      { to: "/accounts/notification-settings", label: "알림 설정", description: "푸시·이메일 알림 종류" },
    ],
  },
];

export function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <button type="button" className={styles.back} onClick={() => navigate(-1)} aria-label="뒤로">
          <IconChevronLeft />
        </button>
        <h1 className={styles.title}>설정</h1>
        <span className={styles.spacer} />
      </header>

      {SECTIONS.map((section) => (
        <section key={section.id} aria-labelledby={`settings-${section.id}`}>
          <p id={`settings-${section.id}`} className={styles.sectionLabel}>
            {section.label}
          </p>
          <nav className={styles.list} aria-label={`${section.label} 설정`}>
            {section.items.map((item) => (
              <Link key={item.to} to={item.to} className={styles.row}>
                <div className={styles.rowText}>
                  <span className={styles.rowLabel}>{item.label}</span>
                  <span className={styles.rowDesc}>{item.description}</span>
                </div>
                <span className={styles.chevron} aria-hidden>
                  ›
                </span>
              </Link>
            ))}
          </nav>
        </section>
      ))}

      <p className={styles.sectionLabel}>로그인</p>
      <div className={styles.list}>
        <button
          type="button"
          className={styles.rowButton}
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
        >
          <span className={styles.rowLabel}>로그아웃</span>
          <span className={styles.chevron} aria-hidden>
            ›
          </span>
        </button>
      </div>

      <p className={styles.note}>
        알림 목록·프로필 편집 일부는 백엔드와 연동 시 API가 필요합니다. 설정 하위 화면 중 비밀번호·보안·차단 등은 현재 UI·로컬
        동작만 제공합니다.
      </p>
    </div>
  );
}
