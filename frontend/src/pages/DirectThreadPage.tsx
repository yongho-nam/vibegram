import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconChevronLeft, IconSend } from "@/components/icons/Icons";
import { Avatar } from "@/components/common/Avatar";
import { fetchThreadMessages, fetchThreads, markThreadRead, sendThreadMessage } from "@/api/endpoints";
import styles from "./DirectThreadPage.module.css";

function formatMsgTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function DirectThreadPage() {
  const { threadId } = useParams();
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const threadsQuery = useQuery({
    queryKey: ["threads"],
    queryFn: fetchThreads,
    refetchOnMount: "always",
  });
  const thread = threadsQuery.data?.find((t) => t.id === threadId);

  const resolvingPeer = Boolean(
    threadId &&
      !thread &&
      (threadsQuery.isPending || threadsQuery.isLoading || threadsQuery.isFetching),
  );

  const messagesQuery = useQuery({
    queryKey: ["thread-messages", threadId],
    queryFn: () => fetchThreadMessages(threadId!),
    enabled: Boolean(threadId),
  });

  useEffect(() => {
    if (!threadId) return;
    void markThreadRead(threadId).then(() => {
      void qc.invalidateQueries({ queryKey: ["threads"] });
    });
  }, [threadId, qc]);

  const sendMut = useMutation({
    mutationFn: () => sendThreadMessage(threadId!, text.trim()),
    onSuccess: () => {
      setText("");
      void qc.invalidateQueries({ queryKey: ["thread-messages", threadId] });
      void qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  if (!threadId) {
    return (
      <div className={styles.miss}>
        <p>대화를 찾을 수 없습니다.</p>
        <Link to="/direct">목록으로</Link>
      </div>
    );
  }

  if (resolvingPeer) {
    return (
      <div className={styles.root}>
        <header className={styles.header}>
          <Link to="/direct" className={styles.back} aria-label="뒤로">
            <IconChevronLeft />
          </Link>
          <span className={styles.un}>불러오는 중…</span>
          <span className={styles.spacer} />
        </header>
        <div className={styles.chat}>
          <p>대화 정보를 불러오는 중입니다.</p>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className={styles.miss}>
        <p>대화를 찾을 수 없습니다.</p>
        <Link to="/direct">목록으로</Link>
      </div>
    );
  }

  const messages = messagesQuery.data?.items ?? [];

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link to="/direct" className={styles.back} aria-label="뒤로">
          <IconChevronLeft />
        </Link>
        <Link to={`/${thread.username}`} className={styles.peer}>
          <Avatar src={thread.avatarUrl} alt="" size="sm" ring="none" />
          <span className={styles.un}>{thread.username}</span>
        </Link>
        <span className={styles.spacer} />
      </header>
      <div className={styles.chat}>
        {messagesQuery.isLoading ? <p>불러오는 중…</p> : null}
        {messages.map((m) => (
          <div key={m.id} className={styles.row} data-me={m.fromMe}>
            <div className={styles.bubble}>{m.body}</div>
            <span className={styles.time}>{formatMsgTime(m.time)}</span>
          </div>
        ))}
      </div>
      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim() || sendMut.isPending) return;
          sendMut.mutate();
        }}
      >
        <input
          className={styles.input}
          placeholder="메시지..."
          aria-label="메시지 입력"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className={styles.send} aria-label="보내기" disabled={sendMut.isPending}>
          <IconSend />
        </button>
      </form>
    </div>
  );
}
