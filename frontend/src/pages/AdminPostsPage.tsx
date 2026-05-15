import { useCallback, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminDeletePost, fetchAdminPosts, type AdminPostRow } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import s from "./adminConsole.module.css";

export function AdminPostsPage() {
  const qc = useQueryClient();
  const [rows, setRows] = useState<AdminPostRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (cursor: string | undefined, append: boolean) => {
    setErr(null);
    setLoading(true);
    try {
      const page = await fetchAdminPosts(cursor);
      setRows((prev) => (append ? [...prev, ...page.items] : page.items));
      setNextCursor(page.next_cursor);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(undefined, false);
  }, [load]);

  const del = useMutation({
    mutationFn: (id: string) => adminDeletePost(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      void load(undefined, false);
    },
  });

  return (
    <div>
      <h1 className={s.title}>게시물 관리</h1>
      {err ? <p className={s.err}>{err}</p> : null}
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>미리보기</th>
              <th>ID</th>
              <th>작성자</th>
              <th>캡션</th>
              <th>작성일</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className={s.row}>
                <td>
                  {p.imageUrl ? <img src={p.imageUrl} alt="" className={s.thumb} /> : <span className={s.muted}>—</span>}
                </td>
                <td>{p.id}</td>
                <td>@{p.authorUsername}</td>
                <td className={s.captionCell} title={p.caption}>
                  {p.caption || "—"}
                </td>
                <td className={s.muted}>{new Date(p.createdAt).toLocaleString("ko-KR")}</td>
                <td>
                  <button
                    type="button"
                    className={s.danger}
                    disabled={del.isPending}
                    onClick={() => {
                      if (!window.confirm(`게시물 #${p.id} 를 삭제할까요?`)) return;
                      del.mutate(p.id, {
                        onError: (e) => {
                          window.alert(e instanceof ApiError ? e.message : "삭제에 실패했습니다.");
                        },
                      });
                    }}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && rows.length === 0 ? <p className={s.muted}>불러오는 중…</p> : null}
      {nextCursor ? (
        <div className={s.loadMore}>
          <button type="button" disabled={loading} onClick={() => void load(nextCursor, true)}>
            더 보기
          </button>
        </div>
      ) : null}
    </div>
  );
}
