import {
  LectureForm,
  type LectureFormValues,
} from "@/components/admin/lecture-form";

export default function NewLecturePage() {
  const values: LectureFormValues = {
    id: null,
    title: "",
    lectureAt: "",
    body: "",
    imageUrls: [],
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">강의 정리 추가</h1>
      <LectureForm values={values} />
    </div>
  );
}
