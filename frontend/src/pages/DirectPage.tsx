import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { IconNewMessage } from "@/components/icons/Icons";
import { Avatar } from "@/components/common/Avatar";
import { NewMessageDialog } from "@/components/direct/NewMessageDialog";
import { fetchThreads } from "@/api/endpoints";
import styles from "./DirectPage.module.css";

export function DirectPage() {
  const { user } = useAuth();
  const [newOpen, setNewOpen] = useState(false);
  const { data, isLoading, error } = useQuery({ queryKey: ["threads"], queryFn: fetchThreads });
  const threads = data ?? [];

  return (
    <div className={styles.root}>
      <NewMessageDialog open={newOpen} onClose={() => setNewOpen(false)} />
      <header className={styles.header}>
        <span className={styles.spacer} />
        <span className={styles.title}>{user?.username ?? ""}</span>
        <button type="button" className={styles.new} aria-label="새 메시지" onClick={() => setNewOpen(true)}>
          <IconNewMessage />
        </button>
      </header>
      <div className={styles.panel}>
        <div className={styles.sideHead}>
          <h1 className={styles.sideTitle}>메시지</h1>
          <button type="button" className={styles.primarySm} onClick={() => setNewOpen(true)}>
            새 대화
          </button>
        </div>
        {isLoading ? <p className={styles.hint}>불러오는 중…</p> : null}
        {error ? <p className={styles.hint}>대화 목록을 불러오지 못했습니다.</p> : null}
        {!isLoading && !error && threads.length === 0 ? (
          <p className={styles.emptyHint}>아직 대화가 없습니다. 상단의 새 메시지에서 사용자를 검색하거나, 프로필에서 &quot;메시지 보내기&quot;를 눌러보세요.</p>
        ) : null}
        <ul className={styles.list}>
          {threads.map((t) => (
            <li key={t.id}>
              <Link to={`/direct/t/${t.id}`} className={styles.row}>
                <Avatar src={t.avatarUrl} alt="" size="md" ring="none" />
                <div className={styles.meta}>
                  <div className={styles.top}>
                    <span className={styles.un}>{t.username}</span>
                    <span className={styles.time}>{t.timeLabel}</span>
                  </div>
                  <p className={styles.preview} data-unread={t.unread}>
                    {t.lastMessage}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
