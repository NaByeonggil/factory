import { QuasiDrugLimitsView } from "@/components/admin/quasi-drug-limits-view";
import { QUASI_DRUG_CHAPTERS, QUASI_DRUG_META } from "@/lib/quasi-drug-limits";

/**
 * 먹는 의약외품 배합한도 참고자료.
 *
 * 고시를 정리한 읽기 전용 자료라 DB를 쓰지 않습니다. 값이 개정되면
 * `src/lib/quasi-drug-limits.ts` 를 고치고 확인 시점을 함께 갱신하세요.
 */
export default function AdminQuasiDrugLimitsPage() {
  const chapters = QUASI_DRUG_CHAPTERS.length;
  const tables = QUASI_DRUG_CHAPTERS.reduce(
    (sum, chapter) =>
      sum +
      chapter.sections.reduce(
        (inner, section) => inner + (section.tables?.length ?? 0),
        0,
      ),
    2, // 개요 · 장별 비교
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{QUASI_DRUG_META.title}</h1>
        <p className="mt-1 text-sm text-ink-500">
          내복용 {chapters}개 장 · 표 {tables}개 · 관리자 전용 참고자료로,
          공개 페이지에는 노출되지 않습니다
        </p>
      </div>

      <QuasiDrugLimitsView />
    </div>
  );
}
