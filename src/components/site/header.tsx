"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Menu, X, ChevronDown } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";

type NavItem = { key: string; href: string; children?: { key: string; href: string }[] };

/**
 * 상단 메뉴 + 언어 전환 + CTA 가 한 줄에 들어가는 최소 폭에서 가로 메뉴를
 * 켭니다. 라벨을 바꾸거나 항목을 늘리면 폭을 다시 재고 아래 기준값을
 * 조정해야 합니다(줄바꿈이 생깁니다).
 */
const NAV: NavItem[] = [
  {
    key: "about",
    href: "/about",
    children: [
      { key: "aboutCompany", href: "/about" },
      { key: "aboutRnd", href: "/about/rnd" },
      { key: "aboutQc", href: "/about/qc" },
    ],
  },
  {
    key: "catalog",
    href: "/ingredients",
    children: [
      { key: "ingredients", href: "/ingredients" },
      { key: "portfolio", href: "/portfolio" },
    ],
  },
  { key: "board", href: "/quote" },
  { key: "cosmeticQuote", href: "/quote/cosmetic" },
  { key: "petQuoteTop", href: "/quote/pet" },
  { key: "materialQuote", href: "/quote/material" },
  { key: "marketing", href: "/marketing" },
];

export function Header() {
  const t = useTranslations("nav");
  const tMeta = useTranslations("meta");
  const pathname = usePathname();
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <Container className="flex h-16 items-center justify-between gap-6 min-[1360px]:h-20">
        <Link href="/" className="text-brand-700" aria-label={tMeta("siteName")}>
          <Logo label={tMeta("siteName")} markClassName="size-7 lg:size-8" />
        </Link>

        <nav aria-label="주 메뉴" className="hidden min-[1360px]:flex min-[1360px]:items-center min-[1360px]:gap-1">
          {NAV.map((item) => (
            <div key={item.key} className="group relative">
              <Link
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-2 text-[0.9375rem] font-semibold text-ink-700 transition-colors hover:text-brand-700",
                  pathname.startsWith(item.href) && "text-brand-700",
                )}
              >
                {t(item.key)}
                {item.children && <ChevronDown className="size-4" aria-hidden />}
              </Link>
              {item.children && (
                <div className="invisible absolute left-0 top-full w-52 rounded-xl border border-ink-200 bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  {item.children.map((child) => (
                    <Link
                      key={child.key}
                      href={child.href}
                      className="block rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 hover:text-brand-700"
                    >
                      {t(child.key)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="hidden items-center gap-3 min-[1360px]:flex">
          <LocaleSwitcher current={locale} />
          <Button asChild size="sm" className="whitespace-nowrap">
            <Link href="/inquiry">{t("inquiry")}</Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label="메뉴 열기"
          className="rounded-md p-2 text-ink-700 min-[1360px]:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </Container>

      {open && (
        <div id="mobile-nav" className="border-t border-ink-200 bg-white min-[1360px]:hidden">
          <Container className="flex flex-col gap-1 py-4">
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                aria-label="메뉴 닫기"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-ink-500"
              >
                <X className="size-5" />
              </button>
            </div>
            {NAV.flatMap((item) =>
              item.children
                ? [
                    <p
                      key={item.key}
                      className="px-2 pt-3 text-xs font-bold uppercase tracking-wide text-ink-400"
                    >
                      {t(item.key)}
                    </p>,
                    ...item.children.map((child) => (
                      <Link
                        key={child.key}
                        href={child.href}
                        onClick={() => setOpen(false)}
                        className="rounded-lg px-2 py-2.5 text-[0.9375rem] font-medium text-ink-800"
                      >
                        {t(child.key)}
                      </Link>
                    )),
                  ]
                : [
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-2 py-2.5 text-[0.9375rem] font-semibold text-ink-800"
                    >
                      {t(item.key)}
                    </Link>,
                  ],
            )}
            <div className="mt-4 flex items-center justify-between border-t border-ink-200 pt-4">
              <LocaleSwitcher current={locale} />
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
