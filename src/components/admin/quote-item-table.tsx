"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ArrowDown, ArrowUp, Pencil } from "lucide-react";
import { deleteQuoteItem, moveQuoteItem } from "@/actions/content";
import { DeleteButton } from "@/components/admin/delete-button";

export type QuoteItemRow = {
  id: string;
  title: string;
  body: string;
  sortOrder: number;
};

/**
 * 견적서 항목 목록 — 순서만 이 화면에서 바로 바꾸고,
 * 문구 수정은 상세 폼에서 합니다.
 */
export function QuoteItemTable({
  rows,
  canDelete,
}: {
  rows: QuoteItemRow[];
  /** 삭제는 ADMIN 권한에서만 노출합니다 */
  canDelete: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white">
      <table className="w-full min-w-3xl text-left text-sm">
        <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase text-ink-500">
          <tr>
            <th className="px-4 py-3 font-semibold">순서</th>
            <th className="px-4 py-3 font-semibold">항목</th>
            <th className="px-4 py-3 font-semibold">내용</th>
            <th className="px-4 py-3 font-semibold">작업</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((row, index) => (
            <tr key={row.id} className="hover:bg-ink-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="위로"
                    disabled={pending || index === 0}
                    onClick={() =>
                      startTransition(async () => {
                        await moveQuoteItem(row.id, "up");
                      })
                    }
                    className={arrow}
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="아래로"
                    disabled={pending || index === rows.length - 1}
                    onClick={() =>
                      startTransition(async () => {
                        await moveQuoteItem(row.id, "down");
                      })
                    }
                    className={arrow}
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                  <span className="ml-1 text-xs text-ink-400">
                    {row.sortOrder}
                  </span>
                </div>
              </td>

              <td className="px-4 py-3">
                <Link
                  href={`/admin/quote-items/${row.id}`}
                  className="font-semibold text-ink-900"
                >
                  {row.title}
                </Link>
              </td>

              <td className="px-4 py-3 text-ink-600">{row.body}</td>

              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/quote-items/${row.id}`}
                    className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                  >
                    <Pencil className="mr-1 inline size-3" aria-hidden />
                    수정
                  </Link>
                  {canDelete && (
                    <DeleteButton action={deleteQuoteItem} id={row.id} />
                  )}
                </div>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-12 text-center text-ink-400">
                등록된 견적서 항목이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const arrow =
  "rounded-md border border-ink-200 p-1 text-ink-500 hover:bg-ink-100 disabled:opacity-30 disabled:hover:bg-transparent";
