import { useEffect, useState, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { request } from '@/lib/request';
import type { User } from '@/types';

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { accessToken, user, setUser, clearTokens, hydrate } = useAuthStore();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!useAuthStore.getState().accessToken) {
        setChecking(false);
        return;
      }
      try {
        const resp = await request<User>('/users/me');
        if (!cancelled) {
          if (resp.code === 0 && resp.data) {
            setUser(resp.data);
          } else {
            clearTokens();
          }
        }
      } catch {
        if (!cancelled) clearTokens();
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    check();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        加载中...
      </div>
    );
  }
  if (!accessToken || !user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return <>{children}</>;
}
