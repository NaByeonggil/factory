import { cn } from "@/lib/utils";

const tones = {
  brand: "bg-ink-100 text-brand-700 ring-transparent",
  neutral: "bg-ink-100 text-ink-700 ring-ink-200",
  accent: "bg-accent-500 text-ink-900 ring-transparent",
  danger: "bg-red-50 text-red-700 ring-red-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
} as const;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        // flex 컨테이너 안에서 카드 폭만큼 늘어나지 않도록 w-fit / self-start 고정
        "inline-flex w-fit self-start items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
