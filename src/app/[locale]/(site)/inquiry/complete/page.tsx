import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CircleCheckBig } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";
import { ConversionTags } from "@/components/tracking/analytics";

// 접수번호(?id=)를 함께 안내하므로 요청마다 렌더링합니다
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/[locale]/inquiry/complete">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "inquiry" });
  return {
    title: t("completeTitle"),
    // 전환 페이지는 색인 대상이 아님
    robots: { index: false, follow: false },
  };
}

export default async function InquiryCompletePage(
  props: PageProps<"/[locale]/inquiry/complete">,
) {
  const { locale } = await props.params;
  const search = await props.searchParams;
  const t = await getTranslations({ locale, namespace: "inquiry" });
  const tQuote = await getTranslations({ locale, namespace: "quote" });

  const id = typeof search.id === "string" ? search.id : null;

  return (
    <Section>
      <Container className="max-w-xl text-center">
        <CircleCheckBig className="mx-auto size-14 text-brand-600" aria-hidden />
        <h1 className="mt-6 text-2xl font-bold text-ink-900 sm:text-3xl">
          {t("completeTitle")}
        </h1>
        <p className="mt-4 leading-relaxed text-ink-600">
          {t("completeDescription")}
        </p>

        {id && (
          <div className="mt-8 rounded-2xl border border-ink-200 bg-ink-50 p-6">
            <p className="text-xs font-semibold text-ink-500">
              {tQuote("receiptTitle")}
            </p>
            <p className="mt-1 font-mono text-sm font-bold break-all text-ink-900">
              {id}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              {tQuote("receiptHint")}
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href={`/quote/${id}`}>{tQuote("goBoard")}</Link>
            </Button>
          </div>
        )}

        <Button asChild size="lg" variant="outline" className="mt-8">
          <Link href="/">{t("completeHome")}</Link>
        </Button>
      </Container>
      {/* 광고 전환 태그는 이 페이지에서만 발화 */}
      <ConversionTags />
    </Section>
  );
}
