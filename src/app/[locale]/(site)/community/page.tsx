import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function CommunityIndexPage(
  props: PageProps<"/[locale]/community">,
) {
  const { locale } = await props.params;
  redirect({ href: "/community/news", locale });
}
