import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CurrentUser } from "@/data/types";
import { ApiError, getStoredToken, setStoredToken } from "@/api/client";
import { fetchMe, loginApi, mapAuthUser, mapUserMe, registerApi } from "@/api/endpoints";

type RegisterInput = {
  email: string;
  username: string;
  password: string;
  displayName?: string;
};

type AuthContextValue = {
  user: CurrentUser | null;
  /** 초기 세션 복원·`/users/me` 조회 완료 전에는 false */
  ready: boolean;
  /** @returns 로그인 성공 여부 */
  login: (loginId: string, password: string) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<{ ok: true } | { ok: false; message: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(async () => {
    if (!getStoredToken()) {
      setUser(null);
      return;
    }
    const me = await fetchMe();
    setUser(mapUserMe(me));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getStoredToken()) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        await refreshUser();
      } catch {
        setStoredToken(null);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const login = useCallback(async (loginId: string, password: string) => {
    try {
      const r = await loginApi(loginId.trim(), password);
      setStoredToken(r.access_token);
      setUser(mapAuthUser(r.user));
      return true;
    } catch {
      return false;
    }
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    try {
      const r = await registerApi({
        email: input.email.trim().toLowerCase(),
        username: input.username.trim(),
        password: input.password,
        display_name: input.displayName?.trim() || input.username.trim(),
      });
      setStoredToken(r.access_token);
      setUser(mapAuthUser(r.user));
      return { ok: true as const };
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "가입에 실패했습니다.";
      return { ok: false as const, message: msg };
    }
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, logout, refreshUser }),
    [user, ready, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
