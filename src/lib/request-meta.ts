import { createHash } from "node:crypto";
import { headers } from "next/headers";

/** 개인정보 최소수집: IP 원문 대신 솔트 해시만 보관 */
export function hashIp(ip: string | null) {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT ?? "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function getRequestMeta() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  return {
    ip,
    ipHash: hashIp(ip),
    userAgent: h.get("user-agent")?.slice(0, 512) ?? null,
  };
}
