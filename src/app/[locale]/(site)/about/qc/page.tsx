import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketingPage } from "@/components/site/marketing-page";
import { routing } from "@/i18n/routing";

const NS = "pages.qc";

export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/about/qc">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: NS });
  const title = t("title").replace(/\n/g, " ");
  return {
    title,
    description: t("description"),
    alternates: { canonical: `/${locale}/about/qc` },
  };
}

export default async function Page(props: PageProps<"/[locale]/about/qc">) {
  const { locale } = await props.params;
  return <MarketingPage locale={locale} ns={NS} />;
}
