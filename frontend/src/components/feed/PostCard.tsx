import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { Post } from "@/data/types";
import { Avatar } from "@/components/common/Avatar";
import { IconComment, IconHeart, IconSave, IconSend } from "@/components/icons/Icons";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { likePost, savePost, unlikePost, unsavePost } from "@/api/endpoints";
import { PostOwnerMenu } from "@/components/feed/PostOwnerMenu";
import styles from "./PostCard.module.css";

type Props = { post: Post; onPostChanged?: () => void };

export function PostCard({ post, onPostChanged }: Props) {
  const { user, ensureLoggedIn } = useRequireAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [liked, setLiked] = useState(Boolean(post.isLiked));
  const [saved, setSaved] = useState(Boolean(post.isSaved));
  const [likes, setLikes] = useState(post.likes);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLiked(Boolean(post.isLiked));
    setSaved(Boolean(post.isSaved));
    setLikes(post.likes);
  }, [post.id, post.isLiked, post.isSaved, post.likes]);

  const likeCount = useMemo(() => likes, [likes]);

  const postPath = `/p/${post.id}`;
  const loginState = { from: postPath };
  const isOwn = Boolean(post.isOwn ?? (user && user.username === post.username));

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["feed"] });
    void qc.invalidateQueries({ queryKey: ["explore"] });
    void qc.invalidateQueries({ queryKey: ["post", post.id] });
    onPostChanged?.();
  };

  return (
    <article className={styles.card}>
      <header className={styles.head}>
        <Link to={`/${post.username}`} className={styles.user}>
          <Avatar src={post.avatarUrl} alt="" size="sm" ring="none" />
          <div className={styles.userMeta}>
            <span className={styles.username}>{post.username}</span>
            {post.location ? <span className={styles.location}>{post.location}</span> : null}
          </div>
        </Link>
        {isOwn ? (
          <PostOwnerMenu
            postId={post.id}
            onDeleted={() => {
              invalidate();
            }}
          />
        ) : (
          <span className={styles.headSpacer} aria-hidden />
        )}
      </header>

      <Link to={postPath} className={styles.mediaLink} aria-label={`${post.username}의 게시물 보기`}>
        <div className={styles.media}>
          <img src={post.imageUrl} alt="" className={styles.img} loading="lazy" />
        </div>
      </Link>

      <div className={styles.actions}>
        <div className={styles.actionsLeft}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-pressed={liked}
            aria-label={liked ? "좋아요 취소" : "좋아요"}
            disabled={busy}
            onClick={async () => {
              if (!user) {
                navigate("/login", { state: loginState });
                return;
              }
              setBusy(true);
              try {
                if (liked) {
                  await unlikePost(post.id);
                  setLikes((n) => Math.max(0, n - 1));
                  setLiked(false);
                } else {
                  await likePost(post.id);
                  setLikes((n) => n + 1);
                  setLiked(true);
                }
                invalidate();
              } finally {
                setBusy(false);
              }
            }}
          >
            <IconHeart filled={liked} width={26} height={26} />
          </button>
          <Link
            to={postPath}
            className={styles.iconBtn}
            aria-label="댓글"
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                navigate("/login", { state: loginState });
              }
            }}
          >
            <IconComment width={26} height={26} />
          </Link>
          <button type="button" className={styles.iconBtn} aria-label="공유하기">
            <IconSend width={26} height={26} />
          </button>
        </div>
        <button
          type="button"
          className={styles.iconBtn}
          aria-pressed={saved}
          aria-label={saved ? "저장 취소" : "저장"}
          disabled={busy}
          onClick={async () => {
            if (!ensureLoggedIn()) return;
            setBusy(true);
            try {
              if (saved) {
                await unsavePost(post.id);
                setSaved(false);
              } else {
                await savePost(post.id);
                setSaved(true);
              }
              invalidate();
            } finally {
              setBusy(false);
            }
          }}
        >
          <IconSave active={saved} width={26} height={26} />
        </button>
      </div>

      <div className={styles.body}>
        <p className={styles.likes}>
          <strong>좋아요 {likeCount.toLocaleString("ko-KR")}개</strong>
        </p>
        <p className={styles.caption}>
          <Link to={`/${post.username}`} className={styles.captionUser}>
            {post.username}
          </Link>{" "}
          <span>{post.caption}</span>
        </p>
        {post.comments.length > 0 ? (
          <Link to={postPath} className={styles.viewComments}>
            댓글 {post.comments.length}개 모두 보기
          </Link>
        ) : null}
        <Link to={postPath} className={styles.time}>
          {post.timeAgo} 전
        </Link>
      </div>
    </article>
  );
}
