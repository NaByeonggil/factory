"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" size="sm" disabled={pending}>
      {pending ? "삭제 중…" : "삭제 확인"}
    </Button>
  );
}

/**
 * 2단계 삭제. window.confirm 대신 인라인 확인을 씁니다
 * (모달 다이얼로그는 자동화·접근성 양쪽에서 다루기 번거롭습니다).
 * id는 hidden 필드로 넘겨 JS가 없어도 동작합니다.
 */
export function DeleteButton({
  action,
  id,
  label = "삭제",
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label?: string;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <Button type="button" variant="ghost" onClick={() => setArmed(true)}>
        <Trash2 className="size-4" aria-hidden />
        {label}
      </Button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="text-sm font-semibold text-red-700">되돌릴 수 없습니다.</span>
      <ConfirmButton />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setArmed(false)}
      >
        취소
      </Button>
    </form>
  );
}
