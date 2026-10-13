import Link from "next/link";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Inbox,
  FlaskConical,
  BadgeCheck,
  Package,
  ReceiptText,
  Pill,
  GraduationCap,
  Newspaper,
  MessageSquareWarning,
  Calculator,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { logout } from "@/actions/admin";
import { datahealthConfigured } from "@/lib/datahealth";

/** 견적·원가 시스템(datahealth)으로 넘어가는 주소 — 자동 로그인을 거칩니다 */
const DATAHEALTH_HREF = "/admin/go/datahealth";

const NAV = [
  { href: "/admin", label: "대시보드", Icon: LayoutDashboard },
  { href: "/admin/inquiries", label: "생산문의", Icon: Inbox },
  { href: "/admin/ingredients", label: "보유 원료", Icon: FlaskConical },
  { href: "/admin/materials", label: "공급 특허원료", Icon: BadgeCheck },
  { href: "/admin/quote-items", label: "견적서 항목", Icon: ReceiptText },
  { href: "/admin/quasi-drug-limits", label: "의약외품 배합한도", Icon: Pill },
  { href: "/admin/lectures", label: "약사 강의 정리", Icon: GraduationCap },
  { href: "/admin/portfolio", label: "포트폴리오", Icon: Package },
  { href: "/admin/posts", label: "게시물", Icon: Newspaper },
  { href: "/admin/popups", label: "팝업 공지", Icon: MessageSquareWarning },
];

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-200 bg-white lg:flex print:hidden">
        <div className="border-b border-ink-200 px-6 py-5">
          <p className="text-lg font-extrabold text-brand-700">헬씨팜바이오</p>
          <p className="text-xs text-ink-400">Admin</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
          {/* 다른 앱으로 나가는 링크라 <a> 로 둡니다. Link 는 미리 불러오면서 1회용 토큰을 써버립니다 */}
          {datahealthConfigured() && (
            <a
              href={DATAHEALTH_HREF}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center gap-2.5 rounded-lg border-t border-ink-100 px-3 py-2.5 pt-4 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              <Calculator className="size-4" aria-hidden />
              견적·원가 시스템
              <ExternalLink className="ml-auto size-3.5 text-ink-400" aria-hidden />
            </a>
          )}
        </nav>
        <div className="border-t border-ink-200 p-3">
          <p className="px-3 py-2 text-xs text-ink-500">
            {session?.name} · {session?.role}
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-600 hover:bg-ink-50"
            >
              <LogOut className="size-4" aria-hidden />
              로그아웃
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center gap-4 border-b border-ink-200 bg-white px-5 py-3 lg:hidden print:hidden">
          <p className="font-extrabold text-brand-700">헬씨팜바이오 Admin</p>
          <nav className="ml-auto flex gap-3 text-sm">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} className="text-ink-600">
                {label}
              </Link>
            ))}
            {datahealthConfigured() && (
              <a href={DATAHEALTH_HREF} target="_blank" rel="noreferrer" className="text-ink-600">
                견적·원가
              </a>
            )}
          </nav>
        </header>
        <main className="p-5 lg:p-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
