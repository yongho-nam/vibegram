import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/common/Avatar";
import { searchTags, searchUsers } from "@/api/endpoints";
import styles from "./SearchPage.module.css";

export function SearchPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"users" | "tags">("users");
  const dq = useDeferredValue(q.trim());

  const usersQuery = useQuery({
    queryKey: ["search-users", dq],
    queryFn: () => searchUsers(dq),
    enabled: tab === "users" && dq.length >= 1,
  });

  const tagsQuery = useQuery({
    queryKey: ["search-tags", dq],
    queryFn: () => searchTags(dq),
    enabled: tab === "tags" && dq.length >= 1,
  });

  const userRows = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const tagRows = useMemo(() => tagsQuery.data ?? [], [tagsQuery.data]);

  return (
    <div className={styles.root}>
      <div className={styles.searchBar}>
        <span className={styles.icon} aria-hidden>
          🔍
        </span>
        <input
          className={styles.input}
          placeholder="검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="검색"
        />
        {q ? (
          <button type="button" className={styles.clear} onClick={() => setQ("")} aria-label="지우기">
            ✕
          </button>
        ) : null}
      </div>
      <div className={styles.tabs}>
        <button type="button" className={styles.tab} data-active={tab === "users"} onClick={() => setTab("users")}>
          계정
        </button>
        <button type="button" className={styles.tab} data-active={tab === "tags"} onClick={() => setTab("tags")}>
          태그
        </button>
      </div>
      {tab === "users" ? (
        <ul className={styles.list}>
          {dq.length < 1 ? (
            <li className={styles.hint}>검색어를 입력하세요.</li>
          ) : usersQuery.isLoading ? (
            <li className={styles.hint}>검색 중…</li>
          ) : userRows.length === 0 ? (
            <li className={styles.hint}>결과가 없습니다.</li>
          ) : (
            userRows.map((u) => (
              <li key={u.id}>
                <Link to={`/${u.username}`} className={styles.row}>
                  <Avatar src={u.avatarUrl} alt="" size="md" ring="none" />
                  <div>
                    <div className={styles.un}>{u.username}</div>
                    <div className={styles.dn}>{u.displayName}</div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : (
        <ul className={styles.list}>
          {dq.length < 1 ? (
            <li className={styles.hint}>검색어를 입력하세요.</li>
          ) : tagsQuery.isLoading ? (
            <li className={styles.hint}>검색 중…</li>
          ) : tagRows.length === 0 ? (
            <li className={styles.hint}>결과가 없습니다.</li>
          ) : (
            tagRows.map((t) => (
              <li key={t.tag}>
                <Link to="/explore" className={styles.tagRow}>
                  <div className={styles.tagIcon}>#</div>
                  <div>
                    <div className={styles.un}>{t.tag}</div>
                    <div className={styles.dn}>게시물 {t.posts.toLocaleString("ko-KR")}개</div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
