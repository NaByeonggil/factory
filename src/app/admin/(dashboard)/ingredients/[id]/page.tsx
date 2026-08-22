import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  IngredientForm,
  type IngredientFormValues,
} from "@/components/admin/ingredient-form";
import { mergeTranslations } from "@/lib/admin-defaults";

export const dynamic = "force-dynamic";

const FIELDS = ["name", "summary", "functionality", "dailyDose", "body", "seoTitle", "seoDesc"] as const;

export default async function EditIngredientPage(
  props: PageProps<"/admin/ingredients/[id]">,
) {
  const { id } = await props.params;
  const search = await props.searchParams;

  const row = await prisma.ingredient.findUnique({
    where: { id },
    include: { translations: true },
  });
  if (!row) notFound();

  const values: IngredientFormValues = {
    id: row.id,
    slug: row.slug,
    category: row.category,
    thumbnailUrl: row.thumbnailUrl ?? "",
    isFeatured: row.isFeatured,
    isPublished: row.isPublished,
    sortOrder: row.sortOrder,
    translations: mergeTranslations(FIELDS, row.translations),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">원료 수정</h1>
        <Link
          href={`/ko/ingredients/${row.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-brand-700 hover:underline"
        >
          공개 페이지 보기 ↗
        </Link>
      </div>
      <IngredientForm values={values} saved={search.saved === "1"} />
    </div>
  );
}
