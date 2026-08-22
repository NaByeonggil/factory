import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function loadDashboard() {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [total, newCount, last30, byStatus, byKeyword, recent] = await Promise.all([
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.inquiry.count({ where: { createdAt: { gte: since } } }),
    prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.inquiry.groupBy({
      by: ["naverKeyword"],
      where: { naverKeyword: { not: null }, createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { naverKeyword: "desc" } },
      take: 10,
    }),
    prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        company: true,
        serviceType: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return { total, newCount, last30, byStatus, byKeyword, recent };
}

export default async function AdminDashboardPage() {
  let data: Awaited<ReturnType<typeof loadDashboard>> | null = null;
  let dbError: string | null = null;

  try {
    data = await loadDashboard();
  } catch (error) {
    dbError = error instanceof Error ? error.message : String(error);
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <p className="font-bold">데이터베이스에 연결할 수 없습니다.</p>
        <p className="mt-2">
          <code>.env</code>의 <code>DATABASE_URL</code>을 설정하고{" "}
          <code>npx prisma migrate deploy</code>를 실행하세요.
        </p>
        <pre className="mt-3 overflow-x-auto text-xs opacity-70">{dbError}</pre>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">대시보드</h1>

      <dl className="grid gap-4 sm:grid-cols-3">
        {[
          ["전체 문의", data.total],
          ["미처리(신규)", data.newCount],
          ["최근 30일", data.last30],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-ink-200 bg-white p-6"
          >
            <dt className="text-sm text-ink-500">{label}</dt>
            <dd className="mt-2 text-3xl font-extrabold text-ink-900">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-ink-200 bg-white p-6">
          <h2 className="font-bold">상태별 현황</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {data.byStatus.map((row) => (
              <li key={row.status} className="flex justify-between">
                <span className="text-ink-600">{row.status}</span>
                <span className="font-semibold">{row._count._all}</span>
              </li>
            ))}
            {data.byStatus.length === 0 && (
              <li className="text-ink-400">데이터가 없습니다.</li>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-ink-200 bg-white p-6">
          <h2 className="font-bold">
            유입 키워드 TOP 10
            <span className="ml-2 text-xs font-normal text-ink-400">최근 30일</span>
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {data.byKeyword.map((row) => (
              <li key={row.naverKeyword} className="flex justify-between gap-4">
                <span className="truncate text-ink-600">{row.naverKeyword}</span>
                <span className="shrink-0 font-semibold">{row._count._all}</span>
              </li>
            ))}
            {data.byKeyword.length === 0 && (
              <li className="text-ink-400">
                아직 광고 유입 데이터가 없습니다.
              </li>
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-ink-200 bg-white">
        <div className="flex items-center justify-between border-b border-ink-200 px-6 py-4">
          <h2 className="font-bold">최근 문의</h2>
          <Link
            href="/admin/inquiries"
            className="text-sm font-semibold text-brand-700"
          >
            전체 보기
          </Link>
        </div>
        <ul className="divide-y divide-ink-100">
          {data.recent.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/inquiries/${row.id}`}
                className="flex flex-wrap items-center gap-3 px-6 py-4 text-sm hover:bg-ink-50"
              >
                <Badge tone={row.status === "NEW" ? "accent" : "neutral"}>
                  {row.status}
                </Badge>
                <span className="font-semibold">{row.name}</span>
                <span className="text-ink-500">{row.company ?? "-"}</span>
                <span className="text-ink-500">{row.serviceType}</span>
                <span className="ml-auto text-ink-400">
                  {formatDateTime(row.createdAt)}
                </span>
              </Link>
            </li>
          ))}
          {data.recent.length === 0 && (
            <li className="px-6 py-10 text-center text-sm text-ink-400">
              접수된 문의가 없습니다.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
