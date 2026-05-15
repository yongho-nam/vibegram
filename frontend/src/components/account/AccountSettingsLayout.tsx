import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { IconChevronLeft } from "@/components/icons/Icons";
import styles from "./AccountSettingsLayout.module.css";

type Props = {
  title: string;
  backTo?: string;
  demoNote?: string | null;
  children: ReactNode;
};

export function AccountSettingsLayout({ title, backTo = "/accounts", demoNote, children }: Props) {
  const navigate = useNavigate();

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <button type="button" className={styles.back} onClick={() => navigate(backTo)} aria-label="뒤로">
          <IconChevronLeft />
        </button>
        <h1 className={styles.title}>{title}</h1>
        <span className={styles.spacer} aria-hidden />
      </header>
      {demoNote ? (
        <p className={styles.demoBanner} role="status">
          {demoNote}
        </p>
      ) : null}
      {children}
    </div>
  );
}
