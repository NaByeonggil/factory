import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { deletePost } from "@/actions/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  NEWS: "소식",
  NOTICE: "공지",
  ESG: "ESG 경영",
  FACTORY_TOUR: "공장 투어",
};

export default async function AdminPostsPage() {
  const session = await getSession();
  // 삭제는 ADMIN 권한에서만 노출합니다 (deletePost 도 같은 권한을 요구합니다)
  const canDelete = session?.role === "ADMIN";

  const rows = await prisma.post.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      category: true,
      publishedAt: true,
      updatedAt: true,
      translations: { select: { locale: true, title: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">게시물</h1>
          <p className="mt-1 text-sm text-ink-500">총 {rows.length}건</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/posts/new">
            <Plus className="size-4" aria-hidden />
            게시물 작성
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-3xl text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase text-ink-500">
            <tr>
              <th className="px-4 py-3 font-semibold">제목 (KO)</th>
              <th className="px-4 py-3 font-semibold">slug</th>
              <th className="px-4 py-3 font-semibold">분류</th>
              <th className="px-4 py-3 font-semibold">번역</th>
              <th className="px-4 py-3 font-semibold">상태</th>
              <th className="px-4 py-3 font-semibold">게시일</th>
              <th className="px-4 py-3 font-semibold">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((row) => {
              const ko = row.translations.find((t) => t.locale === "KO");
              const locales = row.translations.map((t) => t.locale);
              return (
                <tr key={row.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/admin/posts/${row.id}`}>
                      {ko?.title ?? row.translations[0]?.title ?? "(제목 없음)"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">
                    {row.slug}
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {CATEGORY_LABELS[row.category]}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">
                    {["KO", "EN", "ZH"]
                      .map((l) => (locales.includes(l as "KO") ? l : "·"))
                      .join(" ")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={row.publishedAt ? "success" : "neutral"}>
                      {row.publishedAt ? "게시됨" : "초안"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-400">
                    {row.publishedAt ? formatDate(row.publishedAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/posts/${row.id}`}
                        className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                      >
                        <Pencil className="mr-1 inline size-3" aria-hidden />
                        수정
                      </Link>
                      {canDelete && (
                        <DeleteButton action={deletePost} id={row.id} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-ink-400">
                  등록된 게시물이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
