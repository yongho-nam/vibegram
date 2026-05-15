import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar } from "@/components/common/Avatar";
import { IconChevronLeft, IconComment, IconHeart, IconSave, IconSend } from "@/components/icons/Icons";
import { PostOwnerMenu } from "@/components/feed/PostOwnerMenu";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchComments, fetchPost, likePost, postComment, unlikePost, savePost, unsavePost } from "@/api/endpoints";
import styles from "./PostDetailPage.module.css";

export function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, ensureLoggedIn } = useRequireAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [commentText, setCommentText] = useState("");

  const loginState = { from: `${location.pathname}${location.search}` };

  const postQuery = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPost(postId!),
    enabled: Boolean(postId),
  });

  const commentsQuery = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: () => fetchComments(postId!),
    enabled: Boolean(postId),
  });

  const post = postQuery.data;
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    if (!post) return;
    setLiked(Boolean(post.isLiked));
    setSaved(Boolean(post.isSaved));
    setLikes(post.likes);
  }, [post]);

  const likeCount = useMemo(() => likes, [likes]);

  if (postQuery.isLoading) {
    return (
      <div className={styles.miss}>
        <p>불러오는 중…</p>
      </div>
    );
  }

  if (postQuery.error || !post) {
    return (
      <div className={styles.miss}>
        <p>게시물을 찾을 수 없습니다.</p>
        <Link to="/">홈으로</Link>
      </div>
    );
  }

  const comments = commentsQuery.data?.items ?? post.comments;
  const isOwn = Boolean(post.isOwn ?? (user && user.username === post.username));

  return (
    <div className={styles.shell}>
      <header className={styles.mTop}>
        <button type="button" className={styles.back} onClick={() => navigate(-1)} aria-label="뒤로">
          <IconChevronLeft />
        </button>
        <span className={styles.mTitle}>게시물</span>
        <span className={styles.spacer} />
      </header>

      <div className={styles.grid}>
        <div className={styles.media}>
          <img src={post.imageUrl} alt="" className={styles.img} />
        </div>
        <div className={styles.panel}>
          <header className={styles.head}>
            <Link to={`/${post.username}`} className={styles.user}>
              <Avatar src={post.avatarUrl} alt="" size="sm" ring="none" />
              <span className={styles.username}>{post.username}</span>
            </Link>
            {isOwn ? (
              <PostOwnerMenu
                postId={post.id}
                onDeleted={() => {
                  void qc.invalidateQueries({ queryKey: ["feed"] });
                  void qc.invalidateQueries({ queryKey: ["explore"] });
                  void qc.invalidateQueries({ queryKey: ["post", postId] });
                  navigate("/", { replace: true });
                }}
              />
            ) : (
              <span className={styles.headSpacer} aria-hidden />
            )}
          </header>
          <div className={styles.comments}>
            <div className={styles.pinned}>
              <Avatar src={post.avatarUrl} alt="" size="sm" ring="none" />
              <p className={styles.caption}>
                <Link to={`/${post.username}`} className={styles.captionUser}>
                  {post.username}
                </Link>{" "}
                {post.caption}
              </p>
            </div>
            {comments.map((c) => (
              <div key={c.id} className={styles.commentRow}>
                <Avatar
                  src={c.avatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(c.username)}`}
                  alt=""
                  size="sm"
                  ring="none"
                />
                <p className={styles.commentBody}>
                  <Link to={`/${c.username}`} className={styles.captionUser}>
                    {c.username}
                  </Link>{" "}
                  {c.body}
                </p>
              </div>
            ))}
          </div>
          <div className={styles.footer}>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-pressed={liked}
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
                    void qc.invalidateQueries({ queryKey: ["post", postId] });
                    void qc.invalidateQueries({ queryKey: ["feed"] });
                    void qc.invalidateQueries({ queryKey: ["explore"] });
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <IconHeart filled={liked} width={26} height={26} />
              </button>
              <button type="button" className={styles.iconBtn} aria-label="댓글">
                <IconComment width={26} height={26} />
              </button>
              <button type="button" className={styles.iconBtn} aria-label="공유">
                <IconSend width={26} height={26} />
              </button>
              <button
                type="button"
                className={[styles.iconBtn, styles.save].join(" ")}
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
                    void qc.invalidateQueries({ queryKey: ["post", postId] });
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <IconSave active={saved} width={26} height={26} />
              </button>
            </div>
            <p className={styles.likes}>
              <strong>좋아요 {likeCount.toLocaleString("ko-KR")}개</strong>
            </p>
            <p className={styles.time}>{post.timeAgo} 전</p>
            <form
              className={styles.add}
              onSubmit={async (e) => {
                e.preventDefault();
                if (!ensureLoggedIn()) return;
                const t = commentText.trim();
                if (!t) return;
                setBusy(true);
                try {
                  await postComment(post.id, t);
                  setCommentText("");
                  void qc.invalidateQueries({ queryKey: ["post-comments", postId] });
                  void qc.invalidateQueries({ queryKey: ["post", postId] });
                } finally {
                  setBusy(false);
                }
              }}
            >
              <input
                className={styles.addInput}
                placeholder="댓글 달기..."
                aria-label="댓글 달기"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onFocus={() => {
                  if (!user) navigate("/login", { state: loginState });
                }}
              />
              <button type="submit" className={styles.postBtn} disabled={busy}>
                게시
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
