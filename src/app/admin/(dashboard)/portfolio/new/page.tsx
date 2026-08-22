import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";
import { emptyTranslations } from "@/lib/admin-defaults";
import { getIngredientOptions } from "@/lib/admin-ingredient-options";

export const dynamic = "force-dynamic";

const FIELDS = ["title", "description", "seoTitle", "seoDesc"] as const;

export default async function NewProductPage() {
  const ingredients = await getIngredientOptions();

  const values: ProductFormValues = {
    id: null,
    slug: "",
    serviceType: "OEM",
    formulation: "TABLET",
    imageUrls: "",
    ingredientIds: [],
    isFeatured: false,
    isPublished: true,
    sortOrder: 0,
    translations: emptyTranslations(FIELDS),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">포트폴리오 추가</h1>
      <ProductForm values={values} ingredients={ingredients} />
    </div>
  );
}
