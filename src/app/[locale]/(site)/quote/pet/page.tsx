import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { PawPrint } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/section";
import { CtaBand } from "@/components/site/cta-band";
import { QuoteBoard } from "@/components/quote/quote-board";
import type { QuoteSearchField } from "@/lib/queries";

// 접수 즉시 목록에 보여야 하므로 정적 캐시를 쓰지 않습니다
export const dynamic = "force-dynamic";

/**
 * 품목 사진 — pages.pet.features 와 같은 순서입니다.
 * public/pet/ 의 같은 파일명으로 덮어쓰면 코드 수정 없이 교체됩니다.
 */
const FEATURE_IMAGES = [
  "/pet/joint.jpg", // 관절 영양제
  "/pet/gut.jpg", // 장 건강
  "/pet/skin.jpg", // 피부·피모
  "/pet/dental.jpg", // 구강 관리
  "/pet/multi.jpg", // 종합 영양
  "/pet/treat.jpg", // 기호성 간식형
];

/** 품목별 기본 제형 — 간식형만 츄어블, 나머지는 분말로 폼을 채웁니다 */
const FEATURE_FORMULATIONS = [
  "POWDER",
  "POWDER",
  "POWDER",
  "POWDER",
  "POWDER",
  "CHEWABLE",
];

type Pair = { title: string; body: string };

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
  // 소개 문구는 펫 제품 서비스 페이지와 같은 원고를 씁니다
  const tp = await getTranslations({ locale, namespace: "pages.pet" });

  const page = Number(typeof search.page === "string" ? search.page : "1") || 1;
  const keyword = typeof search.q === "string" ? search.q.slice(0, 60) : "";
  const field: QuoteSearchField = search.field === "author" ? "author" : "title";

  const features = tp.raw("features") as Pair[];
  const steps = tp.raw("steps") as Pair[];

  return (
    <>
      {/* ─── 히어로 ─── */}
      <section className="border-b border-ink-200 bg-gradient-to-b from-brand-50 to-white">
        <Container className="py-14 text-center sm:py-20">
          <p className="text-xs font-bold tracking-[0.14em] text-brand-600 uppercase">
            {t("petEyebrow")}
          </p>
          <h1 className="mt-4 text-display text-brand-900">{t("petTitle")}</h1>
          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-ink-700 lg:text-body-lg">
            {t("petLead")}
          </p>
        </Container>
      </section>

      {/* ─── 생산 가능 품목 ─── */}
      <Section>
        <Container>
          <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
            {tp("featuresTitle")}
          </h2>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((item, index) => (
              <li key={item.title}>
                <Link
                  href={`/inquiry?type=pet&formulation=${FEATURE_FORMULATIONS[index]}`}
                  className="flex h-full flex-col overflow-hidden rounded-card border border-ink-200 bg-white transition-shadow hover:shadow-[var(--shadow-soft)]"
                >
                  <div className="relative aspect-4/3 bg-ink-100">
                    <Image
                      src={FEATURE_IMAGES[index]}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-base font-bold text-ink-900">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-700">
                      {item.body}
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
                {tp("eyebrow")}
              </p>
              <h2 className="mt-4 text-2xl font-bold whitespace-pre-line text-ink-900 sm:text-3xl sm:leading-snug">
                {tp("title")}
              </h2>
              <div className="mt-6 h-1 w-16 rounded-full bg-brand-500" />
              <p className="mt-6 whitespace-pre-line leading-loose text-ink-700">
                {tp("intro")}
              </p>
            </div>

            <div className="rounded-card border border-ink-200 bg-white p-6 sm:p-8">
              <p className="flex items-center gap-2 text-base font-bold text-ink-900">
                <PawPrint
                  className="size-5 shrink-0 text-brand-600"
                  aria-hidden
                />
                {tp("stepsTitle")}
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
            {t("petBoardTitle")}
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-700">
            {t("petBoardDescription")}
          </p>

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

      <CtaBand locale={locale} href="/inquiry?type=pet" />
    </>
  );
}
