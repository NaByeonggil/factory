import Link from "next/link";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { deleteProduct } from "@/actions/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { Thumbnail } from "@/components/site/media";
import { formatDate } from "@/lib/utils";
import ko from "@/messages/ko.json";

export const dynamic = "force-dynamic";

const SERVICE_LABELS: Record<string, string> = ko.service;
const FORMULATION_LABELS: Record<string, string> = ko.options.formulation;

export default async function AdminPortfolioPage() {
  const session = await getSession();
  // 삭제는 ADMIN 권한에서만 노출합니다 (deleteProduct 도 같은 권한을 요구합니다)
  const canDelete = session?.role === "ADMIN";

  const rows = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      serviceType: true,
      formulation: true,
      isPublished: true,
      isFeatured: true,
      imageUrls: true,
      updatedAt: true,
      translations: { select: { locale: true, title: true } },
      _count: { select: { ingredients: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">포트폴리오 · 생산 제품</h1>
          <p className="mt-1 text-sm text-ink-500">
            총 {rows.length}건 · 공개로 저장한 제품이 사이트 포트폴리오 메뉴에 올라갑니다
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/portfolio/new">
            <Plus className="size-4" aria-hidden />
            생산 제품 등록
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-3xl text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase text-ink-500">
            <tr>
              <th className="w-16 px-4 py-3 font-semibold">이미지</th>
              <th className="px-4 py-3 font-semibold">제품명 (KO)</th>
              <th className="px-4 py-3 font-semibold">slug</th>
              <th className="px-4 py-3 font-semibold">방식 / 제형</th>
              <th className="px-4 py-3 font-semibold">원료</th>
              <th className="px-4 py-3 font-semibold">상태</th>
              <th className="px-4 py-3 font-semibold">수정일</th>
              <th className="px-4 py-3 font-semibold">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((row) => {
              const title =
                row.translations.find((t) => t.locale === "KO")?.title ??
                row.translations[0]?.title ??
                "(제목 없음)";
              return (
                <tr key={row.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3">
                    <Thumbnail
                      src={row.imageUrls[0] ?? null}
                      alt=""
                      seed={title}
                      ratio="square"
                      className="size-12 rounded-lg"
                      sizes="48px"
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/admin/portfolio/${row.id}`}>{title}</Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">
                    {row.slug}
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {SERVICE_LABELS[row.serviceType] ?? row.serviceType} /{" "}
                    {FORMULATION_LABELS[row.formulation] ?? row.formulation}
                  </td>
                  <td className="px-4 py-3 text-ink-400">
                    {row._count.ingredients}개
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <Badge tone={row.isPublished ? "success" : "neutral"}>
                        {row.isPublished ? "공개" : "비공개"}
                      </Badge>
                      {row.isFeatured && <Badge tone="accent">메인</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-400">
                    {formatDate(row.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/portfolio/${row.id}`}
                        className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                      >
                        <Pencil className="mr-1 inline size-3" aria-hidden />
                        수정
                      </Link>
                      {row.isPublished && (
                        <a
                          href={`/ko/portfolio/${row.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                        >
                          <ExternalLink className="mr-1 inline size-3" aria-hidden />
                          보기
                        </a>
                      )}
                      {canDelete && (
                        <DeleteButton action={deleteProduct} id={row.id} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-ink-400">
                  등록된 생산 제품이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
