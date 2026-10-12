import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { fetchMe, getAccessToken, getCachedUser, safeReturnTo, AuthUser } from '@/lib/auth';

/**
 * 路由守卫：未登录跳 /login?returnTo=...；已登录尝试拉一次 /user/me 校验 access 是否有效。
 * 失败会触发 request 层的 refresh 流程；如果 refresh 也失败则会清 token 并跳登录。
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(getCachedUser());

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!getAccessToken()) {
        setChecking(false);
        return;
      }
      const me = await fetchMe();
      if (cancelled) return;
      setUser(me);
      setChecking(false);
    }
    check();
    return () => { cancelled = true; };
  }, [location.pathname]);

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400 text-sm">
        正在验证登录状态…
      </div>
    );
  }
  if (!getAccessToken() || !user) {
    const returnTo = safeReturnTo(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }
  return <>{children}</>;
}
