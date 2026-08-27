import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { toDbLocale } from "@/i18n/routing";
import { buildDownloadUrl } from "@/lib/upload";
import type {
  IngredientCategory,
  InquiryStatus,
  PostCategory,
  ReplyAuthor,
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

// ─────────────────────── 팝업 공지 ───────────────────────

export type PopupCard = {
  id: string;
  slug: string;
  imageUrl: string | null;
  linkUrl: string | null;
  title: string;
  body: string | null;
  linkLabel: string | null;
};

/**
 * 노출 기간에 걸린 공개 팝업. 해당 언어 번역이 없는 팝업은 건너뜁니다.
 * 캐시되면 기간 만료를 놓치므로 호출부(레이아웃)에서 항상 최신 값을 읽습니다.
 */
export async function getActivePopups(locale: string): Promise<PopupCard[]> {
  const now = new Date();
  return safe(async () => {
    const rows = await prisma.popup.findMany({
      where: {
        isPublished: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        slug: true,
        imageUrl: true,
        linkUrl: true,
        translations: {
          where: { locale: toDbLocale(locale) as "KO" },
          select: { title: true, body: true, linkLabel: true },
        },
      },
    });

    return rows
      .map((row) => {
        const tr = row.translations[0];
        if (!tr) return null;
        return {
          id: row.id,
          slug: row.slug,
          imageUrl: row.imageUrl,
          linkUrl: row.linkUrl,
          title: tr.title,
          body: tr.body,
          linkLabel: tr.linkLabel,
        };
      })
      .filter((v): v is PopupCard => v !== null);
  }, []);
}

// ─────────────────────── 문답 게시판 ───────────────────────

export const QNA_PAGE_SIZE = 15;

export type QuestionCard = {
  id: string;
  title: string;
  authorName: string;
  isSecret: boolean;
  isAnswered: boolean;
  createdAt: Date;
};

/**
 * 공개 문답 목록. 비밀글도 제목까지는 보이고(한국 게시판 관행),
 * 본문·답변은 상세에서 비밀번호를 확인해야 열립니다.
 */
export async function getQuestions(locale: string, page = 1) {
  const take = QNA_PAGE_SIZE;
  const skip = (Math.max(page, 1) - 1) * take;

  return safe(
    async () => {
      const where = {
        isPublished: true,
        locale: toDbLocale(locale) as "KO",
      };
      const [rows, total] = await Promise.all([
        prisma.question.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take,
          select: {
            id: true,
            title: true,
            authorName: true,
            isSecret: true,
            answeredAt: true,
            createdAt: true,
          },
        }),
        prisma.question.count({ where }),
      ]);

      return {
        items: rows.map((row) => ({
          id: row.id,
          title: row.title,
          authorName: row.authorName,
          isSecret: row.isSecret,
          isAnswered: row.answeredAt !== null,
          createdAt: row.createdAt,
        })),
        total,
        page: Math.max(page, 1),
        pageCount: Math.max(Math.ceil(total / take), 1),
      };
    },
    { items: [] as QuestionCard[], total: 0, page: 1, pageCount: 1 },
  );
}

export type QuestionDetail = {
  id: string;
  title: string;
  authorName: string;
  isSecret: boolean;
  createdAt: Date;
  answeredAt: Date | null;
  /** 비밀글이면 null — 열람은 revealQuestion 서버 액션으로만 */
  body: string | null;
  answerBody: string | null;
};

export async function getQuestion(id: string): Promise<QuestionDetail | null> {
  return safe(async () => {
    const row = await prisma.question.findFirst({
      where: { id, isPublished: true },
      select: {
        id: true,
        title: true,
        authorName: true,
        isSecret: true,
        body: true,
        answerBody: true,
        answeredAt: true,
        createdAt: true,
      },
    });
    if (!row) return null;

    // 비밀글 본문은 서버 컴포넌트 페이로드에도 실리지 않도록 여기서 잘라냅니다
    return {
      ...row,
      body: row.isSecret ? null : row.body,
      answerBody: row.isSecret ? null : row.answerBody,
    };
  }, null);
}

// ─────────────────────── 견적문의 게시판 ───────────────────────

export const QUOTE_PAGE_SIZE = 15;

export type QuoteCard = {
  id: string;
  /** 목록 표시용 게시글 번호 (최신이 큰 번호) */
  no: number;
  title: string | null;
  serviceType: ServiceType;
  authorName: string;
  company: string | null;
  status: InquiryStatus;
  isReplied: boolean;
  replyCount: number;
  createdAt: Date;
};

/** 검색 대상 — 본문은 비밀글이라 제목·작성자까지만 허용합니다 */
export type QuoteSearchField = "title" | "author";

/**
 * 견적문의 목록. 모든 글이 비밀글이라 목록에는 유형·작성자(마스킹)·상태만 싣고,
 * 문의 내용과 답변은 상세에서 비밀번호를 확인해야 열립니다.
 */
export async function getQuoteBoard(
  locale: string,
  page = 1,
  search?: { field: QuoteSearchField; keyword: string },
) {
  const take = QUOTE_PAGE_SIZE;
  const skip = (Math.max(page, 1) - 1) * take;
  const keyword = search?.keyword.trim() ?? "";

  return safe(
    async () => {
      const where = {
        // 스팸으로 분류한 문의는 게시판에서 제외합니다
        status: { not: "SPAM" as InquiryStatus },
        locale: toDbLocale(locale) as "KO",
        ...(keyword
          ? search?.field === "author"
            ? { name: { contains: keyword, mode: "insensitive" as const } }
            : { title: { contains: keyword, mode: "insensitive" as const } }
          : {}),
      };
      const [rows, total] = await Promise.all([
        prisma.inquiry.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take,
          select: {
            id: true,
            title: true,
            serviceType: true,
            name: true,
            company: true,
            status: true,
            repliedAt: true,
            createdAt: true,
            _count: { select: { replies: true } },
          },
        }),
        prisma.inquiry.count({ where }),
      ]);

      return {
        items: rows.map((row, index) => ({
          id: row.id,
          // 최신 글이 가장 큰 번호를 갖도록 전체 건수에서 역산합니다
          no: total - skip - index,
          title: row.title,
          serviceType: row.serviceType,
          authorName: row.name,
          company: row.company,
          status: row.status,
          isReplied: row.repliedAt !== null,
          replyCount: row._count.replies,
          createdAt: row.createdAt,
        })),
        total,
        page: Math.max(page, 1),
        pageCount: Math.max(Math.ceil(total / take), 1),
      };
    },
    { items: [] as QuoteCard[], total: 0, page: 1, pageCount: 1 },
  );
}

export type QuoteSummary = {
  id: string;
  title: string | null;
  serviceType: ServiceType;
  authorName: string;
  company: string | null;
  status: InquiryStatus;
  isReplied: boolean;
  createdAt: Date;
  /** 게시판 도입 전 문의는 비밀번호가 없어 열람할 수 없습니다 */
  hasPassword: boolean;
};

/** 상세 페이지의 잠금 화면에 쓰는 최소 정보 (본문·답변은 포함하지 않습니다) */
export async function getQuoteSummary(id: string): Promise<QuoteSummary | null> {
  return safe(async () => {
    const row = await prisma.inquiry.findFirst({
      where: { id, status: { not: "SPAM" } },
      select: {
        id: true,
        title: true,
        serviceType: true,
        name: true,
        company: true,
        status: true,
        passwordHash: true,
        repliedAt: true,
        createdAt: true,
      },
    });
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      serviceType: row.serviceType,
      authorName: row.name,
      company: row.company,
      status: row.status,
      isReplied: row.repliedAt !== null,
      createdAt: row.createdAt,
      hasPassword: row.passwordHash !== null,
    };
  }, null);
}

/** 견적문의 답글 한 건 (고객 화면·관리자 화면 공용) */
/**
 * 관리자용 비밀글 본문 — 비밀번호 없이 조회합니다.
 * 호출부(서버 컴포넌트)에서 반드시 세션을 먼저 확인해야 합니다.
 */
export async function getQuestionForStaff(id: string) {
  return safe(async () => {
    const row = await prisma.question.findFirst({
      where: { id, isPublished: true },
      select: { body: true, answerBody: true },
    });
    return row;
  }, null);
}

export type QuoteReply = {
  id: string;
  authorType: ReplyAuthor;
  authorName: string;
  body: string;
  files: QuoteReplyFile[];
  /** 클라이언트로 넘기므로 ISO 문자열 */
  createdAt: string;
};

export type QuoteReplyFile = {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  /** 서명·만료가 붙은 열람 주소 (30분) */
  url: string;
};

/** 고객이 열람하는 본인 문의 상세 */
export type QuoteDetail = {
  serviceType: ServiceType;
  formulations: string[];
  packagings: string[];
  quantity: string | null;
  budget: string | null;
  targetDate: string | null;
  message: string | null;
  /** 문의 접수 시 올린 첨부 */
  files: QuoteReplyFile[];
  status: InquiryStatus;
  replyBody: string | null;
  repliedAt: string | null;
  replies: QuoteReply[];
};

/** 답글 조회 시 공통으로 쓰는 select */
export const REPLY_SELECT = {
  id: true,
  authorType: true,
  authorName: true,
  body: true,
  createdAt: true,
  files: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      filename: true,
      size: true,
      mimeType: true,
      storageKey: true,
    },
  },
} as const;

type FileRow = {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  storageKey: string;
};

export function toQuoteFile(row: FileRow): QuoteReplyFile {
  return {
    id: row.id,
    filename: row.filename,
    size: row.size,
    mimeType: row.mimeType,
    // 권한을 통과한 응답에서만 서명 주소를 만들어 넘깁니다
    url: buildDownloadUrl(row.storageKey),
  };
}

export function toQuoteReply(row: {
  id: string;
  authorType: ReplyAuthor;
  authorName: string;
  body: string;
  createdAt: Date;
  files: FileRow[];
}): QuoteReply {
  return {
    id: row.id,
    authorType: row.authorType,
    authorName: row.authorName,
    body: row.body,
    files: row.files.map(toQuoteFile),
    createdAt: row.createdAt.toISOString(),
  };
}

const QUOTE_DETAIL_SELECT = {
  serviceType: true,
  formulations: true,
  packagings: true,
  quantity: true,
  budget: true,
  targetDate: true,
  message: true,
  status: true,
  replyBody: true,
  repliedAt: true,
  files: {
    select: {
      id: true,
      filename: true,
      size: true,
      mimeType: true,
      storageKey: true,
    },
  },
  replies: { orderBy: { createdAt: "asc" }, select: REPLY_SELECT },
} as const;

export function toQuoteDetail(row: {
  serviceType: ServiceType;
  formulations: string[];
  packagings: string[];
  quantity: string | null;
  budget: string | null;
  targetDate: Date | null;
  message: string | null;
  status: InquiryStatus;
  replyBody: string | null;
  repliedAt: Date | null;
  files: FileRow[];
  replies: (Omit<QuoteReply, "files" | "createdAt"> & {
    createdAt: Date;
    files: FileRow[];
  })[];
}): QuoteDetail {
  return {
    serviceType: row.serviceType,
    formulations: row.formulations,
    packagings: row.packagings,
    quantity: row.quantity,
    budget: row.budget,
    // 클라이언트 컴포넌트로 넘기므로 문자열로 직렬화합니다
    targetDate: row.targetDate?.toISOString() ?? null,
    message: row.message,
    files: row.files.map(toQuoteFile),
    status: row.status,
    replyBody: row.replyBody,
    repliedAt: row.repliedAt?.toISOString() ?? null,
    replies: row.replies.map(toQuoteReply),
  };
}

/**
 * 관리자용 문의 상세 — 고객 비밀번호 없이 바로 엽니다.
 * 호출부(서버 컴포넌트)에서 반드시 세션을 먼저 확인해야 합니다.
 */
export async function getQuoteDetailForStaff(
  id: string,
): Promise<QuoteDetail | null> {
  return safe(async () => {
    const row = await prisma.inquiry.findFirst({
      where: { id, status: { not: "SPAM" } },
      select: QUOTE_DETAIL_SELECT,
    });
    return row ? toQuoteDetail(row) : null;
  }, null);
}

/** 비밀번호 검증을 통과한 뒤 쓰는 조회 (검증은 호출부 책임) */
export async function getQuoteDetailUnlocked(id: string) {
  const row = await prisma.inquiry.findFirst({
    where: { id, status: { not: "SPAM" } },
    select: QUOTE_DETAIL_SELECT,
  });
  return row ? toQuoteDetail(row) : null;
}
