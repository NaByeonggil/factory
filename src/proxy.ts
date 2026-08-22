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
  /**
   * 제외 대상: api · 내부 경로 · 확장자가 있는 파일
   * 그리고 Next 메타데이터 라우트(apple-icon, opengraph-image 등).
   *
   * 메타데이터 라우트는 확장자가 없어서 그냥 두면 로케일 라우팅이
   * /ko/apple-icon 으로 리다이렉트해버립니다(브라우저는 아이콘을 못 받음).
   */
  matcher: [
    "/((?!api|_next|_vercel|icon|apple-icon|opengraph-image|twitter-image|manifest|.*\\..*).*)",
  ],
};
