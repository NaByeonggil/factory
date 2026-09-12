import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  LectureGallery,
  PrintButton,
} from "@/components/admin/lecture-viewer";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * 강의 정리 보기.
 *
 * 사진은 뷰어로 크게 보고, 인쇄하면 이 노트 한 건만 나가도록
 * 관리자 레이아웃의 사이드바·버튼에는 print:hidden 을 걸어 두었습니다.
 */
export default async function LecturePage(
  props: PageProps<"/admin/lectures/[id]">,
) {
  const { id } = await props.params;

  const row = await prisma.lecture.findUnique({ where: { id } });
  if (!row) notFound();

  return (
    <article className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/admin/lectures"
            className="inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-ink-800 print:hidden"
          >
            <ArrowLeft className="size-4" aria-hidden />
            목록으로
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-ink-900">{row.title}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {row.lectureAt ? `강의일 ${formatDate(row.lectureAt)}` : "강의일 미기재"}
            {` · 최종 수정 ${formatDate(row.updatedAt)}`}
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <PrintButton />
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/lectures/${row.id}/edit`}>
              <Pencil className="size-4" aria-hidden />
              수정
            </Link>
          </Button>
        </div>
      </div>

      <section className="rounded-2xl border border-ink-200 bg-white p-6 print:border-0 print:p-0">
        <h2 className="text-sm font-bold text-ink-900">강의 내용 정리</h2>
        {/* 입력한 줄바꿈을 그대로 살립니다 */}
        <p className="mt-3 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-ink-800">
          {row.body}
        </p>
      </section>

      <LectureGallery images={row.imageUrls} title={row.title} />
    </article>
  );
}
