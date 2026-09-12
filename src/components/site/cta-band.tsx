import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";

/**
 * 모든 하위 페이지 하단 공통 전환 배너.
 *
 * 문구는 기본적으로 홈 카피(home.cta*)를 쓰고, 흐름이 다른 페이지는
 * 그 페이지에서 번역한 문구를 넘겨 배너만 갈아끼웁니다.
 */
export async function CtaBand({
  locale,
  /** 유형이 정해진 페이지에서는 그 유형이 선택된 문의 폼으로 보냅니다 */
  href = "/inquiry",
  title,
  description,
  label,
}: {
  locale: string;
  href?: string;
  /** 비우면 홈 카피를 그대로 씁니다 */
  title?: string;
  description?: string;
  label?: string;
}) {
  const t = await getTranslations({ locale, namespace: "home" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <Section className="bg-brand-600 text-white">
      <Container className="flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
        <div>
          <h2 className="text-headline">{title ?? t("ctaTitle")}</h2>
          <p className="mt-3 text-body-lg text-brand-100">
            {description ?? t("ctaDescription")}
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="shrink-0 bg-white text-brand-700 shadow-sm hover:bg-brand-50"
        >
          <Link href={href}>{label ?? tNav("inquiry")}</Link>
        </Button>
      </Container>
    </Section>
  );
}
