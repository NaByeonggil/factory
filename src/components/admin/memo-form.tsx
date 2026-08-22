"use client";

import { useRef } from "react";
import { addInquiryMemo } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";

export function MemoForm({ id }: { id: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addInquiryMemo(id, formData);
        formRef.current?.reset();
      }}
      className="space-y-3"
    >
      <label htmlFor="memo" className="sr-only">
        상담 메모
      </label>
      <Textarea
        id="memo"
        name="content"
        required
        className="min-h-24"
        placeholder="통화 내용, 견적 조건 등을 기록하세요."
      />
      <Button type="submit" size="sm">
        메모 저장
      </Button>
    </form>
  );
}
