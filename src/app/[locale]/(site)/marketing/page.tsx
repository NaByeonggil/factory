import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  Camera,
  Check,
  ChevronDown,
  FileText,
  Headset,
  Megaphone,
  Palette,
  ShieldCheck,
  Store,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";
import { routing } from "@/i18n/routing";

const NS = "pages.marketing";

/**
 * 히어로 배경 — public/marketing/hero.jpg 를 같은 파일명으로 덮어쓰면
 * 코드 수정 없이 교체됩니다. 출처와 주의사항은 CREDITS.md 참고.
 */
const HERO_IMAGE = "/marketing/hero.jpg";

/** 지원 항목 아이콘 — features 와 같은 순서 */
const FEATURE_ICONS = [Palette, FileText, Camera, Store, Megaphone, ShieldCheck];

type Feature = {
  title: string;
  subtitle: string;
  body: string;
  points: string[];
};
type Pair = { title: string; body: string };
type Faq = { q: string; a: string };

export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/marketing">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: NS });
  return {
    title: t("title").replace(/\n/g, " "),
    description: t("description"),
    alternates: { canonical: `/${locale}/marketing` },
  };
}

export default async function MarketingServicePage(
  props: PageProps<"/[locale]/marketing">,
) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: NS });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const features = t.raw("features") as Feature[];
  const steps = t.raw("steps") as Pair[];
  const faq = t.raw("faq") as Faq[];

  return (
    <>
      {/* ─── 히어로 — 사진 위에 어두운 막을 덮고 흰 글씨를 얹습니다 ─── */}
      <section className="relative isolate overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          sizes="100vw"
          priority
          className="-z-10 object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-ink-900/75 mix-blend-multiply"
        />
        <Container className="py-20 text-center sm:py-28">
          <p className="text-xs font-bold tracking-[0.14em] text-brand-200 uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-display whitespace-pre-line text-white">
            {t("title")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-ink-100 lg:text-body-lg">
            {t("description")}
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-white text-brand-700 shadow-sm hover:bg-brand-50"
          >
            <Link href="/inquiry">{tNav("inquiry")}</Link>
          </Button>
        </Container>
      </section>

      {/* ─── 왜 필요한가 ─── */}
      <Section className="pb-0">
        <Container className="max-w-3xl">
          <p className="whitespace-pre-line leading-loose text-ink-700">
            {t("intro")}
          </p>
        </Container>
      </Section>

      {/* ─── 지원 항목 ─── */}
      <Section>
        <Container>
          <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
            {t("featuresTitle")}
          </h2>

          <ul className="mt-10 space-y-6">
            {features.map((item, index) => {
              const Icon = FEATURE_ICONS[index];
              return (
                <li
                  key={item.title}
                  className="rounded-card border border-ink-200 bg-white p-6 sm:p-8"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="text-sm font-bold text-ink-400">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-x-10 gap-y-6 lg:grid-cols-[1.1fr_1fr]">
                    <div>
                      <h3 className="text-xl font-bold text-ink-900">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-sm font-semibold text-brand-700">
                        {item.subtitle}
                      </p>
                      <p className="mt-4 leading-relaxed text-ink-700">
                        {item.body}
                      </p>
                    </div>

                    <div className="rounded-xl bg-ink-50 p-6">
                      <ul className="space-y-3">
                        {item.points.map((point) => (
                          <li key={point} className="flex items-start gap-2.5">
                            <Check
                              className="mt-0.5 size-4 shrink-0 text-brand-600"
                              aria-hidden
                            />
                            <span className="text-sm leading-relaxed text-ink-700">
                              {point}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {/* 항목 이름이 문의 제목에 미리 채워집니다 */}
                      <Button asChild size="sm" variant="outline" className="mt-6">
                        <Link
                          href={`/inquiry?title=${encodeURIComponent(item.title)}`}
                        >
                          {t("serviceCta")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      {/* ─── 진행 방식 ─── */}
      <Section className="bg-ink-50">
        <Container>
          <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
            {t("stepsTitle")}
          </h2>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-card border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="flex flex-col bg-white p-6">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="mt-4 text-base font-bold text-ink-900">
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* ─── FAQ ─── */}
      <Section>
        <Container className="max-w-3xl">
          <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
            {t("faqTitle")}
          </h2>
          <dl className="mt-8 space-y-4">
            {faq.map((item) => (
              <details
                key={item.q}
                className="group overflow-hidden rounded-card border border-ink-200 bg-white [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 p-5 text-label font-bold text-ink-900">
                  <dt>{item.q}</dt>
                  <ChevronDown
                    aria-hidden
                    className="size-5 shrink-0 text-ink-400 transition-transform duration-300 group-open:-rotate-180"
                  />
                </summary>
                <dd className="border-t border-ink-100 bg-ink-50 px-5 py-4 text-sm leading-relaxed text-ink-700">
                  {item.a}
                </dd>
              </details>
            ))}
          </dl>
        </Container>
      </Section>

      {/* ─── 무엇이 필요한지 모를 때 ─── */}
      <Section className="bg-ink-900 text-white">
        <Container className="max-w-2xl text-center">
          <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-white/10 text-brand-200">
            <Headset className="size-7" aria-hidden />
          </span>
          <h2 className="mt-6 text-headline">{t("consultTitle")}</h2>
          <p className="mt-3 leading-relaxed text-ink-300">{t("consultBody")}</p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-white text-brand-700 shadow-sm hover:bg-brand-50"
          >
            <Link href="/inquiry">{t("consultCta")}</Link>
          </Button>
        </Container>
      </Section>
    </>
  );
}
