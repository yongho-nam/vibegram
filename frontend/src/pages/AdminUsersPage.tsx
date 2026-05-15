import { useCallback, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminDeleteUser, fetchAdminUsers, type AdminUserRow } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import s from "./adminConsole.module.css";

export function AdminUsersPage() {
  const qc = useQueryClient();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (off: number, append: boolean) => {
    setErr(null);
    setLoading(true);
    try {
      const page = await fetchAdminUsers(off);
      setRows((prev) => (append ? [...prev, ...page.items] : page.items));
      setNextOffset(page.next_offset);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(0, false);
  }, [load]);

  const del = useMutation({
    mutationFn: (id: string) => adminDeleteUser(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      void load(0, false);
    },
  });

  return (
    <div>
      <h1 className={s.title}>회원 관리</h1>
      {err ? <p className={s.err}>{err}</p> : null}
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>사용자 이름</th>
              <th>이메일</th>
              <th>표시 이름</th>
              <th>가입일</th>
              <th>게시물</th>
              <th>관리자</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className={s.row}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.displayName}</td>
                <td className={s.muted}>{new Date(u.createdAt).toLocaleString("ko-KR")}</td>
                <td>{u.postsCount}</td>
                <td>{u.isAdmin ? "예" : ""}</td>
                <td>
                  <button
                    type="button"
                    className={s.danger}
                    disabled={del.isPending}
                    onClick={() => {
                      if (!window.confirm(`회원 @${u.username} 을(를) 탈퇴(삭제) 처리할까요? 관련 데이터가 함께 삭제됩니다.`)) return;
                      del.mutate(u.id, {
                        onError: (e) => {
                          window.alert(e instanceof ApiError ? e.message : "삭제에 실패했습니다.");
                        },
                      });
                    }}
                  >
                    탈퇴
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && rows.length === 0 ? <p className={s.muted}>불러오는 중…</p> : null}
      {nextOffset !== null ? (
        <div className={s.loadMore}>
          <button type="button" disabled={loading} onClick={() => void load(nextOffset, true)}>
            더 보기
          </button>
        </div>
      ) : null}
    </div>
  );
}
