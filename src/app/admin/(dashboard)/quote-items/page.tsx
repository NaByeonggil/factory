import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { QuoteItemTable } from "@/components/admin/quote-item-table";

export const dynamic = "force-dynamic";

/**
 * 견적서에 담기는 항목 관리.
 *
 * 원래 「건강기능식품 생산문의」 페이지에 공개돼 있던 표를 관리자 전용으로
 * 옮긴 화면입니다. 견적서를 쓸 때 빠뜨린 항목이 없는지 보는 체크리스트라
 * 고객 화면에는 나가지 않습니다.
 */
export default async function AdminQuoteItemsPage() {
  const session = await getSession();
  const rows = await prisma.quoteItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, body: true, sortOrder: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">견적서 항목</h1>
          <p className="mt-1 text-sm text-ink-500">
            총 {rows.length}건 · 견적서를 작성할 때 확인하는 내부 체크리스트로,
            고객 페이지에는 노출되지 않습니다
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/quote-items/new">
            <Plus className="size-4" aria-hidden />
            항목 추가
          </Link>
        </Button>
      </div>

      <QuoteItemTable rows={rows} canDelete={session?.role === "ADMIN"} />
    </div>
  );
}
