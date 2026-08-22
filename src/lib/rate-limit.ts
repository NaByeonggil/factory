/**
 * 인스턴스 로컬 슬라이딩 윈도우 레이트리미터.
 * 단일 인스턴스/저트래픽 기준으로는 충분하지만, Vercel 등 다중 인스턴스
 * 환경에서 엄밀하게 막으려면 Upstash Redis 등 공유 저장소로 교체하세요.
 */
const buckets = new Map<string, number[]>();

export type RateLimitResult = { success: boolean; remaining: number };

export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 10 * 60 * 1000,
): RateLimitResult {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { success: false, remaining: 0 };
  }

  hits.push(now);
  buckets.set(key, hits);

  // 메모리 누수 방지: 가끔 만료 버킷 정리
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }

  return { success: true, remaining: limit - hits.length };
}
