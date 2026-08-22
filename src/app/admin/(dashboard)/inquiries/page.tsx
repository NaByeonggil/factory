import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { INQUIRY_STATUSES } from "@/lib/constants";
import { formatDateTime, maskPhone } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { InquiryStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminInquiriesPage(
  props: PageProps<"/admin/inquiries">,
) {
  const search = await props.searchParams;
  const rawStatus = typeof search.status === "string" ? search.status : undefined;
  const status = INQUIRY_STATUSES.includes(
    rawStatus as (typeof INQUIRY_STATUSES)[number],
  )
    ? (rawStatus as InquiryStatus)
    : undefined;
  const q = typeof search.q === "string" ? search.q.trim() : "";
  const page = Math.max(1, Number(search.page ?? 1) || 1);

  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { company: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
            { naverKeyword: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        company: true,
        phone: true,
        serviceType: true,
        status: true,
        naverKeyword: true,
        utmSource: true,
        createdAt: true,
      },
    }),
    prisma.inquiry.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">생산문의</h1>
        <p className="text-sm text-ink-500">총 {total.toLocaleString()}건</p>
      </div>

      <form className="flex flex-wrap gap-2" action="/admin/inquiries">
        <input
          name="q"
          defaultValue={q}
          placeholder="이름 · 회사 · 연락처 · 키워드"
          className="h-10 min-w-56 flex-1 rounded-lg border border-ink-300 px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-lg border border-ink-300 px-3 text-sm"
        >
          <option value="">전체 상태</option>
          {INQUIRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-lg bg-ink-900 px-4 text-sm font-semibold text-white"
        >
          검색
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-3xl text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase text-ink-500">
            <tr>
              <th className="px-4 py-3 font-semibold">상태</th>
              <th className="px-4 py-3 font-semibold">담당자명</th>
              <th className="px-4 py-3 font-semibold">회사</th>
              <th className="px-4 py-3 font-semibold">연락처</th>
              <th className="px-4 py-3 font-semibold">유형</th>
              <th className="px-4 py-3 font-semibold">유입 키워드</th>
              <th className="px-4 py-3 font-semibold">접수일시</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-ink-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/inquiries/${row.id}`}>
                    <Badge tone={row.status === "NEW" ? "accent" : "neutral"}>
                      {row.status}
                    </Badge>
                  </Link>
                </td>
                <td className="px-4 py-3 font-semibold">
                  <Link href={`/admin/inquiries/${row.id}`}>{row.name}</Link>
                </td>
                <td className="px-4 py-3 text-ink-600">{row.company ?? "-"}</td>
                <td className="px-4 py-3 text-ink-600">{maskPhone(row.phone)}</td>
                <td className="px-4 py-3 text-ink-600">{row.serviceType}</td>
                <td className="px-4 py-3 text-ink-600">
                  {row.naverKeyword ?? row.utmSource ?? "-"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-400">
                  {formatDateTime(row.createdAt)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-ink-400">
                  결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="flex justify-center gap-1" aria-label="페이지">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={{
                pathname: "/admin/inquiries",
                query: { ...(q ? { q } : {}), ...(status ? { status } : {}), page: p },
              }}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-semibold",
                p === page ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-100",
              )}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
