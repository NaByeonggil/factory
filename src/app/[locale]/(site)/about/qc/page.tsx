import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketingPage } from "@/components/site/marketing-page";
import { routing } from "@/i18n/routing";

const NS = "pages.qc";

/**
 * 히어로 이미지 — public/about/qc-hero.jpg 를 같은 파일명으로 덮어쓰면
 * 코드 수정 없이 교체됩니다. 출처는 public/about/CREDITS.md 참고.
 */
const HERO_IMAGE = "/about/qc-hero.jpg";

export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/about/qc">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: NS });
  const title = t("title").replace(/\n/g, " ");
  return {
    title,
    description: t("description"),
    alternates: { canonical: `/${locale}/about/qc` },
  };
}

export default async function Page(props: PageProps<"/[locale]/about/qc">) {
  const { locale } = await props.params;
  return <MarketingPage locale={locale} ns={NS} heroImage={HERO_IMAGE} />;
}
