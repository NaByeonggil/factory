-- 약사 강의 정리를 칸반으로 관리하기 위한 진행 단계·주제 태그
CREATE TYPE "LectureStatus" AS ENUM ('PLANNED', 'ATTENDED', 'DRAFTING', 'DONE', 'APPLIED');

ALTER TABLE "Lecture"
    ADD COLUMN "status" "LectureStatus" NOT NULL DEFAULT 'ATTENDED',
    ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Lecture_status_idx" ON "Lecture"("status");

-- 강의일이 비어 있고 제목 끝에 「260904」 같은 YYMMDD 가 붙은 노트는 그 날짜로 채웁니다.
-- 폼은 한국 시각 자정을 저장하므로(UTC 15:00 전날) 같은 기준으로 맞춥니다.
UPDATE "Lecture"
SET "lectureAt" = (('20' || substring("title" from '(\d{6})\s*$'))::date - INTERVAL '9 hours')
WHERE "lectureAt" IS NULL
  AND substring("title" from '(\d{6})\s*$') ~ '^\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$';

-- 본문이 어느 정도 쌓인 노트는 「정리 중」으로 시작합니다
UPDATE "Lecture" SET "status" = 'DRAFTING' WHERE length("body") >= 300;
