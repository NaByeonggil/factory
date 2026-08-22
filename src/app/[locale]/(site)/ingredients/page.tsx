import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import { CtaBand } from "@/components/site/cta-band";
import { IngredientFilter } from "@/components/site/ingredient-filter";
import { getIngredients } from "@/lib/queries";
import { routing } from "@/i18n/routing";

export const dynamic = "force-static";
export const revalidate = 600;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/ingredients">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "ingredients" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `/${locale}/ingredients` },
  };
}

export default async function IngredientsPage(
  props: PageProps<"/[locale]/ingredients">,
) {
  const { locale } = await props.params;

  const t = await getTranslations({ locale, namespace: "ingredients" });
  const items = await getIngredients(locale);

  return (
    <>
      <Section>
        <Container>
          <SectionHeading title={t("title")} description={t("description")} />
          <Suspense fallback={<div className="mt-10 h-64 animate-pulse rounded-2xl bg-ink-100" />}>
            <IngredientFilter items={items} />
          </Suspense>
        </Container>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
