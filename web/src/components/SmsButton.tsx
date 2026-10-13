import { useState, useEffect } from 'react';
import { authApi } from '@/lib/auth-api';

const PHONE_REGEX = /^1[3-9]\d{9}$/;

interface Props {
  phone: string;
  scene: 'register' | 'login';
  onError: (msg: string) => void;
}

export default function SmsButton({ phone, scene, onError }: Props) {
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const disabled = cooldown > 0 || sending || !PHONE_REGEX.test(phone);

  const handleSend = async () => {
    onError('');
    setSending(true);
    try {
      const resp = await authApi.sendSms(phone, scene);
      if (resp.code === 0 && resp.data) {
        setCooldown(resp.data.cooldown);
      } else {
        onError(resp.message || '验证码发送失败');
        if (resp.data?.cooldown) setCooldown(resp.data.cooldown);
      }
    } catch {
      onError('网络异常，请检查后重试');
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleSend}
      className={`whitespace-nowrap px-3 h-10 rounded-md text-sm border transition-colors ${
        disabled
          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
          : 'bg-white text-brand border-brand hover:bg-brand-50'
      }`}
    >
      {cooldown > 0 ? `${cooldown}s 后重发` : sending ? '发送中...' : '获取验证码'}
    </button>
  );
}
