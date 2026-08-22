import {
  IngredientForm,
  type IngredientFormValues,
} from "@/components/admin/ingredient-form";
import { emptyTranslations } from "@/lib/admin-defaults";

const FIELDS = ["name", "summary", "functionality", "dailyDose", "body", "seoTitle", "seoDesc"] as const;

export default function NewIngredientPage() {
  const values: IngredientFormValues = {
    id: null,
    slug: "",
    category: "HOT_TREND",
    thumbnailUrl: "",
    isFeatured: false,
    isPublished: true,
    sortOrder: 0,
    translations: emptyTranslations(FIELDS),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">원료 추가</h1>
      <IngredientForm values={values} />
    </div>
  );
}
