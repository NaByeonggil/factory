import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import { QuoteProcess } from "@/components/quote/quote-process";
import { QuoteBoard } from "@/components/quote/quote-board";
import type { QuoteSearchField } from "@/lib/queries";
import { FOOD_SERVICE_TYPES } from "@/lib/constants";

// 접수 즉시 목록에 보여야 하므로 정적 캐시를 쓰지 않습니다
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/[locale]/quote">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "quote" });
  return {
    title: t("foodTitle"),
    description: t("foodDescription"),
    alternates: { canonical: `/${locale}/quote` },
    // 고객 문의 목록은 색인 대상이 아닙니다
    robots: { index: false, follow: true },
  };
}

export default async function QuoteBoardPage(
  props: PageProps<"/[locale]/quote">,
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
          title={t("foodTitle")}
          description={t("foodDescription")}
        />

        <div className="mt-8">
          <QuoteProcess locale={locale} />
        </div>

        <QuoteBoard
          locale={locale}
          page={page}
          keyword={keyword}
          field={field}
          serviceType={FOOD_SERVICE_TYPES}
          basePath="/quote"
          writeHref="/inquiry"
          writeLabel={t("write")}
          emptyLabel={t("foodEmpty")}
        />
      </Container>
    </Section>
  );
}
