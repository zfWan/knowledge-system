import { Injectable } from '@nestjs/common';

/**
 * Access Token 内存黑名单：以 jti 为 key，TTL = access 自然过期剩余时间。
 * 服务重启后丢失（≤2h 窗口），这是已知 trade-off（见架构 §D10）。
 */
@Injectable()
export class TokenBlacklist {
  private store = new Map<string, number>(); // jti -> expiresAt(ms)

  add(jti: string, expiresAtMs: number) {
    this.store.set(jti, expiresAtMs);
    this.sweep();
  }

  has(jti: string): boolean {
    const exp = this.store.get(jti);
    if (exp === undefined) return false;
    if (Date.now() >= exp) {
      this.store.delete(jti);
      return false;
    }
    return true;
  }

  private sweep() {
    const now = Date.now();
    for (const [k, v] of this.store) {
      if (now >= v) this.store.delete(k);
    }
  }
}
