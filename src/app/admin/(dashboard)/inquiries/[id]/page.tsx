import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { StatusControl } from "@/components/admin/status-control";
import { MemoForm } from "@/components/admin/memo-form";
import { ReplyForm } from "@/components/admin/reply-form";
import { ReplyThread } from "@/components/admin/reply-thread";

export const dynamic = "force-dynamic";

export default async function AdminInquiryDetailPage(
  props: PageProps<"/admin/inquiries/[id]">,
) {
  const { id } = await props.params;
  const search = await props.searchParams;

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      files: true,
      assignee: { select: { id: true, name: true } },
      repliedBy: { select: { name: true } },
      replies: { orderBy: { createdAt: "asc" }, include: { files: true } },
      memos: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!inquiry) notFound();

  const rows: [string, string | null][] = [
    ["회사", inquiry.company],
    ["연락처", inquiry.phone],
    ["이메일", inquiry.email],
    ["문의 유형", inquiry.serviceType],
    ["희망 제형", inquiry.formulations.join(", ") || null],
    ["희망 포장", inquiry.packagings.join(", ") || null],
    ["예상 수량", inquiry.quantity],
    ["예상 예산", inquiry.budget],
    ["희망 납기", inquiry.targetDate ? formatDateTime(inquiry.targetDate) : null],
    ["마케팅 수신동의", inquiry.marketingAgreed ? "동의" : "미동의"],
    ["개인정보 동의일시", formatDateTime(inquiry.privacyAgreedAt)],
  ];

  const attribution: [string, string | null][] = [
    ["utm_source", inquiry.utmSource],
    ["utm_medium", inquiry.utmMedium],
    ["utm_campaign", inquiry.utmCampaign],
    ["utm_term", inquiry.utmTerm],
    ["네이버 키워드", inquiry.naverKeyword],
    ["광고 노출순위", inquiry.naverRank],
    ["광고그룹", inquiry.naverAdGroup],
    ["랜딩 경로", inquiry.landingPath],
    ["referrer", inquiry.referrer],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/inquiries" className="text-sm text-ink-500">
          ← 목록
        </Link>
        <h1 className="text-2xl font-bold">
          {inquiry.title ?? `${inquiry.serviceType} 견적문의`}
          <span className="ml-2 text-base font-medium text-ink-500">
            {inquiry.name}
          </span>
        </h1>
        <Badge tone={inquiry.status === "NEW" ? "accent" : "neutral"}>
          {inquiry.status}
        </Badge>
        <span className="ml-auto text-sm text-ink-400">
          {formatDateTime(inquiry.createdAt)}
        </span>
      </div>

      <StatusControl id={inquiry.id} status={inquiry.status} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-ink-200 bg-white p-6">
            <h2 className="font-bold">문의 정보</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold text-ink-400">{label}</dt>
                  <dd className="mt-0.5 text-sm text-ink-800">{value ?? "-"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl border border-ink-200 bg-white p-6">
            <h2 className="font-bold">상세 내용</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-800">
              {inquiry.message ?? "(작성된 내용 없음)"}
            </p>
            {inquiry.files.length > 0 && (
              <ul className="mt-4 space-y-1 border-t border-ink-100 pt-4 text-sm">
                {inquiry.files.map((file) => (
                  <li key={file.id}>
                    <a
                      href={file.url}
                      className="text-brand-700 underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {file.filename}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <ReplyForm
            id={inquiry.id}
            replyBody={inquiry.replyBody ?? ""}
            repliedAt={
              inquiry.repliedAt ? formatDateTime(inquiry.repliedAt) : null
            }
            repliedBy={inquiry.repliedBy?.name ?? null}
            hasEmail={Boolean(inquiry.email)}
            saved={search.replied === "1"}
          />

          <ReplyThread
            id={inquiry.id}
            hasEmail={Boolean(inquiry.email)}
            replies={inquiry.replies.map((reply) => ({
              id: reply.id,
              authorType: reply.authorType,
              authorName: reply.authorName,
              body: reply.body,
              createdAt: formatDateTime(reply.createdAt),
              files: reply.files.map((file) => ({
                id: file.id,
                filename: file.filename,
                size: file.size,
                mimeType: file.mimeType,
                // 관리자는 세션 인증이 걸린 기존 라우트로 엽니다
                url: `/api/files/${file.storageKey}`,
              })),
            }))}
          />

          <section className="rounded-2xl border border-ink-200 bg-white p-6">
            <h2 className="font-bold">상담 메모</h2>
            <div className="mt-4">
              <MemoForm id={inquiry.id} />
            </div>
            <ul className="mt-6 space-y-4">
              {inquiry.memos.map((memo) => (
                <li key={memo.id} className="rounded-xl bg-ink-50 p-4 text-sm">
                  <p className="whitespace-pre-line text-ink-800">{memo.content}</p>
                  <p className="mt-2 text-xs text-ink-400">
                    {memo.author.name} · {formatDateTime(memo.createdAt)}
                  </p>
                </li>
              ))}
              {inquiry.memos.length === 0 && (
                <li className="text-sm text-ink-400">메모가 없습니다.</li>
              )}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-ink-200 bg-white p-6">
            <h2 className="font-bold">
              유입 경로
              <span className="ml-2 text-xs font-normal text-ink-400">
                광고 성과 분석
              </span>
            </h2>
            <dl className="mt-4 space-y-2.5">
              {attribution.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 text-sm">
                  <dt className="shrink-0 text-ink-400">{label}</dt>
                  <dd className="truncate text-right text-ink-800">
                    {value ?? "-"}
                  </dd>
                </div>
              ))}
            </dl>
            {inquiry.rawParams != null && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-ink-500">
                  원본 파라미터
                </summary>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-ink-50 p-3 text-xs">
                  {JSON.stringify(inquiry.rawParams, null, 2)}
                </pre>
              </details>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
