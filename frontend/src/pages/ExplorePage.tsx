import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchExplore } from "@/api/endpoints";
import styles from "./ExplorePage.module.css";

export function ExplorePage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["explore"], queryFn: () => fetchExplore() });

  return (
    <div className={styles.root}>
      <h1 className="ig-page-title">탐색</h1>
      {isLoading ? <p className={styles.status}>불러오는 중…</p> : null}
      {error ? (
        <p className={styles.status} role="alert">
          탐색 피드를 불러오지 못했습니다.
        </p>
      ) : null}
      <div className={styles.grid}>
        {(data?.items ?? []).map((cell) => (
          <Link key={cell.id} to={`/p/${cell.id}`} className={styles.cell}>
            <img src={cell.imageUrl} alt="" className={styles.img} loading="lazy" />
            <div className={styles.overlay} aria-hidden>
              <span className={styles.stat}>♥ {cell.likes.toLocaleString("ko-KR")}</span>
              <span className={styles.stat}>💬 {cell.comments?.length ?? 0}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
