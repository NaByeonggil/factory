import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PawPrint } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import { QuoteBoard } from "@/components/quote/quote-board";
import type { QuoteSearchField } from "@/lib/queries";

// 접수 즉시 목록에 보여야 하므로 정적 캐시를 쓰지 않습니다
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/[locale]/quote/pet">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "quote" });
  return {
    title: t("petTitle"),
    description: t("petDescription"),
    alternates: { canonical: `/${locale}/quote/pet` },
    // 고객 문의 목록은 색인 대상이 아닙니다
    robots: { index: false, follow: true },
  };
}

export default async function PetQuoteBoardPage(
  props: PageProps<"/[locale]/quote/pet">,
) {
  const { locale } = await props.params;
  const search = await props.searchParams;
  const t = await getTranslations({ locale, namespace: "quote" });

  const page = Number(typeof search.page === "string" ? search.page : "1") || 1;
  const keyword = typeof search.q === "string" ? search.q.slice(0, 60) : "";
  const field: QuoteSearchField = search.field === "author" ? "author" : "title";

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("petTitle")}
          description={t("petDescription")}
        />

        {/* 펫 문의만 모아 보는 화면이라 전체 게시판으로 가는 길을 열어둡니다 */}
        <Link
          href="/quote"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-brand-700"
        >
          <PawPrint className="size-4" aria-hidden />
          {t("allBoard")} →
        </Link>

        <QuoteBoard
          locale={locale}
          page={page}
          keyword={keyword}
          field={field}
          serviceType="PET"
          basePath="/quote/pet"
          writeHref="/inquiry?type=pet"
          writeLabel={t("petWrite")}
          emptyLabel={t("petEmpty")}
        />
      </Container>
    </Section>
  );
}
