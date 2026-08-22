import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketingPage } from "@/components/site/marketing-page";
import { routing } from "@/i18n/routing";

const NS = "pages.material";

export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/service/material">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: NS });
  const title = t("title").replace(/\n/g, " ");
  return {
    title,
    description: t("description"),
    alternates: { canonical: `/${locale}/service/material` },
  };
}

export default async function Page(props: PageProps<"/[locale]/service/material">) {
  const { locale } = await props.params;
  return <MarketingPage locale={locale} ns={NS} />;
}
