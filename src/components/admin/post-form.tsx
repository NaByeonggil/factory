"use client";

import { useActionState } from "react";
import Link from "next/link";
import { deletePost, savePost } from "@/actions/content";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import {
  AdminCard,
  FormError,
  SavedNotice,
  SubmitButton,
} from "@/components/admin/form-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import type { ActionState, DbLocale } from "@/lib/validations/admin";

const CATEGORY_LABELS = {
  NEWS: "소식",
  NOTICE: "공지",
  ESG: "ESG 경영",
  FACTORY_TOUR: "공장 투어",
} as const;

export type PostFormValues = {
  id: string | null;
  slug: string;
  category: string;
  coverUrl: string;
  /** datetime-local 형식 (YYYY-MM-DDTHH:mm). 비우면 초안 */
  publishedAt: string;
  translations: Record<
    DbLocale,
    { title: string; excerpt: string; body: string; seoTitle: string; seoDesc: string }
  >;
};

export function PostForm({
  values,
  saved,
}: {
  values: PostFormValues;
  saved?: boolean;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    savePost,
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

      <AdminCard
        title="기본 정보"
        description="게시일을 비우면 초안으로 저장되어 공개 사이트에 노출되지 않습니다."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="slug" htmlFor="slug" required error={state.fieldErrors?.slug}>
            <Input
              id="slug"
              name="slug"
              defaultValue={values.slug}
              placeholder="cphi-korea-2026"
              required
            />
          </Field>

          <Field label="분류" htmlFor="category" required>
            <Select id="category" name="category" defaultValue={values.category}>
              {Object.entries(CATEGORY_LABELS).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="게시일"
            htmlFor="publishedAt"
            hint="비우면 초안"
            error={state.fieldErrors?.publishedAt}
          >
            <Input
              id="publishedAt"
              name="publishedAt"
              type="datetime-local"
              defaultValue={values.publishedAt}
            />
          </Field>

          <Field
            label="커버 이미지 URL"
            htmlFor="coverUrl"
            hint="선택"
            error={state.fieldErrors?.coverUrl}
          >
            <Input
              id="coverUrl"
              name="coverUrl"
              defaultValue={values.coverUrl}
              placeholder="https://…"
            />
          </Field>
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
                  label="제목"
                  htmlFor={n("title")}
                  error={state.fieldErrors?.[n("title")]}
                >
                  <Input id={n("title")} name={n("title")} defaultValue={tr.title} />
                </Field>
                <Field label="요약" htmlFor={n("excerpt")} hint="목록에 노출">
                  <Input
                    id={n("excerpt")}
                    name={n("excerpt")}
                    defaultValue={tr.excerpt}
                  />
                </Field>
                <Field label="본문" htmlFor={n("body")}>
                  <Textarea
                    id={n("body")}
                    name={n("body")}
                    defaultValue={tr.body}
                    className="min-h-64"
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
          href="/admin/posts"
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
          <DeleteButton action={deletePost} id={values.id} />
        </div>
      )}
    </div>
  );
}
