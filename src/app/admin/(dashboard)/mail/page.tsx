import Link from "next/link";
import { ExternalLink, Mail as MailIcon, Paperclip } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MailCategorySelect,
  MailDisconnectButton,
  MailLabelToggle,
  MailRetryButton,
  MailSyncButton,
} from "@/components/admin/mail-controls";
import { MAIL_CATEGORIES, MAIL_CATEGORY_LABELS } from "@/lib/constants";
import { gmailConfigured } from "@/lib/gmail";
import { llmConfigured } from "@/lib/llm";
import { cn, formatDateTime } from "@/lib/utils";
import type { MailCategory } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
/** Google 동의 화면으로 넘어가는 주소 — Link 는 미리 불러오므로 <a> 로 둡니다 */
const CONNECT_HREF = "/admin/mail/oauth/start";
const STATUS_LABELS = { PENDING: "정리 대기", FAILED: "정리 실패" } as const;

/** 받은편지함 메일을 AI 가 분류·요약한 목록. 대표 메일함이라 관리자만 봅니다 */
export default async function AdminMailPage(props: PageProps<"/admin/mail">) {
  await requireSession(["ADMIN"]);

  const search = await props.searchParams;
  const account = await prisma.mailAccount.findUnique({ where: { id: "gmail" } });

  if (!account) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">메일 분류</h1>
        <div className="space-y-4 rounded-2xl border border-ink-200 bg-white p-6">
          {search.error === "connect" && (
            <p role="alert" className="text-sm text-red-600">
              Gmail 연결에 실패했습니다. 다시 시도해주세요.
            </p>
          )}
          {gmailConfigured() ? (
            <>
              <p className="text-sm text-ink-600">
                Gmail을 연결하면 받은편지함의 새 메일을 로컬 AI가 분류하고
                요약합니다. 처음에는 최근 메일 50건을 가져옵니다.
              </p>
              <Button asChild size="sm">
                <a href={CONNECT_HREF}>
                  <MailIcon className="size-4" aria-hidden />
                  Gmail 연결
                </a>
              </Button>
            </>
          ) : (
            <p className="text-sm text-ink-600">
              GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 환경변수를 설정하면 사용할 수
              있습니다.
            </p>
          )}
        </div>
      </div>
    );
  }

  const rawCategory = typeof search.category === "string" ? search.category : "";
  const category = MAIL_CATEGORIES.includes(rawCategory as MailCategory)
    ? (rawCategory as MailCategory)
    : undefined;
  const urgent = search.urgent === "1";
  const q = typeof search.q === "string" ? search.q.trim() : "";
  const page = Math.max(1, Number(search.page ?? 1) || 1);

  const where = {
    accountEmail: account.email,
    ...(category ? { category } : {}),
    ...(urgent ? { urgent: true } : {}),
    ...(q
      ? {
          OR: [
            { subject: { contains: q, mode: "insensitive" as const } },
            { fromName: { contains: q, mode: "insensitive" as const } },
            { fromEmail: { contains: q, mode: "insensitive" as const } },
            { company: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total, pendingCount] = await Promise.all([
    prisma.mail.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.mail.count({ where }),
    prisma.mail.count({
      where: { accountEmail: account.email, status: "PENDING" },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">메일 분류</h1>
          <p className="mt-1 text-sm text-ink-500">
            {account.email} · 총 {total.toLocaleString()}건
            {pendingCount > 0 && ` · 정리 대기 ${pendingCount.toLocaleString()}건`}
            {account.lastSyncAt &&
              ` · 마지막 동기화 ${formatDateTime(account.lastSyncAt)}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MailLabelToggle enabled={account.applyLabels} />
          <MailSyncButton />
          <MailDisconnectButton />
        </div>
      </div>

      {account.lastError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {account.lastError}
        </p>
      )}
      {!llmConfigured() && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          LLM 설정이 없어 메일을 정리할 수 없습니다.
        </p>
      )}

      <form className="flex flex-wrap gap-2" action="/admin/mail">
        <input
          name="q"
          defaultValue={q}
          placeholder="제목 · 보낸 사람 · 회사"
          className="h-10 min-w-56 flex-1 rounded-lg border border-ink-300 px-3 text-sm"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          className="h-10 rounded-lg border border-ink-300 px-3 text-sm"
        >
          <option value="">전체 분류</option>
          {MAIL_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {MAIL_CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-ink-300 px-3 text-sm">
          <input type="checkbox" name="urgent" value="1" defaultChecked={urgent} />
          긴급만
        </label>
        <button
          type="submit"
          className="h-10 rounded-lg bg-ink-900 px-4 text-sm font-semibold text-white"
        >
          검색
        </button>
      </form>

      <ul className="space-y-3">
        {rows.map((row) => {
          const details = [
            ["회사", row.company],
            ["제품", row.product],
            ["수량·금액", row.quantity],
            ["납기·기한", row.dueDate],
            ["할 일", row.action],
          ].filter((detail): detail is [string, string] => Boolean(detail[1]));

          return (
            <li
              key={row.id}
              className="space-y-3 rounded-2xl border border-ink-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                {row.status === "DONE" ? (
                  <MailCategorySelect id={row.id} category={row.category ?? "OTHER"} />
                ) : (
                  <Badge tone={row.status === "FAILED" ? "danger" : "neutral"}>
                    {STATUS_LABELS[row.status]}
                  </Badge>
                )}
                {row.urgent && <Badge tone="danger">긴급</Badge>}
                {row.status === "FAILED" && <MailRetryButton id={row.id} />}
                <span className="ml-auto whitespace-nowrap text-xs text-ink-400">
                  {formatDateTime(row.receivedAt)}
                </span>
              </div>

              <div>
                <p className="font-semibold break-words">{row.subject}</p>
                <p className="text-sm break-words text-ink-500">
                  {row.fromName ? `${row.fromName} <${row.fromEmail}>` : row.fromEmail}
                </p>
              </div>

              {row.failReason && row.status === "FAILED" && (
                <p className="text-sm text-red-600">{row.failReason}</p>
              )}

              {row.summary.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-sm text-ink-700">
                  {row.summary.map((line, index) => (
                    <li key={index}>{line}</li>
                  ))}
                </ul>
              )}

              {details.length > 0 && (
                <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[6rem_1fr]">
                  {details.map(([label, value]) => (
                    <div key={label} className="contents">
                      <dt className="font-semibold text-ink-500">{label}</dt>
                      <dd className="break-words text-ink-700">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {row.attachmentNames.length > 0 && (
                  <span className="flex items-center gap-1 break-all text-ink-500">
                    <Paperclip className="size-3.5 shrink-0" aria-hidden />
                    {row.attachmentNames.join(", ")}
                  </span>
                )}
                <a
                  href={`https://mail.google.com/mail/?authuser=${encodeURIComponent(account.email)}#all/${row.gmailId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto flex items-center gap-1 font-semibold text-brand-700 hover:underline"
                >
                  Gmail에서 원문 보기
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </div>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="rounded-2xl border border-ink-200 bg-white px-4 py-12 text-center text-sm text-ink-400">
            결과가 없습니다.
          </li>
        )}
      </ul>

      {totalPages > 1 && (
        <nav className="flex justify-center gap-1" aria-label="페이지">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={{
                pathname: "/admin/mail",
                query: {
                  ...(q ? { q } : {}),
                  ...(category ? { category } : {}),
                  ...(urgent ? { urgent: "1" } : {}),
                  page: p,
                },
              }}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-semibold",
                p === page ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-100",
              )}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
