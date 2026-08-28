import { getTranslations } from "next-intl/server";
import { Lock, MessageSquare, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuoteSearch } from "@/components/quote/quote-search";
import { getQuoteBoard, type QuoteSearchField } from "@/lib/queries";
import { cn, formatDate, maskName } from "@/lib/utils";
import type { ServiceType } from "@/generated/prisma/enums";

/**
 * 견적문의 목록 — 식품·화장품·펫·원료 게시판이 함께 씁니다.
 * serviceType 을 넘기면 그 유형만(배열이면 그 유형들만) 모아 보여줍니다.
 */
export async function QuoteBoard({
  locale,
  page,
  keyword,
  field,
  serviceType,
  /** 검색·페이지 이동 링크의 기준 경로 */
  basePath,
  /** 「작성」 버튼이 여는 문의 폼 주소 */
  writeHref,
  writeLabel,
  emptyLabel,
}: {
  locale: string;
  page: number;
  keyword: string;
  field: QuoteSearchField;
  serviceType?: ServiceType | readonly ServiceType[];
  basePath: string;
  writeHref: string;
  writeLabel: string;
  emptyLabel: string;
}) {
  const t = await getTranslations({ locale, namespace: "quote" });
  const tService = await getTranslations({ locale, namespace: "service" });

  const {
    items,
    total,
    page: current,
    pageCount,
  } = await getQuoteBoard(
    locale,
    page,
    keyword ? { field, keyword } : undefined,
    serviceType,
  );

  /** 검색 결과 페이지 이동에도 조건이 유지되도록 */
  const pageHref = (n: number) =>
    keyword
      ? `${basePath}?field=${field}&q=${encodeURIComponent(keyword)}&page=${n}`
      : `${basePath}?page=${n}`;

  return (
    <>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <QuoteSearch field={field} keyword={keyword} basePath={basePath} />
        <Button asChild size="sm">
          <Link href={writeHref}>
            <Plus className="size-4" aria-hidden />
            {writeLabel}
          </Link>
        </Button>
      </div>

      {keyword && (
        <p className="mt-4 text-sm text-ink-600">
          {t("searchResult", { keyword, count: total })}
        </p>
      )}

      <div className="mt-4 overflow-x-auto rounded-card border border-ink-200">
        <table className="w-full min-w-3xl text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-xs font-semibold text-ink-500">
            <tr>
              <th className="w-20 px-4 py-3">{t("colNo")}</th>
              <th className="px-4 py-3">{t("colSubject")}</th>
              <th className="w-28 px-4 py-3">{t("colStatus")}</th>
              <th className="w-28 px-4 py-3">{t("colAuthor")}</th>
              <th className="w-32 px-4 py-3">{t("colDate")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 bg-white">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-ink-50/60">
                <td className="px-4 py-4 text-ink-400">{item.no}</td>

                <td className="px-4 py-4">
                  <Link
                    href={`/quote/${item.id}`}
                    className="flex flex-wrap items-center gap-x-2 gap-y-1"
                  >
                    <Lock className="size-3.5 shrink-0 text-ink-400" aria-hidden />
                    <span className="text-sm font-semibold text-brand-700">
                      [{tService(item.serviceType)}]
                    </span>
                    <span className="font-semibold text-ink-900">
                      {item.title ??
                        t("subject", { service: tService(item.serviceType) })}
                    </span>
                    {item.replyCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-500">
                        <MessageSquare className="size-3" aria-hidden />
                        {item.replyCount}
                      </span>
                    )}
                    {item.isReplied && (
                      <Badge tone="success" className="ml-1">
                        {t("replied")}
                      </Badge>
                    )}
                  </Link>
                </td>

                <td className="px-4 py-4 text-ink-600">
                  {t(`status${item.status}`)}
                </td>

                <td className="px-4 py-4 text-ink-500">
                  {maskName(item.authorName)}
                </td>

                <td className="px-4 py-4 whitespace-nowrap text-ink-400">
                  <time dateTime={item.createdAt.toISOString()}>
                    {formatDate(item.createdAt, locale)}
                  </time>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-ink-400">
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-ink-400">
        {t("maskedNotice")} {t("searchNotice")}
      </p>

      {pageCount > 1 && (
        <nav
          aria-label={t("title")}
          className="mt-10 flex items-center justify-center gap-1"
        >
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={pageHref(n)}
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
    </>
  );
}
