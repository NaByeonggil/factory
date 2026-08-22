"use client";

import { useTransition } from "react";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LABELS: Record<AppLocale, string> = { ko: "KR", en: "EN", zh: "CN" };

export function LocaleSwitcher({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1" role="group" aria-label="언어 선택">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              router.replace(
                // @ts-expect-error -- 동적 세그먼트는 현재 경로의 params를 그대로 사용
                { pathname, params },
                { locale },
              );
            })
          }
          className={cn(
            "rounded px-2 py-1 text-xs font-bold transition-colors",
            locale === current
              ? "bg-ink-900 text-white"
              : "text-ink-500 hover:text-ink-800",
          )}
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
