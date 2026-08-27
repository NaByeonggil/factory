"use client";

import { useTranslations } from "next-intl";
import { MessageSquareReply } from "lucide-react";

/** 질문 본문 + 운영자 답변. 공개글·비밀글 열람 양쪽에서 같은 모양으로 씁니다. */
export function QuestionBody({
  body,
  answerBody,
}: {
  body: string;
  answerBody: string | null;
}) {
  const t = useTranslations("qna");

  return (
    <div className="mt-8 space-y-8">
      <p className="whitespace-pre-line leading-relaxed text-ink-800">{body}</p>

      {answerBody ? (
        <section className="rounded-2xl border border-brand-200 bg-brand-50 p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-bold text-brand-800">
            <MessageSquareReply className="size-4" aria-hidden />
            {t("answer")}
          </h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-800">
            {answerBody}
          </p>
        </section>
      ) : (
        <p className="rounded-2xl border border-dashed border-ink-300 p-6 text-sm text-ink-500">
          {t("noAnswer")}
        </p>
      )}
    </div>
  );
}
