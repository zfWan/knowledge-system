// 业务常量
export const ACCESS_TTL_SECONDS = 2 * 60 * 60; // 2h
export const REFRESH_TTL_DEFAULT_SECONDS = 7 * 24 * 60 * 60; // 7d
export const REFRESH_TTL_REMEMBER_SECONDS = 30 * 24 * 60 * 60; // 30d
export const SMS_CODE_TTL_SECONDS = 5 * 60; // 5min
export const SMS_SEND_COOLDOWN_MS = 60 * 1000; // 60s
export const SMS_DAILY_LIMIT = 10;
export const SMS_FAIL_MAX = 5;
export const LOGIN_FAIL_MAX = 5;
export const LOCK_DURATION_MS = 10 * 60 * 1000; // 10min
export const ARGON2_OPTIONS = {
  // argon2id 默认参数即可，P95 哈希耗时 < 200ms
  type: 2 as const, // 2 = argon2id
};
// 无密码占位 hash 的特殊标记（即注册即登录场景）：以 $argon2id$ 开头但 salt 固定、不用于校验
// 使用真正的 argon2 对一段高熵字符串预哈希一次，确保 argon2.verify 永远不匹配用户输入
// 这里采用一个固定的随机字节数组 argon2 hash，不可被任何普通密码匹配。
// 由 AuthService 初始化时生成并复用。
