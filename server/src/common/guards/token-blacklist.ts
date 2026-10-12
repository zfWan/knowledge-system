/**
 * 进程内 access token jti 黑名单。
 * - key: jti
 * - value: 过期时间戳（ms）
 * 定期清理已过期项；进程重启后丢失（架构 D10 允许）。
 */
class TokenBlacklist {
  private items = new Map<string, number>();
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.timer = setInterval(() => this.sweep(), 60_000).unref?.();
  }

  add(jti: string, expireAtMs: number) {
    if (!jti) return;
    this.items.set(jti, expireAtMs);
  }

  has(jti: string): boolean {
    const exp = this.items.get(jti);
    if (exp === undefined) return false;
    if (exp <= Date.now()) {
      this.items.delete(jti);
      return false;
    }
    return true;
  }

  private sweep() {
    const now = Date.now();
    for (const [k, exp] of this.items) {
      if (exp <= now) this.items.delete(k);
    }
  }
}

export const tokenBlacklist = new TokenBlacklist();
