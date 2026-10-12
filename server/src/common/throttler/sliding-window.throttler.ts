/**
 * 内存滑窗限流器（单进程）。
 * - Map<key, number[]> 存时间戳队列；
 * - hit(key, windowMs, limit) 返回是否通过，超限返回 false；
 * - 定期清理空 key，避免内存膨胀；进程重启后计数清零（架构 D10 允许）。
 */
export class SlidingWindowThrottler {
  private buckets = new Map<string, number[]>();
  private timer: NodeJS.Timeout | null = null;

  constructor(private sweepIntervalMs = 60_000) {
    this.timer = setInterval(() => this.sweep(), sweepIntervalMs).unref?.();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  hit(key: string, windowMs: number, limit: number): { ok: boolean; remaining: number } {
    const now = Date.now();
    const windowStart = now - windowMs;
    let queue = this.buckets.get(key);
    if (!queue) {
      queue = [];
      this.buckets.set(key, queue);
    }
    // 移除窗口外的时间戳
    while (queue.length && queue[0] <= windowStart) queue.shift();
    if (queue.length >= limit) {
      return { ok: false, remaining: 0 };
    }
    queue.push(now);
    return { ok: true, remaining: limit - queue.length };
  }

  private sweep() {
    const now = Date.now();
    for (const [k, q] of this.buckets) {
      // 清理超过 2 个窗口以上没访问的队列：这里以 10 分钟为保守边界
      if (!q.length || q[q.length - 1] < now - 10 * 60_000) {
        this.buckets.delete(k);
      }
    }
  }
}

export const authThrottler = new SlidingWindowThrottler();
