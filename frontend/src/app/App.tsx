import type { ReactElement } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthLayout } from "@/layouts/AuthLayout";
import { MainLayout } from "@/layouts/MainLayout";
import { AccountBlockedPage } from "@/pages/AccountBlockedPage";
import { AccountEditPage } from "@/pages/AccountEditPage";
import { AccountNotificationSettingsPage } from "@/pages/AccountNotificationSettingsPage";
import { AccountPasswordPage } from "@/pages/AccountPasswordPage";
import { AccountPrivacyPage } from "@/pages/AccountPrivacyPage";
import { AccountSecurityPage } from "@/pages/AccountSecurityPage";
import { AccountStoryArchivePage } from "@/pages/AccountStoryArchivePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { CreatePage } from "@/pages/CreatePage";
import { DirectPage } from "@/pages/DirectPage";
import { DirectThreadPage } from "@/pages/DirectThreadPage";
import { ExplorePage } from "@/pages/ExplorePage";
import { FollowersPage, FollowingPage } from "@/pages/FollowersPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { PostDetailPage } from "@/pages/PostDetailPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SearchPage } from "@/pages/SearchPage";
import { SignupPage } from "@/pages/SignupPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { AdminUsersPage } from "@/pages/AdminUsersPage";
import { AdminPostsPage } from "@/pages/AdminPostsPage";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null;
  if (!user) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }
  return children;
}

export function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="posts" element={<AdminPostsPage />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreatePage />
            </ProtectedRoute>
          }
        />
        <Route path="/p/:postId" element={<PostDetailPage />} />
        <Route
          path="/direct"
          element={
            <ProtectedRoute>
              <DirectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/direct/t/:threadId"
          element={
            <ProtectedRoute>
              <DirectThreadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/edit"
          element={
            <ProtectedRoute>
              <AccountEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/password"
          element={
            <ProtectedRoute>
              <AccountPasswordPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/security"
          element={
            <ProtectedRoute>
              <AccountSecurityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/privacy"
          element={
            <ProtectedRoute>
              <AccountPrivacyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/blocked"
          element={
            <ProtectedRoute>
              <AccountBlockedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/notification-settings"
          element={
            <ProtectedRoute>
              <AccountNotificationSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts/story-archive"
          element={
            <ProtectedRoute>
              <AccountStoryArchivePage />
            </ProtectedRoute>
          }
        />
        <Route path="/:username/followers" element={<FollowersPage />} />
        <Route path="/:username/following" element={<FollowingPage />} />
        <Route path="/:username" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
