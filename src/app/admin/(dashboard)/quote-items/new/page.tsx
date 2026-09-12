import { prisma } from "@/lib/prisma";
import {
  QuoteItemForm,
  type QuoteItemFormValues,
} from "@/components/admin/quote-item-form";

export const dynamic = "force-dynamic";

export default async function NewQuoteItemPage() {
  // 새 항목은 목록 맨 뒤에 붙습니다
  const last = await prisma.quoteItem.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const values: QuoteItemFormValues = {
    id: null,
    title: "",
    body: "",
    sortOrder: (last?.sortOrder ?? 0) + 1,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">견적서 항목 추가</h1>
      <QuoteItemForm values={values} />
    </div>
  );
}
