import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { register, safeReturnTo } from '@/lib/auth';

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)[\s\S]{8,64}$/;

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const returnTo = safeReturnTo(params.get('returnTo'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string>('');
  const [toast, setToast] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = PASSWORD_RE.test(password);
  const confirmValid = confirm.length > 0 && confirm === password;
  const canSubmit = emailValid && passwordValid && confirmValid && !loading;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      const resp = await register(email.trim(), password);
      if (resp.code === 0) {
        setToast('注册成功，欢迎使用');
        setTimeout(() => navigate(returnTo, { replace: true }), 800);
      } else {
        setError(resp.message || '注册失败');
      }
    } catch (err: any) {
      setError(err?.message || '网络异常，请稍后再试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 px-4 relative">
      {toast && (
        <div className="absolute -top-10 left-0 right-0 text-center">
          <span className="inline-block px-3 py-1 text-sm rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
            {toast}
          </span>
        </div>
      )}
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-1">创建账号</h2>
        <p className="text-sm text-slate-500 mb-4">注册后自动进入你的知识库</p>
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
                autoComplete="new-password"
                placeholder="8-64 位，包含字母和数字"
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
            {password.length > 0 && !passwordValid && (
              <p className="mt-1 text-xs text-red-500">密码需至少 8 位，且包含字母和数字</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">确认密码</label>
            <input
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="请再次输入密码"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-brand"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {confirm.length > 0 && !confirmValid && (
              <p className="mt-1 text-xs text-red-500">两次输入的密码不一致</p>
            )}
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full rounded py-2 text-sm text-white transition ${
              canSubmit ? 'bg-brand hover:bg-brand-600' : 'bg-brand opacity-60 cursor-not-allowed'
            }`}
          >
            {loading ? '注册中…' : '注册并登录'}
          </button>
        </form>
        <div className="mt-4 text-sm text-slate-500 text-center">
          已有账号？
          <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="text-brand hover:underline ml-1">
            去登录
          </Link>
        </div>
      </div>
    </div>
  );
}
