import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-sm font-semibold text-ink-800"
      >
        {label}
        {required && (
          <span aria-hidden className="text-red-600">
            *
          </span>
        )}
        {hint && (
          <span className="font-normal text-xs text-ink-500">{hint}</span>
        )}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

const control =
  "w-full rounded-xl border border-ink-200 bg-surface px-4 py-3 text-[0.9375rem] text-ink-900 placeholder:text-ink-400 " +
  "focus:border-brand-600 focus:bg-white focus:outline-2 focus:outline-offset-0 focus:outline-brand-600/20 " +
  "aria-[invalid=true]:border-red-500";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(control, "min-h-36 resize-y", className)} {...props} />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, "pr-8", className)} {...props} />;
}

/** 체크박스형 다중 선택 칩 */
export function CheckChip({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" className="peer sr-only" {...props} />
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition-colors",
          "peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:font-semibold peer-checked:text-white",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600",
        )}
      >
        {label}
      </span>
    </label>
  );
}


/** 폼 섹션 제목 — 시안처럼 아래 구분선을 둡니다 */
export function FieldsetLegend({ children }: { children: React.ReactNode }) {
  return (
    <legend className="mb-2 w-full border-b border-ink-200 pb-3 text-title text-brand-900">
      {children}
    </legend>
  );
}
