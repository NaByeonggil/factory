import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { POST_CATEGORY_SLUGS } from "@/lib/queries";
import { cn } from "@/lib/utils";

/** 커뮤니티 상단 탭 — 게시물 카테고리 4종 */
export async function CommunityTabs({
  locale,
  active,
}: {
  locale: string;
  /** 현재 카테고리 slug */
  active: string;
}) {
  const t = await getTranslations({ locale, namespace: "collections" });

  const tabs = Object.entries(POST_CATEGORY_SLUGS).map(([slug, value]) => ({
    slug,
    href: `/community/${slug}`,
    label: t(`category${value}`),
  }));

  return (
    <nav aria-label={t("communityTitle")} className="mt-8 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.slug}
          href={tab.href}
          aria-current={tab.slug === active ? "page" : undefined}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
            tab.slug === active
              ? "border-brand-600 bg-brand-50 text-brand-700"
              : "border-ink-200 text-ink-600 hover:border-ink-300",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
