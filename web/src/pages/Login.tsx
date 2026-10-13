import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/lib/auth-api';
import SmsButton from '@/components/SmsButton';

type TabType = 'password' | 'sms';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^1[3-9]\d{9}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,64}$/;

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/workbench';
  const { accessToken, setTokens } = useAuthStore();
  const [tab, setTab] = useState<TabType>('password');

  // 密码登录
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // 验证码登录
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [rememberMeSms, setRememberMeSms] = useState(false);

  const [error, setError] = useState('');
  const [smsError, setSmsError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (accessToken) {
      navigate('/workbench', { replace: true });
    }
  }, [accessToken, navigate]);

  const validatePwd = () => {
    if (!account.trim()) return '请输入邮箱或手机号';
    if (!PASSWORD_REGEX.test(password)) return '账号或密码错误';
    return '';
  };

  const onSubmitPwd = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const msg = validatePwd();
    if (msg) {
      setError(msg);
      return;
    }
    setSubmitting(true);
    try {
      const resp = await authApi.login(account.trim(), password, rememberMe);
      if (resp.code === 0 && resp.data) {
        setTokens(resp.data.accessToken, resp.data.refreshToken, resp.data.user);
        navigate(redirect, { replace: true });
      } else {
        setError(resp.message || '登录失败');
      }
    } catch {
      setError('网络异常，请检查后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitSms = async (e: FormEvent) => {
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
    setSubmitting(true);
    try {
      const resp = await authApi.loginBySms(phone, smsCode, rememberMeSms);
      if (resp.code === 0 && resp.data) {
        setTokens(resp.data.accessToken, resp.data.refreshToken, resp.data.user);
        navigate(redirect, { replace: true });
      } else {
        setSmsError(resp.message || '登录失败');
      }
    } catch {
      setSmsError('网络异常，请检查后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const pwdValid = account.trim().length > 0 && PASSWORD_REGEX.test(password) && !submitting;
  const smsValid = PHONE_REGEX.test(phone) && /^\d{6}$/.test(smsCode) && !submitting;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-semibold text-slate-800 text-center mb-1">
          登录个人知识库
        </h1>
        <p className="text-center text-sm text-slate-500 mb-6">欢迎回来，请登录您的账号</p>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-5">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === 'password'
                ? 'text-brand border-b-2 border-brand'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setTab('password')}
          >
            密码登录
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === 'sms'
                ? 'text-brand border-b-2 border-brand'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setTab('sms')}
          >
            验证码登录
          </button>
        </div>

        {tab === 'password' ? (
          <form onSubmit={onSubmitPwd} className="space-y-4">
            <div>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="请输入邮箱或手机号"
                className="w-full h-10 px-3 rounded-md border border-slate-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm"
                autoComplete="username"
              />
            </div>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码（至少8位，含字母和数字）"
                className="w-full h-10 px-3 pr-10 rounded-md border border-slate-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm"
                autoComplete="current-password"
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
            <div className="flex items-center justify-between text-sm">
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
              disabled={!pwdValid}
              className={`w-full h-10 rounded-md text-white text-sm font-medium transition-colors ${
                pwdValid ? 'bg-brand hover:bg-brand-600' : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {submitting ? '登录中...' : '登录'}
            </button>
          </form>
        ) : (
          <form onSubmit={onSubmitSms} className="space-y-4">
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
              <SmsButton phone={phone} scene="login" onError={setSmsError} />
            </div>
            <div className="flex items-center text-sm">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMeSms}
                  onChange={(e) => setRememberMeSms(e.target.checked)}
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
            <div className="text-xs text-slate-400 bg-slate-50 rounded px-3 py-2">
              未注册手机号验证后将自动创建账号
            </div>
            <button
              type="submit"
              disabled={!smsValid}
              className={`w-full h-10 rounded-md text-white text-sm font-medium transition-colors ${
                smsValid ? 'bg-brand hover:bg-brand-600' : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {submitting ? '登录中...' : '登录'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-500">
          还没有账号？
          <Link to="/register" className="text-brand hover:underline ml-1">
            立即注册
          </Link>
        </div>
      </div>
    </div>
  );
}
