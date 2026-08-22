import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const handleI18nRouting = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 관리자 영역은 로케일 라우팅 대상이 아니며, 세션 없으면 로그인으로
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();

    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return handleI18nRouting(request);
}

export const config = {
  // api / 정적 자산 / 파일 확장자가 있는 경로는 제외
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
