import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import { QuoteBoard } from "@/components/quote/quote-board";
import type { QuoteSearchField } from "@/lib/queries";

// 접수 즉시 목록에 보여야 하므로 정적 캐시를 쓰지 않습니다
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/[locale]/quote/cosmetic">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "quote" });
  return {
    title: t("cosmeticTitle"),
    description: t("cosmeticDescription"),
    alternates: { canonical: `/${locale}/quote/cosmetic` },
    robots: { index: false, follow: true },
  };
}

export default async function CosmeticQuoteBoardPage(
  props: PageProps<"/[locale]/quote/cosmetic">,
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
          title={t("cosmeticTitle")}
          description={t("cosmeticDescription")}
        />

        {/* 소개 페이지가 메뉴에서 빠져 있어 여기서 이어줍니다 */}
        <Link
          href="/service/cosmetic"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-brand-700"
        >
          <Sparkles className="size-4" aria-hidden />
          {t("cosmeticIntro")} →
        </Link>

        <QuoteBoard
          locale={locale}
          page={page}
          keyword={keyword}
          field={field}
          serviceType="COSMETIC"
          basePath="/quote/cosmetic"
          writeHref="/inquiry?type=cosmetic"
          writeLabel={t("cosmeticWrite")}
          emptyLabel={t("cosmeticEmpty")}
        />
      </Container>
    </Section>
  );
}
