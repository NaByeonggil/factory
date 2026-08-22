import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";
import { getAllIngredientSlugs, getIngredientBySlug } from "@/lib/queries";
import { routing } from "@/i18n/routing";
import { Thumbnail } from "@/components/site/media";

export const dynamic = "force-static";
export const revalidate = 600;

export async function generateStaticParams() {
  const slugs = await getAllIngredientSlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map(({ slug }) => ({ locale, slug })),
  );
}

export async function generateMetadata(
  props: PageProps<"/[locale]/ingredients/[slug]">,
): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const item = await getIngredientBySlug(slug, locale);
  if (!item) return {};

  return {
    title: item.t.seoTitle ?? item.t.name,
    description: item.t.seoDesc ?? item.t.summary ?? undefined,
    alternates: { canonical: `/${locale}/ingredients/${slug}` },
  };
}

export default async function IngredientDetailPage(
  props: PageProps<"/[locale]/ingredients/[slug]">,
) {
  const { locale, slug } = await props.params;

  const item = await getIngredientBySlug(slug, locale);
  if (!item) notFound();

  const t = await getTranslations({ locale, namespace: "ingredients" });
  const tCategory = await getTranslations({ locale, namespace: "category" });

  return (
    <Section>
      <Container className="max-w-3xl">
        {item.thumbnailUrl && (
          <Thumbnail
            src={item.thumbnailUrl}
            alt={item.t.name}
            seed={item.t.name}
            ratio="video"
            className="mb-8"
            sizes="(min-width: 768px) 720px, 100vw"
            priority
          />
        )}
        <Badge tone="brand">{tCategory(item.category)}</Badge>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
          {item.t.name}
        </h1>
        {item.t.summary && (
          <p className="mt-4 text-lg leading-relaxed text-ink-600">
            {item.t.summary}
          </p>
        )}

        <dl className="mt-10 grid gap-4 sm:grid-cols-2">
          {item.t.functionality && (
            <div className="rounded-2xl border border-ink-200 p-6">
              <dt className="text-sm font-bold text-ink-500">
                {t("functionality")}
              </dt>
              <dd className="mt-2 leading-relaxed text-ink-800">
                {item.t.functionality}
              </dd>
            </div>
          )}
          {item.t.dailyDose && (
            <div className="rounded-2xl border border-ink-200 p-6">
              <dt className="text-sm font-bold text-ink-500">{t("dailyDose")}</dt>
              <dd className="mt-2 leading-relaxed text-ink-800">
                {item.t.dailyDose}
              </dd>
            </div>
          )}
        </dl>

        {item.t.body && (
          <div className="mt-10 whitespace-pre-line leading-relaxed text-ink-700">
            {item.t.body}
          </div>
        )}

        <div className="mt-12 rounded-2xl bg-brand-50 p-8 text-center">
          <Button asChild size="lg">
            <Link href={{ pathname: "/inquiry", query: { ingredient: slug } }}>
              {t("relatedCta")}
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
