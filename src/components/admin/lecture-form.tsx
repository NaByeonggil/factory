"use client";

import Link from "next/link";
import { useActionState } from "react";
import { deleteLecture, saveLecture } from "@/actions/content";
import {
  AdminCard,
  FormError,
  SubmitButton,
} from "@/components/admin/form-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { ImageListField } from "@/components/admin/image-field";
import { Field, Input, Textarea } from "@/components/ui/field";
import type { ActionState } from "@/lib/validations/admin";

export type LectureFormValues = {
  id: string | null;
  title: string;
  /** YYYY-MM-DD */
  lectureAt: string;
  body: string;
  imageUrls: string[];
};

/** 강의 정리 작성·수정. 저장하면 보기 화면으로 돌아갑니다. */
export function LectureForm({ values }: { values: LectureFormValues }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveLecture,
    {},
  );

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        {/* id는 다른 폼과 같이 hidden 필드로 넘깁니다 (JS 없이도 동작) */}
        {values.id && <input type="hidden" name="id" value={values.id} />}
        <FormError state={state} />

        <AdminCard title="강의 정보">
          <div className="grid gap-5 sm:grid-cols-[1fr_12rem]">
            <Field
              label="강의 제목"
              htmlFor="title"
              required
              error={state.fieldErrors?.title}
            >
              <Input
                id="title"
                name="title"
                defaultValue={values.title}
                maxLength={200}
                placeholder="예) 개별인정형 원료 인정 절차 실무"
                required
              />
            </Field>

            <Field
              label="강의일"
              htmlFor="lectureAt"
              hint="선택"
              error={state.fieldErrors?.lectureAt}
            >
              <Input
                id="lectureAt"
                name="lectureAt"
                type="date"
                defaultValue={values.lectureAt}
              />
            </Field>
          </div>

          <Field
            label="강의 내용 정리"
            htmlFor="body"
            required
            hint="줄바꿈은 그대로 유지됩니다 · 최대 50,000자"
            error={state.fieldErrors?.body}
          >
            <Textarea
              id="body"
              name="body"
              defaultValue={values.body}
              maxLength={50000}
              className="min-h-96"
              placeholder={"핵심 내용\n- …\n\n적용할 점\n- …"}
              required
            />
          </Field>
        </AdminCard>

        <AdminCard
          title="자료 사진"
          description="강의 자료·판서 사진을 올려 두면 보기 화면에서 뷰어로 크게 볼 수 있습니다. 관리자 전용 저장소에 올라가 로그인해야 열립니다. png · jpg · webp, 장당 4MB 이하."
        >
          <ImageListField
            name="imageUrls"
            label="이미지 첨부"
            hint="최대 30장 · 화살표로 순서 변경"
            defaultValue={values.imageUrls}
            max={30}
            scope="adm"
          />
        </AdminCard>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton />
          <Link
            href={values.id ? `/admin/lectures/${values.id}` : "/admin/lectures"}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-ink-600 hover:bg-ink-100"
          >
            취소
          </Link>
        </div>
      </form>

      {/* 삭제는 별도 form이라 저장 form 밖에 둡니다 (form 중첩은 무효) */}
      {values.id && (
        <div className="flex justify-end border-t border-ink-200 pt-6">
          <DeleteButton action={deleteLecture} id={values.id} />
        </div>
      )}
    </div>
  );
}
