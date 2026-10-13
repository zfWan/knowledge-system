import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/lib/auth-api';

export default function AppLayout() {
  const { user, refreshToken, clearTokens } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [toast, setToast] = useState('');

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout(refreshToken ?? undefined);
    } catch {
      // 忽略接口错误
    } finally {
      clearTokens();
      setToast('您已安全退出');
      setTimeout(() => setToast(''), 2000);
      navigate('/login', { replace: true });
    }
  };

  const initial = user?.nickname?.[0] || 'U';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="border-b bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link to="/workbench" className="flex items-center gap-2">
          <span className="inline-block w-6 h-6 rounded bg-brand" />
          <h1 className="font-semibold text-lg text-slate-800">个人知识库</h1>
        </Link>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 text-sm text-slate-700 hover:text-brand"
          >
            <span className="w-8 h-8 rounded-full bg-brand-50 text-brand flex items-center justify-center font-medium">
              {initial}
            </span>
            <span className="hidden sm:inline">{user?.nickname}</span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-md py-1 text-sm">
                <div className="px-3 py-2 text-slate-500 text-xs border-b">
                  {user?.email || user?.phone}
                </div>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 disabled:opacity-50"
                >
                  {loggingOut ? '退出中...' : '退出登录'}
                </button>
              </div>
            </>
          )}
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm px-4 py-2 rounded-md shadow">
          {toast}
        </div>
      )}
    </div>
  );
}
