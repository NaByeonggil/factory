"use client";

import { useActionState } from "react";
import { answerQuestion, deleteQuestion } from "@/actions/qna";
import {
  AdminCard,
  FormError,
  SavedNotice,
  SubmitButton,
} from "@/components/admin/form-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { Field, Textarea } from "@/components/ui/field";
import type { ActionState } from "@/lib/validations/admin";

/** 문답 답변 작성. 답변을 저장하면 공개 게시판에 바로 반영됩니다. */
export function AnswerForm({
  id,
  answerBody,
  isPublished,
  answeredAt,
  answeredBy,
  saved,
}: {
  id: string;
  answerBody: string;
  isPublished: boolean;
  answeredAt: string | null;
  answeredBy: string | null;
  saved?: boolean;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    answerQuestion,
    {},
  );

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="id" value={id} />
        <SavedNotice show={Boolean(saved)} />
        <FormError state={state} />

        <AdminCard
          title="답변"
          description="저장하면 공개 문답 게시판에 그대로 노출됩니다. 비밀글이면 비밀번호를 아는 작성자만 볼 수 있습니다."
        >
          <Field label="답변 내용" htmlFor="answerBody" hint="비우면 미답변 상태로 되돌아갑니다">
            <Textarea
              id="answerBody"
              name="answerBody"
              defaultValue={answerBody}
              maxLength={5000}
              className="min-h-52"
            />
          </Field>

          {answeredAt && (
            <p className="text-sm text-ink-500">
              최근 답변 {answeredAt}
              {answeredBy && ` · ${answeredBy}`}
            </p>
          )}

          <label className="flex items-center gap-2.5 border-t border-ink-100 pt-5 text-sm font-semibold text-ink-800">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={isPublished}
              className="size-4 accent-brand-600"
            />
            게시판에 공개 (스팸이면 체크를 해제해 숨깁니다)
          </label>
        </AdminCard>

        <SubmitButton label="답변 저장" />
      </form>

      {/* 삭제는 별도 form이므로 저장 form 밖에 둡니다 (form 중첩은 무효) */}
      <div className="flex justify-end border-t border-ink-200 pt-6">
        <DeleteButton action={deleteQuestion} id={id} />
      </div>
    </div>
  );
}
