import { z } from "zod";

/** 국내 휴대폰/유선 모두 허용 */
const phoneRegex = /^[0-9+\-() ]{9,20}$/;

/**
 * 공개 문답 게시판 작성 폼.
 * 메시지는 키만 돌려주고 화면에서 `validation.*` 로 번역합니다.
 */
export const questionSchema = z.object({
  authorName: z.string().trim().min(1, "nameRequired").max(30),
  company: z.string().trim().max(100).optional().or(z.literal("")),
  email: z.email("emailInvalid").max(150).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "phoneInvalid")
    .optional()
    .or(z.literal("")),

  title: z.string().trim().min(2, "titleRequired").max(120),
  body: z.string().trim().min(5, "bodyRequired").max(5000, "messageTooLong"),

  /** 비밀글 열람·본인 확인에 쓰이므로 비밀글이 아니어도 받습니다 */
  password: z.string().min(4, "passwordTooShort").max(50),
  isSecret: z.boolean().default(false),

  privacyAgreed: z
    .boolean()
    .refine((v) => v === true, { message: "privacyRequired" }),

  /**
   * 봇 트랩 — 사람이라면 비어 있어야 함.
   * 어떤 필드가 트랩인지 알리지 않으려고 스키마는 통과시키고
   * 서버 액션에서 조용히 차단합니다. (생산문의 폼과 같은 방식)
   */
  website: z.string().max(500).optional(),
  turnstileToken: z.string().optional(),
});

/** 폼이 다루는 입력 타입 (기본값 적용 전) — 생산문의 폼과 동일하게 z.input */
export type QuestionInput = z.input<typeof questionSchema>;

/** 비밀글 열람 */
export const revealSchema = z.object({
  id: z.string().min(1).max(40),
  password: z.string().min(1).max(50),
});

/** 운영자 답변 */
export const answerSchema = z.object({
  answerBody: z
    .string()
    .trim()
    .max(5000, "답변은 5000자까지 입력할 수 있습니다.")
    .transform((v) => (v ? v : null)),
  isPublished: z.boolean(),
});
