import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { Role } from "@/generated/prisma/enums";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  type SessionUser,
  signSession,
  verifySession,
} from "@/lib/session";

export { SESSION_COOKIE, type SessionUser };

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function createSessionCookie(user: SessionUser) {
  const token = await signSession(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** 서버 액션·페이지 진입 시 권한 확인. 실패하면 throw */
export async function requireSession(roles?: Role[]) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (roles && !roles.includes(session.role)) throw new Error("FORBIDDEN");
  return session;
}
