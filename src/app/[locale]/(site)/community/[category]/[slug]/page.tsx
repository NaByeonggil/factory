import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Container, Section } from "@/components/ui/section";
import { CtaBand } from "@/components/site/cta-band";
import {
  POST_CATEGORY_SLUGS,
  getAllPosts,
  getPostBySlug,
  isPostCategorySlug,
} from "@/lib/queries";
import { routing } from "@/i18n/routing";
import { formatDate } from "@/lib/utils";
import { Thumbnail } from "@/components/site/media";

const SLUG_BY_CATEGORY = Object.fromEntries(
  Object.entries(POST_CATEGORY_SLUGS).map(([slug, value]) => [value, slug]),
) as Record<string, string>;

export const dynamic = "force-static";
export const revalidate = 600;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return routing.locales.flatMap((locale) =>
    posts.map((post) => ({
      locale,
      category: SLUG_BY_CATEGORY[post.category],
      slug: post.slug,
    })),
  );
}

export async function generateMetadata(
  props: PageProps<"/[locale]/community/[category]/[slug]">,
): Promise<Metadata> {
  const { locale, category, slug } = await props.params;
  const post = await getPostBySlug(slug, locale);
  if (!post) return {};
  return {
    title: post.t.seoTitle ?? post.t.title,
    description: post.t.seoDesc ?? post.t.excerpt ?? undefined,
    alternates: { canonical: `/${locale}/community/${category}/${slug}` },
  };
}

export default async function CommunityPostPage(
  props: PageProps<"/[locale]/community/[category]/[slug]">,
) {
  const { locale, category, slug } = await props.params;
  if (!isPostCategorySlug(category)) notFound();

  const post = await getPostBySlug(slug, locale);
  // URL의 카테고리와 실제 게시물 카테고리가 다르면 중복 URL이 생기므로 404
  if (!post || post.category !== POST_CATEGORY_SLUGS[category]) notFound();

  const t = await getTranslations({ locale, namespace: "collections" });

  return (
    <>
      <Section>
        <Container className="max-w-3xl">
          <Link
            href={`/community/${category}`}
            className="text-sm font-semibold text-ink-500 hover:text-brand-700"
          >
            ← {t(`category${post.category}`)}
          </Link>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-4xl">
            {post.t.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge tone="brand">{t(`category${post.category}`)}</Badge>
            {post.publishedAt && (
              <time
                dateTime={post.publishedAt.toISOString()}
                className="text-sm text-ink-400"
              >
                {formatDate(post.publishedAt, locale)}
              </time>
            )}
          </div>

          {post.coverUrl && (
            <Thumbnail
              src={post.coverUrl}
              alt={post.t.title}
              seed={post.t.title}
              ratio="video"
              className="mt-8"
              sizes="(min-width: 768px) 720px, 100vw"
              priority
            />
          )}

          <div className="mt-10 whitespace-pre-line text-[0.9375rem] leading-loose text-ink-700">
            {post.t.body}
          </div>
        </Container>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
