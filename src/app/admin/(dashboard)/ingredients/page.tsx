import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  IngredientTable,
  type IngredientRow,
} from "@/components/admin/ingredient-table";

export const dynamic = "force-dynamic";

export default async function AdminIngredientsPage() {
  const session = await getSession();
  const rows = await prisma.ingredient.findMany({
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
  const featured = items.filter((item) => item.isFeatured).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">보유 원료 관리</h1>
          <p className="mt-1 text-sm text-ink-500">
            총 {items.length}건 · 공개 {published}건 · 메인 노출 {featured}건 ·
            공개 사이트「당사 보유 원료」에 그대로 반영됩니다
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/ingredients/new">
            <Plus className="size-4" aria-hidden />
            원료 추가
          </Link>
        </Button>
      </div>

      <IngredientTable rows={items} canDelete={session?.role === "ADMIN"} />
    </div>
  );
}
