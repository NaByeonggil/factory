import { PopupForm, type PopupFormValues } from "@/components/admin/popup-form";
import { emptyTranslations } from "@/lib/admin-defaults";

const FIELDS = ["title", "body", "linkLabel"] as const;

export default function NewPopupPage() {
  const values: PopupFormValues = {
    id: null,
    slug: "",
    imageUrl: "",
    linkUrl: "",
    startsAt: "",
    endsAt: "",
    isPublished: true,
    sortOrder: 0,
    translations: emptyTranslations(FIELDS),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">팝업 작성</h1>
      <PopupForm values={values} />
    </div>
  );
}
