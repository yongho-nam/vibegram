import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AccountSettingsLayout } from "@/components/account/AccountSettingsLayout";
import { Avatar } from "@/components/common/Avatar";
import { fetchBlocks, unblockUser } from "@/api/endpoints";
import type { BlockedUser } from "@/data/types";
import s from "./accountSubpagesShared.module.css";

export function AccountBlockedPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["blocks"], queryFn: fetchBlocks });

  const unblock = useMutation({
    mutationFn: (userId: number) => unblockUser(userId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["blocks"] }),
  });

  const list: BlockedUser[] = data ?? [];

  return (
    <AccountSettingsLayout title="차단된 계정" demoNote={null}>
      <div className={s.card}>
        <h2 className={s.cardTitle}>차단</h2>
        <p className={s.cardLead}>차단한 사람은 회원님의 프로필이나 콘텐츠를 찾을 수 없습니다.</p>
        {isLoading ? <p className={s.hint}>불러오는 중…</p> : null}
        {list.length === 0 ? (
          <p className={s.hint} style={{ marginTop: 0 }}>
            차단한 계정이 없습니다.
          </p>
        ) : (
          list.map((u) => (
            <div key={u.id} className={s.blockRow}>
              <Link to={`/${u.username}`} className={s.blockUser}>
                <Avatar src={u.avatarUrl} alt="" size="md" ring="none" />
                <div className={s.blockMeta}>
                  <div className={s.blockUn}>{u.username}</div>
                  <div className={s.blockDn}>{u.displayName}</div>
                </div>
              </Link>
              <button
                type="button"
                className={s.unblock}
                onClick={() => unblock.mutate(Number(u.id))}
                disabled={unblock.isPending}
              >
                차단 해제
              </button>
            </div>
          ))
        )}
      </div>
    </AccountSettingsLayout>
  );
}
