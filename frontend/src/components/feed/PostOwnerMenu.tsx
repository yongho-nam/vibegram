import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { IconMore } from "@/components/icons/Icons";
import { deletePost } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import styles from "./PostOwnerMenu.module.css";

type Props = {
  postId: string;
  onDeleted: () => void;
};

export function PostOwnerMenu({ postId, onDeleted }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const del = useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      setOpen(false);
      onDeleted();
    },
  });

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.toggle}
        aria-label="게시물 옵션"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <IconMore width={24} height={24} />
      </button>
      {open ? (
        <div className={styles.menu} role="menu">
          <button
            type="button"
            className={styles.item}
            role="menuitem"
            disabled={del.isPending}
            onClick={() => {
              if (!window.confirm("이 게시물을 삭제할까요?")) return;
              del.mutate(undefined, {
                onError: (e) => {
                  window.alert(e instanceof ApiError ? e.message : "삭제에 실패했습니다.");
                },
              });
            }}
          >
            삭제
          </button>
        </div>
      ) : null}
    </div>
  );
}
