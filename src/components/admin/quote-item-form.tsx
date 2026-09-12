"use client";

import Link from "next/link";
import { useActionState } from "react";
import { deleteQuoteItem, saveQuoteItem } from "@/actions/content";
import {
  AdminCard,
  FormError,
  SavedNotice,
  SubmitButton,
} from "@/components/admin/form-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { Field, Input, Textarea } from "@/components/ui/field";
import type { ActionState } from "@/lib/validations/admin";

export type QuoteItemFormValues = {
  id: string | null;
  title: string;
  body: string;
  sortOrder: number;
};

/** 견적서 항목 작성·수정. 관리자만 보는 화면이라 번역 탭이 없습니다. */
export function QuoteItemForm({
  values,
  saved,
}: {
  values: QuoteItemFormValues;
  saved?: boolean;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveQuoteItem,
    {},
  );

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        {/* id는 팝업·원료 폼과 같이 hidden 필드로 넘깁니다 (JS 없이도 동작) */}
        {values.id && <input type="hidden" name="id" value={values.id} />}
        <SavedNotice show={Boolean(saved)} />
        <FormError state={state} />

        <AdminCard
          title="항목 내용"
          description="견적서를 쓸 때 이 순서대로 확인합니다. 고객에게는 보이지 않습니다."
        >
          <div className="grid gap-5 sm:grid-cols-[1fr_10rem]">
            <Field
              label="항목 이름"
              htmlFor="title"
              required
              hint="최대 60자"
              error={state.fieldErrors?.title}
            >
              <Input
                id="title"
                name="title"
                defaultValue={values.title}
                maxLength={60}
                placeholder="제품 사양"
                required
              />
            </Field>

            <Field
              label="정렬 순서"
              htmlFor="sortOrder"
              hint="작을수록 앞"
              error={state.fieldErrors?.sortOrder}
            >
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={values.sortOrder}
              />
            </Field>
          </div>

          <Field
            label="내용"
            htmlFor="body"
            required
            hint="최대 1000자"
            error={state.fieldErrors?.body}
          >
            <Textarea
              id="body"
              name="body"
              defaultValue={values.body}
              maxLength={1000}
              placeholder="제형, 1일 섭취량, 내용량, 포장 형태"
              required
            />
          </Field>
        </AdminCard>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton />
          <Link
            href="/admin/quote-items"
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-ink-600 hover:bg-ink-100"
          >
            목록으로
          </Link>
        </div>
      </form>

      {/* 삭제는 별도 form이라 저장 form 밖에 둡니다 (form 중첩은 무효) */}
      {values.id && (
        <div className="flex justify-end border-t border-ink-200 pt-6">
          <DeleteButton action={deleteQuoteItem} id={values.id} />
        </div>
      )}
    </div>
  );
}
