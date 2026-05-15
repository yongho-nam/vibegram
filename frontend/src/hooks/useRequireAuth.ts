import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/** 로그인이 필요하면 `/login`으로 보내고 `false`, 이미 로그인이면 `true` */
export function useRequireAuth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const ensureLoggedIn = useCallback(() => {
    if (user) return true;
    const from = `${location.pathname}${location.search}`;
    navigate("/login", { state: { from } });
    return false;
  }, [user, navigate, location.pathname, location.search]);

  return { user, ensureLoggedIn };
}
