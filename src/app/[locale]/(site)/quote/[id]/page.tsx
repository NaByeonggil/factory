import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Lock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Container, Section } from "@/components/ui/section";
import { QuoteGate } from "@/components/quote/quote-gate";
import { getQuoteDetailForStaff, getQuoteSummary } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { boardPathFor } from "@/lib/constants";
import { formatDate, maskName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/[locale]/quote/[id]">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "quote" });
  return {
    title: t("title"),
    // 고객 문의는 색인하지 않습니다
    robots: { index: false, follow: false },
  };
}

export default async function QuoteDetailPage(
  props: PageProps<"/[locale]/quote/[id]">,
) {
  const { locale, id } = await props.params;
  const t = await getTranslations({ locale, namespace: "quote" });
  const tService = await getTranslations({ locale, namespace: "service" });

  const summary = await getQuoteSummary(id);
  if (!summary) notFound();

  // 관리자로 로그인한 상태면 고객 비밀번호 없이 바로 열고 답글도 답니다
  const session = await getSession();
  const staffDetail = session ? await getQuoteDetailForStaff(id) : null;

  return (
    <Section>
      <Container className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={summary.isReplied ? "success" : "neutral"}>
            {summary.isReplied ? t("replied") : t("waiting")}
          </Badge>
          <Badge tone="brand">{t(`status${summary.status}`)}</Badge>
          <Badge tone={staffDetail ? "accent" : "neutral"}>
            <Lock className="mr-1 size-3" aria-hidden />
            {staffDetail ? t("staffView") : t("password")}
          </Badge>
        </div>

        <h1 className="mt-4 text-2xl font-bold text-ink-900 sm:text-3xl">
          <span className="mr-2 text-brand-700">
            [{tService(summary.serviceType)}]
          </span>
          {summary.title ??
            t("subject", { service: tService(summary.serviceType) })}
        </h1>

        <p className="mt-3 text-sm text-ink-500">
          {maskName(summary.authorName)}
          {summary.company && ` · ${maskName(summary.company)}`} ·{" "}
          <time dateTime={summary.createdAt.toISOString()}>
            {formatDate(summary.createdAt, locale)}
          </time>
        </p>

        <p className="mt-2 font-mono text-xs text-ink-400">
          {t("receiptTitle")} {summary.id}
        </p>

        <div className="mt-6 border-t border-ink-200" />

        <QuoteGate
          id={summary.id}
          locale={locale}
          hasPassword={summary.hasPassword}
          staffDetail={staffDetail}
        />

        <div className="mt-10 border-t border-ink-200 pt-6">
          <Link
            href={boardPathFor(summary.serviceType)}
            className="text-sm font-semibold text-ink-600 hover:text-brand-700"
          >
            ← {t("backToList")}
          </Link>
        </div>
      </Container>
    </Section>
  );
}
