"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { questionSchema, type QuestionInput } from "@/lib/validations/qna";
import { submitQuestion } from "@/actions/qna";

export function QuestionForm() {
  const t = useTranslations("qna");
  const tv = useTranslations("validation");
  const locale = useLocale();
  const router = useRouter();

  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<QuestionInput>({
    resolver: zodResolver(questionSchema),
    defaultValues: { isSecret: false, privacyAgreed: false, website: "" },
  });

  /** zod가 돌려준 메시지 키를 번역문으로 (생산문의 폼과 같은 방식) */
  const msg = (key?: string) => {
    if (!key) return undefined;
    try {
      return tv(key);
    } catch {
      return key;
    }
  };

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await submitQuestion(locale, values);

      if (result.ok) {
        router.push(`/community/qna/${result.id}`);
        return;
      }

      if (result.error === "VALIDATION" && result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof QuestionInput, { message });
        }
        return;
      }
      setFormError(
        result.error === "RATE_LIMIT" ? t("rateLimited") : t("submitError"),
      );
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {formError && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {formError}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={t("fieldName")}
          htmlFor="authorName"
          required
          error={msg(errors.authorName?.message)}
        >
          <Input id="authorName" {...register("authorName")} maxLength={30} />
        </Field>

        <Field label={t("fieldCompany")} htmlFor="company">
          <Input id="company" {...register("company")} maxLength={100} />
        </Field>

        <Field
          label={t("fieldEmail")}
          htmlFor="email"
          error={msg(errors.email?.message)}
        >
          <Input id="email" type="email" {...register("email")} maxLength={150} />
        </Field>

        <Field
          label={t("fieldPhone")}
          htmlFor="phone"
          error={msg(errors.phone?.message)}
        >
          <Input id="phone" type="tel" {...register("phone")} maxLength={20} />
        </Field>
      </div>

      <Field
        label={t("fieldSubject")}
        htmlFor="title"
        required
        error={msg(errors.title?.message)}
      >
        <Input id="title" {...register("title")} maxLength={120} />
      </Field>

      <Field
        label={t("fieldBody")}
        htmlFor="body"
        required
        error={msg(errors.body?.message)}
      >
        <Textarea id="body" {...register("body")} maxLength={5000} className="min-h-52" />
      </Field>

      <Field
        label={t("fieldPassword")}
        htmlFor="password"
        required
        hint={t("passwordHint")}
        error={msg(errors.password?.message)}
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          maxLength={50}
        />
      </Field>

      <label className="flex items-center gap-2.5 text-sm font-medium text-ink-800">
        <input
          type="checkbox"
          {...register("isSecret")}
          className="size-4 accent-brand-600"
        />
        {t("secretLabel")}
      </label>

      <div className="space-y-2 border-t border-ink-200 pt-5">
        <label className="flex items-start gap-2.5 text-sm text-ink-700">
          <input
            type="checkbox"
            {...register("privacyAgreed")}
            className="mt-0.5 size-4 accent-brand-600"
          />
          {t("privacyAgree")}
        </label>
        {errors.privacyAgreed && (
          <p role="alert" className="text-sm text-red-600">
            {msg(errors.privacyAgreed.message)}
          </p>
        )}
      </div>

      {/* 봇 트랩 — 사람 눈에는 보이지 않습니다 */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="sr-only"
        {...register("website")}
      />

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
