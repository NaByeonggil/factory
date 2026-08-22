import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";

/** 모든 하위 페이지 하단 공통 전환 배너 */
export async function CtaBand({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <Section className="bg-brand-600 text-white">
      <Container className="flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
        <div>
          <h2 className="text-headline">{t("ctaTitle")}</h2>
          <p className="mt-3 text-body-lg text-brand-100">{t("ctaDescription")}</p>
        </div>
        <Button
          asChild
          size="lg"
          className="shrink-0 bg-white text-brand-700 shadow-sm hover:bg-brand-50"
        >
          <Link href="/inquiry">{tNav("inquiry")}</Link>
        </Button>
      </Container>
    </Section>
  );
}
