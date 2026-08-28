import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketingPage } from "@/components/site/marketing-page";
import { routing } from "@/i18n/routing";

const NS = "pages.about";

/**
 * 히어로 이미지 — public/about/hero.jpg 를 같은 파일명으로 덮어쓰면
 * 코드 수정 없이 교체됩니다. 출처와 주의사항은 public/about/CREDITS.md 참고.
 */
const HERO_IMAGE = "/about/hero.jpg";

/** 「이런 고객과 일합니다」 목록 옆 이미지 */
const CUSTOMERS_IMAGE = "/about/customers.jpg";

/** 대표 약력 옆 인물 이미지 (3:4) */
const FOUNDER_IMAGE = "/about/founder.png";

export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/about">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: NS });
  const title = t("title").replace(/\n/g, " ");
  return {
    title,
    description: t("description"),
    alternates: { canonical: `/${locale}/about` },
  };
}

export default async function Page(props: PageProps<"/[locale]/about">) {
  const { locale } = await props.params;
  return (
    <MarketingPage
      locale={locale}
      ns={NS}
      heroImage={HERO_IMAGE}
      bulletsImage={CUSTOMERS_IMAGE}
      founderImage={FOUNDER_IMAGE}
    />
  );
}
