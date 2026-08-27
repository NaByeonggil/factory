import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Lock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Container, Section } from "@/components/ui/section";
import { QuestionBody } from "@/components/qna/question-body";
import { SecretGate } from "@/components/qna/secret-gate";
import { getQuestion, getQuestionForStaff } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { formatDate, maskName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/[locale]/community/qna/[id]">,
): Promise<Metadata> {
  const { locale, id } = await props.params;
  const t = await getTranslations({ locale, namespace: "qna" });
  const question = await getQuestion(id);
  if (!question) return {};

  return {
    title: question.isSecret ? t("secret") : question.title,
    // 고객이 남긴 글은 색인하지 않습니다 (개인정보·스팸 유입 방지)
    robots: { index: false, follow: false },
  };
}

export default async function QuestionDetailPage(
  props: PageProps<"/[locale]/community/qna/[id]">,
) {
  const { locale, id } = await props.params;
  const t = await getTranslations({ locale, namespace: "qna" });
  const tQuote = await getTranslations({ locale, namespace: "quote" });

  const question = await getQuestion(id);
  if (!question) notFound();

  // 관리자로 로그인한 상태면 비밀글도 비밀번호 없이 바로 보여줍니다
  const session = await getSession();
  const staffView =
    question.isSecret && session ? await getQuestionForStaff(id) : null;

  const isAnswered = question.answeredAt !== null;

  return (
    <Section>
      <Container className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={isAnswered ? "success" : "neutral"}>
            {isAnswered ? t("answered") : t("pending")}
          </Badge>
          {question.isSecret && (
            <Badge tone={staffView ? "accent" : "neutral"}>
              <Lock className="mr-1 size-3" aria-hidden />
              {staffView ? `${t("secret")} · ${tQuote("staffView")}` : t("secret")}
            </Badge>
          )}
        </div>

        <h1 className="mt-4 text-2xl font-bold text-ink-900 sm:text-3xl">
          {question.title}
        </h1>

        <p className="mt-3 text-sm text-ink-500">
          {maskName(question.authorName)} ·{" "}
          <time dateTime={question.createdAt.toISOString()}>
            {formatDate(question.createdAt, locale)}
          </time>
        </p>

        <div className="mt-6 border-t border-ink-200" />

        {question.isSecret && !staffView ? (
          <SecretGate id={question.id} />
        ) : (
          <QuestionBody
            body={staffView?.body ?? question.body ?? ""}
            answerBody={staffView?.answerBody ?? question.answerBody}
          />
        )}

        <div className="mt-10 border-t border-ink-200 pt-6">
          <Link
            href="/community/qna"
            className="text-sm font-semibold text-ink-600 hover:text-brand-700"
          >
            ← {t("backToList")}
          </Link>
        </div>
      </Container>
    </Section>
  );
}
