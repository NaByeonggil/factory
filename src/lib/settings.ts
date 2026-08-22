import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { CompanyInfo } from "@/components/site/footer";

/** DB(SiteSetting)가 비어 있거나 연결 전이어도 사이트가 뜨도록 하는 기본값 */
export const DEFAULT_COMPANY: CompanyInfo = {
  name: "(주)패스트랩",
  ceo: "홍길동",
  bizNo: "000-00-00000",
  address: "경기도 성남시 분당구 판교로 000",
  tel: "031-000-0000",
  fax: "031-000-0001",
};

export const getCompanyInfo = cache(async (): Promise<CompanyInfo> => {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: "company" } });
    if (!row) return DEFAULT_COMPANY;
    return { ...DEFAULT_COMPANY, ...(row.value as Partial<CompanyInfo>) };
  } catch {
    // DB 미연결(초기 셋업 중)에도 페이지는 렌더링되어야 함
    return DEFAULT_COMPANY;
  }
});
