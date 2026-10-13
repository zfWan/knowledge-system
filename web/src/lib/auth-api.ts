import { request } from './request';
import type { TokenPair, User } from '@/types';

export const authApi = {
  registerByEmail: (email: string, password: string, confirmPassword: string, rememberMe: boolean) =>
    request<TokenPair>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ type: 'email', email, password, confirmPassword, rememberMe }),
    }),
  registerByPhone: (phone: string, smsCode: string, password: string, rememberMe: boolean) =>
    request<TokenPair>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ type: 'phone', phone, smsCode, password, rememberMe }),
    }),
  login: (account: string, password: string, rememberMe: boolean) =>
    request<TokenPair>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ account, password, rememberMe }),
    }),
  loginBySms: (phone: string, smsCode: string, rememberMe: boolean) =>
    request<TokenPair>('/auth/login/sms', {
      method: 'POST',
      body: JSON.stringify({ phone, smsCode, rememberMe }),
    }),
  sendSms: (phone: string, scene: 'register' | 'login') =>
    request<{ expiresIn: number; cooldown: number }>('/auth/sms/send', {
      method: 'POST',
      body: JSON.stringify({ phone, scene }),
    }),
  logout: (refreshToken?: string) =>
    request<null>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
  me: () => request<User>('/users/me'),
};
