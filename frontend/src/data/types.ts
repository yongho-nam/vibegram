export type CurrentUser = {
  id: string;
  username: string;
  /** 로그인 식별용 (목업) */
  email?: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  website?: string;
  /** 서버에서만 true, 관리자 콘솔 접근 */
  isAdmin?: boolean;
};

export type StoryUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  hasUnseen: boolean;
  isOwn?: boolean;
};

export type Comment = {
  id: string;
  username: string;
  avatarUrl?: string;
  body: string;
  timeAgo: string;
  likes: number;
};

export type Post = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: Comment[];
  timeAgo: string;
  location?: string;
  isLiked?: boolean;
  isSaved?: boolean;
  /** 현재 로그인 사용자가 작성한 게시물 */
  isOwn?: boolean;
};

export type SuggestionUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  reason: string;
};

export type ThreadPreview = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  lastMessage: string;
  timeLabel: string;
  unread: boolean;
  isVerified?: boolean;
};

export type Message = {
  id: string;
  fromMe: boolean;
  body: string;
  time: string;
};

export type NotificationItem = {
  id: string;
  type: string;
  actorUsername: string;
  actorAvatar: string;
  text: string;
  timeAgo: string;
  thumbnailUrl?: string;
  isRead: boolean;
};

export type BlockedUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
};
