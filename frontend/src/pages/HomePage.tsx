import { useQuery } from "@tanstack/react-query";
import { fetchFeed } from "@/api/endpoints";
import { PostCard } from "@/components/feed/PostCard";
import { StoryTray } from "@/components/feed/StoryTray";
import { brandCopyrightYear } from "@/config/brand";
import styles from "./HomePage.module.css";

export function HomePage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["feed"], queryFn: () => fetchFeed() });

  return (
    <div className={styles.root}>
      <StoryTray />
      <div className={styles.feed}>
        {isLoading ? <p className={styles.hint}>불러오는 중…</p> : null}
        {error ? (
          <p className={styles.hint} role="alert">
            피드를 불러오지 못했습니다. API 서버가 실행 중인지 확인해 주세요.
          </p>
        ) : null}
        {data?.items.map((post) => (
          <PostCard key={post.id} post={post} onPostChanged={() => void refetch()} />
        ))}
        {data && data.items.length === 0 && !isLoading ? (
          <p className={styles.hint}>표시할 게시물이 없습니다. 다른 계정을 팔로우하거나 탐색에서 찾아보세요.</p>
        ) : null}
      </div>
      <footer className={styles.feedFooter}>
        <p className={styles.feedCopy}>{brandCopyrightYear()}</p>
      </footer>
    </div>
  );
}
