import { timingSafeEqual } from "node:crypto";
import { after, NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { exchangeCode } from "@/lib/gmail";
import { syncMail } from "@/lib/mail-sync";
import { prisma } from "@/lib/prisma";
import { MAIL_OAUTH_COOKIE } from "../cookie";

export const dynamic = "force-dynamic";

const mailPage = (error?: string) =>
  `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin/mail${error ? `?error=${error}` : ""}`;

function sameState(a: string | null, b: string | undefined) {
  if (!a || !b) return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Google 동의 화면에서 돌아오는 곳. 계정을 저장하고 첫 동기화를 시작합니다 */
export async function GET(request: NextRequest) {
  await requireSession(["ADMIN"]);

  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const validState = sameState(
    params.get("state"),
    request.cookies.get(MAIL_OAUTH_COOKIE)?.value,
  );

  let target = mailPage("connect");
  if (validState && code) {
    try {
      const { email, refreshToken } = await exchangeCode(code);
      const account = {
        email,
        refreshToken,
        syncCursor: null,
        lastError: null,
        lockedUntil: null,
        connectedAt: new Date(),
      };
      await prisma.mailAccount.upsert({
        where: { id: "gmail" },
        create: account,
        update: account,
      });
      after(() => syncMail());
      target = mailPage();
    } catch (error) {
      console.error("[gmail] 연결 실패", error);
    }
  }

  const response = NextResponse.redirect(target);
  response.cookies.delete({ name: MAIL_OAUTH_COOKIE, path: "/admin/mail/oauth" });
  return response;
}
