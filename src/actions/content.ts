"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { POST_CATEGORY_SLUGS } from "@/lib/queries";
import { INGREDIENT_CATEGORIES } from "@/lib/constants";
import { routing } from "@/i18n/routing";
import type { PostCategory } from "@/generated/prisma/enums";
import {
  DB_LOCALES,
  type ActionState,
  type DbLocale,
  checkbox,
  ingredientSchema,
  lectureSchema,
  slugSchema,
  text,
  lines,
  parseTranslations,
  popupSchema,
  postSchema,
  productSchema,
  quoteItemSchema,
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

/** 팝업은 로케일 레이아웃에서 렌더링되므로 하위 경로 전체를 비웁니다 */
function revalidatePopups() {
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}`, "layout");
  }
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

/**
 * 원료는 「보유 원료」와 「공급 특허원료」 두 목록에서 같이 다룹니다.
 * 저장·삭제 뒤 어느 목록으로 돌아갈지는 폼이 hidden 필드로 알려주고,
 * 열린 리다이렉트가 되지 않도록 값은 아래 두 개로만 제한합니다.
 */
const INGREDIENT_BASE_PATHS = [
  "/admin/ingredients",
  "/admin/materials",
] as const;

type IngredientBasePath = (typeof INGREDIENT_BASE_PATHS)[number];

function ingredientBasePath(formData: FormData): IngredientBasePath {
  const value = String(formData.get("basePath") ?? "");
  return (
    INGREDIENT_BASE_PATHS.find((path) => path === value) ?? "/admin/ingredients"
  );
}

/** 두 목록이 같은 데이터를 보여주므로 함께 비웁니다 */
function revalidateIngredientAdmin() {
  for (const path of INGREDIENT_BASE_PATHS) revalidatePath(path);
}

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
  revalidateIngredientAdmin();
  redirect(`${ingredientBasePath(formData)}/${id}?saved=1`);
}

export async function deleteIngredient(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await requireSession(["ADMIN"]);
  const removed = await prisma.ingredient.delete({
    where: { id },
    select: { slug: true },
  });
  revalidateIngredients([removed.slug]);
  revalidateIngredientAdmin();
  redirect(ingredientBasePath(formData));
}

/**
 * 목록에서 바로 켜고 끄는 노출 스위치.
 * 상세 폼을 열지 않고 공개·메인추천을 바꾸기 위한 경로입니다.
 */
export async function toggleIngredientFlag(
  id: string,
  field: "isPublished" | "isFeatured",
  value: boolean,
) {
  await requireSession(["ADMIN", "EDITOR"]);
  const row = await prisma.ingredient.update({
    where: { id },
    data: { [field]: value },
    select: { slug: true },
  });
  revalidateIngredients([row.slug]);
  revalidateIngredientAdmin();
}

/** 목록에서 분류만 바꾸는 경로 (상세 폼을 열지 않아도 되도록) */
export async function updateIngredientCategory(id: string, category: string) {
  await requireSession(["ADMIN", "EDITOR"]);
  const parsed = z.enum(INGREDIENT_CATEGORIES).safeParse(category);
  if (!parsed.success) return;

  const row = await prisma.ingredient.update({
    where: { id },
    data: { category: parsed.data },
    select: { slug: true },
  });
  revalidateIngredients([row.slug]);
  revalidateIngredientAdmin();
}

/**
 * 목록에서 바로 만드는 빠른 추가.
 * 이름·slug·분류만 받아 만들고, 상세 내용은 편집 화면에서 이어 채웁니다.
 */
export async function quickCreateIngredient(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession(["ADMIN", "EDITOR"]);

  const parsed = z
    .object({
      slug: slugSchema,
      category: z.enum(INGREDIENT_CATEGORIES),
      name: z.string().trim().min(1, "원료명을 입력해주세요.").max(120),
    })
    .safeParse({
      slug: text(formData, "slug"),
      category: text(formData, "category"),
      name: text(formData, "name"),
    });
  if (!parsed.success) {
    return { error: "입력값을 확인해주세요.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const { slug, category, name } = parsed.data;

  let id: string;
  try {
    const created = await prisma.ingredient.create({
      data: {
        slug,
        category,
        isPublished: true,
        translations: { create: [{ locale: "KO", name }] },
      },
      select: { id: true },
    });
    id = created.id;
  } catch (error) {
    if (uniqueSlugError(error)) {
      return { error: "이미 사용 중인 slug입니다.", fieldErrors: { slug: "중복된 slug" } };
    }
    console.error("[quickCreateIngredient]", error);
    return { error: "저장 중 오류가 발생했습니다." };
  }

  revalidateIngredients([slug]);
  revalidateIngredientAdmin();
  // 나머지 항목(요약·기능성·이미지·번역)을 이어서 채우도록 편집 화면으로
  redirect(`${ingredientBasePath(formData)}/${id}`);
}

/**
 * 목록 순서 변경.
 *
 * sortOrder 가 0으로 몰려 있으면 값 교환만으로는 순서가 바뀌지 않으므로,
 * 현재 표시 순서대로 전부 다시 번호를 매기면서 대상만 한 칸 이동시킵니다.
 *
 * `categories` 를 주면 그 분류만 모아 놓고 본 화면(「공급 특허원료」)의
 * 순서대로 한 칸 옮깁니다. 전체 목록 기준으로 옮기면 화면에 없는 원료와
 * 자리를 바꿔 아무 변화도 없는 것처럼 보입니다.
 */
export async function moveIngredient(
  id: string,
  direction: "up" | "down",
  categories?: string[],
) {
  await requireSession(["ADMIN", "EDITOR"]);

  const scope = z
    .array(z.enum(INGREDIENT_CATEGORIES))
    .nonempty()
    .safeParse(categories);

  const rows = await prisma.ingredient.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, slug: true, category: true },
  });

  // 순서를 따질 대상 — 분류가 지정되면 그 안에서만 이웃을 찾습니다
  const pool = scope.success
    ? rows.filter((row) => scope.data.includes(row.category))
    : rows;

  const index = pool.findIndex((row) => row.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= pool.length) return;

  const from = rows.indexOf(pool[index]);
  const to = rows.indexOf(pool[target]);
  [rows[from], rows[to]] = [rows[to], rows[from]];

  await prisma.$transaction(
    rows.map((row, order) =>
      prisma.ingredient.update({
        where: { id: row.id },
        data: { sortOrder: order + 1 },
      }),
    ),
  );

  revalidateIngredients(rows.map((row) => row.slug));
  revalidateIngredientAdmin();
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

// ─────────────────────── 팝업 공지 ───────────────────────

const POPUP_FIELDS = ["title", "body", "linkLabel"] as const;

export async function savePopup(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // id는 .bind()가 아니라 폼의 hidden 필드로 받습니다.
  // 바인딩된 인자는 암호화되어 전달되는데, JS가 없는 폼 제출 경로에서
  // 응답이 완결되지 않는 문제가 있어 hidden 필드 방식이 더 견고합니다.
  let id = String(formData.get("id") ?? "") || null;
  await requireSession(["ADMIN", "EDITOR"]);

  const parsed = popupSchema.safeParse({
    slug: text(formData, "slug"),
    imageUrl: text(formData, "imageUrl"),
    linkUrl: text(formData, "linkUrl"),
    startsAt: text(formData, "startsAt"),
    endsAt: text(formData, "endsAt"),
    isPublished: checkbox(formData, "isPublished"),
    sortOrder: text(formData, "sortOrder") || 0,
    translations: parseTranslations(formData, POPUP_FIELDS),
  });
  if (!parsed.success) {
    return { error: "입력값을 확인해주세요.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const { translations, ...data } = parsed.data;
  const locales = filledLocales(translations, "title");
  if (locales.length === 0) {
    return {
      error: "최소 한 개 언어의 팝업 제목을 입력해주세요.",
      fieldErrors: { "translations.KO.title": "제목을 입력해주세요." },
    };
  }

  const rows = locales.map((locale) => ({ locale, ...translations[locale] }));

  try {
    if (id) {
      const popupId = id;
      await prisma.$transaction([
        prisma.popup.update({ where: { id: popupId }, data }),
        // 비워둔 언어의 번역은 제거하고, 채워진 언어만 다시 씁니다
        prisma.popupTranslation.deleteMany({ where: { popupId } }),
        prisma.popupTranslation.createMany({
          data: rows.map((row) => ({ ...row, popupId })),
        }),
      ]);
    } else {
      const created = await prisma.popup.create({
        data: { ...data, translations: { create: rows } },
        select: { id: true },
      });
      id = created.id;
    }
  } catch (error) {
    if (uniqueSlugError(error)) {
      return { error: "이미 사용 중인 slug입니다.", fieldErrors: { slug: "중복된 slug" } };
    }
    console.error("[savePopup]", error);
    return { error: "저장 중 오류가 발생했습니다." };
  }

  revalidatePopups();
  revalidatePath("/admin/popups");
  redirect(`/admin/popups/${id}?saved=1`);
}

export async function deletePopup(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await requireSession(["ADMIN"]);
  await prisma.popup.delete({ where: { id } });
  revalidatePopups();
  revalidatePath("/admin/popups");
  redirect("/admin/popups");
}

// ─────────────────────── 견적서 항목 ───────────────────────

/**
 * 견적서에 담기는 항목.
 *
 * 공개 페이지에서 내리고 관리자 전용으로 옮긴 내부 체크리스트라
 * 공개 경로를 다시 만들 일이 없어 캐시 무효화도 관리자 화면만 합니다.
 */
export async function saveQuoteItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let id = String(formData.get("id") ?? "") || null;
  await requireSession(["ADMIN", "EDITOR"]);

  const parsed = quoteItemSchema.safeParse({
    title: text(formData, "title"),
    body: text(formData, "body"),
    sortOrder: text(formData, "sortOrder") || 0,
  });
  if (!parsed.success) {
    return { error: "입력값을 확인해주세요.", fieldErrors: toFieldErrors(parsed.error) };
  }

  try {
    if (id) {
      await prisma.quoteItem.update({ where: { id }, data: parsed.data });
    } else {
      const created = await prisma.quoteItem.create({
        data: parsed.data,
        select: { id: true },
      });
      id = created.id;
    }
  } catch (error) {
    console.error("[saveQuoteItem]", error);
    return { error: "저장 중 오류가 발생했습니다." };
  }

  revalidatePath("/admin/quote-items");
  redirect(`/admin/quote-items/${id}?saved=1`);
}

export async function deleteQuoteItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await requireSession(["ADMIN"]);
  await prisma.quoteItem.delete({ where: { id } });
  revalidatePath("/admin/quote-items");
  redirect("/admin/quote-items");
}

/** 원료 목록과 같은 방식 — 표시 순서대로 다시 번호를 매기며 한 칸 옮깁니다 */
export async function moveQuoteItem(id: string, direction: "up" | "down") {
  await requireSession(["ADMIN", "EDITOR"]);

  const rows = await prisma.quoteItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  const index = rows.findIndex((row) => row.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= rows.length) return;

  [rows[index], rows[target]] = [rows[target], rows[index]];

  await prisma.$transaction(
    rows.map((row, order) =>
      prisma.quoteItem.update({
        where: { id: row.id },
        data: { sortOrder: order + 1 },
      }),
    ),
  );

  revalidatePath("/admin/quote-items");
}

// ─────────────────────── 약사 강의 ───────────────────────

/**
 * 대표가 들은 강의 정리 노트.
 *
 * 공개 페이지에 나가지 않는 관리자 전용 자료라 공개 경로 캐시는 건드리지
 * 않습니다. 자료 사진은 폼에서 업로드한 뒤 줄바꿈으로 구분해 넘어옵니다.
 */
export async function saveLecture(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let id = String(formData.get("id") ?? "") || null;
  await requireSession(["ADMIN", "EDITOR"]);

  const parsed = lectureSchema.safeParse({
    title: text(formData, "title"),
    lectureAt: text(formData, "lectureAt"),
    body: text(formData, "body"),
    imageUrls: lines(formData, "imageUrls"),
  });
  if (!parsed.success) {
    return { error: "입력값을 확인해주세요.", fieldErrors: toFieldErrors(parsed.error) };
  }

  try {
    if (id) {
      await prisma.lecture.update({ where: { id }, data: parsed.data });
    } else {
      const created = await prisma.lecture.create({
        data: parsed.data,
        select: { id: true },
      });
      id = created.id;
    }
  } catch (error) {
    console.error("[saveLecture]", error);
    return { error: "저장 중 오류가 발생했습니다." };
  }

  revalidatePath("/admin/lectures");
  revalidatePath(`/admin/lectures/${id}`);
  redirect(`/admin/lectures/${id}`);
}

export async function deleteLecture(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await requireSession(["ADMIN"]);
  await prisma.lecture.delete({ where: { id } });
  revalidatePath("/admin/lectures");
  redirect("/admin/lectures");
}
