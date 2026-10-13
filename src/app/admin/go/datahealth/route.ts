import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import {
  datahealthPublicUrl,
  datahealthSsoUrl,
  pushCustomerToDatahealth,
  pushInquiryToDatahealth,
} from "@/lib/datahealth";

// 요청마다 새 1회용 토큰을 만들어야 하므로 캐시하지 않습니다
export const dynamic = "force-dynamic";

/**
 * 견적·원가 시스템으로 이동. 로그인된 관리자면 자동 로그인 주소로,
 * 연동 설정이 없으면 그쪽 로그인 화면으로 보냅니다.
 * (/admin 아래라 세션 확인은 proxy.ts 가 먼저 합니다)
 *
 * ?inquiry=<문의 ID> 가 붙으면 「견적서 만들기」입니다 — 그 문의와 고객 정보를 넘긴 뒤
 * 견적서 작성 화면으로 보냅니다.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  const inquiryId = request.nextUrl.searchParams.get("inquiry");

  let next = "/";
  if (inquiryId && /^[a-z0-9]+$/i.test(inquiryId) && session) {
    // 문의가 아직 안 넘어갔을 수 있어 먼저 넘기고(이미 있으면 그대로 둡니다), 그다음 고객 정보를 붙입니다
    await pushInquiryToDatahealth(inquiryId);
    await pushCustomerToDatahealth(inquiryId);
    next = `/quotation/simple/new?inquiry=${inquiryId}`;
  }

  // 원가가 걸린 시스템이라 관리자만 자동으로 넘깁니다. 나머지는 그쪽에서 직접 로그인합니다.
  const url = session?.role === "ADMIN" ? datahealthSsoUrl(session, next) : null;
  return NextResponse.redirect(url ?? `${datahealthPublicUrl()}/login?next=${encodeURIComponent(next)}`);
}
