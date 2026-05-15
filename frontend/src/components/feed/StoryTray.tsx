import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchStoriesFeed } from "@/api/endpoints";
import { Avatar } from "@/components/common/Avatar";
import styles from "./StoryTray.module.css";

export function StoryTray() {
  const { data, isLoading } = useQuery({ queryKey: ["stories-feed"], queryFn: fetchStoriesFeed });

  if (isLoading && !data) {
    return (
      <div className={styles.wrap} role="region" aria-label="스토리">
        <div className={styles.track}>
          <span className={styles.label}>불러오는 중…</span>
        </div>
      </div>
    );
  }

  const items = data ?? [];

  return (
    <div className={styles.wrap} role="region" aria-label="스토리">
      <div className={styles.track}>
        {items.map((s) => (
          <Link key={s.id} to={`/${s.username}`} className={styles.story} aria-label={`${s.username} 스토리`}>
            <Avatar
              src={s.avatarUrl}
              alt=""
              size="lg"
              ring={s.isOwn ? "story-seen" : s.hasUnseen ? "story" : "story-seen"}
            />
            <span className={styles.label}>{s.isOwn ? "내 스토리" : s.username}</span>
          </Link>
        ))}
        {items.length === 0 ? <span className={styles.label}>스토리 없음</span> : null}
      </div>
    </div>
  );
}
