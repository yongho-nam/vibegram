import { apiFetch } from "./client";
import type {
  BlockedUser,
  Comment,
  CurrentUser,
  Message,
  NotificationItem,
  Post,
  StoryUser,
  SuggestionUser,
  ThreadPreview,
} from "@/data/types";

export type FeedPage = { items: Post[]; next_cursor: string | null };

export type AuthUserOut = {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  avatarUrl: string;
  bio?: string | null;
  isAdmin?: boolean;
};

export type UserMeResponse = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  bio?: string | null;
  website?: string | null;
  isAdmin?: boolean;
};

export function mapAuthUser(u: AuthUserOut): CurrentUser {
  return {
    id: u.id,
    username: u.username,
    email: u.email ?? undefined,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl ?? "",
    bio: u.bio ?? undefined,
    website: undefined,
    isAdmin: Boolean(u.isAdmin),
  };
}

export function mapUserMe(m: UserMeResponse): CurrentUser {
  return {
    id: m.id,
    username: m.username,
    email: m.email,
    displayName: m.displayName,
    avatarUrl: m.avatarUrl ?? "",
    bio: m.bio ?? undefined,
    website: m.website ?? undefined,
    isAdmin: Boolean(m.isAdmin),
  };
}

export async function loginApi(login: string, password: string) {
  return apiFetch<{ access_token: string; user: AuthUserOut }>("/auth/login", {
    method: "POST",
    json: { login, password },
  });
}

export type ForgotPasswordResponse = {
  message: string;
  reset_url?: string | null;
};

export async function requestPasswordReset(login: string) {
  return apiFetch<ForgotPasswordResponse>("/auth/forgot-password", {
    method: "POST",
    json: { login: login.trim() },
  });
}

export async function resetPasswordWithToken(token: string, new_password: string) {
  return apiFetch<void>("/auth/reset-password", {
    method: "POST",
    json: { token, new_password },
  });
}

export async function registerApi(body: {
  email: string;
  username: string;
  password: string;
  display_name?: string;
}) {
  return apiFetch<{ access_token: string; user: AuthUserOut }>("/auth/register", { method: "POST", json: body });
}

export async function fetchMe(): Promise<UserMeResponse> {
  return apiFetch("/users/me");
}

export type SuggestedFollowUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
};

export async function fetchSuggestedFollows(): Promise<SuggestedFollowUser[]> {
  return apiFetch("/users/suggest-follows?limit=12");
}

export type AdminStats = {
  totalUsers: number;
  totalPosts: number;
  usersLast7Days: number;
  postsLast7Days: number;
};

export async function fetchAdminStats(): Promise<AdminStats> {
  return apiFetch("/admin/stats");
}

export type AdminUserRow = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  createdAt: string;
  isAdmin: boolean;
  postsCount: number;
};

export type AdminUsersPage = { items: AdminUserRow[]; next_offset: number | null };

export async function fetchAdminUsers(offset: number): Promise<AdminUsersPage> {
  const q = new URLSearchParams();
  q.set("offset", String(offset));
  q.set("limit", "25");
  return apiFetch(`/admin/users?${q.toString()}`);
}

export async function adminDeleteUser(userId: string): Promise<void> {
  return apiFetch<void>(`/admin/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
}

export type AdminPostRow = {
  id: string;
  authorId: string;
  authorUsername: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
};

export type AdminPostsPage = { items: AdminPostRow[]; next_cursor: string | null };

export async function fetchAdminPosts(cursor?: string): Promise<AdminPostsPage> {
  const q = new URLSearchParams();
  q.set("limit", "25");
  if (cursor) q.set("cursor", cursor);
  const s = q.toString();
  return apiFetch(`/admin/posts?${s}`);
}

export async function adminDeletePost(postId: string): Promise<void> {
  return apiFetch<void>(`/admin/posts/${encodeURIComponent(postId)}`, { method: "DELETE" });
}

export async function fetchFeed(cursor?: string): Promise<FeedPage> {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return apiFetch(`/posts/feed${q}`);
}

export async function fetchExplore(cursor?: string): Promise<FeedPage> {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return apiFetch(`/posts/explore${q}`);
}

export async function fetchPost(postId: string): Promise<Post> {
  return apiFetch(`/posts/${postId}`);
}

export async function fetchComments(postId: string, cursor?: string): Promise<{ items: Comment[]; next_cursor: string | null }> {
  const q = new URLSearchParams();
  if (cursor) q.set("cursor", cursor);
  const s = q.toString();
  return apiFetch(`/posts/${postId}/comments${s ? `?${s}` : ""}`);
}

export async function postComment(postId: string, body: string) {
  return apiFetch<Comment>(`/posts/${postId}/comments`, { method: "POST", json: { body } });
}

export async function likePost(postId: string) {
  return apiFetch<void>(`/posts/${postId}/like`, { method: "POST" });
}

export async function unlikePost(postId: string) {
  return apiFetch<void>(`/posts/${postId}/like`, { method: "DELETE" });
}

export async function savePost(postId: string) {
  return apiFetch<void>(`/posts/${postId}/save`, { method: "POST" });
}

export async function unsavePost(postId: string) {
  return apiFetch<void>(`/posts/${postId}/save`, { method: "DELETE" });
}

export async function createPostMultipart(form: FormData) {
  return apiFetch<Post>("/posts", { method: "POST", form });
}

export function buildPostUploadForm(files: File[], caption?: string, location?: string): FormData {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  const c = caption?.trim();
  if (c) form.append("caption", c);
  const loc = location?.trim();
  if (loc) form.append("location", loc);
  return form;
}

export async function deletePost(postId: string): Promise<void> {
  return apiFetch<void>(`/posts/${encodeURIComponent(postId)}`, { method: "DELETE" });
}

export type ProfileResponse = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  posts: number;
  followers: number;
  following: number;
  isFollowing: boolean;
  isOwn: boolean;
};

export async function fetchProfile(username: string): Promise<ProfileResponse> {
  return apiFetch(`/users/${encodeURIComponent(username)}`);
}

export type PostGridItem = { id: string; imageUrl: string };
export type PostGridPage = { items: PostGridItem[]; next_cursor: string | null };

export async function fetchUserPosts(username: string): Promise<PostGridPage> {
  return apiFetch(`/users/${encodeURIComponent(username)}/posts`);
}

export async function followUser(username: string) {
  return apiFetch<void>(`/users/${encodeURIComponent(username)}/follow`, { method: "POST" });
}

export async function unfollowUser(username: string) {
  return apiFetch<void>(`/users/${encodeURIComponent(username)}/follow`, { method: "DELETE" });
}

export type FollowListRow = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  subtitle: string | null;
};

export async function fetchFollowers(username: string): Promise<FollowListRow[]> {
  return apiFetch(`/users/${encodeURIComponent(username)}/followers`);
}

export async function fetchFollowing(username: string): Promise<FollowListRow[]> {
  return apiFetch(`/users/${encodeURIComponent(username)}/following`);
}

export async function removeFollower(profileUsername: string, followerUserId: number) {
  return apiFetch<void>(`/users/${encodeURIComponent(profileUsername)}/followers/${followerUserId}`, {
    method: "DELETE",
  });
}

export async function fetchStoriesFeed(): Promise<StoryUser[]> {
  return apiFetch("/stories/feed");
}

export type StoryArchiveItem = { id: string; imageUrl: string; createdAt: string };

export async function fetchStoryArchive(): Promise<StoryArchiveItem[]> {
  return apiFetch("/stories/archive");
}

export async function markStorySeen(storyId: string) {
  return apiFetch<void>(`/stories/${storyId}/seen`, { method: "POST" });
}

export async function fetchThreads(): Promise<ThreadPreview[]> {
  return apiFetch("/messages/threads");
}

export async function createThread(otherUserId: number): Promise<ThreadPreview> {
  return apiFetch("/messages/threads", { method: "POST", json: { other_user_id: otherUserId } });
}

export type MessagesPage = { items: Message[]; next_cursor: string | null };

export async function fetchThreadMessages(threadId: string): Promise<MessagesPage> {
  return apiFetch(`/messages/threads/${encodeURIComponent(threadId)}/messages`);
}

export async function sendThreadMessage(threadId: string, body: string) {
  return apiFetch<Message>(`/messages/threads/${encodeURIComponent(threadId)}/messages`, {
    method: "POST",
    json: { body },
  });
}

export async function markThreadRead(threadId: string) {
  return apiFetch<void>(`/messages/threads/${encodeURIComponent(threadId)}/read`, { method: "PATCH" });
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  return apiFetch("/notifications");
}

export async function markAllNotificationsRead() {
  return apiFetch<void>("/notifications/read-all", { method: "PATCH" });
}

export async function markNotificationRead(id: string) {
  return apiFetch<void>(`/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" });
}

export async function searchUsers(q: string): Promise<SuggestionUser[]> {
  const rows = await apiFetch<{ id: string; username: string; displayName: string; avatarUrl: string }[]>(
    `/search/users?q=${encodeURIComponent(q)}`,
  );
  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    displayName: r.displayName,
    avatarUrl: r.avatarUrl,
    reason: "검색 결과",
  }));
}

export async function searchTags(q: string) {
  return apiFetch<{ tag: string; posts: number }[]>(`/search/tags?q=${encodeURIComponent(q)}`);
}

export async function patchMe(body: Partial<{ username: string; email: string; display_name: string; bio: string; website: string }>) {
  return apiFetch<UserMeResponse>("/users/me", { method: "PATCH", json: body });
}

export async function uploadAvatar(file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<UserMeResponse>("/users/me/avatar", { method: "POST", form });
}

export async function changePassword(current_password: string, new_password: string) {
  return apiFetch<void>("/users/me/password", { method: "POST", json: { current_password, new_password } });
}

export type PrivacyResponse = { is_private: boolean; show_activity_status: boolean; allow_tags: boolean };

export async function fetchPrivacy(): Promise<PrivacyResponse> {
  return apiFetch("/users/me/privacy");
}

export async function patchPrivacy(body: Partial<{ is_private: boolean; show_activity_status: boolean; allow_tags: boolean }>) {
  return apiFetch<PrivacyResponse>("/users/me/privacy", { method: "PATCH", json: body });
}

export type SecurityResponse = { two_factor_enabled: boolean; login_alerts_enabled: boolean };

export async function fetchSecurity(): Promise<SecurityResponse> {
  return apiFetch("/users/me/security");
}

export async function patchSecurity(body: Partial<{ two_factor_enabled: boolean; login_alerts_enabled: boolean }>) {
  return apiFetch<SecurityResponse>("/users/me/security", { method: "PATCH", json: body });
}

export type SessionRow = { id: string; label: string; meta: string; is_current: boolean };

export async function fetchSessions(): Promise<SessionRow[]> {
  return apiFetch("/users/me/sessions");
}

export async function deleteSession(sessionId: string) {
  return apiFetch<void>(`/users/me/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
}

export async function fetchBlocks(): Promise<BlockedUser[]> {
  return apiFetch("/users/me/blocks");
}

export async function blockUser(blockedUserId: number) {
  return apiFetch<BlockedUser>("/users/me/blocks", { method: "POST", json: { blocked_user_id: blockedUserId } });
}

export async function unblockUser(userId: number) {
  return apiFetch<void>(`/users/me/blocks/${userId}`, { method: "DELETE" });
}

export type NotifSettings = {
  pushLike: boolean;
  pushComment: boolean;
  pushFollow: boolean;
  pushMention: boolean;
  pushDirect: boolean;
  emailDigest: boolean;
};

export async function fetchNotificationSettings(): Promise<NotifSettings> {
  return apiFetch("/users/me/notification-settings");
}

export async function patchNotificationSettings(body: Partial<NotifSettings>) {
  const json: Record<string, boolean> = {};
  if (body.pushLike !== undefined) json.push_like = body.pushLike;
  if (body.pushComment !== undefined) json.push_comment = body.pushComment;
  if (body.pushFollow !== undefined) json.push_follow = body.pushFollow;
  if (body.pushMention !== undefined) json.push_mention = body.pushMention;
  if (body.pushDirect !== undefined) json.push_direct = body.pushDirect;
  if (body.emailDigest !== undefined) json.email_digest = body.emailDigest;
  return apiFetch<NotifSettings>("/users/me/notification-settings", { method: "PATCH", json });
}
