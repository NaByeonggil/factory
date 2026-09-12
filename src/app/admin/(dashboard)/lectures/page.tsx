import Link from "next/link";
import Image from "next/image";
import { ImageIcon, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * 약사 강의 정리 목록.
 *
 * 대표가 들은 강의를 정리해 두는 관리자 전용 노트라 공개 페이지가 없습니다.
 * 최근 강의가 위로 오게 강의일 기준으로 내림차순 정렬합니다.
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
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">약사 강의 정리</h1>
          <p className="mt-1 text-sm text-ink-500">
            총 {rows.length}건 · 들은 강의를 정리해 두는 관리자 전용 노트로,
            공개 페이지에는 노출되지 않습니다
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/lectures/new">
            <Plus className="size-4" aria-hidden />
            강의 정리 추가
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-ink-200 bg-white px-4 py-12 text-center text-ink-400">
          정리된 강의가 없습니다.
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/lectures/${row.id}`}
                className="flex gap-4 rounded-2xl border border-ink-200 bg-white p-4 hover:border-brand-300"
              >
                <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                  {row.imageUrls[0] ? (
                    <Image
                      src={row.imageUrls[0]}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <ImageIcon
                      className="absolute inset-0 m-auto size-6 text-ink-300"
                      aria-hidden
                    />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink-900">
                    {row.title}
                  </span>
                  <span className="mt-1 block text-xs text-ink-400">
                    {row.lectureAt
                      ? formatDate(row.lectureAt)
                      : `수정 ${formatDate(row.updatedAt)}`}
                    {row.imageUrls.length > 0 &&
                      ` · 사진 ${row.imageUrls.length}장`}
                  </span>
                  <span className="mt-2 line-clamp-2 block text-sm leading-relaxed text-ink-600">
                    {row.body}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
