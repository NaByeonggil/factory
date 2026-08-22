import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { CtaBand } from "@/components/site/cta-band";

type Pair = { title: string; body: string };
type Faq = { q: string; a: string };

/**
 * 정적 마케팅 페이지 공용 렌더러.
 * 본문은 src/messages/*.json 의 `pages.<key>` 네임스페이스에서 읽습니다.
 * 모든 섹션은 선택 사항이며, 키가 없으면 렌더링하지 않습니다.
 */
export async function MarketingPage({
  locale,
  ns,
}: {
  locale: string;
  ns: string;
}) {
  const t = await getTranslations({ locale, namespace: ns });

  const bullets = t.has("bullets") ? (t.raw("bullets") as string[]) : [];
  const features = t.has("features") ? (t.raw("features") as Pair[]) : [];
  const steps = t.has("steps") ? (t.raw("steps") as Pair[]) : [];
  const faq = t.has("faq") ? (t.raw("faq") as Faq[]) : [];

  return (
    <>
      <section className="border-b border-ink-200 bg-gradient-to-b from-brand-50 to-white">
        <Container className="py-14 sm:py-20">
          {t.has("eyebrow") && <Badge tone="brand">{t("eyebrow")}</Badge>}
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          {t.has("description") && (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg">
              {t("description")}
            </p>
          )}
        </Container>
      </section>

      {t.has("intro") && (
        <Section className="pb-0">
          <Container className="max-w-3xl">
            <p className="whitespace-pre-line text-base leading-loose text-ink-700">
              {t("intro")}
            </p>
          </Container>
        </Section>
      )}

      {bullets.length > 0 && (
        <Section>
          <Container>
            <SectionHeading title={t("bulletsTitle")} />
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {bullets.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-ink-200 bg-white p-5"
                >
                  <Check
                    className="mt-0.5 size-5 shrink-0 text-brand-600"
                    aria-hidden
                  />
                  <span className="text-[0.9375rem] leading-relaxed text-ink-800">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {features.length > 0 && (
        <Section className="bg-ink-50">
          <Container>
            <SectionHeading title={t("featuresTitle")} />
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-ink-200 bg-white p-6"
                >
                  <p className="text-base font-bold text-ink-900">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {steps.length > 0 && (
        <Section>
          <Container>
            <SectionHeading title={t("stepsTitle")} />
            <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((item, index) => (
                <li key={item.title} className="bg-white p-6">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="mt-4 text-base font-bold text-ink-900">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </Container>
        </Section>
      )}

      {faq.length > 0 && (
        <Section className="bg-ink-50">
          <Container className="max-w-3xl">
            <SectionHeading title={t("faqTitle")} />
            <dl className="mt-8 divide-y divide-ink-200 overflow-hidden rounded-2xl border border-ink-200 bg-white">
              {faq.map((item) => (
                <details key={item.q} className="group">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-[0.9375rem] font-semibold text-ink-900 marker:content-none">
                    <dt>{item.q}</dt>
                    <span
                      aria-hidden
                      className="shrink-0 text-xl text-ink-400 transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <dd className="px-6 pb-5 text-sm leading-relaxed text-ink-600">
                    {item.a}
                  </dd>
                </details>
              ))}
            </dl>
          </Container>
        </Section>
      )}

      <CtaBand locale={locale} />
    </>
  );
}
