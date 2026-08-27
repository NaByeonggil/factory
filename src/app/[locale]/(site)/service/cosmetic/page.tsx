import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  BadgeCheck,
  ChevronDown,
  Droplet,
  Droplets,
  Layers,
  Sparkles,
  Waves,
  Wind,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import { CtaBand } from "@/components/site/cta-band";
import { getCertifications } from "@/lib/queries";
import { routing } from "@/i18n/routing";

const NS = "pages.cosmetic";

/**
 * 임시 이미지 — 화장품 촬영본이 준비되면 이 값만 바꾸면 됩니다.
 * 지금은 자사 공장 사진을 쓰고 있어 저작권 문제는 없습니다.
 * (교체 권장 규격: 히어로 16:9 1600px 이상, 품목 4:3 1200px 이상)
 */
const HERO_IMAGE = "/hero-factory.jpg";

export const dynamic = "force-static";
export const revalidate = 600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/service/cosmetic">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: NS });
  const title = t("title").replace(/\n/g, " ");
  return {
    title,
    description: t("description"),
    alternates: { canonical: `/${locale}/service/cosmetic` },
  };
}

type Pair = { title: string; body: string };
type Line = Pair & { code: string };
type Faq = { q: string; a: string };

/** 제형 코드 → 아이콘 (사진 대신 제형 성격을 드러내는 자리) */
const LINE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CREAM: Droplet,
  SERUM: Sparkles,
  TONER: Droplets,
  LOTION: Waves,
  MASK_PACK: Layers,
  CLEANSER: Wind,
};

/** 홈과 같은 기본 인증 (DB에 인증 데이터가 없을 때) */
const FALLBACK_CERTIFICATIONS = [
  { code: "GMP", name: "" },
  { code: "HACCP", name: "" },
  { code: "ISO 9001", name: "" },
  { code: "ISO 22716", name: "" },
];

const STATS = [
  ["years", "yearsValue"],
  ["ccm", "ccmValue"],
  ["satisfaction", "satisfactionValue"],
  ["products", "productsValue"],
] as const;

export default async function Page(
  props: PageProps<"/[locale]/service/cosmetic">,
) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: NS });
  const tHome = await getTranslations({ locale, namespace: "home" });

  const strengths = t.raw("strengths") as Pair[];
  const lines = t.raw("lines") as Line[];
  const steps = t.raw("steps") as Pair[];
  const faq = t.raw("faq") as Faq[];

  const rows = await getCertifications();
  const certifications = rows.length > 0 ? rows : FALLBACK_CERTIFICATIONS;

  return (
    <>
      {/* ─── 히어로 ─── */}
      <section className="border-b border-ink-200 bg-gradient-to-b from-brand-50 to-white">
        <Container className="py-16 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <Badge tone="brand">{t("eyebrow")}</Badge>
              <h1 className="mt-5 whitespace-pre-line text-display text-brand-900">
                {t("title")}
              </h1>
              <p className="mt-6 max-w-xl leading-relaxed text-ink-700 lg:text-body-lg">
                {t("description")}
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  {/* 문의 폼이 ?type= 을 읽어 화장품으로 미리 선택합니다 */}
                  <Link href="/inquiry?type=cosmetic">{t("heroPrimaryCta")}</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/ingredients">{t("heroSecondaryCta")}</Link>
                </Button>
              </div>
            </div>

            <div className="relative aspect-4/3 overflow-hidden rounded-card border border-ink-200 shadow-[var(--shadow-soft-lg)]">
              <Image
                src={HERO_IMAGE}
                alt=""
                fill
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </Container>
      </section>

      {/* ─── 지표 스트립 ─── */}
      <section className="border-b border-ink-200 bg-white">
        <Container>
          <dl className="grid grid-cols-2 divide-ink-200 sm:grid-cols-4 sm:divide-x">
            {STATS.map(([labelKey, valueKey]) => (
              <div
                key={labelKey}
                className="flex flex-col-reverse px-2 py-6 text-center sm:py-8"
              >
                <dt className="mt-1 text-sm font-medium text-ink-500">
                  {tHome(`stats.${labelKey}`)}
                </dt>
                <dd className="text-2xl font-extrabold text-brand-700 sm:text-3xl">
                  {tHome(`stats.${valueKey}`)}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* ─── 강점 ─── */}
      <Section>
        <Container>
          <SectionHeading title={t("strengthsTitle")} />
          <ul className="mt-10 grid gap-4 lg:grid-cols-3">
            {strengths.map((item, index) => (
              <li
                key={item.title}
                className="flex h-full flex-col gap-3 rounded-card border border-ink-200 bg-white p-7"
              >
                <span className="text-label font-extrabold text-brand-300">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-title text-ink-900">{item.title}</p>
                <p className="text-sm leading-relaxed text-ink-700">{item.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ─── 생산 가능 품목 ─── */}
      <Section className="bg-ink-50">
        <Container>
          <SectionHeading
            title={t("linesTitle")}
            description={t("linesDescription")}
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lines.map((line) => {
              const Icon = LINE_ICONS[line.code] ?? Droplet;
              return (
                <li key={line.code}>
                  <Link
                    href={`/inquiry?type=cosmetic&formulation=${line.code}`}
                    className="flex h-full flex-col overflow-hidden rounded-card border border-ink-200 bg-white transition-shadow hover:shadow-[var(--shadow-soft)]"
                  >
                    {/* 제형 사진이 준비되면 이 영역을 이미지로 바꿉니다 */}
                    <span className="flex h-28 items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100/60">
                      <Icon className="size-9 text-brand-600" />
                    </span>
                    <span className="flex flex-1 flex-col gap-2 p-6">
                      <span className="text-title text-ink-900">{line.title}</span>
                      <span className="text-sm leading-relaxed text-ink-700">
                        {line.body}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      {/* ─── 진행 절차 ─── */}
      <Section>
        <Container>
          <SectionHeading title={t("stepsTitle")} />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <li
                key={step.title}
                className="flex h-full flex-col gap-2 rounded-card border-t-4 border-brand-600 bg-white p-6 shadow-[var(--shadow-soft)]"
              >
                <p className="font-bold text-brand-700">{step.title}</p>
                <p className="text-sm leading-relaxed text-ink-700">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* ─── 인증 ─── */}
      <Section className="bg-ink-50">
        <Container>
          <SectionHeading
            title={t("certTitle")}
            description={t("certDescription")}
          />
          <ul className="mt-10 flex flex-wrap gap-3">
            {certifications.map((cert) => (
              <li
                key={cert.code}
                className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-5 py-3 text-sm font-bold text-ink-800"
              >
                <BadgeCheck className="size-4 text-brand-600" aria-hidden />
                {cert.code}
                {cert.name && (
                  <span className="font-medium text-ink-500">{cert.name}</span>
                )}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ─── FAQ ─── */}
      <Section>
        <Container className="max-w-3xl">
          <SectionHeading title={t("faqTitle")} />
          <ul className="mt-8 divide-y divide-ink-200 border-y border-ink-200">
            {faq.map((item) => (
              <li key={item.q}>
                <details className="group py-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-bold text-ink-900">
                    {item.q}
                    <ChevronDown
                      className="size-5 shrink-0 text-ink-400 transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <p className="mt-3 leading-relaxed text-ink-700">{item.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <CtaBand locale={locale} />
    </>
  );
}
