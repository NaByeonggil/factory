"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { revealQuestion } from "@/actions/qna";
import { QuestionBody } from "@/components/qna/question-body";

/**
 * 비밀글 잠금 화면.
 * 본문은 서버 페이로드에 실리지 않고, 비밀번호가 맞을 때만
 * revealQuestion 액션이 돌려준 값을 그립니다.
 */
export function SecretGate({ id }: { id: string }) {
  const t = useTranslations("qna");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<{
    body: string;
    answerBody: string | null;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  if (opened) {
    return <QuestionBody body={opened.body} answerBody={opened.answerBody} />;
  }

  return (
    <form
      className="mt-8 rounded-2xl border border-ink-200 bg-ink-50 p-6 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await revealQuestion(id, password);
          if (result.ok) {
            setOpened({ body: result.body, answerBody: result.answerBody });
            return;
          }
          setError(
            result.error === "RATE_LIMIT"
              ? t("tooManyAttempts")
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
          <label htmlFor="qna-password" className="sr-only">
            {t("password")}
          </label>
          <Input
            id="qna-password"
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
