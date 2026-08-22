import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";

/** 모든 하위 페이지 하단 공통 전환 배너 */
export async function CtaBand({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <Section className="bg-brand-700 text-white">
      <Container className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{t("ctaTitle")}</h2>
          <p className="mt-2 text-brand-100">{t("ctaDescription")}</p>
        </div>
        <Button asChild size="lg" className="bg-white text-brand-700 hover:bg-brand-50">
          <Link href="/inquiry">{tNav("inquiry")}</Link>
        </Button>
      </Container>
    </Section>
  );
}
