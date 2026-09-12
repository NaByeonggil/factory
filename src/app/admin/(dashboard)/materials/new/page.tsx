import {
  IngredientForm,
  type IngredientFormValues,
} from "@/components/admin/ingredient-form";
import { emptyTranslations } from "@/lib/admin-defaults";
import { MATERIAL_CATEGORIES } from "@/lib/constants";

const FIELDS = ["name", "summary", "functionality", "dailyDose", "body", "seoTitle", "seoDesc"] as const;

export default function NewMaterialIngredientPage() {
  const values: IngredientFormValues = {
    id: null,
    slug: "",
    category: "PATENT",
    thumbnailUrl: "",
    isFeatured: false,
    isPublished: true,
    sortOrder: 0,
    translations: emptyTranslations(FIELDS),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">공급 특허원료 추가</h1>
      <p className="text-sm text-ink-500">
        저장하면「공급가능 특허원료 문의」상단 카드와「보유 원료」목록에 함께
        나타납니다.
      </p>
      <IngredientForm
        values={values}
        basePath="/admin/materials"
        categories={MATERIAL_CATEGORIES}
      />
    </div>
  );
}
