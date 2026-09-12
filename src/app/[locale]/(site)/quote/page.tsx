import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ChevronDown } from "lucide-react";
import { Container, Section } from "@/components/ui/section";
import { CtaBand } from "@/components/site/cta-band";
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

  const after = t.raw("after") as string[];

  return (
    <>
      {/* ─── 히어로 ─── */}
      <section className="border-b border-ink-200 bg-gradient-to-b from-brand-50 to-white">
        <Container className="py-14 text-center sm:py-20">
          <p className="text-xs font-bold tracking-[0.14em] text-brand-600 uppercase">
            {t("foodEyebrow")}
          </p>
          <h1 className="mt-4 text-display text-brand-900">{t("foodTitle")}</h1>
          <p className="mx-auto mt-5 max-w-3xl leading-relaxed text-ink-700 lg:text-body-lg">
            {t("foodLead")}
          </p>
        </Container>
      </section>

      {/* ─── 상담 진행 방식 + 상담 결과물 도해 ─── */}
      <Section className="bg-ink-50">
        <Container>
          <QuoteProcess locale={locale} />
        </Container>
      </Section>

      {/* ─── 계약 이후 진행 (아코디언) ─── */}
      <Section>
        <Container>
          <details className="group overflow-hidden rounded-card border border-ink-200 bg-white [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-4 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
                {t("afterTitle")}
              </h2>
              <ChevronDown
                aria-hidden
                className="size-6 shrink-0 text-ink-400 transition-transform duration-300 group-open:-rotate-180"
              />
            </summary>

            <div className="border-t border-ink-100 p-6 sm:p-8">
              <p className="max-w-3xl leading-relaxed text-ink-700">
                {t("afterDescription")}
              </p>

              <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {after.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-4"
                  >
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-ink-800">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>

              <p className="mt-6 max-w-4xl text-xs leading-relaxed text-ink-500">
                {t("afterNote")}
              </p>
            </div>
          </details>
        </Container>
      </Section>

      {/* ─── 게시판 ─── */}
      <Section className="bg-ink-50">
        <Container>
          <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
            {t("foodTitle")}
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-700">
            {t("foodDescription")}
          </p>

          <QuoteBoard
            locale={locale}
            page={page}
            keyword={keyword}
            field={field}
            serviceType={FOOD_SERVICE_TYPES}
            basePath="/quote"
            writeHref="/inquiry"
            writeLabel={t("foodWrite")}
            emptyLabel={t("foodEmpty")}
          />
        </Container>
      </Section>

      {/* 이 페이지는 「제조 가능성 진단」 흐름이라 배너 문구도 그에 맞춥니다 */}
      <CtaBand
        locale={locale}
        title={t("foodCtaTitle")}
        description={t("foodCtaDescription")}
        label={t("foodWrite")}
      />
    </>
  );
}
