import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  QuoteItemForm,
  type QuoteItemFormValues,
} from "@/components/admin/quote-item-form";

export const dynamic = "force-dynamic";

export default async function EditQuoteItemPage(
  props: PageProps<"/admin/quote-items/[id]">,
) {
  const { id } = await props.params;
  const search = await props.searchParams;

  const row = await prisma.quoteItem.findUnique({ where: { id } });
  if (!row) notFound();

  const values: QuoteItemFormValues = {
    id: row.id,
    title: row.title,
    body: row.body,
    sortOrder: row.sortOrder,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">견적서 항목 수정</h1>
      <QuoteItemForm values={values} saved={search.saved === "1"} />
    </div>
  );
}
