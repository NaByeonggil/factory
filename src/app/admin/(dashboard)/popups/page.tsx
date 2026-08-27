import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { POPUP_SIZE } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** 공개 여부 + 노출 기간을 합친 현재 상태 */
function popupState(row: {
  isPublished: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}) {
  if (!row.isPublished) return { tone: "neutral" as const, label: "비공개" };
  const now = Date.now();
  if (row.startsAt && row.startsAt.getTime() > now)
    return { tone: "brand" as const, label: "예약" };
  if (row.endsAt && row.endsAt.getTime() < now)
    return { tone: "neutral" as const, label: "종료" };
  return { tone: "success" as const, label: "노출중" };
}

function period(startsAt: Date | null, endsAt: Date | null) {
  if (!startsAt && !endsAt) return "상시";
  return `${startsAt ? formatDateTime(startsAt) : "제한 없음"} ~ ${
    endsAt ? formatDateTime(endsAt) : "제한 없음"
  }`;
}

export default async function AdminPopupsPage() {
  const rows = await prisma.popup.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      isPublished: true,
      startsAt: true,
      endsAt: true,
      sortOrder: true,
      translations: { select: { locale: true, title: true } },
    },
  });

  const live = rows.filter((row) => popupState(row).label === "노출중").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">팝업 공지</h1>
          <p className="mt-1 text-sm text-ink-500">
            총 {rows.length}건 · 현재 노출 {live}건 · 핸드폰 규격{" "}
            {POPUP_SIZE.width}×{POPUP_SIZE.height}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/popups/new">
            <Plus className="size-4" aria-hidden />
            팝업 작성
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-3xl text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase text-ink-500">
            <tr>
              <th className="px-4 py-3 font-semibold">제목 (KO)</th>
              <th className="px-4 py-3 font-semibold">slug</th>
              <th className="px-4 py-3 font-semibold">번역</th>
              <th className="px-4 py-3 font-semibold">노출 기간</th>
              <th className="px-4 py-3 font-semibold">순서</th>
              <th className="px-4 py-3 font-semibold">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((row) => {
              const ko = row.translations.find((t) => t.locale === "KO");
              const locales = row.translations.map((t) => t.locale);
              const state = popupState(row);
              return (
                <tr key={row.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/admin/popups/${row.id}`}>
                      {ko?.title ?? row.translations[0]?.title ?? "(제목 없음)"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">
                    {row.slug}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">
                    {["KO", "EN", "ZH"]
                      .map((l) => (locales.includes(l as "KO") ? l : "·"))
                      .join(" ")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-500">
                    {period(row.startsAt, row.endsAt)}
                  </td>
                  <td className="px-4 py-3 text-ink-500">{row.sortOrder}</td>
                  <td className="px-4 py-3">
                    <Badge tone={state.tone}>{state.label}</Badge>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-ink-400">
                  등록된 팝업이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
