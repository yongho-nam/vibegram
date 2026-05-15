import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar } from "@/components/common/Avatar";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/api/endpoints";
import styles from "./NotificationsPage.module.css";

export function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });

  const readOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const readAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const list = data ?? [];

  return (
    <div className={styles.root}>
      <header className={styles.topBar}>
        <h1 className={styles.title}>알림</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            type="button"
            className={styles.settingsLink}
            onClick={() => readAll.mutate()}
            disabled={readAll.isPending || list.length === 0}
          >
            모두 읽음
          </button>
          <Link to="/accounts/notification-settings" className={styles.settingsLink}>
            설정
          </Link>
        </div>
      </header>
      {isLoading ? <p className={styles.section}>불러오는 중…</p> : null}
      <p className={styles.section}>알림</p>
      <ul className={styles.list}>
        {list.map((n) => (
          <li
            key={n.id}
            className={styles.row}
            data-read={n.isRead}
            onClick={() => {
              if (!n.isRead) readOne.mutate(n.id);
            }}
            style={{ cursor: n.isRead ? "default" : "pointer" }}
          >
            <Link to={`/${n.actorUsername}`} className={styles.actor} onClick={(e) => e.stopPropagation()}>
              <Avatar src={n.actorAvatar} alt="" size="md" ring="none" />
            </Link>
            <p className={styles.text}>
              <Link to={`/${n.actorUsername}`} className={styles.un} onClick={(e) => e.stopPropagation()}>
                {n.actorUsername}
              </Link>{" "}
              {n.text} <span className={styles.time}>{n.timeAgo}</span>
            </p>
            {n.thumbnailUrl ? (
              <Link to="/" className={styles.thumbLink} onClick={(e) => e.stopPropagation()}>
                <img src={n.thumbnailUrl} alt="" className={styles.thumb} />
              </Link>
            ) : n.type === "follow" ? (
              <button type="button" className={styles.follow}>
                팔로우
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {!isLoading && list.length === 0 ? <p className={styles.section}>알림이 없습니다.</p> : null}
    </div>
  );
}
