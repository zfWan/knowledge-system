import { customAlphabet } from 'nanoid';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const nanoid = (prefix = '', size = 16) => {
  const gen = customAlphabet(ALPHABET, size);
  return `${prefix}${gen()}`;
};

export const newUserId = () => nanoid('user_', 16);
export const newRefreshTokenId = () => nanoid('rtk_', 16);
export const newAuditId = () => nanoid('aud_', 16);
export const newSmsCodeId = () => nanoid('sms_', 12);
export const newQuotaId = () => nanoid('qt_', 16);

// 32 字节随机值（refresh token 原文）：用 url-safe base64 风格
const TOKEN_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';
export const newRefreshToken = () => customAlphabet(TOKEN_ALPHABET, 32)();

// 6 位数字验证码
export const newSmsCode = () => {
  const gen = customAlphabet('0123456789', 6);
  return gen();
};
