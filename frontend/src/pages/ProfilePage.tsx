import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/common/Avatar";
import { IconMenu } from "@/components/icons/Icons";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  createThread,
  fetchProfile,
  fetchThreads,
  fetchUserPosts,
  followUser,
  unfollowUser,
} from "@/api/endpoints";
import { ApiError } from "@/api/client";
import styles from "./ProfilePage.module.css";

export function ProfilePage() {
  const { username } = useParams();
  const { logout } = useAuth();
  const { ensureLoggedIn } = useRequireAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [followBusy, setFollowBusy] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchProfile(username!),
    enabled: Boolean(username),
  });

  const postsQuery = useQuery({
    queryKey: ["profile-posts", username],
    queryFn: () => fetchUserPosts(username!),
    enabled: Boolean(username),
  });

  const profile = profileQuery.data;
  const posts = postsQuery.data?.items ?? [];

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!username) return;
      if (profile?.isFollowing) await unfollowUser(username);
      else await followUser(username);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["profile", username] });
      void qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const messageMutation = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      return createThread(Number(profile.id));
    },
    onSuccess: async (th) => {
      if (!th) return;
      await qc.fetchQuery({ queryKey: ["threads"], queryFn: fetchThreads });
      navigate(`/direct/t/${th.id}`);
    },
    onError: (e) => {
      window.alert(e instanceof ApiError ? e.message : "메시지를 시작할 수 없습니다.");
    },
  });

  const title = useMemo(() => username ?? "", [username]);

  if (profileQuery.isLoading) {
    return (
      <div className={styles.miss}>
        <p>불러오는 중…</p>
      </div>
    );
  }

  if (profileQuery.error || !username || !profile) {
    return (
      <div className={styles.miss}>
        <p>페이지를 사용할 수 없습니다.</p>
        <Link to="/">홈으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <header className={styles.top}>
        <span className={styles.topUser}>{title}</span>
        {profile.isOwn ? (
          <button type="button" className={styles.iconBtn} aria-label="설정" onClick={() => navigate("/accounts")}>
            <IconMenu />
          </button>
        ) : (
          <span className={styles.spacer} />
        )}
      </header>

      <section className={styles.head}>
        <Avatar src={profile.avatarUrl} alt="" size="xl" ring="none" />
        <div className={styles.stats}>
          <div className={styles.stat}>
            <strong>{profile.posts}</strong>
            <span>게시물</span>
          </div>
          <Link to={`/${username}/followers`} className={styles.stat}>
            <strong>{profile.followers.toLocaleString("ko-KR")}</strong>
            <span>팔로워</span>
          </Link>
          <Link to={`/${username}/following`} className={styles.stat}>
            <strong>{profile.following.toLocaleString("ko-KR")}</strong>
            <span>팔로잉</span>
          </Link>
        </div>
      </section>

      <div className={styles.meta}>
        <p className={styles.displayName}>{profile.displayName}</p>
        {profile.bio ? <p className={styles.bio}>{profile.bio}</p> : null}
        <div className={styles.actions}>
          {profile.isOwn ? (
            <>
              <Link to="/accounts" className={styles.btn}>
                설정
              </Link>
              <Link to="/accounts/edit" className={styles.btn}>
                프로필 편집
              </Link>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.primary}
                disabled={followBusy || followMutation.isPending}
                onClick={async () => {
                  if (!ensureLoggedIn()) return;
                  setFollowBusy(true);
                  try {
                    await followMutation.mutateAsync();
                  } finally {
                    setFollowBusy(false);
                  }
                }}
              >
                {profile.isFollowing ? "팔로잉" : "팔로우"}
              </button>
              <button
                type="button"
                className={styles.btn}
                disabled={messageMutation.isPending}
                onClick={() => {
                  if (!ensureLoggedIn()) return;
                  void messageMutation.mutateAsync();
                }}
              >
                메시지 보내기
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles.tabs}>
        <button type="button" className={styles.tab} data-active>
          게시물
        </button>
      </div>

      <div className={styles.grid}>
        {posts.length === 0 ? (
          <p className={styles.empty}>아직 게시물이 없습니다.</p>
        ) : (
          posts.map((p) => (
            <Link key={p.id} to={`/p/${p.id}`} className={styles.cell}>
              <img src={p.imageUrl} alt="" className={styles.thumb} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
