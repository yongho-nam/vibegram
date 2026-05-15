import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/common/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { createThread, fetchThreads, searchUsers } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import styles from "./NewMessageDialog.module.css";

type Props = { open: boolean; onClose: () => void };

export function NewMessageDialog({ open, onClose }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q.trim());

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const usersQuery = useQuery({
    queryKey: ["search-users", dq],
    queryFn: () => searchUsers(dq),
    enabled: open && dq.length >= 1,
  });

  const rows = useMemo(() => {
    const list = usersQuery.data ?? [];
    if (!user) return list;
    return list.filter((u) => u.username !== user.username);
  }, [usersQuery.data, user]);

  const { mutate, isPending, isError, error, reset } = useMutation({
    mutationFn: (otherUserId: number) => createThread(otherUserId),
    onSuccess: async (th) => {
      await qc.fetchQuery({ queryKey: ["threads"], queryFn: fetchThreads });
      navigate(`/direct/t/${th.id}`);
      onClose();
    },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-msg-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.head}>
          <h2 id="new-msg-title" className={styles.title}>
            새 메시지
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <div className={styles.search}>
          <input
            className={styles.input}
            placeholder="사용자 이름 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="사용자 검색"
            autoFocus
          />
        </div>
        {isError ? (
          <p className={styles.err}>
            {error instanceof ApiError ? error.message : "대화를 시작할 수 없습니다."}
          </p>
        ) : null}
        <ul className={styles.list}>
          {dq.length < 1 ? (
            <li className={styles.hint}>이름 또는 사용자 이름을 입력하세요.</li>
          ) : usersQuery.isLoading ? (
            <li className={styles.hint}>검색 중…</li>
          ) : rows.length === 0 ? (
            <li className={styles.hint}>결과가 없습니다.</li>
          ) : (
            rows.map((u) => {
              const idNum = Number(u.id);
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    className={styles.row}
                    disabled={isPending || Number.isNaN(idNum)}
                    onClick={() => {
                      if (Number.isNaN(idNum)) return;
                      mutate(idNum);
                    }}
                  >
                    <Avatar src={u.avatarUrl} alt="" size="md" ring="none" />
                    <div className={styles.meta}>
                      <div className={styles.un}>{u.username}</div>
                      <div className={styles.dn}>{u.displayName}</div>
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
