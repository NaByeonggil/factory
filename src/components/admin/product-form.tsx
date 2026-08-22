"use client";

import { useActionState } from "react";
import Link from "next/link";
import { deleteProduct, saveProduct } from "@/actions/content";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import {
  AdminCard,
  FormError,
  SavedNotice,
  SubmitButton,
} from "@/components/admin/form-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { CheckChip, Field, Input, Select, Textarea } from "@/components/ui/field";
import { FORMULATIONS, SERVICE_TYPES } from "@/lib/constants";
import type { ActionState, DbLocale } from "@/lib/validations/admin";

const FORMULATION_LABELS: Record<string, string> = {
  PILL: "환",
  HARD_CAPSULE: "경질캡슐",
  SOFT_CAPSULE: "연질캡슐",
  JELLY: "젤리",
  LIQUID: "액상",
  POWDER: "분말",
  TABLET: "정제",
};

export type ProductFormValues = {
  id: string | null;
  slug: string;
  serviceType: string;
  formulation: string;
  imageUrls: string;
  ingredientIds: string[];
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  translations: Record<
    DbLocale,
    { title: string; description: string; seoTitle: string; seoDesc: string }
  >;
};

export function ProductForm({
  values,
  ingredients,
  saved,
}: {
  values: ProductFormValues;
  ingredients: { id: string; name: string }[];
  saved?: boolean;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveProduct,
    {},
  );

  const filled = Object.fromEntries(
    (["KO", "EN", "ZH"] as DbLocale[]).map((l) => [
      l,
      values.translations[l].title.length > 0,
    ]),
  ) as Record<DbLocale, boolean>;

  const formBody = (
    <form action={formAction} className="space-y-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <SavedNotice show={Boolean(saved)} />
      <FormError state={state} />

      <AdminCard title="기본 정보">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="slug" htmlFor="slug" required error={state.fieldErrors?.slug}>
            <Input id="slug" name="slug" defaultValue={values.slug} required />
          </Field>

          <Field label="생산 방식" htmlFor="serviceType" required>
            <Select
              id="serviceType"
              name="serviceType"
              defaultValue={values.serviceType}
            >
              {SERVICE_TYPES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="제형" htmlFor="formulation" required>
            <Select
              id="formulation"
              name="formulation"
              defaultValue={values.formulation}
            >
              {FORMULATIONS.map((code) => (
                <option key={code} value={code}>
                  {FORMULATION_LABELS[code]}
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

        <Field
          label="이미지 URL"
          htmlFor="imageUrls"
          hint="한 줄에 하나씩"
          error={state.fieldErrors?.imageUrls}
        >
          <Textarea
            id="imageUrls"
            name="imageUrls"
            defaultValue={values.imageUrls}
            className="min-h-24 font-mono text-xs"
            placeholder={"https://…/front.jpg\nhttps://…/back.jpg"}
          />
        </Field>

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
        title="적용 원료"
        description="선택한 원료는 공개 상세 페이지에서 원료 페이지로 링크됩니다."
      >
        {ingredients.length === 0 ? (
          <p className="text-sm text-ink-500">등록된 원료가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ing) => (
              <CheckChip
                key={ing.id}
                label={ing.name}
                name="ingredientIds"
                value={ing.id}
                defaultChecked={values.ingredientIds.includes(ing.id)}
              />
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard title="언어별 내용">
        <LocaleTabs filled={filled}>
          {(locale) => {
            const tr = values.translations[locale];
            const n = (field: string) => `translations.${locale}.${field}`;
            return (
              <>
                <Field
                  label="제품명"
                  htmlFor={n("title")}
                  error={state.fieldErrors?.[n("title")]}
                >
                  <Input id={n("title")} name={n("title")} defaultValue={tr.title} />
                </Field>
                <Field label="설명" htmlFor={n("description")}>
                  <Textarea
                    id={n("description")}
                    name={n("description")}
                    defaultValue={tr.description}
                  />
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
          href="/admin/portfolio"
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
          <DeleteButton action={deleteProduct} id={values.id} />
        </div>
      )}
    </div>
  );
}
