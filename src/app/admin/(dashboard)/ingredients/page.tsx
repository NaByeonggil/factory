import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  HOT_TREND: "HOT 트렌드",
  INDIVIDUAL_APPROVED: "개별인정형",
  PATENT: "특허보유",
  BASIC: "기본",
  SUPERFOOD: "슈퍼푸드",
};

export default async function AdminIngredientsPage() {
  const rows = await prisma.ingredient.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      category: true,
      isPublished: true,
      isFeatured: true,
      sortOrder: true,
      updatedAt: true,
      translations: { select: { locale: true, name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">원료 관리</h1>
          <p className="mt-1 text-sm text-ink-500">총 {rows.length}건</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/ingredients/new">
            <Plus className="size-4" aria-hidden />
            원료 추가
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-3xl text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase text-ink-500">
            <tr>
              <th className="px-4 py-3 font-semibold">원료명 (KO)</th>
              <th className="px-4 py-3 font-semibold">slug</th>
              <th className="px-4 py-3 font-semibold">분류</th>
              <th className="px-4 py-3 font-semibold">번역</th>
              <th className="px-4 py-3 font-semibold">상태</th>
              <th className="px-4 py-3 font-semibold">순서</th>
              <th className="px-4 py-3 font-semibold">수정일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((row) => {
              const ko = row.translations.find((t) => t.locale === "KO");
              const locales = row.translations.map((t) => t.locale);
              return (
                <tr key={row.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/admin/ingredients/${row.id}`}>
                      {ko?.name ?? row.translations[0]?.name ?? "(제목 없음)"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">
                    {row.slug}
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {CATEGORY_LABELS[row.category]}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-ink-500">
                      {["KO", "EN", "ZH"]
                        .map((l) => (locales.includes(l as "KO") ? l : "·"))
                        .join(" ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <Badge tone={row.isPublished ? "success" : "neutral"}>
                        {row.isPublished ? "공개" : "비공개"}
                      </Badge>
                      {row.isFeatured && <Badge tone="accent">메인</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-400">{row.sortOrder}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-400">
                    {formatDate(row.updatedAt)}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-ink-400">
                  등록된 원료가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
