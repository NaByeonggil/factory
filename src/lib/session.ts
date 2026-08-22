import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/generated/prisma/enums";

export const SESSION_COOKIE = "fastlab_admin";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8시간

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error("AUTH_SECRET 환경변수가 없거나 너무 짧습니다 (32바이트 권장).");
  }
  return new TextEncoder().encode(value);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}
