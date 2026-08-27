import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Lock, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import { CtaBand } from "@/components/site/cta-band";
import { CommunityTabs } from "@/components/site/community-tabs";
import { getQuestions } from "@/lib/queries";
import { formatDate, maskName } from "@/lib/utils";
import { cn } from "@/lib/utils";

// 고객이 남긴 글이 바로 보여야 하므로 정적 캐시를 쓰지 않습니다
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/[locale]/community/qna">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "qna" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `/${locale}/community/qna` },
  };
}

export default async function QnaListPage(
  props: PageProps<"/[locale]/community/qna">,
) {
  const { locale } = await props.params;
  const search = await props.searchParams;
  const t = await getTranslations({ locale, namespace: "qna" });

  const page = Number(typeof search.page === "string" ? search.page : "1") || 1;
  const { items, page: current, pageCount } = await getQuestions(locale, page);

  return (
    <>
      <Section>
        <Container>
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
          />

          <CommunityTabs locale={locale} active="qna" />

          <div className="mt-6 flex justify-end">
            <Button asChild size="sm">
              <Link href="/community/qna/new">
                <Plus className="size-4" aria-hidden />
                {t("write")}
              </Link>
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-ink-300 p-12 text-center text-sm text-ink-500">
              {t("listEmpty")}
            </p>
          ) : (
            <ul className="mt-6 divide-y divide-ink-200 border-y border-ink-200">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/community/qna/${item.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 py-5 transition-colors hover:bg-ink-50/60"
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2 font-semibold text-ink-900">
                      {item.isSecret && (
                        <Lock
                          className="size-4 shrink-0 text-ink-400"
                          aria-label={t("secret")}
                        />
                      )}
                      <span className="truncate">{item.title}</span>
                    </span>
                    <Badge tone={item.isAnswered ? "success" : "neutral"}>
                      {item.isAnswered ? t("answered") : t("pending")}
                    </Badge>
                    <span className="w-24 text-sm text-ink-500">
                      {maskName(item.authorName)}
                    </span>
                    <time
                      dateTime={item.createdAt.toISOString()}
                      className="w-28 text-sm text-ink-400"
                    >
                      {formatDate(item.createdAt, locale)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-xs text-ink-400">{t("maskedNotice")}</p>

          {pageCount > 1 && (
            <nav
              aria-label={t("title")}
              className="mt-10 flex items-center justify-center gap-1"
            >
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={`/community/qna?page=${n}`}
                  aria-current={n === current ? "page" : undefined}
                  className={cn(
                    "min-w-9 rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors",
                    n === current
                      ? "bg-brand-600 text-white"
                      : "text-ink-600 hover:bg-ink-100",
                  )}
                >
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </Container>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
