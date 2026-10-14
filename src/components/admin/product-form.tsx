"use client";

import { useActionState, useState } from "react";
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
import { ImageListField } from "@/components/admin/image-field";
import { FORMULATIONS, SERVICE_TYPES, formulationsFor } from "@/lib/constants";
import type { ActionState, DbLocale } from "@/lib/validations/admin";
import ko from "@/messages/ko.json";

const SERVICE_LABELS: Record<string, string> = ko.service;
const FORMULATION_LABELS: Record<string, string> = ko.options.formulation;

/** 생산 방식에 맞는 제형만 고르게 합니다. 원료 공급은 제형 구분이 없어 전체를 보여줍니다 */
function formulationOptions(serviceType: string): readonly string[] {
  const list = formulationsFor(serviceType);
  return list.length > 0 ? list : FORMULATIONS;
}

export type ProductFormValues = {
  id: string | null;
  slug: string;
  serviceType: string;
  formulation: string;
  imageUrls: string[];
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
  const [serviceType, setServiceType] = useState(values.serviceType);
  const [formulation, setFormulation] = useState(values.formulation);
  // 예전에 저장된 값이 지금 방식의 제형 목록에 없어도 선택값이 사라지지 않게 남겨둡니다
  const options = formulationOptions(serviceType);
  const formulations = options.includes(formulation)
    ? options
    : [formulation, ...options];

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
          <Field
            label="slug"
            htmlFor="slug"
            required
            hint="영문 소문자·숫자·하이픈 · 상세 페이지 주소"
            error={state.fieldErrors?.slug}
          >
            <Input id="slug" name="slug" defaultValue={values.slug} required />
          </Field>

          <Field label="생산 방식" htmlFor="serviceType" required>
            <Select
              id="serviceType"
              name="serviceType"
              value={serviceType}
              onChange={(e) => {
                const next = e.target.value;
                setServiceType(next);
                const options = formulationOptions(next);
                if (!options.includes(formulation)) setFormulation(options[0]);
              }}
            >
              {SERVICE_TYPES.map((code) => (
                <option key={code} value={code}>
                  {SERVICE_LABELS[code] ?? code}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="제형" htmlFor="formulation" required>
            <Select
              id="formulation"
              name="formulation"
              value={formulation}
              onChange={(e) => setFormulation(e.target.value)}
            >
              {formulations.map((code) => (
                <option key={code} value={code}>
                  {FORMULATION_LABELS[code] ?? code}
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

        <ImageListField
          name="imageUrls"
          label="제품 이미지"
          hint="최대 6장 · 첫 번째가 대표 이미지"
          defaultValue={values.imageUrls}
        />

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
