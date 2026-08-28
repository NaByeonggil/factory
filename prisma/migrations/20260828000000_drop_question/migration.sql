-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT IF EXISTS "Question_answeredById_fkey";

-- DropTable
DROP TABLE IF EXISTS "Question";
