import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AccountSettingsLayout } from "@/components/account/AccountSettingsLayout";
import { fetchPrivacy, patchPrivacy } from "@/api/endpoints";
import s from "./accountSubpagesShared.module.css";

export function AccountPrivacyPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["privacy"], queryFn: fetchPrivacy });
  const [privateAccount, setPrivateAccount] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [allowTags, setAllowTags] = useState(true);

  useEffect(() => {
    if (!data) return;
    setPrivateAccount(data.is_private);
    setShowActivity(data.show_activity_status);
    setAllowTags(data.allow_tags);
  }, [data]);

  const save = useMutation({
    mutationFn: (body: { is_private: boolean; show_activity_status: boolean; allow_tags: boolean }) => patchPrivacy(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["privacy"] }),
  });

  const push = (next: { is_private?: boolean; show_activity_status?: boolean; allow_tags?: boolean }) => {
    save.mutate({
      is_private: next.is_private ?? privateAccount,
      show_activity_status: next.show_activity_status ?? showActivity,
      allow_tags: next.allow_tags ?? allowTags,
    });
  };

  return (
    <AccountSettingsLayout title="계정 공개 범위" demoNote={null}>
      <div className={s.card}>
        <h2 className={s.cardTitle}>계정</h2>
        <p className={s.cardLead}>회원님의 콘텐츠를 누가 볼 수 있는지 관리합니다.</p>
        {isLoading ? <p className={s.hint}>불러오는 중…</p> : null}
        {save.isSuccess ? <p className={s.hint}>서버에 저장되었습니다.</p> : null}
        {save.isError ? <p className={s.hint}>저장에 실패했습니다.</p> : null}
        <div className={s.toggleRow}>
          <div className={s.toggleText}>
            <span className={s.toggleTitle}>비공개 계정</span>
            <p className={s.toggleDesc}>승인한 팔로워만 회원님의 사진과 동영상을 볼 수 있습니다.</p>
          </div>
          <label className={s.switch}>
            <input
              type="checkbox"
              checked={privateAccount}
              onChange={() => {
                const nv = !privateAccount;
                setPrivateAccount(nv);
                push({ is_private: nv });
              }}
            />
            <span className={s.slider} />
          </label>
        </div>
        <div className={s.toggleRow}>
          <div className={s.toggleText}>
            <span className={s.toggleTitle}>활동 상태 표시</span>
            <p className={s.toggleDesc}>메시지에서 마지막 활동 시간을 표시합니다.</p>
          </div>
          <label className={s.switch}>
            <input
              type="checkbox"
              checked={showActivity}
              onChange={() => {
                const nv = !showActivity;
                setShowActivity(nv);
                push({ show_activity_status: nv });
              }}
            />
            <span className={s.slider} />
          </label>
        </div>
        <div className={s.toggleRow}>
          <div className={s.toggleText}>
            <span className={s.toggleTitle}>태그 허용</span>
            <p className={s.toggleDesc}>다른 사람이 게시물에 회원님을 태그할 수 있습니다.</p>
          </div>
          <label className={s.switch}>
            <input
              type="checkbox"
              checked={allowTags}
              onChange={() => {
                const nv = !allowTags;
                setAllowTags(nv);
                push({ allow_tags: nv });
              }}
            />
            <span className={s.slider} />
          </label>
        </div>
      </div>
    </AccountSettingsLayout>
  );
}
