"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { INGREDIENT_CATEGORIES } from "@/lib/constants";
import type { IngredientCard } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Thumbnail } from "@/components/site/media";

/**
 * 카테고리 필터를 클라이언트에서 처리해 목록 페이지를 정적 프리렌더로 유지합니다.
 * (서버에서 searchParams를 읽으면 라우트 전체가 동적으로 전환됩니다)
 */
export function IngredientFilter({ items }: { items: IngredientCard[] }) {
  const t = useTranslations("ingredients");
  const tCategory = useTranslations("category");
  const searchParams = useSearchParams();

  const raw = searchParams.get("category");
  const active = INGREDIENT_CATEGORIES.includes(
    raw as (typeof INGREDIENT_CATEGORIES)[number],
  )
    ? raw
    : null;

  const visible = active ? items.filter((i) => i.category === active) : items;

  return (
    <>
      <nav
        aria-label={t("title")}
        className="-mx-5 mt-8 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Link
          href="/ingredients"
          scroll={false}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
            !active
              ? "border-brand-600 bg-brand-50 text-brand-700"
              : "border-ink-200 text-ink-600 hover:border-ink-300",
          )}
        >
          {t("all")}
        </Link>
        {INGREDIENT_CATEGORIES.map((code) => (
          <Link
            key={code}
            href={{ pathname: "/ingredients", query: { category: code } }}
            scroll={false}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              active === code
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-ink-200 text-ink-600 hover:border-ink-300",
            )}
          >
            {tCategory(code)}
          </Link>
        ))}
      </nav>

      {visible.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-dashed border-ink-300 p-12 text-center text-sm text-ink-500">
          {t("empty")}
        </p>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/ingredients/${item.slug}`}
                className="flex h-full flex-col overflow-hidden rounded-card border border-ink-200 bg-white transition-shadow hover:shadow-[var(--shadow-soft)]"
              >
                <Thumbnail
                  src={item.thumbnailUrl}
                  alt={item.name}
                  seed={item.name}
                  className="rounded-none"
                  sizes="(min-width: 1264px) 368px, (min-width: 1024px) 31vw, (min-width: 640px) 47vw, 100vw"
                />
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <Badge tone="accent">{tCategory(item.category)}</Badge>
                  <p className="text-title text-ink-900">{item.name}</p>
                  {item.summary && (
                    <p className="line-clamp-3 text-sm leading-relaxed text-ink-700">
                      {item.summary}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
