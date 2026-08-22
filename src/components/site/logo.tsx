import { cn } from "@/lib/utils";

/**
 * 헬씨팜바이오 심볼 — 톱니지붕 공장 + 굴뚝 + 새싹.
 *
 * design/stitch/헬씨팜바이오-브랜드로고.png 의 마크를 벡터로 옮긴 것입니다.
 * 원본은 흰 배경 JPEG라 헤더/다크 푸터 어디에도 그대로 얹을 수 없습니다.
 *
 * 색은 `currentColor` 를 따르므로 밝은 배경에서는 brand-700,
 * 다크 푸터에서는 흰색으로 상속됩니다.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 40"
      className={cn("size-8", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* 새싹 — 줄기에서 갈라진 두 잎 */}
      <path d="M13 20c1-3 1-5 1-7" />
      <path d="M14 13c-5-1-6-6-3-9 5 1 6 6 3 9Z" />
      <path d="M14 13c-1-6 4-10 9-9 1 6-4 10-9 9Z" />
      {/* 톱니지붕 + 굴뚝 + 본동 외곽 */}
      <path d="M4 37V24l8-6v6l8-6v6h5V8h6v29" />
      {/* 바닥 */}
      <path d="M3 37h38" />
      {/* 창 두 개 */}
      <path d="M13 37v-6h5v6" />
      <path d="M23 37v-6h5v6" />
    </svg>
  );
}

/**
 * 마크 + 워드마크.
 *
 * 워드마크는 SVG `<text>` 가 아니라 HTML 텍스트입니다 — 폰트가 그대로 적용되고,
 * 선택·검색이 되며, 로케일별 표기(국문/라틴)를 바꿀 수 있습니다.
 */
export function Logo({
  label,
  className,
  markClassName,
}: {
  label: string;
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      <span className="text-xl font-extrabold tracking-tight">{label}</span>
    </span>
  );
}
