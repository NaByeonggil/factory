import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  IngredientTable,
  type IngredientRow,
} from "@/components/admin/ingredient-table";
import { MATERIAL_CATEGORIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * 「공급가능 특허원료 문의」(/quote/material) 상단 카드 목록 관리.
 *
 * 별도 테이블이 아니라 보유 원료 중 특허·개별인정형 분류를 모아 보는
 * 화면입니다. 여기서 고친 내용은 「보유 원료」와 공개 페이지에 함께 반영됩니다.
 */
export default async function AdminMaterialIngredientsPage() {
  const session = await getSession();
  const rows = await prisma.ingredient.findMany({
    where: { category: { in: [...MATERIAL_CATEGORIES] } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      category: true,
      thumbnailUrl: true,
      isPublished: true,
      isFeatured: true,
      sortOrder: true,
      translations: { select: { locale: true, name: true } },
    },
  });

  const items: IngredientRow[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    category: row.category,
    thumbnailUrl: row.thumbnailUrl,
    isPublished: row.isPublished,
    isFeatured: row.isFeatured,
    sortOrder: row.sortOrder,
    name:
      row.translations.find((t) => t.locale === "KO")?.name ??
      row.translations[0]?.name ??
      "(이름 없음)",
    locales: row.translations.map((t) => t.locale),
  }));

  const published = items.filter((item) => item.isPublished).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">공급 특허원료 관리</h1>
          <p className="mt-1 text-sm text-ink-500">
            총 {items.length}건 · 공개 {published}건 ·「공급가능 특허원료 문의」
            상단 카드에 공개 건만 순서대로 노출됩니다
          </p>
          <Link
            href="/ko/quote/material"
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-sm font-semibold text-brand-700 hover:underline"
          >
            공개 페이지 보기 ↗
          </Link>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/materials/new">
            <Plus className="size-4" aria-hidden />
            원료 추가
          </Link>
        </Button>
      </div>

      <IngredientTable
        rows={items}
        canDelete={session?.role === "ADMIN"}
        basePath="/admin/materials"
        categories={MATERIAL_CATEGORIES}
        scoped
        emptyLabel="등록된 특허·개별인정형 원료가 없습니다."
      />
    </div>
  );
}
