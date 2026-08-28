import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import { Thumbnail } from "@/components/site/media";
import { QuoteBoard } from "@/components/quote/quote-board";
import { getIngredients, type QuoteSearchField } from "@/lib/queries";

// 접수 즉시 목록에 보여야 하므로 정적 캐시를 쓰지 않습니다
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/[locale]/quote/material">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "quote" });
  return {
    title: t("materialTitle"),
    description: t("materialDescription"),
    alternates: { canonical: `/${locale}/quote/material` },
    robots: { index: false, follow: true },
  };
}

export default async function MaterialQuoteBoardPage(
  props: PageProps<"/[locale]/quote/material">,
) {
  const { locale } = await props.params;
  const search = await props.searchParams;
  const t = await getTranslations({ locale, namespace: "quote" });
  const tCategory = await getTranslations({ locale, namespace: "category" });

  const page = Number(typeof search.page === "string" ? search.page : "1") || 1;
  const keyword = typeof search.q === "string" ? search.q.slice(0, 60) : "";
  const field: QuoteSearchField = search.field === "author" ? "author" : "title";

  // 공급 대상은 특허·개별인정형 원료입니다
  const ingredients = await getIngredients(locale, [
    "PATENT",
    "INDIVIDUAL_APPROVED",
  ]);

  return (
    <>
      <Section className="pb-0">
        <Container>
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("materialTitle")}
            description={t("materialDescription")}
          />

          {ingredients.length > 0 && (
            <>
              <h2 className="mt-12 text-title text-brand-900">
                {t("materialListTitle")}
              </h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ingredients.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/ingredients/${item.slug}`}
                      className="flex h-full flex-col overflow-hidden rounded-card border border-ink-200 bg-white transition-shadow hover:shadow-[var(--shadow-soft)]"
                    >
                      <Thumbnail
                        src={item.thumbnailUrl}
                        alt={item.name}
                        seed={item.name}
                        className="rounded-none"
                        sizes="(min-width: 1024px) 368px, (min-width: 640px) 47vw, 100vw"
                      />
                      <span className="flex flex-1 flex-col gap-2 p-5">
                        <Badge tone="accent">{tCategory(item.category)}</Badge>
                        <span className="text-title text-ink-900">{item.name}</span>
                        {item.summary && (
                          <span className="line-clamp-3 text-sm leading-relaxed text-ink-700">
                            {item.summary}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                href="/ingredients"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-brand-700"
              >
                {t("materialListMore")}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </>
          )}
        </Container>
      </Section>

      <Section>
        <Container>
          <QuoteBoard
            locale={locale}
            page={page}
            keyword={keyword}
            field={field}
            serviceType="MATERIAL"
            basePath="/quote/material"
            writeHref="/inquiry?type=material"
            writeLabel={t("materialWrite")}
            emptyLabel={t("materialEmpty")}
          />
        </Container>
      </Section>
    </>
  );
}
