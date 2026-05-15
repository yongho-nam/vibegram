import type { CurrentUser } from "@/data/types";

/** QA용 고정 계정 (모든 보호 페이지 확인용) */
export const TEST_CREDENTIALS = {
  email: "test@gmail.com",
  password: "12345",
} as const;

export const TEST_USER: CurrentUser = {
  id: "user-test",
  username: "test_user",
  email: TEST_CREDENTIALS.email,
  displayName: "테스트 사용자",
  avatarUrl: "https://i.pravatar.cc/150?u=test@gmail.com",
  bio: "테스트 계정입니다. (test@gmail.com / 12345)",
};

/**
 * 로그인 필드: 이메일 또는 사용자 이름 + 비밀번호
 * @returns 성공 시 사용자, 실패 시 null
 */
export function authenticateTestUser(loginId: string, password: string): CurrentUser | null {
  const id = loginId.trim().toLowerCase();
  const pw = password;
  if (pw !== TEST_CREDENTIALS.password) return null;
  if (id === TEST_CREDENTIALS.email.toLowerCase() || id === TEST_USER.username.toLowerCase()) {
    return TEST_USER;
  }
  return null;
}
