import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PopupForm, type PopupFormValues } from "@/components/admin/popup-form";
import { mergeTranslations, toDatetimeLocal } from "@/lib/admin-defaults";

export const dynamic = "force-dynamic";

const FIELDS = ["title", "body", "linkLabel"] as const;

export default async function EditPopupPage(
  props: PageProps<"/admin/popups/[id]">,
) {
  const { id } = await props.params;
  const search = await props.searchParams;

  const row = await prisma.popup.findUnique({
    where: { id },
    include: { translations: true },
  });
  if (!row) notFound();

  const values: PopupFormValues = {
    id: row.id,
    slug: row.slug,
    imageUrl: row.imageUrl ?? "",
    linkUrl: row.linkUrl ?? "",
    startsAt: toDatetimeLocal(row.startsAt),
    endsAt: toDatetimeLocal(row.endsAt),
    isPublished: row.isPublished,
    sortOrder: row.sortOrder,
    translations: mergeTranslations(FIELDS, row.translations),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">팝업 수정</h1>
      <PopupForm values={values} saved={search.saved === "1"} />
    </div>
  );
}
