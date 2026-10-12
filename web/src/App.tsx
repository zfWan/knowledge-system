import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation, NavLink } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Workbench from './pages/Workbench';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthUser, clearTokens, fetchMe, getAccessToken, getCachedUser, logout, safeReturnTo } from '@/lib/auth';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(getCachedUser());

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      if (getAccessToken()) {
        const me = await fetchMe();
        if (!cancelled) setUser(me);
      } else {
        if (!cancelled) setUser(null);
      }
    }
    sync();
    // 监听 storage 事件，多标签同步
    const onStorage = () => {
      if (!cancelled) setUser(getCachedUser());
    };
    window.addEventListener('storage', onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
    };
  }, [location.pathname]);

  async function onLogout() {
    await logout();
    const returnTo = safeReturnTo(location.pathname + location.search);
    navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
  }

  return (
    <header className="border-b bg-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="inline-block w-6 h-6 rounded bg-brand" />
        <h1 className="font-semibold text-lg">个人知识库</h1>
      </div>
      <nav className="flex items-center gap-4 text-sm text-slate-600">
        <NavLink to="/app" className={({ isActive }) => (isActive ? 'text-brand' : 'hover:text-brand')}>
          工作台
        </NavLink>
        {user ? (
          <>
            <span className="text-slate-500">你好，{user.nickname}</span>
            <button onClick={onLogout} className="hover:text-brand">退出登录</button>
          </>
        ) : (
          <Link to="/login" className="hover:text-brand">登录</Link>
        )}
      </nav>
    </header>
  );
}

/** 已登录用户访问 /login /register 时直接跳 /app */
function PublicOnly({ children }: { children: JSX.Element }) {
  const location = useLocation();
  if (getAccessToken()) {
    const params = new URLSearchParams(location.search);
    const returnTo = safeReturnTo(params.get('returnTo'));
    return <Navigate to={returnTo} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route
              path="/login"
              element={
                <PublicOnly>
                  <Login />
                </PublicOnly>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnly>
                  <Register />
                </PublicOnly>
              }
            />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Workbench />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<div className="p-8">页面不存在</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
