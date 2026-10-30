"use client";

import Link from "next/link";
import { Sparkles, Undo2 } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import {
  deleteLecture,
  organizeLectureBody,
  saveLecture,
} from "@/actions/content";
import {
  AdminCard,
  FormError,
  SubmitButton,
} from "@/components/admin/form-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { ImageListField } from "@/components/admin/image-field";
import { Button } from "@/components/ui/button";
import { CheckChip, Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  LECTURE_STATUSES,
  LECTURE_STATUS_LABELS,
  LECTURE_TAGS,
  type LectureStatusCode,
} from "@/lib/constants";
import type { ActionState } from "@/lib/validations/admin";

export type LectureFormValues = {
  id: string | null;
  title: string;
  /** YYYY-MM-DD */
  lectureAt: string;
  body: string;
  imageUrls: string[];
  status: LectureStatusCode;
  tags: string[];
};

/** 강의 정리 작성·수정. 저장하면 보기 화면으로 돌아갑니다. */
export function LectureForm({
  values,
  aiEnabled,
}: {
  values: LectureFormValues;
  /** LLM 설정이 있을 때만 AI 정리 버튼을 보여 줍니다 */
  aiEnabled: boolean;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveLecture,
    {},
  );
  const [body, setBody] = useState(values.body);
  /** AI 정리 직전의 원문 — 되돌리기용 */
  const [originalBody, setOriginalBody] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [organizing, startOrganizing] = useTransition();

  function organize() {
    setAiError(null);
    startOrganizing(async () => {
      const result = await organizeLectureBody(body);
      if (result.body) {
        setOriginalBody(body);
        setBody(result.body);
      } else {
        setAiError(result.error ?? "AI 정리에 실패했습니다.");
      }
    });
  }

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

          <div className="grid gap-5 sm:grid-cols-[12rem_1fr]">
            <Field
              label="진행 단계"
              htmlFor="status"
              error={state.fieldErrors?.status}
            >
              <Select id="status" name="status" defaultValue={values.status}>
                {LECTURE_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {LECTURE_STATUS_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="주제 태그" hint="선택 · 여러 개" error={state.fieldErrors?.tags}>
              <div className="flex flex-wrap gap-2">
                {LECTURE_TAGS.map((tag) => (
                  <CheckChip
                    key={tag}
                    name="tags"
                    value={tag}
                    label={tag}
                    defaultChecked={values.tags.includes(tag)}
                  />
                ))}
              </div>
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
              value={body}
              onChange={(event) => setBody(event.target.value)}
              readOnly={organizing}
              maxLength={50000}
              className="min-h-96"
              placeholder={"핵심 내용\n- …\n\n적용할 점\n- …"}
              required
            />
          </Field>

          {aiEnabled && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={organize}
                  disabled={organizing || !body.trim()}
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  {organizing ? "AI 정리 중…" : "AI로 정리"}
                </Button>
                {originalBody !== null && !organizing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBody(originalBody);
                      setOriginalBody(null);
                    }}
                  >
                    <Undo2 className="h-4 w-4" aria-hidden />
                    원문으로 되돌리기
                  </Button>
                )}
              </div>
              {aiError && (
                <p role="alert" className="text-sm text-red-600">
                  {aiError}
                </p>
              )}
              {originalBody !== null && !aiError && !organizing && (
                <p className="text-sm text-ink-500">
                  AI가 정리한 내용입니다. 약물 정보와 수치를 원문과 대조한 뒤 저장해주세요.
                </p>
              )}
            </div>
          )}
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
