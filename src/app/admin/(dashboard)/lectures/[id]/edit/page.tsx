import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  LectureForm,
  type LectureFormValues,
} from "@/components/admin/lecture-form";
import { toDateInput } from "@/lib/admin-defaults";

export const dynamic = "force-dynamic";

export default async function EditLecturePage(
  props: PageProps<"/admin/lectures/[id]/edit">,
) {
  const { id } = await props.params;

  const row = await prisma.lecture.findUnique({ where: { id } });
  if (!row) notFound();

  const values: LectureFormValues = {
    id: row.id,
    title: row.title,
    lectureAt: toDateInput(row.lectureAt),
    body: row.body,
    imageUrls: row.imageUrls,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">강의 정리 수정</h1>
      <LectureForm values={values} />
    </div>
  );
}
