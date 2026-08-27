"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Lock, MessageSquareReply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import {
  addQuoteReply,
  addQuoteReplyAsStaff,
  revealQuote,
} from "@/actions/quote";
import type { QuoteDetail, QuoteReply } from "@/lib/queries";
import { cn, formatDate, formatDateTime, maskName } from "@/lib/utils";
import { FileUpload, type Attachment } from "@/components/inquiry/file-upload";
import { AttachmentList } from "@/components/quote/attachment-list";

/**
 * 견적문의 열람 잠금 화면.
 * 문의 내용·답변은 서버 페이로드에 실리지 않고,
 * 비밀번호가 맞을 때만 revealQuote 가 돌려준 값을 그립니다.
 */
export function QuoteGate({
  id,
  locale,
  hasPassword,
  staffDetail,
}: {
  id: string;
  locale: string;
  hasPassword: boolean;
  /**
   * 관리자로 로그인한 경우 서버에서 미리 열어 넘겨준 상세.
   * 이 값이 있으면 비밀번호를 묻지 않고 바로 보여줍니다.
   */
  staffDetail?: QuoteDetail | null;
}) {
  const t = useTranslations("quote");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<QuoteDetail | null>(null);
  const [pending, startTransition] = useTransition();

  if (staffDetail) {
    return (
      <QuoteDetailView
        id={id}
        detail={staffDetail}
        locale={locale}
        password=""
        isStaff
      />
    );
  }

  if (!hasPassword) {
    return (
      <p className="mt-8 rounded-2xl border border-dashed border-ink-300 p-6 text-sm text-ink-600">
        {t("noPassword")}
      </p>
    );
  }

  if (detail) {
    return (
      <QuoteDetailView
        id={id}
        detail={detail}
        locale={locale}
        // 답글도 본인 확인이 필요해 방금 통과한 비밀번호를 그대로 씁니다
        password={password}
      />
    );
  }

  return (
    <form
      className="mt-8 rounded-2xl border border-ink-200 bg-ink-50 p-6 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await revealQuote(id, password);
          if (result.ok) {
            setDetail(result.detail);
            return;
          }
          setError(
            result.error === "RATE_LIMIT"
              ? t("tooManyAttempts")
              : result.error === "NO_PASSWORD"
                ? t("noPassword")
                : t("wrongPassword"),
          );
        });
      }}
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-ink-800">
        <Lock className="size-4" aria-hidden />
        {t("secretNotice")}
      </p>

      <div className="mt-5 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="quote-password" className="sr-only">
            {t("password")}
          </label>
          <Input
            id="quote-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={50}
            className="bg-white"
          />
        </div>
        <Button type="submit" disabled={pending || password.length === 0}>
          {t("unlock")}
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}

function QuoteDetailView({
  id,
  detail,
  locale,
  password,
  isStaff,
}: {
  id: string;
  detail: QuoteDetail;
  locale: string;
  password: string;
  isStaff?: boolean;
}) {
  const t = useTranslations("quote");
  const tInquiry = useTranslations("inquiry");
  const tOptions = useTranslations("options");
  const tService = useTranslations("service");

  const rows: [string, string | null][] = [
    [tInquiry("serviceType"), tService(detail.serviceType)],
    [
      tInquiry("formulations"),
      detail.formulations.map((c) => tOptions(`formulation.${c}`)).join(", ") ||
        null,
    ],
    [
      tInquiry("packagings"),
      detail.packagings.map((c) => tOptions(`packaging.${c}`)).join(", ") || null,
    ],
    [
      tInquiry("quantity"),
      detail.quantity ? tOptions(`quantity.${detail.quantity}`) : null,
    ],
    [tInquiry("budget"), detail.budget ? tOptions(`budget.${detail.budget}`) : null],
    [
      tInquiry("targetDate"),
      detail.targetDate ? formatDate(detail.targetDate, locale) : null,
    ],
  ];

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-2xl border border-ink-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-ink-900">{t("myInquiry")}</h2>
          <Badge tone="brand">{t(`status${detail.status}`)}</Badge>
        </div>

        <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold text-ink-400">{label}</dt>
              <dd className="mt-0.5 text-sm text-ink-800">{value ?? "—"}</dd>
            </div>
          ))}
        </dl>

        {detail.message && (
          <p className="mt-6 whitespace-pre-line border-t border-ink-100 pt-6 leading-relaxed text-ink-800">
            {detail.message}
          </p>
        )}

        {detail.files.length > 0 && (
          <div className="mt-5 border-t border-ink-100 pt-5">
            <AttachmentList files={detail.files} />
          </div>
        )}
      </section>

      {detail.replyBody ? (
        <section className="rounded-2xl border border-brand-200 bg-brand-50 p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-bold text-brand-800">
            <MessageSquareReply className="size-4" aria-hidden />
            {t("reply")}
          </h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-800">
            {detail.replyBody}
          </p>
          {detail.repliedAt && (
            <p className="mt-4 text-xs text-ink-500">
              {formatDateTime(detail.repliedAt, locale)}
            </p>
          )}
        </section>
      ) : (
        <p className="rounded-2xl border border-dashed border-ink-300 p-6 text-sm text-ink-500">
          {t("noReply")}
        </p>
      )}

      <QuoteThread
        id={id}
        locale={locale}
        password={password}
        isStaff={isStaff}
        initialReplies={detail.replies}
      />
    </div>
  );
}

/** 문의 내용 하단의 답글 스레드 — 고객과 담당자가 이어서 대화합니다 */
function QuoteThread({
  id,
  locale,
  password,
  isStaff,
  initialReplies,
}: {
  id: string;
  locale: string;
  password: string;
  isStaff?: boolean;
  initialReplies: QuoteReply[];
}) {
  const t = useTranslations("quote");
  const [replies, setReplies] = useState(initialReplies);
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-6 sm:p-8">
      <h2 className="font-bold text-ink-900">
        {t("thread")}
        {replies.length > 0 && (
          <span className="ml-2 text-sm font-normal text-ink-400">
            {replies.length}
          </span>
        )}
      </h2>

      {isStaff && (
        <p className="mt-2 rounded-lg bg-accent-500/15 p-3 text-sm text-ink-700">
          {t("threadStaffNotice")}
        </p>
      )}

      {replies.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500">{t("threadEmpty")}</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {replies.map((reply) => {
            const isAdmin = reply.authorType === "ADMIN";
            return (
              <li
                key={reply.id}
                className={cn(
                  "rounded-xl p-4",
                  isAdmin ? "bg-brand-50" : "bg-ink-50",
                )}
              >
                <p className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge tone={isAdmin ? "brand" : "neutral"}>
                    {isAdmin ? t("threadAdmin") : t("threadCustomer")}
                  </Badge>
                  <span className="font-semibold text-ink-700">
                    {isAdmin ? reply.authorName : maskName(reply.authorName)}
                  </span>
                  <time dateTime={reply.createdAt} className="text-ink-400">
                    {formatDateTime(reply.createdAt, locale)}
                  </time>
                </p>
                {reply.body && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-800">
                    {reply.body}
                  </p>
                )}
                {reply.files.length > 0 && (
                  <div className="mt-3">
                    <AttachmentList files={reply.files} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {replies.some((reply) => reply.files.length > 0) && (
        <p className="mt-3 text-xs text-ink-400">{t("threadLinkExpired")}</p>
      )}

      <form
        className="mt-6 space-y-3 border-t border-ink-100 pt-6"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = isStaff
              ? await addQuoteReplyAsStaff(id, body, attachments)
              : await addQuoteReply(id, password, body, attachments);
            if (result.ok) {
              setReplies(result.replies);
              setBody("");
              setAttachments([]);
              return;
            }
            setError(
              result.error === "RATE_LIMIT"
                ? t("threadRateLimited")
                : t("threadError"),
            );
          });
        }}
      >
        <label htmlFor="quote-reply" className="sr-only">
          {t("thread")}
        </label>
        <Textarea
          id="quote-reply"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("threadPlaceholder")}
          maxLength={2000}
          className="min-h-28"
        />
        <FileUpload
          value={attachments}
          onChange={setAttachments}
          label={t("threadAttach")}
          hint={t("threadAttachHint")}
          dropHint={t("threadAttachDrop")}
          browseLabel={t("threadAttachBrowse")}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={
              pending || (body.trim().length === 0 && attachments.length === 0)
            }
          >
            {pending ? t("threadSubmitting") : t("threadSubmit")}
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
