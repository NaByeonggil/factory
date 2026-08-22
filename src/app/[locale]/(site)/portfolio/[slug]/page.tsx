import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Container, Section } from "@/components/ui/section";
import { CtaBand } from "@/components/site/cta-band";
import { getAllProductSlugs, getProductBySlug } from "@/lib/queries";
import { routing } from "@/i18n/routing";
import { Gallery } from "@/components/site/media";

export const dynamic = "force-static";
export const revalidate = 600;

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map(({ slug }) => ({ locale, slug })),
  );
}

export async function generateMetadata(
  props: PageProps<"/[locale]/portfolio/[slug]">,
): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const item = await getProductBySlug(slug, locale);
  if (!item) return {};
  return {
    title: item.t.seoTitle ?? item.t.title,
    description: item.t.seoDesc ?? item.t.description ?? undefined,
    alternates: { canonical: `/${locale}/portfolio/${slug}` },
  };
}

export default async function PortfolioDetailPage(
  props: PageProps<"/[locale]/portfolio/[slug]">,
) {
  const { locale, slug } = await props.params;

  const item = await getProductBySlug(slug, locale);
  if (!item) notFound();

  const t = await getTranslations({ locale, namespace: "collections" });
  const tService = await getTranslations({ locale, namespace: "service" });
  const tOptions = await getTranslations({ locale, namespace: "options" });

  const ingredients = item.ingredients
    .map((ing) => ({ slug: ing.slug, name: ing.translations[0]?.name }))
    .filter((ing): ing is { slug: string; name: string } => Boolean(ing.name));

  return (
    <>
      <Section>
        <Container className="max-w-3xl">
          {item.imageUrls.length > 0 && (
            <div className="mb-8">
              <Gallery images={item.imageUrls} alt={item.t.title} />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{tService(item.serviceType)}</Badge>
            <Badge>{tOptions(`formulation.${item.formulation}`)}</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            {item.t.title}
          </h1>
          {item.t.description && (
            <p className="mt-5 whitespace-pre-line text-base leading-loose text-ink-700">
              {item.t.description}
            </p>
          )}

          <dl className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-ink-200 p-6">
              <dt className="text-sm font-bold text-ink-500">{t("serviceLabel")}</dt>
              <dd className="mt-2 text-ink-800">{tService(item.serviceType)}</dd>
            </div>
            <div className="rounded-2xl border border-ink-200 p-6">
              <dt className="text-sm font-bold text-ink-500">
                {t("formulationLabel")}
              </dt>
              <dd className="mt-2 text-ink-800">
                {tOptions(`formulation.${item.formulation}`)}
              </dd>
            </div>
          </dl>

          {ingredients.length > 0 && (
            <div className="mt-6 rounded-2xl border border-ink-200 p-6">
              <p className="text-sm font-bold text-ink-500">
                {t("ingredientsLabel")}
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {ingredients.map((ing) => (
                  <li key={ing.slug}>
                    <Link
                      href={`/ingredients/${ing.slug}`}
                      className="rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-700"
                    >
                      {ing.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Container>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
