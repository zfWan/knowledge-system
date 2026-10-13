import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/lib/auth-api';
import SmsButton from '@/components/SmsButton';

type TabType = 'email' | 'phone';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^1[3-9]\d{9}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,64}$/;

export default function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/workbench';
  const { accessToken, setTokens } = useAuthStore();
  const [tab, setTab] = useState<TabType>('email');

  // 邮箱注册
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // 手机号注册
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [pPassword, setPPassword] = useState('');
  const [pShowPwd, setPShowPwd] = useState(false);
  const [pRememberMe, setPRememberMe] = useState(false);

  const [error, setError] = useState('');
  const [smsError, setSmsError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (accessToken) navigate('/workbench', { replace: true });
  }, [accessToken, navigate]);

  const onSubmitEmail = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_REGEX.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setError('密码至少 8 位，且包含字母和数字');
      return;
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致');
      return;
    }
    setSubmitting(true);
    try {
      const resp = await authApi.registerByEmail(email.trim().toLowerCase(), password, confirm, rememberMe);
      if (resp.code === 0 && resp.data) {
        setTokens(resp.data.accessToken, resp.data.refreshToken, resp.data.user);
        navigate(redirect, { replace: true });
      } else {
        setError(resp.message || '注册失败');
      }
    } catch {
      setError('网络异常，请检查后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitPhone = async (e: FormEvent) => {
    e.preventDefault();
    setSmsError('');
    if (!PHONE_REGEX.test(phone)) {
      setSmsError('请输入有效的 11 位手机号');
      return;
    }
    if (!/^\d{6}$/.test(smsCode)) {
      setSmsError('请输入 6 位验证码');
      return;
    }
    if (!PASSWORD_REGEX.test(pPassword)) {
      setSmsError('密码至少 8 位，且包含字母和数字');
      return;
    }
    setSubmitting(true);
    try {
      const resp = await authApi.registerByPhone(phone, smsCode, pPassword, pRememberMe);
      if (resp.code === 0 && resp.data) {
        setTokens(resp.data.accessToken, resp.data.refreshToken, resp.data.user);
        navigate(redirect, { replace: true });
      } else {
        setSmsError(resp.message || '注册失败');
      }
    } catch {
      setSmsError('网络异常，请检查后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const emailValid =
    EMAIL_REGEX.test(email) &&
    PASSWORD_REGEX.test(password) &&
    password === confirm &&
    password.length > 0 &&
    !submitting;
  const phoneValid =
    PHONE_REGEX.test(phone) && /^\d{6}$/.test(smsCode) && PASSWORD_REGEX.test(pPassword) && !submitting;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-semibold text-slate-800 text-center mb-1">
          创建您的知识库账号
        </h1>
        <p className="text-center text-sm text-slate-500 mb-6">注册后即可开始使用个人知识库</p>

        <div className="flex border-b border-slate-200 mb-5">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === 'email'
                ? 'text-brand border-b-2 border-brand'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setTab('email')}
          >
            邮箱注册
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === 'phone'
                ? 'text-brand border-b-2 border-brand'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setTab('phone')}
          >
            手机号注册
          </button>
        </div>

        {tab === 'email' ? (
          <form onSubmit={onSubmitEmail} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm"
                autoComplete="email"
              />
            </div>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码（至少8位，含字母和数字）"
                className="w-full h-10 px-3 pr-10 rounded-md border border-slate-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-2"
                tabIndex={-1}
              >
                {showPwd ? '隐藏' : '显示'}
              </button>
            </div>
            <div>
              <input
                type={showPwd ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="请再次输入密码"
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm"
                autoComplete="new-password"
              />
            </div>
            <div className="flex items-center text-sm">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-brand"
                />
                记住我（30 天免登录）
              </label>
            </div>
            {error && (
              <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={!emailValid}
              className={`w-full h-10 rounded-md text-white text-sm font-medium transition-colors ${
                emailValid ? 'bg-brand hover:bg-brand-600' : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {submitting ? '注册中...' : '注册并登录'}
            </button>
          </form>
        ) : (
          <form onSubmit={onSubmitPhone} className="space-y-4">
            <div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="请输入手机号"
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm"
                autoComplete="tel"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="请输入 6 位验证码"
                className="flex-1 h-10 px-3 rounded-md border border-slate-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm tracking-widest"
                inputMode="numeric"
              />
              <SmsButton phone={phone} scene="register" onError={setSmsError} />
            </div>
            <div className="relative">
              <input
                type={pShowPwd ? 'text' : 'password'}
                value={pPassword}
                onChange={(e) => setPPassword(e.target.value)}
                placeholder="请输入密码（至少8位，含字母和数字）"
                className="w-full h-10 px-3 pr-10 rounded-md border border-slate-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setPShowPwd((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-2"
                tabIndex={-1}
              >
                {pShowPwd ? '隐藏' : '显示'}
              </button>
            </div>
            <div className="flex items-center text-sm">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pRememberMe}
                  onChange={(e) => setPRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-brand"
                />
                记住我（30 天免登录）
              </label>
            </div>
            {smsError && (
              <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2">
                {smsError}
              </div>
            )}
            <button
              type="submit"
              disabled={!phoneValid}
              className={`w-full h-10 rounded-md text-white text-sm font-medium transition-colors ${
                phoneValid ? 'bg-brand hover:bg-brand-600' : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {submitting ? '注册中...' : '注册并登录'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-500">
          已有账号？
          <Link to="/login" className="text-brand hover:underline ml-1">
            立即登录
          </Link>
        </div>
      </div>
    </div>
  );
}
