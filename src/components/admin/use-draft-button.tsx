"use client";

import { Button } from "@/components/ui/button";

/**
 * AI 답변 초안을 아래 「고객 공개 답변」 입력란에 채워 넣습니다.
 * 저장하지는 않습니다 — 담당자가 읽고 고친 뒤 직접 저장합니다.
 */
export function UseDraftButton({ draft, targetId }: { draft: string; targetId: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        const field = document.getElementById(targetId);
        if (!(field instanceof HTMLTextAreaElement)) return;
        if (field.value.trim() && !window.confirm("입력란에 작성 중인 내용을 초안으로 바꿀까요?")) return;
        field.value = draft.slice(0, field.maxLength > 0 ? field.maxLength : undefined);
        field.scrollIntoView({ behavior: "smooth", block: "center" });
        field.focus();
      }}
    >
      답변란에 불러오기
    </Button>
  );
}
