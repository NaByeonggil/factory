"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { POST_CATEGORY_SLUGS } from "@/lib/queries";
import { routing } from "@/i18n/routing";
import type { PostCategory } from "@/generated/prisma/enums";
import {
  DB_LOCALES,
  type ActionState,
  type DbLocale,
  checkbox,
  ingredientSchema,
  text,
  lines,
  parseTranslations,
  postSchema,
  productSchema,
} from "@/lib/validations/admin";

const SLUG_BY_CATEGORY = Object.fromEntries(
  Object.entries(POST_CATEGORY_SLUGS).map(([slug, value]) => [value, slug]),
) as Record<PostCategory, string>;

/** zod 오류를 필드 경로 → 메시지 맵으로 */
function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!out[path]) out[path] = issue.message;
  }
  return out;
}

/** 이름/제목이 비어 있는 로케일은 번역을 만들지 않습니다 (부분 번역 허용) */
function filledLocales<T extends Record<string, unknown>>(
  translations: Record<DbLocale, T>,
  requiredField: keyof T,
) {
  return DB_LOCALES.filter((locale) => {
    const value = translations[locale][requiredField];
    return typeof value === "string" && value.trim().length > 0;
  });
}

/**
 * 공개 페이지 캐시 무효화.
 *
 * `revalidatePath("/[locale]/ingredients", "page")` 같은 패턴 형태는 라우트가
 * 그룹`(site)` 안에 있어 매칭되지 않습니다. 로케일별 리터럴 경로로 지정합니다.
 */
function revalidateLocalePaths(paths: string[]) {
  for (const locale of routing.locales) {
    for (const path of paths) {
      revalidatePath(`/${locale}${path}`);
    }
  }
  revalidatePath("/sitemap.xml");
}

function revalidateIngredients(slugs: (string | null | undefined)[]) {
  revalidateLocalePaths([
    "",
    "/ingredients",
    ...unique(slugs).map((slug) => `/ingredients/${slug}`),
  ]);
}

function revalidatePosts(
  entries: { category: PostCategory; slug: string }[],
) {
  const paths = new Set<string>();
  for (const entry of entries) {
    const category = SLUG_BY_CATEGORY[entry.category];
    paths.add(`/community/${category}`);
    paths.add(`/community/${category}/${entry.slug}`);
  }
  revalidateLocalePaths([...paths]);
}

function revalidateProducts(slugs: (string | null | undefined)[]) {
  revalidateLocalePaths([
    "/portfolio",
    ...unique(slugs).map((slug) => `/portfolio/${slug}`),
  ]);
}

function unique(values: (string | null | undefined)[]) {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

function uniqueSlugError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

// ───────────────────────── 원료 ─────────────────────────

const INGREDIENT_FIELDS = [
  "name",
  "summary",
  "functionality",
  "dailyDose",
  "body",
  "seoTitle",
  "seoDesc",
] as const;

function readIngredient(formData: FormData) {
  return ingredientSchema.safeParse({
    slug: text(formData, "slug"),
    category: text(formData, "category"),
    thumbnailUrl: text(formData, "thumbnailUrl"),
    isFeatured: checkbox(formData, "isFeatured"),
    isPublished: checkbox(formData, "isPublished"),
    sortOrder: text(formData, "sortOrder") || 0,
    translations: parseTranslations(formData, INGREDIENT_FIELDS),
  });
}

export async function saveIngredient(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // id는 .bind()가 아니라 폼의 hidden 필드로 받습니다.
  // 바인딩된 인자는 암호화되어 전달되는데, JS가 없는 폼 제출 경로에서
  // 응답이 완결되지 않는 문제가 있어 hidden 필드 방식이 더 견고합니다.
  let id = String(formData.get("id") ?? "") || null;
  await requireSession(["ADMIN", "EDITOR"]);

  const parsed = readIngredient(formData);
  if (!parsed.success) {
    return { error: "입력값을 확인해주세요.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const { translations, ...data } = parsed.data;
  const locales = filledLocales(translations, "name");
  if (locales.length === 0) {
    return {
      error: "최소 한 개 언어의 원료명을 입력해주세요.",
      fieldErrors: { "translations.KO.name": "원료명을 입력해주세요." },
    };
  }

  const rows = locales.map((locale) => ({ locale, ...translations[locale] }));

  // slug가 바뀌면 이전 주소의 캐시도 함께 비워야 합니다
  const previousSlug = id
    ? (await prisma.ingredient.findUnique({ where: { id }, select: { slug: true } }))
        ?.slug
    : null;

  try {
    if (id) {
      const ingredientId = id;
      await prisma.$transaction([
        prisma.ingredient.update({ where: { id: ingredientId }, data }),
        // 비워둔 언어의 번역은 제거하고, 채워진 언어만 다시 씁니다
        prisma.ingredientTranslation.deleteMany({ where: { ingredientId } }),
        prisma.ingredientTranslation.createMany({
          data: rows.map((row) => ({ ...row, ingredientId })),
        }),
      ]);
    } else {
      const created = await prisma.ingredient.create({
        data: { ...data, translations: { create: rows } },
        select: { id: true },
      });
      id = created.id;
    }
  } catch (error) {
    if (uniqueSlugError(error)) {
      return { error: "이미 사용 중인 slug입니다.", fieldErrors: { slug: "중복된 slug" } };
    }
    console.error("[saveIngredient]", error);
    return { error: "저장 중 오류가 발생했습니다." };
  }

  revalidateIngredients([data.slug, previousSlug]);
  revalidatePath("/admin/ingredients");
  redirect(`/admin/ingredients/${id}?saved=1`);
}

export async function deleteIngredient(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await requireSession(["ADMIN"]);
  const removed = await prisma.ingredient.delete({
    where: { id },
    select: { slug: true },
  });
  revalidateIngredients([removed.slug]);
  revalidatePath("/admin/ingredients");
  redirect("/admin/ingredients");
}

// ───────────────────────── 게시물 ─────────────────────────

const POST_FIELDS = ["title", "excerpt", "body", "seoTitle", "seoDesc"] as const;

export async function savePost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // id는 .bind()가 아니라 폼의 hidden 필드로 받습니다.
  // 바인딩된 인자는 암호화되어 전달되는데, JS가 없는 폼 제출 경로에서
  // 응답이 완결되지 않는 문제가 있어 hidden 필드 방식이 더 견고합니다.
  let id = String(formData.get("id") ?? "") || null;
  await requireSession(["ADMIN", "EDITOR"]);

  const parsed = postSchema.safeParse({
    slug: text(formData, "slug"),
    category: text(formData, "category"),
    coverUrl: text(formData, "coverUrl"),
    publishedAt: text(formData, "publishedAt"),
    translations: parseTranslations(formData, POST_FIELDS),
  });
  if (!parsed.success) {
    return { error: "입력값을 확인해주세요.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const { translations, ...data } = parsed.data;
  const locales = filledLocales(translations, "title");
  if (locales.length === 0) {
    return {
      error: "최소 한 개 언어의 제목을 입력해주세요.",
      fieldErrors: { "translations.KO.title": "제목을 입력해주세요." },
    };
  }

  const rows = locales.map((locale) => ({ locale, ...translations[locale] }));

  const previous = id
    ? await prisma.post.findUnique({
        where: { id },
        select: { slug: true, category: true },
      })
    : null;

  try {
    if (id) {
      const postId = id;
      await prisma.$transaction([
        prisma.post.update({ where: { id: postId }, data }),
        prisma.postTranslation.deleteMany({ where: { postId } }),
        prisma.postTranslation.createMany({
          data: rows.map((row) => ({ ...row, postId })),
        }),
      ]);
    } else {
      const created = await prisma.post.create({
        data: { ...data, translations: { create: rows } },
        select: { id: true },
      });
      id = created.id;
    }
  } catch (error) {
    if (uniqueSlugError(error)) {
      return { error: "이미 사용 중인 slug입니다.", fieldErrors: { slug: "중복된 slug" } };
    }
    console.error("[savePost]", error);
    return { error: "저장 중 오류가 발생했습니다." };
  }

  revalidatePosts([
    { category: data.category, slug: data.slug },
    ...(previous ? [previous] : []),
  ]);
  revalidatePath("/admin/posts");
  redirect(`/admin/posts/${id}?saved=1`);
}

export async function deletePost(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await requireSession(["ADMIN"]);
  const removed = await prisma.post.delete({
    where: { id },
    select: { slug: true, category: true },
  });
  revalidatePosts([removed]);
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}

// ─────────────────────── 포트폴리오 ───────────────────────

const PRODUCT_FIELDS = ["title", "description", "seoTitle", "seoDesc"] as const;

export async function saveProduct(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // id는 .bind()가 아니라 폼의 hidden 필드로 받습니다.
  // 바인딩된 인자는 암호화되어 전달되는데, JS가 없는 폼 제출 경로에서
  // 응답이 완결되지 않는 문제가 있어 hidden 필드 방식이 더 견고합니다.
  let id = String(formData.get("id") ?? "") || null;
  await requireSession(["ADMIN", "EDITOR"]);

  const parsed = productSchema.safeParse({
    slug: text(formData, "slug"),
    serviceType: text(formData, "serviceType"),
    formulation: text(formData, "formulation"),
    imageUrls: lines(formData, "imageUrls"),
    ingredientIds: formData.getAll("ingredientIds").map(String),
    isFeatured: checkbox(formData, "isFeatured"),
    isPublished: checkbox(formData, "isPublished"),
    sortOrder: text(formData, "sortOrder") || 0,
    translations: parseTranslations(formData, PRODUCT_FIELDS),
  });
  if (!parsed.success) {
    return { error: "입력값을 확인해주세요.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const { translations, ingredientIds, ...data } = parsed.data;
  const locales = filledLocales(translations, "title");
  if (locales.length === 0) {
    return {
      error: "최소 한 개 언어의 제품명을 입력해주세요.",
      fieldErrors: { "translations.KO.title": "제품명을 입력해주세요." },
    };
  }

  const rows = locales.map((locale) => ({ locale, ...translations[locale] }));
  const connect = ingredientIds.map((ingredientId) => ({ id: ingredientId }));

  const previousProductSlug = id
    ? (await prisma.product.findUnique({ where: { id }, select: { slug: true } }))?.slug
    : null;

  try {
    if (id) {
      const productId = id;
      await prisma.$transaction([
        prisma.product.update({
          where: { id: productId },
          data: { ...data, ingredients: { set: connect } },
        }),
        prisma.productTranslation.deleteMany({ where: { productId } }),
        prisma.productTranslation.createMany({
          data: rows.map((row) => ({ ...row, productId })),
        }),
      ]);
    } else {
      const created = await prisma.product.create({
        data: {
          ...data,
          ingredients: { connect },
          translations: { create: rows },
        },
        select: { id: true },
      });
      id = created.id;
    }
  } catch (error) {
    if (uniqueSlugError(error)) {
      return { error: "이미 사용 중인 slug입니다.", fieldErrors: { slug: "중복된 slug" } };
    }
    console.error("[saveProduct]", error);
    return { error: "저장 중 오류가 발생했습니다." };
  }

  revalidateProducts([data.slug, previousProductSlug]);
  revalidatePath("/admin/portfolio");
  redirect(`/admin/portfolio/${id}?saved=1`);
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await requireSession(["ADMIN"]);
  const removed = await prisma.product.delete({
    where: { id },
    select: { slug: true },
  });
  revalidateProducts([removed.slug]);
  revalidatePath("/admin/portfolio");
  redirect("/admin/portfolio");
}
