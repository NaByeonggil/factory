/**
 * 생산문의 글 만들기 — 홈페이지 양식(submitInquiry)과 AI 견적 연동 API 가 함께 씁니다.
 *
 * 봇 확인·접수 횟수 제한·첨부 검증은 경로마다 달라 부르는 쪽에서 합니다.
 * 알림과 datahealth 전달도 부르는 쪽이 시점을 정합니다.
 */
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type InquiryPostInput = Omit<Prisma.InquiryCreateInput, "passwordHash"> & {
  /** 견적문의 게시판에서 본인 확인용 비밀번호 (평문) */
  password: string;
};

/** 알림(notifyNewInquiry)에 넘기는 항목 */
const createdSelect = {
  id: true,
  name: true,
  company: true,
  phone: true,
  email: true,
  serviceType: true,
  message: true,
  naverKeyword: true,
  utmSource: true,
} satisfies Prisma.InquirySelect;

export type CreatedInquiry = Prisma.InquiryGetPayload<{ select: typeof createdSelect }>;

export async function createInquiryPost({ password, ...data }: InquiryPostInput): Promise<CreatedInquiry> {
  return prisma.inquiry.create({
    data: { ...data, passwordHash: await bcrypt.hash(password, 12) },
    select: createdSelect,
  });
}
