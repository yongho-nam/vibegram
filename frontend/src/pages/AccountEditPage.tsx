import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/common/Avatar";
import { IconChevronLeft } from "@/components/icons/Icons";
import { patchMe, uploadAvatar } from "@/api/endpoints";
import styles from "./AccountEditPage.module.css";

export function AccountEditPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [website, setWebsite] = useState(user?.website ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName);
    setBio(user.bio ?? "");
    setWebsite(user.website ?? "");
  }, [user]);

  if (!user) return null;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <button type="button" className={styles.back} onClick={() => navigate("/accounts")} aria-label="설정으로">
          <IconChevronLeft />
        </button>
        <h1 className={styles.title}>프로필 편집</h1>
        <span className={styles.spacer} />
      </header>

      <div className={styles.card}>
        <div className={styles.avatarRow}>
          <Avatar src={user.avatarUrl} alt="" size="lg" ring="none" />
          <div>
            <div className={styles.un}>{user.username}</div>
            <label className={styles.avatarLink}>
              프로필 사진 바꾸기
              <input
                type="file"
                accept="image/*"
                className={styles.hiddenFile}
                disabled={busy}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setBusy(true);
                  setMsg(null);
                  try {
                    await uploadAvatar(f);
                    await refreshUser();
                    setMsg("프로필 사진이 저장되었습니다.");
                  } catch {
                    setMsg("이미지 업로드에 실패했습니다.");
                  } finally {
                    setBusy(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
          </div>
        </div>
        <label className={styles.field}>
          <span className={styles.label}>이름</span>
          <input className={styles.input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>사용자 이름</span>
          <input className={styles.input} defaultValue={user.username} readOnly />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>웹사이트</span>
          <input className={styles.input} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>소개</span>
          <textarea className={styles.textarea} rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        </label>
        {msg ? <p className={styles.note}>{msg}</p> : null}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.submit}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setMsg(null);
              try {
                await patchMe({
                  display_name: displayName.trim(),
                  bio: bio.trim() || undefined,
                  website: website.trim() || undefined,
                });
                await refreshUser();
                setMsg("저장되었습니다.");
              } catch {
                setMsg("저장에 실패했습니다.");
              } finally {
                setBusy(false);
              }
            }}
          >
            제출
          </button>
          <Link to={`/${user.username}`} className={styles.cancel}>
            취소
          </Link>
        </div>
      </div>
    </div>
  );
}
