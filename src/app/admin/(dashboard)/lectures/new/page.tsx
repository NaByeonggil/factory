import {
  LectureForm,
  type LectureFormValues,
} from "@/components/admin/lecture-form";
import { LECTURE_STATUSES } from "@/lib/constants";
import { llmConfigured } from "@/lib/llm";

/** 칸반 열의 「+」에서 들어오면 그 열의 단계로 시작합니다 */
export default async function NewLecturePage(
  props: PageProps<"/admin/lectures/new">,
) {
  const { status } = await props.searchParams;
  const initial = LECTURE_STATUSES.find((value) => value === status);

  const values: LectureFormValues = {
    id: null,
    title: "",
    lectureAt: "",
    body: "",
    imageUrls: [],
    status: initial ?? "ATTENDED",
    tags: [],
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">강의 정리 추가</h1>
      <LectureForm values={values} aiEnabled={llmConfigured()} />
    </div>
  );
}
