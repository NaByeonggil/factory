"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** 인쇄는 브라우저 대화상자를 띄웁니다 (강의 노트 한 건만 나오도록 인쇄용 CSS 적용) */
export function PrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="print:hidden"
    >
      <Printer className="size-4" aria-hidden />
      인쇄
    </Button>
  );
}

/**
 * 자료 사진 갤러리 + 뷰어.
 *
 * 썸네일을 누르면 전체화면 뷰어가 열리고 ←/→ 로 넘깁니다.
 * 인쇄할 때는 뷰어를 숨기고 사진을 잘리지 않게 펴서 내보냅니다.
 */
export function LectureGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;

  const close = useCallback(() => setIndex(null), []);
  const move = useCallback(
    (delta: number) =>
      setIndex((prev) =>
        prev === null ? prev : (prev + delta + images.length) % images.length,
      ),
    [images.length],
  );

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    }
    window.addEventListener("keydown", onKey);
    // 뷰어가 떠 있는 동안 뒤 배경이 따라 스크롤되지 않게 합니다
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, close, move]);

  if (images.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-ink-900">
        자료 사진 {images.length}장
        <span className="ml-2 font-normal text-xs text-ink-400 print:hidden">
          사진을 누르면 크게 볼 수 있습니다
        </span>
      </h2>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-2 print:gap-4">
        {images.map((url, i) => (
          <li key={url} className="print:break-inside-avoid">
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="relative block aspect-4/3 w-full overflow-hidden rounded-xl border border-ink-200 bg-ink-50 hover:border-brand-300"
            >
              <Image
                src={url}
                alt={`${title} 자료 사진 ${i + 1}`}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover print:object-contain"
                unoptimized
              />
            </button>
            <p className="mt-1 hidden text-center text-xs text-ink-500 print:block">
              사진 {i + 1}
            </p>
          </li>
        ))}
      </ul>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} 자료 사진 뷰어`}
          className="fixed inset-0 z-50 flex flex-col bg-ink-900/95 p-4 print:hidden"
          onClick={close}
        >
          <div className="flex items-center justify-between text-sm font-semibold text-white">
            <span>
              {index + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="닫기"
              className="rounded-lg p-2 hover:bg-white/10"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* 이미지 영역을 눌렀을 때는 닫히지 않도록 이벤트를 멈춥니다 */}
          <div
            className="relative min-h-0 flex-1"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={images[index]}
              alt={`${title} 자료 사진 ${index + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              unoptimized
            />
          </div>

          {images.length > 1 && (
            <div
              className="mt-4 flex items-center justify-center gap-3"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="이전 사진"
                className={navButton}
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="다음 사진"
                className={navButton}
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

const navButton =
  "rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20";
