import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * 시드가 넣은 데모 데이터 정리.
 *
 * 운영 서버로 옮기기 전에 돌립니다. 고객에게 가짜 원료·제품·소식이
 * 보이는 것을 막는 것이 목적입니다.
 *
 * 지우는 대상은 아래 목록에 적힌 slug 뿐입니다. 관리자에서 직접 등록한
 * 것은 목록에 없으므로 절대 지워지지 않습니다.
 *
 *   npm run db:clean-demo            # 무엇이 지워질지 보기만 (기본)
 *   npm run db:clean-demo -- --yes   # 실제로 삭제
 *   npm run db:clean-demo -- --yes --with-inquiries   # 문의까지 함께 삭제
 *
 * 삭제 후에는 참조가 끊긴 이미지가 남으므로 `npm run storage:cleanup` 을
 * 이어서 돌리세요(24시간 지난 고아 파일만 지웁니다).
 */

/** prisma/seed.ts 의 INGREDIENTS 와 같은 목록 */
const DEMO_INGREDIENTS = [
  "melatonin",
  "nmn",
  "berberine",
  "fisetin",
  "ib-complex",
  "hl-joint-100",
  "vitamin-d3",
];

/** prisma/seed.ts 의 PRODUCTS */
const DEMO_PRODUCTS = [
  "joint-care-tablet",
  "sleep-jelly-stick",
  "nmn-capsule",
  "pet-gut-powder",
];

/** prisma/seed.ts 의 POSTS */
const DEMO_POSTS = [
  "cphi-korea-2026",
  "minimum-order-guide",
  "esg-packaging-2026",
  "factory-tour-guide",
];

/** prisma/seed.ts 의 POPUPS */
const DEMO_POPUPS = [
  "consultation-notice",
  "minimum-order-popup",
  "holiday-schedule",
];

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL이 설정되지 않았습니다.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const apply = process.argv.includes("--yes");
const withInquiries = process.argv.includes("--with-inquiries");

function line(label: string, items: string[]) {
  console.log(`  ${label.padEnd(10)} ${items.length}건${items.length ? " — " + items.join(", ") : ""}`);
}

async function main() {
  // ── 지울 것 ──
  const ingredients = await prisma.ingredient.findMany({
    where: { slug: { in: DEMO_INGREDIENTS } },
    select: { slug: true },
  });
  const products = await prisma.product.findMany({
    where: { slug: { in: DEMO_PRODUCTS } },
    select: { slug: true },
  });
  const posts = await prisma.post.findMany({
    where: { slug: { in: DEMO_POSTS } },
    select: { slug: true },
  });
  const popups = await prisma.popup.findMany({
    where: { slug: { in: DEMO_POPUPS } },
    select: { slug: true },
  });
  const inquiryCount = withInquiries ? await prisma.inquiry.count() : 0;

  console.log(apply ? "── 삭제합니다 ──" : "── 미리보기 (실제로 지우려면 --yes) ──");
  line("원료", ingredients.map((r) => r.slug));
  line("제품", products.map((r) => r.slug));
  line("게시물", posts.map((r) => r.slug));
  line("팝업", popups.map((r) => r.slug));
  if (withInquiries) console.log(`  ${"문의".padEnd(10)} ${inquiryCount}건 (전체)`);

  // ── 남는 것 ──
  const keptIngredients = await prisma.ingredient.findMany({
    where: { slug: { notIn: DEMO_INGREDIENTS } },
    select: { slug: true },
  });
  const keptPopups = await prisma.popup.findMany({
    where: { slug: { notIn: DEMO_POPUPS } },
    select: { slug: true },
  });
  console.log("\n── 남는 것 (직접 등록하신 것) ──");
  line("원료", keptIngredients.map((r) => r.slug));
  line("팝업", keptPopups.map((r) => r.slug));
  console.log("  인증·회사정보·관리자 계정은 손대지 않습니다.");

  if (!apply) {
    console.log("\n실제로 지우려면: npm run db:clean-demo -- --yes");
    return;
  }

  // 번역·연결 테이블은 onDelete: Cascade 로 함께 지워집니다
  await prisma.product.deleteMany({ where: { slug: { in: DEMO_PRODUCTS } } });
  await prisma.ingredient.deleteMany({ where: { slug: { in: DEMO_INGREDIENTS } } });
  await prisma.post.deleteMany({ where: { slug: { in: DEMO_POSTS } } });
  await prisma.popup.deleteMany({ where: { slug: { in: DEMO_POPUPS } } });
  if (withInquiries) await prisma.inquiry.deleteMany({});

  console.log("\n완료. 이어서 `npm run storage:cleanup` 으로 참조가 끊긴 이미지를 정리하세요.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
