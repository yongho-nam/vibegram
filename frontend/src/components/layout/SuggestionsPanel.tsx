import { Link, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/common/Avatar";
import { IconMenu } from "@/components/icons/Icons";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchSuggestedFollows, followUser } from "@/api/endpoints";
import type { SuggestionUser } from "@/data/types";
import styles from "./SuggestionsPanel.module.css";

function buildSuggestions(
  items: { username: string; displayName: string; avatarUrl: string }[],
  reason: string,
): SuggestionUser[] {
  const seen = new Set<string>();
  const out: SuggestionUser[] = [];
  for (const p of items) {
    if (seen.has(p.username)) continue;
    seen.add(p.username);
    out.push({
      id: p.username,
      username: p.username,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      reason,
    });
    if (out.length >= 6) break;
  }
  return out;
}

export function SuggestionsPanel() {
  const { user } = useAuth();
  const { ensureLoggedIn } = useRequireAuth();
  const location = useLocation();
  const qc = useQueryClient();
  const loginState = { from: `${location.pathname}${location.search}` };

  const suggested = useQuery({
    queryKey: ["suggest-follows", user?.id ?? "guest"],
    queryFn: () => fetchSuggestedFollows(),
    enabled: location.pathname === "/",
  });

  const reason = user ? "팔로우하지 않음" : "추천 계정";
  const suggestions = buildSuggestions(suggested.data ?? [], reason);

  const followMut = useMutation({
    mutationFn: (username: string) => followUser(username),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["suggest-follows"] });
      void qc.invalidateQueries({ queryKey: ["feed"] });
      void qc.invalidateQueries({ queryKey: ["explore"] });
    },
  });

  return (
    <div className={styles.root}>
      <div className={styles.upper}>
        {user ? (
          <div className={styles.me}>
            <Link to={`/${user.username}`} className={styles.meLink}>
              <Avatar src={user.avatarUrl} alt="" size="md" ring="none" />
              <div className={styles.meText}>
                <span className={styles.username}>{user.username}</span>
                <span className={styles.sub}>{user.displayName}</span>
              </div>
            </Link>
            <Link to="/accounts" className={styles.meSettings} aria-label="설정">
              <IconMenu width={22} height={22} />
            </Link>
          </div>
        ) : (
          <div className={styles.guestCard}>
            <p className={styles.guestTitle}>계정이 있으신가요?</p>
            <p className={styles.guestText}>로그인하면 좋아요, 댓글, 게시물 작성을 할 수 있어요.</p>
            <Link to="/login" state={loginState} className={styles.guestLogin}>
              로그인
            </Link>
            <Link to="/signup" state={loginState} className={styles.guestSignup}>
              가입하기
            </Link>
          </div>
        )}

        <div className={styles.sHead}>
          <span className={styles.sTitle}>회원님을 위한 추천</span>
          <Link to="/explore" className={styles.seeAll}>
            모두 보기
          </Link>
        </div>

        <ul className={styles.list}>
          {suggested.isLoading ? (
            <li className={styles.item}>
              <span className={styles.reason}>불러오는 중…</span>
            </li>
          ) : suggestions.filter((s) => !user || s.username !== user.username).length === 0 ? (
            <li className={styles.item}>
              <span className={styles.reason}>표시할 추천 프로필이 없습니다.</span>
            </li>
          ) : (
            suggestions
              .filter((s) => !user || s.username !== user.username)
              .map((s) => (
                <li key={s.id} className={styles.item}>
                  <Link to={`/${s.username}`} className={styles.userRow}>
                    <Avatar src={s.avatarUrl} alt="" size="sm" ring="none" />
                    <div className={styles.userMeta}>
                      <span className={styles.username}>{s.username}</span>
                      <span className={styles.reason}>{s.reason}</span>
                    </div>
                  </Link>
                  <button
                    type="button"
                    className={styles.follow}
                    onClick={() => {
                      if (!ensureLoggedIn()) return;
                      void followMut.mutate(s.username);
                    }}
                    disabled={followMut.isPending}
                  >
                    팔로우
                  </button>
                </li>
              ))
          )}
        </ul>
      </div>
    </div>
  );
}
