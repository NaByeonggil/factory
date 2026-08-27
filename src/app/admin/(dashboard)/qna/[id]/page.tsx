import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { AnswerForm } from "@/components/admin/answer-form";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminQuestionPage(
  props: PageProps<"/admin/qna/[id]">,
) {
  const { id } = await props.params;
  const search = await props.searchParams;

  const question = await prisma.question.findUnique({
    where: { id },
    include: { answeredBy: { select: { name: true } } },
  });
  if (!question) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/qna" className="text-sm text-ink-500 hover:text-ink-800">
          ← 목록
        </Link>
        {!question.isPublished ? (
          <Badge tone="danger">숨김</Badge>
        ) : question.answeredAt ? (
          <Badge tone="success">답변완료</Badge>
        ) : (
          <Badge tone="accent">미답변</Badge>
        )}
        {question.isSecret && (
          <Badge tone="neutral">
            <Lock className="mr-1 size-3" aria-hidden />
            비밀글
          </Badge>
        )}
      </div>

      <div className="rounded-2xl border border-ink-200 bg-white p-6">
        <h1 className="text-xl font-bold text-ink-900">{question.title}</h1>
        <p className="mt-2 text-sm text-ink-500">
          {question.authorName}
          {question.company && ` · ${question.company}`}
          {" · "}
          {formatDateTime(question.createdAt)}
        </p>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-600">
          {question.email && (
            <div className="flex gap-2">
              <dt className="text-ink-400">이메일</dt>
              <dd>{question.email}</dd>
            </div>
          )}
          {question.phone && (
            <div className="flex gap-2">
              <dt className="text-ink-400">연락처</dt>
              <dd>{question.phone}</dd>
            </div>
          )}
        </dl>
        <p className="mt-5 whitespace-pre-line border-t border-ink-100 pt-5 leading-relaxed text-ink-800">
          {question.body}
        </p>
      </div>

      <AnswerForm
        id={question.id}
        answerBody={question.answerBody ?? ""}
        isPublished={question.isPublished}
        answeredAt={
          question.answeredAt ? formatDateTime(question.answeredAt) : null
        }
        answeredBy={question.answeredBy?.name ?? null}
        saved={search.saved === "1"}
      />
    </div>
  );
}
