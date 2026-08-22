import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import { InquiryForm } from "@/components/inquiry/inquiry-form";
import { routing } from "@/i18n/routing";

/** 전환 페이지 — 광고가 직접 랜딩하므로 정적 프리렌더 */
export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/inquiry">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "inquiry" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `/${locale}/inquiry` },
  };
}

export default async function InquiryPage(
  props: PageProps<"/[locale]/inquiry">,
) {
  const { locale } = await props.params;

  const t = await getTranslations({ locale, namespace: "inquiry" });

  return (
    <Section>
      <Container className="max-w-3xl">
        <SectionHeading title={t("title")} description={t("description")} />
        <div className="mt-12">
          {/* ?type= / ?ingredient= 는 클라이언트에서 읽어 정적 렌더링을 유지 */}
          <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-ink-100" />}>
            <InquiryForm />
          </Suspense>
        </div>
      </Container>
    </Section>
  );
}
