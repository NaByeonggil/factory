import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { gmailAuthUrl } from "@/lib/gmail";
import { MAIL_OAUTH_COOKIE } from "../cookie";

export const dynamic = "force-dynamic";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Google 동의 화면으로 보냅니다. state 는 콜백에서 쿠키와 대조합니다 */
export async function GET() {
  await requireSession(["ADMIN"]);

  const state = randomBytes(32).toString("base64url");
  const url = gmailAuthUrl(state);
  if (!url) return NextResponse.redirect(`${siteUrl()}/admin/mail`);

  const response = NextResponse.redirect(url);
  response.cookies.set(MAIL_OAUTH_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin/mail/oauth",
    maxAge: 10 * 60,
  });
  return response;
}
