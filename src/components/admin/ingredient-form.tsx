"use client";

import { useActionState } from "react";
import Link from "next/link";
import { deleteIngredient, saveIngredient } from "@/actions/content";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import {
  AdminCard,
  FormError,
  SavedNotice,
  SubmitButton,
} from "@/components/admin/form-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ImageField } from "@/components/admin/image-field";
import { INGREDIENT_CATEGORIES } from "@/lib/constants";
import type { ActionState, DbLocale } from "@/lib/validations/admin";

const CATEGORY_LABELS: Record<string, string> = {
  HOT_TREND: "HOT 트렌드",
  INDIVIDUAL_APPROVED: "개별인정형",
  PATENT: "특허보유",
  BASIC: "기본",
  SUPERFOOD: "슈퍼푸드",
};

export type IngredientFormValues = {
  id: string | null;
  slug: string;
  category: string;
  thumbnailUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  translations: Record<
    DbLocale,
    {
      name: string;
      summary: string;
      functionality: string;
      dailyDose: string;
      body: string;
      seoTitle: string;
      seoDesc: string;
    }
  >;
};

export function IngredientForm({
  values,
  saved,
}: {
  values: IngredientFormValues;
  saved?: boolean;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveIngredient,
    {},
  );

  const filled = Object.fromEntries(
    (["KO", "EN", "ZH"] as DbLocale[]).map((l) => [
      l,
      values.translations[l].name.length > 0,
    ]),
  ) as Record<DbLocale, boolean>;

  const formBody = (
    <form action={formAction} className="space-y-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <SavedNotice show={Boolean(saved)} />
      <FormError state={state} />

      <AdminCard
        title="기본 정보"
        description="slug는 공개 URL에 그대로 쓰입니다. 발행 후에는 바꾸지 마세요."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="slug" htmlFor="slug" required error={state.fieldErrors?.slug}>
            <Input
              id="slug"
              name="slug"
              defaultValue={values.slug}
              placeholder="melatonin"
              required
            />
          </Field>

          <Field label="분류" htmlFor="category" required>
            <Select id="category" name="category" defaultValue={values.category}>
              {INGREDIENT_CATEGORIES.map((code) => (
                <option key={code} value={code}>
                  {CATEGORY_LABELS[code]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="정렬 순서" htmlFor="sortOrder" hint="작을수록 먼저">
            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={values.sortOrder}
            />
          </Field>
        </div>

        <div className="border-t border-ink-100 pt-5">
          <ImageField
            name="thumbnailUrl"
            label="썸네일 이미지"
            hint="선택 · 정사각형 권장"
            defaultValue={values.thumbnailUrl}
          />
        </div>

        <div className="flex flex-wrap gap-6 border-t border-ink-100 pt-5">
          <label className="flex items-center gap-2.5 text-sm font-semibold text-ink-800">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={values.isPublished}
              className="size-4 accent-brand-600"
            />
            공개
          </label>
          <label className="flex items-center gap-2.5 text-sm font-semibold text-ink-800">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={values.isFeatured}
              className="size-4 accent-brand-600"
            />
            메인 노출
          </label>
        </div>
      </AdminCard>

      <AdminCard
        title="언어별 내용"
        description="비워둔 언어는 저장되지 않고, 해당 언어 사이트에도 노출되지 않습니다."
      >
        <LocaleTabs filled={filled}>
          {(locale) => {
            const tr = values.translations[locale];
            const n = (field: string) => `translations.${locale}.${field}`;
            return (
              <>
                <Field
                  label="원료명"
                  htmlFor={n("name")}
                  error={state.fieldErrors?.[n("name")]}
                >
                  <Input id={n("name")} name={n("name")} defaultValue={tr.name} />
                </Field>
                <Field label="한 줄 요약" htmlFor={n("summary")}>
                  <Input
                    id={n("summary")}
                    name={n("summary")}
                    defaultValue={tr.summary}
                  />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="기능성 내용" htmlFor={n("functionality")}>
                    <Textarea
                      id={n("functionality")}
                      name={n("functionality")}
                      defaultValue={tr.functionality}
                      className="min-h-24"
                    />
                  </Field>
                  <Field label="일일섭취량" htmlFor={n("dailyDose")}>
                    <Input
                      id={n("dailyDose")}
                      name={n("dailyDose")}
                      defaultValue={tr.dailyDose}
                      placeholder="500~1,000mg"
                    />
                  </Field>
                </div>
                <Field label="상세 본문" htmlFor={n("body")}>
                  <Textarea id={n("body")} name={n("body")} defaultValue={tr.body} />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="SEO 제목" htmlFor={n("seoTitle")} hint="선택">
                    <Input
                      id={n("seoTitle")}
                      name={n("seoTitle")}
                      defaultValue={tr.seoTitle}
                    />
                  </Field>
                  <Field label="SEO 설명" htmlFor={n("seoDesc")} hint="선택">
                    <Input
                      id={n("seoDesc")}
                      name={n("seoDesc")}
                      defaultValue={tr.seoDesc}
                    />
                  </Field>
                </div>
              </>
            );
          }}
        </LocaleTabs>
      </AdminCard>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        <Link
          href="/admin/ingredients"
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-ink-600 hover:bg-ink-100"
        >
          목록으로
        </Link>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {formBody}
      {/* 삭제는 별도 form이므로 저장 form 밖에 둡니다 (form 중첩은 무효) */}
      {values.id && (
        <div className="flex justify-end border-t border-ink-200 pt-6">
          <DeleteButton action={deleteIngredient} id={values.id} />
        </div>
      )}
    </div>
  );
}
