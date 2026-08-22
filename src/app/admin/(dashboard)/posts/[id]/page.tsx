import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostForm, type PostFormValues } from "@/components/admin/post-form";
import { mergeTranslations } from "@/lib/admin-defaults";
import { toDatetimeLocal } from "@/lib/admin-defaults";

export const dynamic = "force-dynamic";

const FIELDS = ["title", "excerpt", "body", "seoTitle", "seoDesc"] as const;

export default async function EditPostPage(props: PageProps<"/admin/posts/[id]">) {
  const { id } = await props.params;
  const search = await props.searchParams;

  const row = await prisma.post.findUnique({
    where: { id },
    include: { translations: true },
  });
  if (!row) notFound();

  const values: PostFormValues = {
    id: row.id,
    slug: row.slug,
    category: row.category,
    coverUrl: row.coverUrl ?? "",
    publishedAt: toDatetimeLocal(row.publishedAt),
    translations: mergeTranslations(FIELDS, row.translations),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">게시물 수정</h1>
      <PostForm values={values} saved={search.saved === "1"} />
    </div>
  );
}
