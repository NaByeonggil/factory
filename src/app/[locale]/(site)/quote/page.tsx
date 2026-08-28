import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ClipboardList, FileText } from "lucide-react";
import { Container, Section } from "@/components/ui/section";
import { CtaBand } from "@/components/site/cta-band";
import { QuoteProcess } from "@/components/quote/quote-process";
import { QuoteBoard } from "@/components/quote/quote-board";
import type { QuoteSearchField } from "@/lib/queries";
import { FOOD_SERVICE_TYPES } from "@/lib/constants";

// 접수 즉시 목록에 보여야 하므로 정적 캐시를 쓰지 않습니다
export const dynamic = "force-dynamic";

type Pair = { title: string; body: string };

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

  const brief = t.raw("brief") as Pair[];
  const quoteRows = t.raw("quoteRows") as Pair[];
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

      {/* ─── 상담 진행 방식 ─── */}
      <Section>
        <Container>
          <QuoteProcess locale={locale} />
        </Container>
      </Section>

      {/* ─── 상담 결과물 (제품개발 방향서) ─── */}
      <Section className="bg-ink-50">
        <Container>
          <div className="rounded-card border border-ink-200 bg-white p-6 sm:p-8">
            <p className="flex items-center gap-2 text-xl font-bold text-ink-900">
              <ClipboardList
                className="size-5 shrink-0 text-brand-600"
                aria-hidden
              />
              {t("briefTitle")}
            </p>
            <p className="mt-3 max-w-2xl leading-relaxed text-ink-700">
              {t("briefDescription")}
            </p>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {brief.map((item) => (
                <li
                  key={item.title}
                  className="rounded-xl border border-ink-200 bg-ink-50 p-5"
                >
                  <p className="text-[0.9375rem] font-bold text-ink-900">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-700">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* ─── 견적서 구성 ─── */}
      <Section>
        <Container>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-ink-900 sm:text-3xl">
            <FileText className="size-6 shrink-0 text-brand-600" aria-hidden />
            {t("quoteTitle")}
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink-700">
            {t("quoteDescription")}
          </p>

          <div className="mt-8 overflow-hidden rounded-card border border-ink-200">
            <dl className="divide-y divide-ink-100 bg-white">
              {quoteRows.map((row) => (
                <div
                  key={row.title}
                  className="grid gap-1 p-5 sm:grid-cols-[12rem_1fr] sm:gap-6"
                >
                  <dt className="text-[0.9375rem] font-bold text-ink-900">
                    {row.title}
                  </dt>
                  <dd className="text-sm leading-relaxed text-ink-700">
                    {row.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </Section>

      {/* ─── 계약 이후 진행 ─── */}
      <Section className="bg-ink-50">
        <Container>
          <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
            {t("afterTitle")}
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink-700">
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
        </Container>
      </Section>

      {/* ─── 게시판 ─── */}
      <Section>
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

      <CtaBand locale={locale} />
    </>
  );
}
