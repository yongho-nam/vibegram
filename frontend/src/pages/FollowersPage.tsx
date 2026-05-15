import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar } from "@/components/common/Avatar";
import { IconChevronLeft } from "@/components/icons/Icons";
import { useAuth } from "@/contexts/AuthContext";
import { fetchFollowers, fetchFollowing, removeFollower, unfollowUser } from "@/api/endpoints";
import styles from "./FollowListPage.module.css";

export function FollowersPage() {
  const { username } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["followers", username],
    queryFn: () => fetchFollowers(username!),
    enabled: Boolean(username),
  });

  const remove = useMutation({
    mutationFn: ({ u, id }: { u: string; id: number }) => removeFollower(u, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["followers", username] });
      void qc.invalidateQueries({ queryKey: ["profile", username] });
    },
  });

  const people = data ?? [];
  const isOwn = Boolean(user && username && user.username === username);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link to={`/${username}`} className={styles.back} aria-label="뒤로">
          <IconChevronLeft />
        </Link>
        <span className={styles.title}>팔로워</span>
        <span className={styles.spacer} />
      </header>
      {isLoading ? <p className={styles.hint}>불러오는 중…</p> : null}
      <ul className={styles.list}>
        {people.map((p) => (
          <li key={p.id} className={styles.row}>
            <Link to={`/${p.username}`} className={styles.user}>
              <Avatar src={p.avatarUrl} alt="" size="md" ring="none" />
              <div>
                <div className={styles.un}>{p.username}</div>
                <div className={styles.sub}>{p.subtitle ?? ""}</div>
              </div>
            </Link>
            {isOwn ? (
              <button
                type="button"
                className={styles.remove}
                onClick={() => remove.mutate({ u: username!, id: Number(p.id) })}
                disabled={remove.isPending}
              >
                제거
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FollowingPage() {
  const { username } = useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["following", username],
    queryFn: () => fetchFollowing(username!),
    enabled: Boolean(username),
  });

  const unfollow = useMutation({
    mutationFn: (peer: string) => unfollowUser(peer),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["following", username] });
      void qc.invalidateQueries({ queryKey: ["profile", username] });
    },
  });

  const people = data ?? [];

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link to={`/${username}`} className={styles.back} aria-label="뒤로">
          <IconChevronLeft />
        </Link>
        <span className={styles.title}>팔로잉</span>
        <span className={styles.spacer} />
      </header>
      {isLoading ? <p className={styles.hint}>불러오는 중…</p> : null}
      <ul className={styles.list}>
        {people.map((p) => (
          <li key={p.id} className={styles.row}>
            <Link to={`/${p.username}`} className={styles.user}>
              <Avatar src={p.avatarUrl} alt="" size="md" ring="none" />
              <div>
                <div className={styles.un}>{p.username}</div>
                <div className={styles.sub}>{p.displayName}</div>
              </div>
            </Link>
            <button
              type="button"
              className={styles.following}
              onClick={() => unfollow.mutate(p.username)}
              disabled={unfollow.isPending}
            >
              팔로잉
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
