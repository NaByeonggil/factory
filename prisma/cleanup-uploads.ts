import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getStorage } from "../src/lib/storage";

/**
 * 고아 첨부파일 정리.
 *
 * 파일은 문의 제출 전에 /api/uploads 로 먼저 올라가므로, 사용자가 업로드만
 * 하고 제출하지 않으면 저장소에 남습니다. 24시간이 지났는데도 InquiryFile
 * 행이 없는 파일을 지웁니다.
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

  const [objects, referenced] = await Promise.all([
    storage.list(),
    prisma.inquiryFile.findMany({ select: { storageKey: true } }),
  ]);

  const keep = new Set(referenced.map((row) => row.storageKey));
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
