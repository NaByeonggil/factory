import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";
import { mergeTranslations } from "@/lib/admin-defaults";
import { getIngredientOptions } from "@/lib/admin-ingredient-options";

export const dynamic = "force-dynamic";

const FIELDS = ["title", "description", "seoTitle", "seoDesc"] as const;

export default async function EditProductPage(
  props: PageProps<"/admin/portfolio/[id]">,
) {
  const { id } = await props.params;
  const search = await props.searchParams;

  const [row, ingredients] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { translations: true, ingredients: { select: { id: true } } },
    }),
    getIngredientOptions(),
  ]);
  if (!row) notFound();

  const values: ProductFormValues = {
    id: row.id,
    slug: row.slug,
    serviceType: row.serviceType,
    formulation: row.formulation,
    imageUrls: row.imageUrls,
    ingredientIds: row.ingredients.map((i) => i.id),
    isFeatured: row.isFeatured,
    isPublished: row.isPublished,
    sortOrder: row.sortOrder,
    translations: mergeTranslations(FIELDS, row.translations),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">포트폴리오 수정</h1>
      <ProductForm
        values={values}
        ingredients={ingredients}
        saved={search.saved === "1"}
      />
    </div>
  );
}
