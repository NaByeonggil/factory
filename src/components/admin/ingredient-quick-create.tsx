"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { quickCreateIngredient } from "@/actions/content";
import { FormError, SubmitButton } from "@/components/admin/form-shell";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { INGREDIENT_CATEGORIES } from "@/lib/constants";
import { CATEGORY_LABELS } from "@/components/admin/ingredient-table";
import type { ActionState } from "@/lib/validations/admin";

/**
 * 목록 위에서 바로 만드는 빠른 추가.
 * 이름·slug·분류만 받아 만들고 편집 화면으로 넘겨 나머지를 채우게 합니다.
 */
export function QuickCreate() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(
    quickCreateIngredient,
    {},
  );

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden />
        목록에서 바로 추가
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-ink-200 bg-white p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-ink-900">원료 빠른 추가</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="닫기"
          className="rounded-full p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
        >
          <X className="size-4" />
        </button>
      </div>

      <FormError state={state} />

      <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr_auto] sm:items-end">
        <Field
          label="원료명 (KO)"
          htmlFor="quick-name"
          required
          error={state.fieldErrors?.name}
        >
          <Input id="quick-name" name="name" placeholder="멜라토닌" required />
        </Field>

        <Field
          label="slug"
          htmlFor="quick-slug"
          required
          hint="소문자·숫자·하이픈"
          error={state.fieldErrors?.slug}
        >
          <Input id="quick-slug" name="slug" placeholder="melatonin" required />
        </Field>

        <Field label="분류" htmlFor="quick-category" required>
          <Select id="quick-category" name="category" defaultValue="BASIC">
            {INGREDIENT_CATEGORIES.map((code) => (
              <option key={code} value={code}>
                {CATEGORY_LABELS[code]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton label="추가하고 편집" pendingLabel="추가 중…" />
        <p className="text-xs text-ink-400">
          공개 상태로 만들어지고, 이어서 편집 화면에서 요약·기능성·이미지·번역을
          채웁니다.
        </p>
      </div>
    </form>
  );
}
