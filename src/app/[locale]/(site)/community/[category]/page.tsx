import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import { CtaBand } from "@/components/site/cta-band";
import { CommunityTabs } from "@/components/site/community-tabs";
import {
  POST_CATEGORY_SLUGS,
  getPosts,
  isPostCategorySlug,
} from "@/lib/queries";
import { routing } from "@/i18n/routing";
import { formatDate } from "@/lib/utils";
import { Thumbnail } from "@/components/site/media";

export const dynamic = "force-static";
export const revalidate = 600;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    Object.keys(POST_CATEGORY_SLUGS).map((category) => ({ locale, category })),
  );
}

export async function generateMetadata(
  props: PageProps<"/[locale]/community/[category]">,
): Promise<Metadata> {
  const { locale, category } = await props.params;
  if (!isPostCategorySlug(category)) return {};

  const t = await getTranslations({ locale, namespace: "collections" });
  const key = POST_CATEGORY_SLUGS[category];
  return {
    title: t(`category${key}`),
    description: t(`desc${key}`),
    alternates: { canonical: `/${locale}/community/${category}` },
  };
}

export default async function CommunityCategoryPage(
  props: PageProps<"/[locale]/community/[category]">,
) {
  const { locale, category } = await props.params;
  if (!isPostCategorySlug(category)) notFound();

  const t = await getTranslations({ locale, namespace: "collections" });
  const key = POST_CATEGORY_SLUGS[category];
  const posts = await getPosts(locale, key);

  return (
    <>
      <Section>
        <Container>
          <SectionHeading
            eyebrow={t("communityTitle")}
            title={t(`category${key}`)}
            description={t(`desc${key}`)}
          />

          <CommunityTabs locale={locale} active={category} />

          {posts.length === 0 ? (
            <p className="mt-12 rounded-2xl border border-dashed border-ink-300 p-12 text-center text-sm text-ink-500">
              {t("postEmpty")}
            </p>
          ) : (
            <ul className="mt-10 divide-y divide-ink-200 border-y border-ink-200">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/community/${category}/${post.slug}`}
                    className="flex gap-5 py-6 transition-colors hover:bg-ink-50/60"
                  >
                    {post.coverUrl && (
                      <Thumbnail
                        src={post.coverUrl}
                        alt={post.title}
                        seed={post.title}
                        ratio="video"
                        className="w-40 shrink-0"
                        sizes="160px"
                      />
                    )}
                    <div className="flex min-w-0 flex-col gap-2">
                    <p className="text-lg font-bold text-ink-900">{post.title}</p>
                    {post.excerpt && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-ink-600">
                        {post.excerpt}
                      </p>
                    )}
                    {post.publishedAt && (
                      <time
                        dateTime={post.publishedAt.toISOString()}
                        className="text-sm text-ink-400"
                      >
                        {formatDate(post.publishedAt, locale)}
                      </time>
                    )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
      <CtaBand locale={locale} />
    </>
  );
}
