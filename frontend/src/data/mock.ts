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
} from "./types";
import { TEST_USER } from "./testCredentials";

export const MOCK_CURRENT_USER: CurrentUser = TEST_USER;

export const MOCK_STORIES: StoryUser[] = [
  {
    id: "s0",
    username: "내 스토리",
    displayName: "내 스토리",
    avatarUrl: "https://i.pravatar.cc/150?u=test@gmail.com",
    hasUnseen: false,
    isOwn: true,
  },
  {
    id: "s1",
    username: "travel_kr",
    displayName: "Travel Korea",
    avatarUrl: "https://i.pravatar.cc/150?u=1",
    hasUnseen: true,
  },
  {
    id: "s2",
    username: "film_daily",
    displayName: "Film Daily",
    avatarUrl: "https://i.pravatar.cc/150?u=2",
    hasUnseen: true,
  },
  {
    id: "s3",
    username: "design_lab",
    displayName: "Design Lab",
    avatarUrl: "https://i.pravatar.cc/150?u=3",
    hasUnseen: false,
  },
  {
    id: "s4",
    username: "coffee_holic",
    displayName: "Coffee Holic",
    avatarUrl: "https://i.pravatar.cc/150?u=4",
    hasUnseen: true,
  },
  {
    id: "s5",
    username: "minimal.home",
    displayName: "Minimal Home",
    avatarUrl: "https://i.pravatar.cc/150?u=5",
    hasUnseen: false,
  },
];

const c = (partial: Omit<Comment, "id"> & { id: string }): Comment => partial;

export const MOCK_POSTS: Post[] = [
  {
    id: "101",
    username: "travel_kr",
    displayName: "Travel Korea",
    avatarUrl: "https://i.pravatar.cc/150?u=1",
    imageUrl: "https://picsum.photos/seed/ig1/1080/1080",
    caption: "주말 드라이브 🚗 #한강 #서울",
    likes: 1240,
    comments: [
      c({ id: "c1", username: "film_daily", body: "분위기 최고예요!", timeAgo: "12분", likes: 4 }),
      c({ id: "c2", username: "test_user", body: "좋아요 눌렀어요 ✨", timeAgo: "1시간", likes: 1 }),
    ],
    timeAgo: "3시간",
    location: "Seoul, Korea",
  },
  {
    id: "102",
    username: "design_lab",
    displayName: "Design Lab",
    avatarUrl: "https://i.pravatar.cc/150?u=3",
    imageUrl: "https://picsum.photos/seed/ig2/1080/1080",
    caption: "Grid & rhythm — 레이아웃 스터디",
    likes: 892,
    comments: [
      c({ id: "c3", username: "coffee_holic", body: "깔끔해요", timeAgo: "45분", likes: 2 }),
    ],
    timeAgo: "6시간",
  },
  {
    id: "103",
    username: "coffee_holic",
    displayName: "Coffee Holic",
    avatarUrl: "https://i.pravatar.cc/150?u=4",
    imageUrl: "https://picsum.photos/seed/ig3/1080/1080",
    caption: "오늘의 라떼 아트 ☕️",
    likes: 2103,
    comments: [],
    timeAgo: "1일",
  },
];

export const MOCK_SUGGESTIONS: SuggestionUser[] = [
  {
    id: "u1",
    username: "art_archive",
    displayName: "Art Archive",
    avatarUrl: "https://i.pravatar.cc/150?u=10",
    reason: "회원님을 위한 추천",
  },
  {
    id: "u2",
    username: "photo_walk",
    displayName: "Photo Walk",
    avatarUrl: "https://i.pravatar.cc/150?u=11",
    reason: "회원님을 위한 추천",
  },
  {
    id: "u3",
    username: "urban_views",
    displayName: "Urban Views",
    avatarUrl: "https://i.pravatar.cc/150?u=12",
    reason: "팔로우하는 사람이 팔로우함",
  },
];

export const MOCK_EXPLORE: { id: string; imageUrl: string }[] = Array.from({ length: 18 }, (_, i) => ({
  id: `ex-${i}`,
  imageUrl: `https://picsum.photos/seed/ex${i}/400/400`,
}));

export const MOCK_THREADS: ThreadPreview[] = [
  {
    id: "t1",
    username: "travel_kr",
    displayName: "Travel Korea",
    avatarUrl: "https://i.pravatar.cc/150?u=1",
    lastMessage: "다음 주에 같이 가요!",
    timeLabel: "방금",
    unread: true,
  },
  {
    id: "t2",
    username: "design_lab",
    displayName: "Design Lab",
    avatarUrl: "https://i.pravatar.cc/150?u=3",
    lastMessage: "피그마 파일 보냈어요",
    timeLabel: "어제",
    unread: false,
  },
  {
    id: "t3",
    username: "film_daily",
    displayName: "Film Daily",
    avatarUrl: "https://i.pravatar.cc/150?u=2",
    lastMessage: "좋아요",
    timeLabel: "3일",
    unread: false,
  },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  t1: [
    { id: "m1", fromMe: false, body: "사진 너무 예뻐요!", time: "오전 9:12" },
    { id: "m2", fromMe: true, body: "감사합니다 🙏", time: "오전 9:14" },
    { id: "m3", fromMe: false, body: "다음 주에 같이 가요!", time: "오전 9:20" },
  ],
  t2: [
    { id: "m4", fromMe: false, body: "안녕하세요!", time: "어제" },
    { id: "m5", fromMe: true, body: "네 안녕하세요", time: "어제" },
    { id: "m6", fromMe: false, body: "피그마 파일 보냈어요", time: "어제" },
  ],
  t3: [{ id: "m7", fromMe: false, body: "좋아요", time: "3일 전" }],
};

export const MOCK_BLOCKED_USERS: BlockedUser[] = [
  {
    id: "blk1",
    username: "spam_promo",
    displayName: "이벤트 당첨 안내",
    avatarUrl: "https://i.pravatar.cc/150?u=blk1",
  },
  {
    id: "blk2",
    username: "unknown_bot",
    displayName: "알 수 없음",
    avatarUrl: "https://i.pravatar.cc/150?u=blk2",
  },
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    type: "like",
    actorUsername: "travel_kr",
    actorAvatar: "https://i.pravatar.cc/150?u=1",
    text: "회원님의 게시물을 좋아합니다.",
    timeAgo: "5분",
    thumbnailUrl: "https://picsum.photos/seed/n1/44/44",
    isRead: false,
  },
  {
    id: "n2",
    type: "follow",
    actorUsername: "art_archive",
    actorAvatar: "https://i.pravatar.cc/150?u=10",
    text: "회원님을 팔로우하기 시작했습니다.",
    timeAgo: "1시간",
    isRead: false,
  },
  {
    id: "n3",
    type: "comment",
    actorUsername: "design_lab",
    actorAvatar: "https://i.pravatar.cc/150?u=3",
    text: "댓글을 남겼습니다: 깔끔해요",
    timeAgo: "어제",
    thumbnailUrl: "https://picsum.photos/seed/n3/44/44",
    isRead: true,
  },
];

export function getPostById(id: string): Post | undefined {
  return MOCK_POSTS.find((p) => p.id === id);
}

export function getProfilePosts(username: string): Post[] {
  if (username === MOCK_CURRENT_USER.username) {
    return [MOCK_POSTS[1]!, MOCK_POSTS[2]!].filter(Boolean);
  }
  return MOCK_POSTS.filter((p) => p.username === username);
}

export function getUserByUsername(username: string, loggedInAs: string | null): {
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  posts: number;
  followers: number;
  following: number;
  isFollowing: boolean;
  isOwn: boolean;
} | null {
  if (username === MOCK_CURRENT_USER.username) {
    const isOwn = loggedInAs !== null && username === loggedInAs;
    return {
      ...MOCK_CURRENT_USER,
      bio: MOCK_CURRENT_USER.bio ?? "",
      posts: 12,
      followers: 328,
      following: 180,
      isFollowing: false,
      isOwn,
    };
  }
  const post = MOCK_POSTS.find((p) => p.username === username);
  if (!post) return null;
  return {
    username: post.username,
    displayName: post.displayName,
    avatarUrl: post.avatarUrl,
    bio: `${post.displayName}의 프로필입니다.`,
    posts: MOCK_POSTS.filter((p) => p.username === username).length,
    followers: 1200 + username.length * 17,
    following: 340,
    isFollowing: false,
    isOwn: false,
  };
}
