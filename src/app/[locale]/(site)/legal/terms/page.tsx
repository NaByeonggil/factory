import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/site/legal-page";
import { routing } from "@/i18n/routing";

export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/legal/terms">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return {
    title: t("terms.title"),
    alternates: { canonical: `/${locale}/legal/terms` },
  };
}

export default async function Page(props: PageProps<"/[locale]/legal/terms">) {
  const { locale } = await props.params;
  return <LegalPage locale={locale} doc="terms" />;
}
