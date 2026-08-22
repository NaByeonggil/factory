import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketingPage } from "@/components/site/marketing-page";
import { routing } from "@/i18n/routing";

const NS = "pages.cdmo";

export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/service/cdmo">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: NS });
  const title = t("title").replace(/\n/g, " ");
  return {
    title,
    description: t("description"),
    alternates: { canonical: `/${locale}/service/cdmo` },
  };
}

export default async function Page(props: PageProps<"/[locale]/service/cdmo">) {
  const { locale } = await props.params;
  return <MarketingPage locale={locale} ns={NS} />;
}
