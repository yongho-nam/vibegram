import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AccountSettingsLayout } from "@/components/account/AccountSettingsLayout";
import { fetchNotificationSettings, patchNotificationSettings, type NotifSettings } from "@/api/endpoints";
import s from "./accountSubpagesShared.module.css";

export function AccountNotificationSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["notif-settings"], queryFn: fetchNotificationSettings });
  const [st, setSt] = useState<NotifSettings>({
    pushLike: true,
    pushComment: true,
    pushFollow: true,
    pushMention: true,
    pushDirect: true,
    emailDigest: false,
  });

  useEffect(() => {
    if (data) setSt(data);
  }, [data]);

  const save = useMutation({
    mutationFn: (body: Partial<NotifSettings>) => patchNotificationSettings(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notif-settings"] }),
  });

  const toggle = (key: keyof NotifSettings) => {
    const nv = { ...st, [key]: !st[key] };
    setSt(nv);
    save.mutate({ [key]: nv[key] });
  };

  return (
    <AccountSettingsLayout title="알림 설정" backTo="/accounts" demoNote={null}>
      <div className={s.card}>
        {isLoading ? <p className={s.hint}>불러오는 중…</p> : null}
        <p className={s.sectionLabel}>푸시 알림</p>
        <div className={s.toggleRow}>
          <div className={s.toggleText}>
            <span className={s.toggleTitle}>좋아요</span>
            <p className={s.toggleDesc}>누군가 회원님의 게시물을 좋아할 때</p>
          </div>
          <label className={s.switch}>
            <input type="checkbox" checked={st.pushLike} onChange={() => toggle("pushLike")} />
            <span className={s.slider} />
          </label>
        </div>
        <div className={s.toggleRow}>
          <div className={s.toggleText}>
            <span className={s.toggleTitle}>댓글</span>
            <p className={s.toggleDesc}>누군가 회원님의 게시물에 댓글을 남길 때</p>
          </div>
          <label className={s.switch}>
            <input type="checkbox" checked={st.pushComment} onChange={() => toggle("pushComment")} />
            <span className={s.slider} />
          </label>
        </div>
        <div className={s.toggleRow}>
          <div className={s.toggleText}>
            <span className={s.toggleTitle}>새 팔로워</span>
            <p className={s.toggleDesc}>누군가 회원님을 팔로우할 때</p>
          </div>
          <label className={s.switch}>
            <input type="checkbox" checked={st.pushFollow} onChange={() => toggle("pushFollow")} />
            <span className={s.slider} />
          </label>
        </div>
        <div className={s.toggleRow}>
          <div className={s.toggleText}>
            <span className={s.toggleTitle}>멘션</span>
            <p className={s.toggleDesc}>댓글이나 캡션에서 회원님이 태그될 때</p>
          </div>
          <label className={s.switch}>
            <input type="checkbox" checked={st.pushMention} onChange={() => toggle("pushMention")} />
            <span className={s.slider} />
          </label>
        </div>
        <div className={s.toggleRow}>
          <div className={s.toggleText}>
            <span className={s.toggleTitle}>메시지</span>
            <p className={s.toggleDesc}>다이렉트 메시지를 받을 때</p>
          </div>
          <label className={s.switch}>
            <input type="checkbox" checked={st.pushDirect} onChange={() => toggle("pushDirect")} />
            <span className={s.slider} />
          </label>
        </div>
      </div>

      <div className={s.card}>
        <p className={s.sectionLabel}>이메일</p>
        <div className={s.toggleRow}>
          <div className={s.toggleText}>
            <span className={s.toggleTitle}>요약 메일</span>
            <p className={s.toggleDesc}>놓친 활동을 주기적으로 이메일로 받습니다.</p>
          </div>
          <label className={s.switch}>
            <input type="checkbox" checked={st.emailDigest} onChange={() => toggle("emailDigest")} />
            <span className={s.slider} />
          </label>
        </div>
      </div>
    </AccountSettingsLayout>
  );
}
