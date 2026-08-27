"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState, type ChangeEvent } from "react";
import { deletePopup, savePopup } from "@/actions/content";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import {
  AdminCard,
  FormError,
  SavedNotice,
  SubmitButton,
} from "@/components/admin/form-shell";
import { DeleteButton } from "@/components/admin/delete-button";
import { ImageField } from "@/components/admin/image-field";
import { Field, Input, Textarea } from "@/components/ui/field";
import { POPUP_SIZE } from "@/lib/constants";
import type { ActionState, DbLocale } from "@/lib/validations/admin";

export type PopupFormValues = {
  id: string | null;
  slug: string;
  imageUrl: string;
  linkUrl: string;
  /** datetime-local 형식 (YYYY-MM-DDTHH:mm) */
  startsAt: string;
  endsAt: string;
  isPublished: boolean;
  sortOrder: number;
  translations: Record<
    DbLocale,
    { title: string; body: string; linkLabel: string }
  >;
};

export function PopupForm({
  values,
  saved,
}: {
  values: PopupFormValues;
  saved?: boolean;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    savePopup,
    {},
  );

  // 미리보기용 — 입력하는 대로 핸드폰 규격 카드에 반영합니다
  const [preview, setPreview] = useState({
    title: values.translations.KO.title,
    body: values.translations.KO.body,
    linkLabel: values.translations.KO.linkLabel,
    imageUrl: values.imageUrl,
  });

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
        title="노출 설정"
        description={`팝업은 핸드폰 화면 규격(${POPUP_SIZE.width}×${POPUP_SIZE.height}px)으로 고정 노출됩니다. 이미지는 4:5 비율(권장 640×800)로 준비해주세요.`}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="slug" htmlFor="slug" required error={state.fieldErrors?.slug}>
            <Input
              id="slug"
              name="slug"
              defaultValue={values.slug}
              placeholder="summer-notice"
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

          <Field
            label="노출 시작"
            htmlFor="startsAt"
            hint="비우면 제한 없음"
            error={state.fieldErrors?.startsAt}
          >
            <Input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              defaultValue={values.startsAt}
            />
          </Field>

          <Field
            label="노출 종료"
            htmlFor="endsAt"
            hint="비우면 제한 없음"
            error={state.fieldErrors?.endsAt}
          >
            <Input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              defaultValue={values.endsAt}
            />
          </Field>

          <Field
            label="클릭 시 이동 주소"
            htmlFor="linkUrl"
            hint="선택 · /ko/... 또는 https://"
            error={state.fieldErrors?.linkUrl}
            className="sm:col-span-2"
          >
            <Input
              id="linkUrl"
              name="linkUrl"
              defaultValue={values.linkUrl}
              placeholder="/ko/inquiry"
            />
          </Field>
        </div>

        <label className="flex items-center gap-2.5 text-sm font-semibold text-ink-800">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={values.isPublished}
            className="size-4 accent-brand-600"
          />
          공개 (노출 기간 안이면 사이트에 표시)
        </label>

        <div className="border-t border-ink-100 pt-5">
          <ImageField
            name="imageUrl"
            label="팝업 이미지"
            hint="선택 · 4:5 세로형"
            defaultValue={values.imageUrl}
            onChange={(imageUrl) => setPreview((p) => ({ ...p, imageUrl }))}
          />
        </div>
      </AdminCard>

      <AdminCard
        title="언어별 내용"
        description="비워둔 언어는 저장되지 않고, 해당 언어 사이트에도 팝업이 뜨지 않습니다."
      >
        <LocaleTabs filled={filled}>
          {(locale) => {
            const tr = values.translations[locale];
            const n = (field: string) => `translations.${locale}.${field}`;
            // 미리보기는 한국어 기준이라 KO 탭 입력만 반영합니다
            const track = (field: "title" | "body" | "linkLabel") =>
              locale === "KO"
                ? (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                    setPreview((p) => ({ ...p, [field]: e.target.value }))
                : undefined;
            return (
              <>
                <Field
                  label="제목"
                  htmlFor={n("title")}
                  hint="최대 60자"
                  error={state.fieldErrors?.[n("title")]}
                >
                  <Input
                    id={n("title")}
                    name={n("title")}
                    defaultValue={tr.title}
                    maxLength={60}
                    onChange={track("title")}
                  />
                </Field>
                <Field
                  label="내용"
                  htmlFor={n("body")}
                  hint="선택 · 최대 300자"
                  error={state.fieldErrors?.[n("body")]}
                >
                  <Textarea
                    id={n("body")}
                    name={n("body")}
                    defaultValue={tr.body}
                    maxLength={300}
                    className="min-h-32"
                    onChange={track("body")}
                  />
                </Field>
                <Field
                  label="버튼 문구"
                  htmlFor={n("linkLabel")}
                  hint="선택 · 이동 주소가 있을 때만 노출"
                >
                  <Input
                    id={n("linkLabel")}
                    name={n("linkLabel")}
                    defaultValue={tr.linkLabel}
                    maxLength={30}
                    placeholder="자세히 보기"
                    onChange={track("linkLabel")}
                  />
                </Field>
              </>
            );
          }}
        </LocaleTabs>
      </AdminCard>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        <Link
          href="/admin/popups"
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-ink-600 hover:bg-ink-100"
        >
          목록으로
        </Link>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">{formBody}</div>
        <PhonePreview {...preview} />
      </div>

      {/* 삭제는 별도 form이므로 저장 form 밖에 둡니다 (form 중첩은 무효) */}
      {values.id && (
        <div className="flex justify-end border-t border-ink-200 pt-6">
          <DeleteButton action={deletePopup} id={values.id} />
        </div>
      )}
    </div>
  );
}

/** 실제 노출과 같은 핸드폰 규격 미리보기 (한국어 기준) */
function PhonePreview({
  title,
  body,
  linkLabel,
  imageUrl,
}: {
  title: string;
  body: string;
  linkLabel: string;
  imageUrl: string;
}) {
  return (
    <div className="hidden xl:block">
      <div className="sticky top-8 space-y-3">
        <p className="text-sm font-semibold text-ink-700">
          미리보기{" "}
          <span className="font-normal text-ink-400">
            핸드폰 규격 {POPUP_SIZE.width}×{POPUP_SIZE.height}
          </span>
        </p>
        <div
          className="rounded-[2rem] border-8 border-ink-900 bg-ink-900 shadow-soft-lg"
          style={{ width: POPUP_SIZE.width + 16 }}
        >
          <div
            className="flex flex-col justify-start overflow-hidden rounded-[1.5rem] bg-ink-100 p-3"
            style={{ width: POPUP_SIZE.width, height: POPUP_SIZE.height }}
          >
            <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-soft">
              {imageUrl && (
                <div className="relative aspect-4/5 w-full bg-ink-100">
                  <Image
                    src={imageUrl}
                    alt=""
                    fill
                    sizes={`${POPUP_SIZE.width}px`}
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="space-y-1.5 px-4 py-3">
                <p className="text-sm font-bold text-ink-900">
                  {title || "팝업 제목"}
                </p>
                {body && (
                  <p className="line-clamp-4 whitespace-pre-line text-xs leading-relaxed text-ink-600">
                    {body}
                  </p>
                )}
                {linkLabel && (
                  <p className="text-xs font-semibold text-brand-700">
                    {linkLabel} →
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-ink-200 bg-ink-50 px-3 py-2 text-[0.6875rem] text-ink-600">
                <span>오늘 하루 보지 않기</span>
                <span className="font-semibold text-ink-800">닫기</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
