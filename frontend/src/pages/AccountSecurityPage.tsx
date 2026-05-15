import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AccountSettingsLayout } from "@/components/account/AccountSettingsLayout";
import { deleteSession, fetchSecurity, fetchSessions, patchSecurity } from "@/api/endpoints";
import s from "./accountSubpagesShared.module.css";

export function AccountSecurityPage() {
  const qc = useQueryClient();
  const sec = useQuery({ queryKey: ["security"], queryFn: fetchSecurity });
  const sess = useQuery({ queryKey: ["sessions"], queryFn: fetchSessions });
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  useEffect(() => {
    if (!sec.data) return;
    setTwoFactor(sec.data.two_factor_enabled);
    setLoginAlerts(sec.data.login_alerts_enabled);
  }, [sec.data]);

  const saveSec = useMutation({
    mutationFn: (body: { two_factor_enabled: boolean; login_alerts_enabled: boolean }) => patchSecurity(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["security"] }),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const sessions = sess.data ?? [];

  return (
    <AccountSettingsLayout title="보안 및 로그인" demoNote={null}>
      <div className={s.card}>
        <p className={s.sectionLabel}>로그인 보안</p>
        <div className={s.toggleRow}>
          <div className={s.toggleText}>
            <span className={s.toggleTitle}>2단계 인증</span>
            <p className={s.toggleDesc}>로그인 시 인증 앱 또는 SMS로 추가 확인을 요청합니다.</p>
          </div>
          <label className={s.switch}>
            <input
              type="checkbox"
              checked={twoFactor}
              onChange={() => {
                const nv = !twoFactor;
                setTwoFactor(nv);
                saveSec.mutate({ two_factor_enabled: nv, login_alerts_enabled: loginAlerts });
              }}
            />
            <span className={s.slider} />
          </label>
        </div>
        <div className={s.toggleRow}>
          <div className={s.toggleText}>
            <span className={s.toggleTitle}>새 기기 로그인 알림</span>
            <p className={s.toggleDesc}>낯선 기기에서 로그인하면 알림을 보냅니다.</p>
          </div>
          <label className={s.switch}>
            <input
              type="checkbox"
              checked={loginAlerts}
              onChange={() => {
                const nv = !loginAlerts;
                setLoginAlerts(nv);
                saveSec.mutate({ two_factor_enabled: twoFactor, login_alerts_enabled: nv });
              }}
            />
            <span className={s.slider} />
          </label>
        </div>
      </div>

      <div className={s.card}>
        <h2 className={s.cardTitle}>로그인 활동</h2>
        <p className={s.cardLead}>현재 로그인된 기기입니다. 의심되는 세션은 종료할 수 있습니다.</p>
        {sess.isLoading ? <p className={s.hint}>불러오는 중…</p> : null}
        {sessions.map((row) => (
          <div key={row.id} className={s.session}>
            <div className={s.sessionInfo}>
              <p className={s.sessionName}>
                {row.label}
                {row.is_current ? (
                  <span style={{ color: "var(--ig-secondary)", fontWeight: 400, marginLeft: 8 }}>(현재)</span>
                ) : null}
              </p>
              <p className={s.sessionMeta}>{row.meta}</p>
            </div>
            <button
              type="button"
              className={s.revoke}
              disabled={row.is_current || del.isPending}
              onClick={() => del.mutate(row.id)}
            >
              종료
            </button>
          </div>
        ))}
        {sessions.length <= 1 ? <p className={s.hint}>다른 활성 세션이 없습니다.</p> : null}
      </div>
    </AccountSettingsLayout>
  );
}
