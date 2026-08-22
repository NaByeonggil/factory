import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import {
  Award,
  BadgeCheck,
  Boxes,
  FlaskConical,
  LineChart,
  Palette,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import {
  FORMULATIONS,
  PACKAGINGS,
  SERVICE_TYPES,
} from "@/lib/constants";
import {
  getCertifications,
  getFeaturedIngredients,
  getRecentInquirySummaries,
} from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { Thumbnail } from "@/components/site/media";
import { routing } from "@/i18n/routing";

/** 광고 랜딩 페이지 — 정적 프리렌더 후 10분마다 ISR 재생성 */
export const dynamic = "force-static";
export const revalidate = 600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "meta" });
  // 레이아웃의 "%s | FASTLAB" 템플릿이 붙지 않도록 absolute 사용
  return {
    title: { absolute: t("defaultTitle") },
    description: t("defaultDescription"),
  };
}

const SERVICE_ICONS = {
  OEM: Boxes,
  ODM: FlaskConical,
  CDMO: ShieldCheck,
  DTC: Sparkles,
  PET: Award,
} as const;

const PRIORITY_ITEMS = [
  { key: "design", Icon: Palette },
  { key: "channel", Icon: LineChart },
  { key: "patent", Icon: ScrollText },
  { key: "funding", Icon: Wallet },
] as const;

export default async function HomePage(props: PageProps<"/[locale]">) {
  const { locale } = await props.params;
  // 레이아웃과 페이지는 병렬로 렌더링되므로, 레이아웃의 notFound()만으로는
  // 알 수 없는 로케일(`/.env` 같은 봇 요청)에서 이 페이지가 먼저 터집니다.
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "home" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tService = await getTranslations({ locale, namespace: "service" });
  const tPriority = await getTranslations({ locale, namespace: "priority" });
  const tOptions = await getTranslations({ locale, namespace: "options" });
  const tCategory = await getTranslations({ locale, namespace: "category" });
  const tIngredients = await getTranslations({ locale, namespace: "ingredients" });

  const [featured, certifications, recent] = await Promise.all([
    getFeaturedIngredients(locale),
    getCertifications(),
    getRecentInquirySummaries(),
  ]);

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <Container className="grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
          <div>
            <Badge tone="brand">{t("heroEyebrow")}</Badge>
            <h1 className="mt-5 text-3xl font-extrabold leading-[1.2] tracking-tight text-ink-900 whitespace-pre-line sm:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg">
              {t("heroDescription")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/inquiry">{t("heroPrimaryCta")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/ingredients">{t("heroSecondaryCta")}</Link>
              </Button>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4">
            {(
              [
                ["years", "yearsValue"],
                ["ccm", "ccmValue"],
                ["satisfaction", "satisfactionValue"],
                ["products", "productsValue"],
              ] as const
            ).map(([labelKey, valueKey]) => (
              <div
                key={labelKey}
                className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm"
              >
                <dt className="text-sm font-medium text-ink-500">
                  {t(`stats.${labelKey}`)}
                </dt>
                <dd className="mt-2 text-2xl font-extrabold text-brand-700 sm:text-3xl">
                  {t(`stats.${valueKey}`)}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* ─── 서비스 ─── */}
      <Section>
        <Container>
          <SectionHeading title={t("serviceTitle")} />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_TYPES.map((type) => {
              const Icon = SERVICE_ICONS[type];
              return (
                <li key={type}>
                  <Link
                    href="/inquiry"
                    className="flex h-full flex-col gap-3 rounded-2xl border border-ink-200 p-6 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                  >
                    <Icon className="size-7 text-brand-600" aria-hidden />
                    <p className="text-lg font-bold text-ink-900">
                      {tService(type)}
                    </p>
                    <p className="text-sm leading-relaxed text-ink-600">
                      {tService(`${type}_desc`)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      {/* ─── HOT 원료 ─── */}
      <Section className="bg-ink-50">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              title={t("hotTitle")}
              description={t("hotDescription")}
            />
            <Button asChild variant="outline" size="sm">
              <Link href="/ingredients">{tNav("ingredients")}</Link>
            </Button>
          </div>

          {featured.length === 0 ? (
            <p className="mt-10 rounded-2xl border border-dashed border-ink-300 bg-white p-10 text-center text-sm text-ink-500">
              {tIngredients("empty")}
            </p>
          ) : (
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/ingredients/${item.slug}`}
                    className="flex h-full flex-col gap-2 rounded-2xl border border-ink-200 bg-white p-5 transition-shadow hover:shadow-md"
                  >
                    <Thumbnail
                      src={item.thumbnailUrl}
                      alt={item.name}
                      seed={item.name}
                      className="mb-2"
                      sizes="(min-width: 1024px) 260px, 45vw"
                    />
                    <Badge tone="accent">{tCategory(item.category)}</Badge>
                    <p className="mt-1 text-base font-bold text-ink-900">
                      {item.name}
                    </p>
                    {item.summary && (
                      <p className="line-clamp-3 text-sm leading-relaxed text-ink-600">
                        {item.summary}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>

      {/* ─── 제형 · 포장 ─── */}
      <Section>
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              title={t("formulationTitle")}
              description={t("formulationDescription")}
            />
            <ul className="mt-8 flex flex-wrap gap-2.5">
              {FORMULATIONS.map((code) => (
                <li
                  key={code}
                  className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700"
                >
                  {tOptions(`formulation.${code}`)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading title={t("packagingTitle")} />
            <ul className="mt-8 flex flex-wrap gap-2.5">
              {PACKAGINGS.map((code) => (
                <li
                  key={code}
                  className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700"
                >
                  {tOptions(`packaging.${code}`)}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* ─── 인증 ─── */}
      <Section className="bg-ink-900 text-white">
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-brand-300">
              Certification
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
              {t("certTitle")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-300">
              {t("certDescription")}
            </p>
          </div>

          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(certifications.length > 0
              ? certifications
              : [
                  { code: "GMP", name: "", imageUrl: null },
                  { code: "HACCP", name: "", imageUrl: null },
                  { code: "ISO 9001", name: "", imageUrl: null },
                  { code: "ISO 22000", name: "", imageUrl: null },
                ]
            ).map((cert) => (
              <li
                key={cert.code}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3.5 text-sm font-semibold"
              >
                {cert.imageUrl ? (
                  <span className="relative size-8 shrink-0 overflow-hidden rounded bg-white/90">
                    <Image
                      src={cert.imageUrl}
                      alt=""
                      fill
                      sizes="32px"
                      unoptimized
                      className="object-contain p-1"
                    />
                  </span>
                ) : (
                  <BadgeCheck className="size-5 shrink-0 text-brand-300" aria-hidden />
                )}
                {cert.code}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ─── Priority Service ─── */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Priority Service"
            title={t("priorityTitle")}
            description={t("priorityDescription")}
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRIORITY_ITEMS.map(({ key, Icon }) => (
              <li
                key={key}
                className="rounded-2xl border border-ink-200 p-6"
              >
                <Icon className="size-7 text-brand-600" aria-hidden />
                <p className="mt-3 text-base font-bold text-ink-900">
                  {tPriority(key)}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                  {tPriority(`${key}Desc`)}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ─── 최근 문의 (사회적 증거) ─── */}
      {recent.length > 0 && (
        <Section className="bg-ink-50">
          <Container>
            <SectionHeading
              title={t("recentTitle")}
              description={t("recentDescription")}
            />
            <ul className="mt-8 divide-y divide-ink-200 rounded-2xl border border-ink-200 bg-white">
              {recent.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-4 text-sm"
                >
                  <Badge tone="brand">{tService(item.serviceType)}</Badge>
                  <span className="text-ink-700">
                    {item.formulations.length > 0
                      ? item.formulations
                          .map((f) => tOptions(`formulation.${f}`))
                          .join(" · ")
                      : "—"}
                  </span>
                  <span className="ml-auto text-ink-400">
                    {formatDate(item.createdAt, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {/* ─── 최종 CTA ─── */}
      <Section className="bg-brand-700 text-white">
        <Container className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{t("ctaTitle")}</h2>
            <p className="mt-2 text-brand-100">{t("ctaDescription")}</p>
          </div>
          <Button
            asChild
            size="lg"
            className="bg-white text-brand-700 hover:bg-brand-50"
          >
            <Link href="/inquiry">{tNav("inquiry")}</Link>
          </Button>
        </Container>
      </Section>
    </>
  );
}
