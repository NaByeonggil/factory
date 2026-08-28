import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Check, ChevronDown, ShieldCheck } from "lucide-react";
import { getCompanyInfo } from "@/lib/settings";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { CtaBand } from "@/components/site/cta-band";
import { cn } from "@/lib/utils";

type Pair = { title: string; body: string };
type Career = { label: string; title: string; body: string };

/**
 * 제목 중 `mark` 와 일치하는 한 구절만 브랜드 색으로 칠합니다.
 * 문구가 바뀌어 일치하지 않으면 그냥 원문을 그대로 보여줍니다.
 */
function highlight(title: string, mark: string | null) {
  if (!mark) return title;
  const at = title.indexOf(mark);
  if (at < 0) return title;
  return (
    <>
      {title.slice(0, at)}
      <span className="text-brand-500">{mark}</span>
      {title.slice(at + mark.length)}
    </>
  );
}
type Faq = { q: string; a: string };

/**
 * 정적 마케팅 페이지 공용 렌더러.
 * 본문은 src/messages/*.json 의 `pages.<key>` 네임스페이스에서 읽습니다.
 * 모든 섹션은 선택 사항이며, 키가 없으면 렌더링하지 않습니다.
 */
export async function MarketingPage({
  locale,
  ns,
  heroImage,
  featureImages,
  stepImages,
  bulletsImage,
  founderImage,
}: {
  locale: string;
  ns: string;
  /**
   * 히어로 우측에 놓을 이미지 경로 (16:9 권장).
   * 넘기지 않으면 지금처럼 텍스트만 있는 히어로가 나옵니다.
   */
  heroImage?: string;
  /**
   * features 카드 상단에 넣을 이미지 경로 (4:3 권장, features 와 같은 순서).
   * 넘기지 않으면 지금처럼 글자만 있는 카드가 나옵니다.
   */
  featureImages?: string[];
  /** steps 카드 상단에 넣을 이미지 경로 (4:3 권장, steps 와 같은 순서) */
  stepImages?: string[];
  /** bullets 목록 옆에 놓을 이미지 경로 (4:3 권장) */
  bulletsImage?: string;
  /** 대표 약력 옆에 놓을 인물 이미지 (3:4 권장) */
  founderImage?: string;
}) {
  const t = await getTranslations({ locale, namespace: ns });

  const bullets = t.has("bullets") ? (t.raw("bullets") as string[]) : [];
  const features = t.has("features") ? (t.raw("features") as Pair[]) : [];
  const steps = t.has("steps") ? (t.raw("steps") as Pair[]) : [];
  const faq = t.has("faq") ? (t.raw("faq") as Faq[]) : [];
  // 대표 성함은 푸터와 같은 값을 씁니다 (관리자 → 회사 정보에서 한 번에 수정)
  const company = t.has("founderTitle") ? await getCompanyInfo() : null;

  return (
    <>
      <section className="border-b border-ink-200 bg-gradient-to-b from-brand-50 to-white">
        <Container className="py-14 sm:py-20">
          <div
            className={cn(
              heroImage && "grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]",
            )}
          >
            <div>
              {t.has("eyebrow") && <Badge tone="brand">{t("eyebrow")}</Badge>}
              {/* 제목의 줄바꿈은 문구에 의도적으로 넣어 둔 것이라 그대로 살립니다 */}
              <h1 className="mt-4 max-w-3xl whitespace-pre-line text-display text-brand-900">
                {highlight(t("title"), t.has("titleHighlight") ? t("titleHighlight") : null)}
              </h1>
              {t.has("description") && (
                <p className="mt-5 max-w-2xl leading-relaxed text-ink-700 lg:text-body-lg">
                  {t("description")}
                </p>
              )}
            </div>

            {heroImage && (
              <div className="relative aspect-video overflow-hidden rounded-card border border-ink-200 shadow-[var(--shadow-soft-lg)]">
                <Image
                  src={heroImage}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </div>
        </Container>
      </section>

      {t.has("missionTitle") && (
        <Section>
          <Container>
            <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.15fr]">
              <div>
                {t.has("missionEyebrow") && (
                  <p className="text-xs font-bold tracking-[0.14em] text-brand-600 uppercase">
                    {t("missionEyebrow")}
                  </p>
                )}
                <h2 className="mt-4 text-2xl font-bold whitespace-pre-line text-ink-900 sm:text-3xl sm:leading-snug">
                  {t("missionTitle")}
                </h2>
                <div className="mt-6 h-1 w-16 rounded-full bg-brand-500" />
                {t.has("missionBody") && (
                  <p className="mt-6 whitespace-pre-line leading-loose text-ink-700">
                    {t("missionBody")}
                  </p>
                )}
              </div>

              <div className="rounded-card border border-ink-200 bg-ink-50 p-6 sm:p-8">
                <p className="flex items-center gap-2 text-base font-bold text-ink-900">
                  <ShieldCheck className="size-5 shrink-0 text-brand-600" aria-hidden />
                  {t("missionCardTitle")}
                </p>

                <ul className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  {(t.raw("missionBarriers") as string[]).map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span
                        aria-hidden
                        className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-red-600"
                      >
                        !
                      </span>
                      <span className="text-sm leading-relaxed text-ink-700">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                {t.has("missionAnswer") && (
                  <p className="mt-8 rounded-xl border border-ink-200 bg-white p-5 text-sm leading-relaxed text-ink-700">
                    {t.rich("missionAnswer", {
                      b: (chunks) => (
                        <strong className="font-bold text-ink-900">{chunks}</strong>
                      ),
                    })}
                  </p>
                )}
              </div>
            </div>
          </Container>
        </Section>
      )}

      {t.has("intro") && (
        <Section className="pb-0">
          <Container className="max-w-3xl">
            <p className="whitespace-pre-line leading-loose text-ink-700">
              {t("intro")}
            </p>
          </Container>
        </Section>
      )}

      {t.has("founderTitle") && company && (
        <Section>
          <Container>
            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,22rem)_1fr]">
              {founderImage && (
                <div className="relative mx-auto aspect-3/4 w-full max-w-sm overflow-hidden rounded-card border border-ink-200 bg-ink-50 shadow-[var(--shadow-soft)]">
                  <Image
                    src={founderImage}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 352px, 90vw"
                    className="object-cover object-top"
                  />
                </div>
              )}

              <div>
                <p className="text-xs font-bold tracking-[0.14em] text-brand-600 uppercase">
                  {t("founderEyebrow")}
                </p>
                <h2 className="mt-4 text-2xl font-bold whitespace-pre-line text-ink-900 sm:text-3xl sm:leading-snug">
                  {t("founderTitle")}
                </h2>
                <p className="mt-5 text-label font-bold text-ink-900">
                  {company.ceo}
                  <span className="ml-2 font-medium text-ink-500">
                    {t("founderRole")}
                  </span>
                </p>
                <p className="mt-3 leading-relaxed text-ink-700">
                  {t("founderNote")}
                </p>

                <ol className="mt-8 space-y-px overflow-hidden rounded-card border border-ink-200 bg-ink-200">
                  {(t.raw("founderCareer") as Career[]).map((item) => (
                    <li
                      key={item.title}
                      className="flex flex-col gap-1 bg-white p-5 sm:flex-row sm:gap-6"
                    >
                      <span className="w-20 shrink-0 text-sm font-bold text-brand-700">
                        {item.label}
                      </span>
                      <span>
                        <span className="block text-[0.9375rem] font-bold text-ink-900">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-ink-700">
                          {item.body}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Container>
        </Section>
      )}

      {bullets.length > 0 && (
        <Section>
          <Container>
            <div
              className={cn(
                bulletsImage &&
                  "grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]",
              )}
            >
              <div>
                <SectionHeading title={t("bulletsTitle")} />
                <ul
                  className={cn(
                    "mt-8 grid gap-3",
                    // 이미지가 있으면 한 줄로 세워 사진과 나란히 놓습니다
                    !bulletsImage && "sm:grid-cols-2",
                  )}
                >
                  {bullets.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 rounded-card border border-ink-200 bg-white p-5"
                    >
                      <Check
                        className="mt-0.5 size-5 shrink-0 text-brand-700"
                        aria-hidden
                      />
                      <span className="text-[0.9375rem] leading-relaxed text-ink-700">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {bulletsImage && (
                <div className="relative aspect-4/3 overflow-hidden rounded-card border border-ink-200 shadow-[var(--shadow-soft)]">
                  <Image
                    src={bulletsImage}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 560px, 100vw"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </Container>
        </Section>
      )}

      {features.length > 0 && (
        <Section className="bg-ink-50">
          <Container>
            <SectionHeading title={t("featuresTitle")} />
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((item, index) => {
                const image = featureImages?.[index];
                return (
                  <li
                    key={item.title}
                    className="flex h-full flex-col overflow-hidden rounded-card border border-ink-200 bg-white"
                  >
                    {image && (
                      <div className="relative aspect-4/3 bg-ink-100">
                        <Image
                          src={image}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      <p className="text-base font-bold text-ink-900">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-ink-700">
                        {item.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Container>
        </Section>
      )}

      {steps.length > 0 && (
        <Section>
          <Container>
            <SectionHeading title={t("stepsTitle")} />
            <ol className="mt-10 grid gap-px overflow-hidden rounded-card border border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((item, index) => {
                const image = stepImages?.[index];
                return (
                  <li key={item.title} className="flex flex-col bg-white">
                    {image && (
                      <div className="relative aspect-4/3 bg-ink-100">
                        <Image
                          src={image}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                        {index + 1}
                      </span>
                      <p className="mt-4 text-base font-bold text-ink-900">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-ink-700">
                        {item.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Container>
        </Section>
      )}

      {faq.length > 0 && (
        <Section className="bg-ink-50">
          <Container className="max-w-3xl">
            <SectionHeading title={t("faqTitle")} />
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
      )}

      <CtaBand locale={locale} />
    </>
  );
}
