"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckChip,
  Field,
  FieldsetLegend,
  Input,
  Select,
  Textarea,
} from "@/components/ui/field";
import {
  BUDGET_RANGES,
  FORMULATIONS,
  PACKAGINGS,
  QUANTITY_RANGES,
  SERVICE_TYPES,
} from "@/lib/constants";
import { inquirySchema, type InquiryInput } from "@/lib/validations/inquiry";
import { readStoredAttribution } from "@/lib/tracking";
import { submitInquiry } from "@/actions/inquiry";
import { FileUpload, type Attachment } from "@/components/inquiry/file-upload";

export function InquiryForm() {
  const t = useTranslations("inquiry");
  const tv = useTranslations("validation");
  const tOptions = useTranslations("options");
  const tService = useTranslations("service");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 원료 상세/서비스 카드에서 넘어온 컨텍스트를 초기값으로
  const presetService = searchParams.get("type")?.toUpperCase();
  const presetIngredient = searchParams.get("ingredient");

  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    formState: { errors },
  } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      serviceType:
        presetService && SERVICE_TYPES.includes(presetService as "OEM")
          ? (presetService as "OEM")
          : "OEM",
      formulations: [],
      packagings: [],
      privacyAgreed: false,
      marketingAgreed: false,
      attachments: [],
      website: "",
    },
  });

  // 랜딩 시 저장해둔 광고 유입 정보를 제출 payload에 실어 보냄
  useEffect(() => {
    const attribution = readStoredAttribution();
    if (attribution) setValue("attribution", attribution);
  }, [setValue]);

  // 원료 상세에서 진입한 경우 문의 내용 프리필
  useEffect(() => {
    if (presetIngredient) {
      setValue("message", `관심 원료: ${presetIngredient}\n\n`);
    }
  }, [presetIngredient, setValue]);

  /** zod가 돌려준 메시지 키를 번역문으로 */
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
      const result = await submitInquiry(locale, values);

      if (result.ok) {
        // 완료 화면에서 접수번호를 안내하고 견적문의 게시판으로 이어줍니다
        router.push(`/inquiry/complete?id=${result.id}`);
        return;
      }

      if (result.error === "VALIDATION" && result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof InquiryInput, { message });
        }
        return;
      }
      setFormError(
        result.error === "RATE_LIMIT" ? t("errorRateLimit") : t("errorGeneric"),
      );
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-12">
      {/* 허니팟 — 스크린리더/사용자에게 보이지 않음 */}
      <div aria-hidden className="absolute left-[-9999px]">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <fieldset className="space-y-6">
<FieldsetLegend>{t("sectionContact")}</FieldsetLegend>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label={t("name")}
            htmlFor="name"
            required
            error={msg(errors.name?.message)}
          >
            <Input
              id="name"
              autoComplete="name"
              placeholder={t("namePlaceholder")}
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
          </Field>

          <Field label={t("company")} htmlFor="company" hint={t("optional")}>
            <Input
              id="company"
              autoComplete="organization"
              placeholder={t("companyPlaceholder")}
              {...register("company")}
            />
          </Field>

          <Field
            label={t("phone")}
            htmlFor="phone"
            required
            error={msg(errors.phone?.message)}
          >
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t("phonePlaceholder")}
              aria-invalid={Boolean(errors.phone)}
              {...register("phone")}
            />
          </Field>

          <Field
            label={t("email")}
            htmlFor="email"
            hint={t("optional")}
            error={msg(errors.email?.message)}
          >
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-6">
<FieldsetLegend>{t("sectionProduct")}</FieldsetLegend>

        <Field
          label={t("subject")}
          htmlFor="title"
          hint={t("subjectHint")}
          error={msg(errors.title?.message)}
        >
          <Input
            id="title"
            placeholder={t("subjectPlaceholder")}
            maxLength={100}
            {...register("title")}
          />
        </Field>

        <Field label={t("serviceType")} htmlFor="serviceType">
          <Select id="serviceType" {...register("serviceType")}>
            {SERVICE_TYPES.map((type) => (
              <option key={type} value={type}>
                {tService(type)}
              </option>
            ))}
          </Select>
        </Field>

        <Controller
          control={control}
          name="formulations"
          render={({ field }) => (
            <Field label={t("formulations")} hint={t("multiSelectHint")}>
              <div className="flex flex-wrap gap-2">
                {FORMULATIONS.map((code) => (
                  <CheckChip
                    key={code}
                    label={tOptions(`formulation.${code}`)}
                    value={code}
                    checked={field.value?.includes(code) ?? false}
                    onChange={(e) => {
                      const set = new Set(field.value ?? []);
                      if (e.target.checked) set.add(code);
                      else set.delete(code);
                      field.onChange([...set]);
                    }}
                  />
                ))}
              </div>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="packagings"
          render={({ field }) => (
            <Field label={t("packagings")} hint={t("multiSelectHint")}>
              <div className="flex flex-wrap gap-2">
                {PACKAGINGS.map((code) => (
                  <CheckChip
                    key={code}
                    label={tOptions(`packaging.${code}`)}
                    value={code}
                    checked={field.value?.includes(code) ?? false}
                    onChange={(e) => {
                      const set = new Set(field.value ?? []);
                      if (e.target.checked) set.add(code);
                      else set.delete(code);
                      field.onChange([...set]);
                    }}
                  />
                ))}
              </div>
            </Field>
          )}
        />

        <div className="grid gap-6 sm:grid-cols-3">
          <Field label={t("quantity")} htmlFor="quantity" hint={t("optional")}>
            <Select id="quantity" defaultValue="" {...register("quantity")}>
              <option value="">—</option>
              {QUANTITY_RANGES.map((code) => (
                <option key={code} value={code}>
                  {tOptions(`quantity.${code}`)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t("budget")} htmlFor="budget" hint={t("optional")}>
            <Select id="budget" defaultValue="" {...register("budget")}>
              <option value="">—</option>
              {BUDGET_RANGES.map((code) => (
                <option key={code} value={code}>
                  {tOptions(`budget.${code}`)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t("targetDate")} htmlFor="targetDate" hint={t("optional")}>
            <Input id="targetDate" type="date" {...register("targetDate")} />
          </Field>
        </div>

        <Field
          label={t("message")}
          htmlFor="message"
          error={msg(errors.message?.message)}
        >
          <Textarea
            id="message"
            placeholder={t("messagePlaceholder")}
            {...register("message")}
          />
        </Field>

        <Controller
          control={control}
          name="attachments"
          render={({ field }) => (
            <FileUpload
              label={t("attachments")}
              hint={t("attachmentsHint")}
              dropHint={t("attachmentsDrop")}
              browseLabel={t("attachmentsBrowse")}
              value={(field.value ?? []) as Attachment[]}
              onChange={field.onChange}
            />
          )}
        />
      </fieldset>

      <fieldset className="space-y-4">
<FieldsetLegend>{t("sectionAgree")}</FieldsetLegend>

        <div className="rounded-xl border border-ink-200 bg-ink-50 p-5">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-brand-600"
              aria-invalid={Boolean(errors.privacyAgreed)}
              {...register("privacyAgreed")}
            />
            <span className="text-sm">
              <span className="font-semibold text-ink-900">
                {t("privacy")}{" "}
                <span className="text-red-600">*</span>
              </span>
              <span className="mt-1 block leading-relaxed text-ink-500">
                {t("privacyDetail")}
              </span>
            </span>
          </label>
          {errors.privacyAgreed && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {msg(errors.privacyAgreed.message)}
            </p>
          )}

          <label className="mt-4 flex items-start gap-3 border-t border-ink-200 pt-4">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-brand-600"
              {...register("marketingAgreed")}
            />
            <span className="text-sm text-ink-700">{t("marketing")}</span>
          </label>
        </div>

        <Field
          label={t("password")}
          htmlFor="password"
          required
          hint={t("passwordHint")}
          error={msg(errors.password?.message)}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
        </Field>
      </fieldset>

      {formError && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {formError}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="w-full bg-brand-900 hover:bg-brand-800"
      >
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
