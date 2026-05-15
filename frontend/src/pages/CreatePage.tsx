import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconCamera } from "@/components/icons/Icons";
import { ApiError } from "@/api/client";
import { buildPostUploadForm, createPostMultipart } from "@/api/endpoints";
import styles from "./CreatePage.module.css";

type Step = "pick" | "compose";

export function CreatePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [err, setErr] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("pick");
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");

  const previewUrl = useMemo(() => (files[0] ? URL.createObjectURL(files[0]) : ""), [files]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const goCompose = useCallback((picked: File[]) => {
    if (!picked.length) return;
    setErr(null);
    setCaption("");
    setLocation("");
    setFiles(picked);
    setStep("compose");
  }, []);

  const backToPick = useCallback(() => {
    setFiles([]);
    setStep("pick");
    setCaption("");
    setLocation("");
    setErr(null);
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!files.length) throw new Error("no files");
      const form = buildPostUploadForm(files, caption, location);
      return createPostMultipart(form);
    },
    onSuccess: (post) => {
      void qc.invalidateQueries({ queryKey: ["feed"] });
      void qc.invalidateQueries({ queryKey: ["explore"] });
      void qc.invalidateQueries({ queryKey: ["profile-posts"] });
      navigate(`/p/${post.id}`, { replace: true });
    },
  });

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const list = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
      if (!list.length) {
        setErr("이미지 파일만 놓을 수 있습니다.");
        return;
      }
      goCompose(list);
    },
    [goCompose],
  );

  if (step === "compose" && files.length) {
    return (
      <div className={styles.root}>
        <div className={styles.composer}>
          <header className={styles.composerTop}>
            <button type="button" className={styles.textBtn} onClick={backToPick}>
              뒤로
            </button>
            <span className={styles.composerTitle}>새 게시물</span>
            <button
              type="button"
              className={styles.shareBtn}
              disabled={mutation.isPending}
              onClick={() => {
                setErr(null);
                mutation.mutate(undefined, {
                  onError: (e) => {
                    const detail = e instanceof ApiError ? e.message : "";
                    setErr(
                      detail
                        ? `공유에 실패했습니다: ${detail}`
                        : "공유에 실패했습니다. 네트워크와 로그인 상태를 확인해 주세요.",
                    );
                  },
                });
              }}
            >
              {mutation.isPending ? "올리는 중…" : "공유"}
            </button>
          </header>
          <div className={styles.composerBody}>
            <div className={styles.previewCol}>
              {previewUrl ? <img src={previewUrl} alt="" className={styles.previewImg} /> : null}
              {files.length > 1 ? (
                <p className={styles.multiHint}>선택한 이미지 {files.length}장이 업로드됩니다.</p>
              ) : null}
            </div>
            <div className={styles.metaCol}>
              <label className={styles.fieldLabel}>
                문구
                <textarea
                  className={styles.caption}
                  rows={6}
                  maxLength={2200}
                  placeholder="문구 입력…"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  disabled={mutation.isPending}
                />
              </label>
              <label className={styles.fieldLabel}>
                위치 (선택)
                <input
                  className={styles.input}
                  placeholder="예: 서울"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={mutation.isPending}
                  maxLength={255}
                />
              </label>
              {err ? <p className={styles.err}>{err}</p> : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div
        className={styles.dropCard}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={onDrop}
      >
        <IconCamera className={styles.cam} width={96} height={96} />
        <p className={styles.title}>사진과 동영상을 여기에 끌어다 놓으세요</p>
        <p className={styles.sub}>컴퓨터에서 직접 선택할 수도 있습니다.</p>
        {err ? <p className={styles.err}>{err}</p> : null}
        <label className={styles.btn}>
          컴퓨터에서 선택
          <input
            type="file"
            accept="image/*"
            multiple
            className={styles.file}
            onChange={(e) => {
              setErr(null);
              const raw = e.target.files;
              if (!raw?.length) return;
              const picked = Array.from(raw);
              goCompose(picked);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}
