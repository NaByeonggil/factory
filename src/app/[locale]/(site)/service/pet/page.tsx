import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketingPage } from "@/components/site/marketing-page";
import { routing } from "@/i18n/routing";

const NS = "pages.pet";

/**
 * 히어로 이미지 — public/pet/hero.jpg 를 같은 파일명으로 덮어쓰면
 * 코드 수정 없이 교체됩니다. 출처는 public/pet/CREDITS.md 참고.
 */
const HERO_IMAGE = "/pet/hero.jpg";

/** 생산 가능 품목 카드 이미지 — pages.pet.features 와 같은 순서입니다 */
const FEATURE_IMAGES = [
  "/pet/joint.jpg", // 관절 영양제
  "/pet/gut.jpg", // 장 건강
  "/pet/skin.jpg", // 피부·피모
  "/pet/dental.jpg", // 구강 관리
  "/pet/multi.jpg", // 종합 영양
  "/pet/treat.jpg", // 기호성 간식형
];

export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/service/pet">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: NS });
  const title = t("title").replace(/\n/g, " ");
  return {
    title,
    description: t("description"),
    alternates: { canonical: `/${locale}/service/pet` },
  };
}

export default async function Page(props: PageProps<"/[locale]/service/pet">) {
  const { locale } = await props.params;
  return (
    <MarketingPage
      locale={locale}
      ns={NS}
      heroImage={HERO_IMAGE}
      featureImages={FEATURE_IMAGES}
    />
  );
}
