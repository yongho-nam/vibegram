import { useState } from "react";
import { AccountSettingsLayout } from "@/components/account/AccountSettingsLayout";
import { changePassword } from "@/api/endpoints";
import s from "./accountSubpagesShared.module.css";

export function AccountPasswordPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit =
    current.trim().length > 0 && next.trim().length > 0 && confirm.trim().length > 0;

  return (
    <AccountSettingsLayout title="비밀번호 변경" demoNote={null}>
      <div className={s.card}>
        <h2 className={s.cardTitle}>비밀번호</h2>
        <p className={s.cardLead}>보안을 위해 이전 비밀번호를 입력한 뒤 새 비밀번호를 설정하세요.</p>
        {msg ? <p className={s.hint}>{msg}</p> : null}
        <label className={s.field}>
          <span className={s.label}>이전 비밀번호</span>
          <input
            className={s.input}
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="이전 비밀번호"
          />
        </label>
        <label className={s.field}>
          <span className={s.label}>새 비밀번호</span>
          <input
            className={s.input}
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="새 비밀번호"
          />
        </label>
        <label className={s.field}>
          <span className={s.label}>새 비밀번호 확인</span>
          <input
            className={s.input}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="새 비밀번호 확인"
          />
        </label>
        <p className={s.hint}>서버 정책에 따라 최소 길이가 적용됩니다.</p>
        <div className={s.actions}>
          <button
            type="button"
            className={s.primary}
            disabled={busy || !canSubmit}
            onClick={async () => {
              setMsg(null);
              if (next !== confirm) {
                setMsg("새 비밀번호 확인이 일치하지 않습니다.");
                return;
              }
              setBusy(true);
              try {
                await changePassword(current, next);
                setMsg("비밀번호가 변경되었습니다.");
                setCurrent("");
                setNext("");
                setConfirm("");
              } catch {
                setMsg("변경에 실패했습니다. 이전 비밀번호를 확인해 주세요.");
              } finally {
                setBusy(false);
              }
            }}
          >
            비밀번호 변경
          </button>
        </div>
      </div>
    </AccountSettingsLayout>
  );
}
