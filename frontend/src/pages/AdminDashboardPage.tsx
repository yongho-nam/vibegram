import { useQuery } from "@tanstack/react-query";
import { fetchAdminStats } from "@/api/endpoints";
import s from "./adminConsole.module.css";

export function AdminDashboardPage() {
  const q = useQuery({ queryKey: ["admin", "stats"], queryFn: fetchAdminStats });

  if (q.isLoading) return <p className={s.muted}>불러오는 중…</p>;
  if (q.error) return <p className={s.err}>통계를 불러오지 못했습니다.</p>;
  const d = q.data!;

  return (
    <div>
      <h1 className={s.title}>통계 대시보드</h1>
      <div className={s.grid}>
        <div className={s.card}>
          <p className={s.cardLabel}>전체 회원</p>
          <p className={s.cardValue}>{d.totalUsers.toLocaleString("ko-KR")}</p>
        </div>
        <div className={s.card}>
          <p className={s.cardLabel}>전체 게시물</p>
          <p className={s.cardValue}>{d.totalPosts.toLocaleString("ko-KR")}</p>
        </div>
        <div className={s.card}>
          <p className={s.cardLabel}>최근 7일 가입</p>
          <p className={s.cardValue}>{d.usersLast7Days.toLocaleString("ko-KR")}</p>
        </div>
        <div className={s.card}>
          <p className={s.cardLabel}>최근 7일 게시</p>
          <p className={s.cardValue}>{d.postsLast7Days.toLocaleString("ko-KR")}</p>
        </div>
      </div>
    </div>
  );
}
