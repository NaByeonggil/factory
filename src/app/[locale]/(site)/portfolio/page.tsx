import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import { CtaBand } from "@/components/site/cta-band";
import { getProducts } from "@/lib/queries";
import { routing } from "@/i18n/routing";
import { Thumbnail } from "@/components/site/media";

export const dynamic = "force-static";
export const revalidate = 600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/portfolio">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "collections" });
  return {
    title: t("portfolioTitle"),
    description: t("portfolioDescription"),
    alternates: { canonical: `/${locale}/portfolio` },
  };
}

export default async function PortfolioPage(
  props: PageProps<"/[locale]/portfolio">,
) {
  const { locale } = await props.params;

  const t = await getTranslations({ locale, namespace: "collections" });
  const tService = await getTranslations({ locale, namespace: "service" });
  const tOptions = await getTranslations({ locale, namespace: "options" });
  const items = await getProducts(locale);

  return (
    <>
      <Section>
        <Container>
          <SectionHeading
            title={t("portfolioTitle")}
            description={t("portfolioDescription")}
          />

          {items.length === 0 ? (
            <p className="mt-12 rounded-2xl border border-dashed border-ink-300 p-12 text-center text-sm text-ink-500">
              {t("portfolioEmpty")}
            </p>
          ) : (
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/portfolio/${item.slug}`}
                    className="flex h-full flex-col overflow-hidden rounded-card border border-ink-200 bg-white transition-shadow hover:shadow-[var(--shadow-soft)]"
                  >
                    <Thumbnail
                      src={item.imageUrls[0] ?? null}
                      alt={item.title}
                      seed={item.title}
                      ratio="video"
                      className="rounded-none"
                      sizes="(min-width: 1264px) 368px, (min-width: 1024px) 31vw, (min-width: 640px) 47vw, 100vw"
                    />
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="brand">{tService(item.serviceType)}</Badge>
                        <Badge>{tOptions(`formulation.${item.formulation}`)}</Badge>
                      </div>
                      <p className="mt-1 text-title text-ink-900">{item.title}</p>
                      {item.description && (
                        <p className="line-clamp-3 text-sm leading-relaxed text-ink-700">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
