"use client";

import { useState, type ReactNode } from "react";
import { DB_LOCALES, type DbLocale } from "@/lib/validations/admin";
import { cn } from "@/lib/utils";

const LABELS: Record<DbLocale, string> = {
  KO: "한국어",
  EN: "English",
  ZH: "中文",
};

/**
 * 언어 탭. 모든 패널을 DOM에 유지한 채 표시만 전환하므로
 * 제출 시 세 언어의 입력값이 모두 FormData에 포함됩니다.
 */
export function LocaleTabs({
  filled,
  children,
}: {
  /** 값이 채워진 언어 표시용 */
  filled?: Partial<Record<DbLocale, boolean>>;
  children: (locale: DbLocale) => ReactNode;
}) {
  const [active, setActive] = useState<DbLocale>("KO");

  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b border-ink-200">
        {DB_LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            role="tab"
            aria-selected={active === locale}
            onClick={() => setActive(locale)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
              active === locale
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-ink-500 hover:text-ink-800",
            )}
          >
            {LABELS[locale]}
            {filled?.[locale] && (
              <span
                aria-label="작성됨"
                className="size-1.5 rounded-full bg-brand-500"
              />
            )}
          </button>
        ))}
      </div>

      {DB_LOCALES.map((locale) => (
        <div
          key={locale}
          role="tabpanel"
          hidden={active !== locale}
          className="space-y-5 pt-6"
        >
          {children(locale)}
        </div>
      ))}
    </div>
  );
}
