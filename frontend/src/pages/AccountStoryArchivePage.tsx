import { useQuery } from "@tanstack/react-query";
import { AccountSettingsLayout } from "@/components/account/AccountSettingsLayout";
import { fetchStoryArchive } from "@/api/endpoints";
import s from "./accountSubpagesShared.module.css";

export function AccountStoryArchivePage() {
  const { data, isLoading } = useQuery({ queryKey: ["story-archive"], queryFn: fetchStoryArchive });

  const rows = data ?? [];

  return (
    <AccountSettingsLayout title="보관된 스토리" demoNote={null}>
      <div className={s.card}>
        {isLoading ? <p className={s.hint}>불러오는 중…</p> : null}
        {rows.length === 0 && !isLoading ? (
          <div className={s.empty} style={{ padding: "24px 8px 8px" }}>
            <div className={s.emptyIcon} aria-hidden>
              🕐
            </div>
            <h2 className={s.emptyTitle}>보관된 스토리 없음</h2>
            <p className={s.emptyText}>스토리를 보관하면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
            {rows.map((x) => (
              <div key={x.id} style={{ aspectRatio: "1", overflow: "hidden", borderRadius: 4 }}>
                <img src={x.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountSettingsLayout>
  );
}
