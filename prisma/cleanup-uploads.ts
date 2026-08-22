import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getStorage } from "../src/lib/storage";
import { mediaKeyFromUrl } from "../src/lib/upload";

/**
 * 고아 파일 정리.
 *
 * 파일은 저장 전에 먼저 업로드되므로(문의 첨부는 /api/uploads, 콘텐츠
 * 이미지는 /api/admin/uploads), 업로드만 하고 저장하지 않으면 남습니다.
 * 24시간이 지났는데도 DB 어디에서도 참조하지 않는 파일을 지웁니다.
 *
 * 참조처: InquiryFile.storageKey, Ingredient.thumbnailUrl, Post.coverUrl,
 * Product.imageUrls, Certification.imageUrl
 *
 *   npm run storage:cleanup
 *
 * 운영에서는 하루 1회 크론으로 돌리세요.
 */
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL이 설정되지 않았습니다.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const storage = getStorage();
  if (!storage.list) {
    console.log(`드라이버 '${storage.name}' 는 목록 조회를 지원하지 않습니다.`);
    return;
  }

  const [objects, attachments, ingredients, posts, products, certifications] =
    await Promise.all([
      storage.list(),
      prisma.inquiryFile.findMany({ select: { storageKey: true } }),
      prisma.ingredient.findMany({ select: { thumbnailUrl: true } }),
      prisma.post.findMany({ select: { coverUrl: true } }),
      prisma.product.findMany({ select: { imageUrls: true } }),
      prisma.certification.findMany({ select: { imageUrl: true } }),
    ]);

  const keep = new Set<string>();
  for (const row of attachments) keep.add(row.storageKey);

  // 콘텐츠 이미지는 URL로 저장되므로 키를 역산합니다
  const mediaUrls = [
    ...ingredients.map((r) => r.thumbnailUrl),
    ...posts.map((r) => r.coverUrl),
    ...products.flatMap((r) => r.imageUrls),
    ...certifications.map((r) => r.imageUrl),
  ];
  for (const url of mediaUrls) {
    const key = mediaKeyFromUrl(url);
    if (key) keep.add(key);
  }
  const cutoff = Date.now() - STALE_AFTER_MS;

  const orphans = objects.filter(
    (object) => !keep.has(object.key) && object.modifiedAt.getTime() < cutoff,
  );

  for (const orphan of orphans) {
    await storage.delete(orphan.key);
  }

  console.log(
    `저장소 파일 ${objects.length}건 / DB 참조 ${keep.size}건 / 삭제 ${orphans.length}건`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
