import Link from "next/link";
import { Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminQnaPage() {
  const rows = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      title: true,
      authorName: true,
      company: true,
      isSecret: true,
      isPublished: true,
      answeredAt: true,
      locale: true,
      createdAt: true,
    },
  });

  const pending = rows.filter((row) => !row.answeredAt).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">문답 게시판</h1>
        <p className="mt-1 text-sm text-ink-500">
          총 {rows.length}건 · 미답변 {pending}건
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-3xl text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase text-ink-500">
            <tr>
              <th className="px-4 py-3 font-semibold">제목</th>
              <th className="px-4 py-3 font-semibold">작성자</th>
              <th className="px-4 py-3 font-semibold">언어</th>
              <th className="px-4 py-3 font-semibold">작성일</th>
              <th className="px-4 py-3 font-semibold">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-ink-50">
                <td className="px-4 py-3 font-semibold">
                  <Link href={`/admin/qna/${row.id}`} className="flex items-center gap-2">
                    {row.isSecret && (
                      <Lock className="size-3.5 shrink-0 text-ink-400" aria-label="비밀글" />
                    )}
                    {row.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-600">
                  {row.authorName}
                  {row.company && (
                    <span className="text-ink-400"> · {row.company}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-500">
                  {row.locale}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-400">
                  {formatDateTime(row.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {!row.isPublished ? (
                    <Badge tone="danger">숨김</Badge>
                  ) : row.answeredAt ? (
                    <Badge tone="success">답변완료</Badge>
                  ) : (
                    <Badge tone="accent">미답변</Badge>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-ink-400">
                  등록된 질문이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
