import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { toDbLocale } from "@/i18n/routing";
import type {
  IngredientCategory,
  PostCategory,
  ServiceType,
} from "@/generated/prisma/enums";

/**
 * DB 미연결 상태(초기 셋업 중)에도 화면이 뜨도록 감싼 조회 헬퍼.
 * 운영 배포에서는 DATABASE_URL이 항상 있으므로 catch로 빠지지 않습니다.
 */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[queries] DB 조회 실패 — 빈 데이터로 대체합니다.", error);
    }
    return fallback;
  }
}

export type IngredientCard = {
  slug: string;
  category: IngredientCategory;
  thumbnailUrl: string | null;
  name: string;
  summary: string | null;
};

function toCard(row: {
  slug: string;
  category: IngredientCategory;
  thumbnailUrl: string | null;
  translations: { name: string; summary: string | null }[];
}): IngredientCard | null {
  const tr = row.translations[0];
  if (!tr) return null;
  return {
    slug: row.slug,
    category: row.category,
    thumbnailUrl: row.thumbnailUrl,
    name: tr.name,
    summary: tr.summary,
  };
}

export const getFeaturedIngredients = cache(
  async (locale: string, take = 8): Promise<IngredientCard[]> =>
    safe(async () => {
      const rows = await prisma.ingredient.findMany({
        where: { isPublished: true, isFeatured: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take,
        select: {
          slug: true,
          category: true,
          thumbnailUrl: true,
          translations: {
            where: { locale: toDbLocale(locale) as "KO" },
            select: { name: true, summary: true },
          },
        },
      });
      return rows.map(toCard).filter((v): v is IngredientCard => v !== null);
    }, []),
);

export const getIngredients = cache(
  async (
    locale: string,
    category?: IngredientCategory,
  ): Promise<IngredientCard[]> =>
    safe(async () => {
      const rows = await prisma.ingredient.findMany({
        where: { isPublished: true, ...(category ? { category } : {}) },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: {
          slug: true,
          category: true,
          thumbnailUrl: true,
          translations: {
            where: { locale: toDbLocale(locale) as "KO" },
            select: { name: true, summary: true },
          },
        },
      });
      return rows.map(toCard).filter((v): v is IngredientCard => v !== null);
    }, []),
);

export const getIngredientBySlug = cache(async (slug: string, locale: string) =>
  safe(async () => {
    const row = await prisma.ingredient.findFirst({
      where: { slug, isPublished: true },
      select: {
        slug: true,
        category: true,
        thumbnailUrl: true,
        translations: {
          where: { locale: toDbLocale(locale) as "KO" },
          select: {
            name: true,
            summary: true,
            functionality: true,
            dailyDose: true,
            body: true,
            seoTitle: true,
            seoDesc: true,
          },
        },
      },
    });
    if (!row?.translations[0]) return null;
    return { ...row, t: row.translations[0] };
  }, null),
);

export const getAllIngredientSlugs = cache(async () =>
  safe(
    async () =>
      prisma.ingredient.findMany({
        where: { isPublished: true },
        select: { slug: true },
      }),
    [] as { slug: string }[],
  ),
);

export const getCertifications = cache(async () =>
  safe(
    async () =>
      prisma.certification.findMany({ orderBy: { sortOrder: "asc" } }),
    [] as Awaited<ReturnType<typeof prisma.certification.findMany>>,
  ),
);

/** 메인의 "최근 접수된 문의" — 개인정보 없이 유형/제형/시점만 노출 */
export const getRecentInquirySummaries = cache(async (take = 6) =>
  safe(
    async () =>
      prisma.inquiry.findMany({
        where: { status: { notIn: ["SPAM"] } },
        orderBy: { createdAt: "desc" },
        take,
        select: {
          id: true,
          serviceType: true,
          formulations: true,
          createdAt: true,
        },
      }),
    [] as { id: string; serviceType: string; formulations: string[]; createdAt: Date }[],
  ),
);

// ───────────────────────── 포트폴리오 ─────────────────────────

export type ProductCard = {
  slug: string;
  serviceType: ServiceType;
  formulation: string;
  imageUrls: string[];
  title: string;
  description: string | null;
};

export const getProducts = cache(
  async (locale: string): Promise<ProductCard[]> =>
    safe(async () => {
      const rows = await prisma.product.findMany({
        where: { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: {
          slug: true,
          serviceType: true,
          formulation: true,
          imageUrls: true,
          translations: {
            where: { locale: toDbLocale(locale) as "KO" },
            select: { title: true, description: true },
          },
        },
      });
      return rows
        .map((row) => {
          const tr = row.translations[0];
          if (!tr) return null;
          return {
            slug: row.slug,
            serviceType: row.serviceType,
            formulation: row.formulation,
            imageUrls: row.imageUrls,
            title: tr.title,
            description: tr.description,
          };
        })
        .filter((v): v is ProductCard => v !== null);
    }, []),
);

export const getProductBySlug = cache(async (slug: string, locale: string) =>
  safe(async () => {
    const row = await prisma.product.findFirst({
      where: { slug, isPublished: true },
      select: {
        slug: true,
        serviceType: true,
        formulation: true,
        imageUrls: true,
        ingredients: {
          where: { isPublished: true },
          select: {
            slug: true,
            translations: {
              where: { locale: toDbLocale(locale) as "KO" },
              select: { name: true },
            },
          },
        },
        translations: {
          where: { locale: toDbLocale(locale) as "KO" },
          select: { title: true, description: true, seoTitle: true, seoDesc: true },
        },
      },
    });
    if (!row?.translations[0]) return null;
    return { ...row, t: row.translations[0] };
  }, null),
);

export const getAllProductSlugs = cache(async () =>
  safe(
    async () =>
      prisma.product.findMany({
        where: { isPublished: true },
        select: { slug: true },
      }),
    [] as { slug: string }[],
  ),
);

// ───────────────────────── 커뮤니티 ─────────────────────────

/** URL 세그먼트 ↔ PostCategory 매핑 */
export const POST_CATEGORY_SLUGS = {
  news: "NEWS",
  notice: "NOTICE",
  esg: "ESG",
  "factory-tour": "FACTORY_TOUR",
} as const satisfies Record<string, PostCategory>;

export type PostCategorySlug = keyof typeof POST_CATEGORY_SLUGS;

export function isPostCategorySlug(value: string): value is PostCategorySlug {
  return value in POST_CATEGORY_SLUGS;
}

export type PostCard = {
  slug: string;
  category: PostCategory;
  coverUrl: string | null;
  publishedAt: Date | null;
  title: string;
  excerpt: string | null;
};

export const getPosts = cache(
  async (locale: string, category: PostCategory): Promise<PostCard[]> =>
    safe(async () => {
      const rows = await prisma.post.findMany({
        where: { category, publishedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
        select: {
          slug: true,
          category: true,
          coverUrl: true,
          publishedAt: true,
          translations: {
            where: { locale: toDbLocale(locale) as "KO" },
            select: { title: true, excerpt: true },
          },
        },
      });
      return rows
        .map((row) => {
          const tr = row.translations[0];
          if (!tr) return null;
          return {
            slug: row.slug,
            category: row.category,
            coverUrl: row.coverUrl,
            publishedAt: row.publishedAt,
            title: tr.title,
            excerpt: tr.excerpt,
          };
        })
        .filter((v): v is PostCard => v !== null);
    }, []),
);

export const getPostBySlug = cache(async (slug: string, locale: string) =>
  safe(async () => {
    const row = await prisma.post.findFirst({
      where: { slug, publishedAt: { not: null } },
      select: {
        slug: true,
        category: true,
        coverUrl: true,
        publishedAt: true,
        translations: {
          where: { locale: toDbLocale(locale) as "KO" },
          select: {
            title: true,
            excerpt: true,
            body: true,
            seoTitle: true,
            seoDesc: true,
          },
        },
      },
    });
    if (!row?.translations[0]) return null;
    return { ...row, t: row.translations[0] };
  }, null),
);

export const getAllPosts = cache(async () =>
  safe(
    async () =>
      prisma.post.findMany({
        where: { publishedAt: { not: null } },
        select: { slug: true, category: true },
      }),
    [] as { slug: string; category: PostCategory }[],
  ),
);
