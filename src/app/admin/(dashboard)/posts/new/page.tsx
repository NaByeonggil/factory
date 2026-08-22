import { PostForm, type PostFormValues } from "@/components/admin/post-form";
import { emptyTranslations } from "@/lib/admin-defaults";

const FIELDS = ["title", "excerpt", "body", "seoTitle", "seoDesc"] as const;

export default function NewPostPage() {
  const values: PostFormValues = {
    id: null,
    slug: "",
    category: "NEWS",
    coverUrl: "",
    publishedAt: "",
    translations: emptyTranslations(FIELDS),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">게시물 작성</h1>
      <PostForm values={values} />
    </div>
  );
}
