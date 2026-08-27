"use client";

import { useActionState } from "react";
import { replyToInquiry } from "@/actions/quote";
import { FormError, SubmitButton } from "@/components/admin/form-shell";
import { Field, Textarea } from "@/components/ui/field";
import type { ActionState } from "@/lib/validations/admin";

/**
 * 고객 공개 답변. 견적문의 게시판에서 작성자가 비밀번호로 열어 보는 내용이라
 * 내부 상담 메모와 분리해서 관리합니다.
 */
export function ReplyForm({
  id,
  replyBody,
  repliedAt,
  repliedBy,
  hasEmail,
  saved,
}: {
  id: string;
  replyBody: string;
  repliedAt: string | null;
  repliedBy: string | null;
  hasEmail: boolean;
  saved?: boolean;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    replyToInquiry,
    {},
  );

  return (
    <section className="rounded-2xl border border-brand-200 bg-brand-50/60 p-6">
      <h2 className="font-bold text-brand-800">고객 공개 답변</h2>
      <p className="mt-1 text-sm text-ink-600">
        견적문의 게시판에서 작성자가 비밀번호로 열람합니다. 상담 메모와 달리 고객에게
        그대로 노출됩니다.
      </p>

      <form action={formAction} className="mt-5 space-y-4">
        <input type="hidden" name="id" value={id} />
        {saved && (
          <p className="rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            답변이 저장되었습니다.
          </p>
        )}
        <FormError state={state} />

        <Field
          label="답변 내용"
          htmlFor="replyBody"
          hint="비우면 답변 대기 상태로 되돌아갑니다"
        >
          <Textarea
            id="replyBody"
            name="replyBody"
            defaultValue={replyBody}
            maxLength={5000}
            className="min-h-44 bg-white"
          />
        </Field>

        <label className="flex items-center gap-2.5 text-sm font-semibold text-ink-800">
          <input
            type="checkbox"
            name="notifyCustomer"
            defaultChecked={hasEmail}
            disabled={!hasEmail}
            className="size-4 accent-brand-600"
          />
          {hasEmail
            ? "저장 시 고객에게 메일로 알림 (답변 내용은 메일에 담지 않습니다)"
            : "이메일이 없어 알림을 보낼 수 없습니다"}
        </label>

        {repliedAt && (
          <p className="text-sm text-ink-500">
            최근 답변 {repliedAt}
            {repliedBy && ` · ${repliedBy}`}
          </p>
        )}

        <SubmitButton label="답변 저장" />
      </form>
    </section>
  );
}
