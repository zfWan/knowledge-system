/**
 * 极简 TTL 解析器：支持 "2h" / "30m" / "24h" / "7d" / "30d" / "1500"（毫秒）/ "1500ms" / "90s"。
 * 不引入 ms 包，返回毫秒数。仅为本项目 JWT / 限流配置使用。
 */
export function parseTtl(input: string | number): number {
  if (typeof input === 'number') return input;
  if (typeof input !== 'string') throw new Error(`invalid ttl: ${String(input)}`);
  const s = input.trim();
  if (!s) throw new Error('empty ttl');
  const m = s.match(/^(\d+)\s*(ms|s|m|h|d)?$/);
  if (!m) throw new Error(`invalid ttl format: ${input}`);
  const n = parseInt(m[1], 10);
  const unit = m[2] || 'ms';
  switch (unit) {
    case 'ms':
      return n;
    case 's':
      return n * 1000;
    case 'm':
      return n * 60_000;
    case 'h':
      return n * 3_600_000;
    case 'd':
      return n * 86_400_000;
    default:
      throw new Error(`unknown ttl unit: ${unit}`);
  }
}

export function ttlToSeconds(input: string | number): number {
  return Math.floor(parseTtl(input) / 1000);
}
