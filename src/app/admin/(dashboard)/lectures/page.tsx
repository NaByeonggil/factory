import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { LectureBoard } from "@/components/admin/lecture-board";

export const dynamic = "force-dynamic";

/**
 * 약사 강의 정리 칸반.
 *
 * 대표가 들은 강의를 정리해 두는 관리자 전용 노트라 공개 페이지가 없습니다.
 * 수강 예정 → 현장 활용까지 단계별 열로 나누고, 열 안의 정렬은 보드가 맡습니다.
 */
export default async function AdminLecturesPage() {
  const rows = await prisma.lecture.findMany({
    orderBy: [{ lectureAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      lectureAt: true,
      body: true,
      imageUrls: true,
      status: true,
      tags: true,
    },
  });

  const cards = rows.map((row) => ({
    id: row.id,
    title: row.title,
    lectureAt: row.lectureAt?.toISOString() ?? null,
    body: row.body,
    coverUrl: row.imageUrls[0] ?? null,
    imageCount: row.imageUrls.length,
    status: row.status,
    tags: row.tags,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">약사 강의 정리</h1>
          <p className="mt-1 text-sm text-ink-500">
            총 {rows.length}건 · 카드를 끌어 단계를 바꿉니다. 관리자 전용
            노트로, 공개 페이지에는 노출되지 않습니다
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/lectures/new">
            <Plus className="size-4" aria-hidden />
            강의 정리 추가
          </Link>
        </Button>
      </div>

      <LectureBoard cards={cards} />
    </div>
  );
}
