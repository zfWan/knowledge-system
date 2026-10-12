import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login, safeReturnTo } from '@/lib/auth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const returnTo = safeReturnTo(params.get('returnTo'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8 && password.length <= 64;
  const canSubmit = emailValid && passwordValid && !loading;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      const resp = await login(email.trim(), password);
      if (resp.code === 0) {
        navigate(returnTo, { replace: true });
      } else {
        setError(resp.message || '登录失败');
        setPassword('');
      }
    } catch (err: any) {
      setError(err?.message || '网络异常，请稍后再试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 px-4">
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-1">欢迎回来</h2>
        <p className="text-sm text-slate-500 mb-4">登录以继续使用个人知识库</p>
        <form className="space-y-3" onSubmit={onSubmit} noValidate>
          {error && (
            <div className="text-sm rounded px-3 py-2 bg-red-50 text-red-600 border border-red-100">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-500 mb-1">邮箱</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-brand"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">密码</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="8-64 位，含字母和数字"
                className="w-full border rounded px-3 py-2 pr-14 text-sm focus:outline-none focus:border-brand"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-2"
              >
                {showPwd ? '隐藏' : '显示'}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full rounded py-2 text-sm text-white transition ${
              canSubmit ? 'bg-brand hover:bg-brand-600' : 'bg-brand opacity-60 cursor-not-allowed'
            }`}
          >
            {loading ? '登录中…' : '登录'}
          </button>
        </form>
        <div className="mt-4 text-sm text-slate-500 text-center">
          还没有账号？
          <Link to={`/register?returnTo=${encodeURIComponent(returnTo)}`} className="text-brand hover:underline ml-1">
            立即注册
          </Link>
        </div>
      </div>
    </div>
  );
}
