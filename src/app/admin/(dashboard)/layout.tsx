import Link from "next/link";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Inbox,
  FlaskConical,
  Package,
  Newspaper,
  MessageSquareWarning,
  LogOut,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { logout } from "@/actions/admin";

const NAV = [
  { href: "/admin", label: "대시보드", Icon: LayoutDashboard },
  { href: "/admin/inquiries", label: "생산문의", Icon: Inbox },
  { href: "/admin/ingredients", label: "보유 원료", Icon: FlaskConical },
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
      <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-200 bg-white lg:flex">
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
        <header className="flex items-center gap-4 border-b border-ink-200 bg-white px-5 py-3 lg:hidden">
          <p className="font-extrabold text-brand-700">헬씨팜바이오 Admin</p>
          <nav className="ml-auto flex gap-3 text-sm">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} className="text-ink-600">
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
