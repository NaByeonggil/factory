import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { FlaskConical } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/section";
import { QuoteBoard } from "@/components/quote/quote-board";
import type { QuoteSearchField } from "@/lib/queries";

// 접수 즉시 목록에 보여야 하므로 정적 캐시를 쓰지 않습니다
export const dynamic = "force-dynamic";

/**
 * 제형 사진 — public/cosmetic/ 의 같은 파일명으로 덮어쓰면
 * 코드 수정 없이 자사 촬영본으로 교체됩니다.
 */
const LINE_IMAGES: Record<string, string> = {
  CREAM: "/cosmetic/cream.jpg",
  SERUM: "/cosmetic/serum.jpg",
  TONER: "/cosmetic/toner.jpg",
  LOTION: "/cosmetic/lotion.jpg",
  MASK_PACK: "/cosmetic/mask.jpg",
  CLEANSER: "/cosmetic/cleanser.jpg",
};

type Pair = { title: string; body: string };
type Line = Pair & { code: string };

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
  // 소개 문구는 화장품 서비스 페이지와 같은 원고를 씁니다
  const tc = await getTranslations({ locale, namespace: "pages.cosmetic" });

  const page = Number(typeof search.page === "string" ? search.page : "1") || 1;
  const keyword = typeof search.q === "string" ? search.q.slice(0, 60) : "";
  const field: QuoteSearchField = search.field === "author" ? "author" : "title";

  const lines = tc.raw("lines") as Line[];
  const steps = tc.raw("steps") as Pair[];

  return (
    <>
      {/* ─── 히어로 ─── */}
      <section className="border-b border-ink-200 bg-gradient-to-b from-brand-50 to-white">
        <Container className="py-14 text-center sm:py-20">
          <p className="text-xs font-bold tracking-[0.14em] text-brand-600 uppercase">
            {t("cosmeticEyebrow")}
          </p>
          <h1 className="mt-4 text-display text-brand-900">
            {t("cosmeticTitle")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-ink-700 lg:text-body-lg">
            {t("cosmeticDescription")}
          </p>
        </Container>
      </section>

      {/* ─── 생산 가능 제형 ─── */}
      <Section>
        <Container>
          <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
            {tc("linesTitle")}
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-700">
            {tc("linesDescription")}
          </p>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lines.map((line) => (
              <li key={line.code}>
                {/* 카드를 누르면 그 제형이 선택된 채로 문의 폼이 열립니다 */}
                <Link
                  href={`/inquiry?type=cosmetic&formulation=${line.code}`}
                  className="flex h-full flex-col overflow-hidden rounded-card border border-ink-200 bg-white transition-shadow hover:shadow-[var(--shadow-soft)]"
                >
                  <div className="relative aspect-4/3 bg-ink-100">
                    <Image
                      src={LINE_IMAGES[line.code]}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-base font-bold text-ink-900">
                      {line.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-700">
                      {line.body}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ─── 소개 + 진행 절차 ─── */}
      <Section className="bg-ink-50">
        <Container>
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-brand-600 uppercase">
                {tc("eyebrow")}
              </p>
              <h2 className="mt-4 text-2xl font-bold whitespace-pre-line text-ink-900 sm:text-3xl sm:leading-snug">
                {tc("title")}
              </h2>
              <div className="mt-6 h-1 w-16 rounded-full bg-brand-500" />
              <p className="mt-6 leading-loose text-ink-700">
                {tc("description")}
              </p>
            </div>

            <div className="rounded-card border border-ink-200 bg-white p-6 sm:p-8">
              <p className="flex items-center gap-2 text-base font-bold text-ink-900">
                <FlaskConical
                  className="size-5 shrink-0 text-brand-600"
                  aria-hidden
                />
                {tc("stepsTitle")}
              </p>
              <ol className="mt-6 grid gap-4 sm:grid-cols-2">
                {steps.map((step) => (
                  <li
                    key={step.title}
                    className="rounded-xl border border-ink-200 bg-ink-50 p-5"
                  >
                    <p className="text-sm font-bold text-ink-900">
                      {step.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-700">
                      {step.body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </Section>

      {/* ─── 게시판 ─── */}
      <Section>
        <Container>
          <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
            {t("cosmeticBoardTitle")}
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-700">
            {t("cosmeticBoardDescription")}
          </p>

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
    </>
  );
}
