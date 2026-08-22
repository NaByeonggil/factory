"use client";

import { useTransition } from "react";
import { INQUIRY_STATUSES } from "@/lib/constants";
import { updateInquiryStatus } from "@/actions/admin";
import { cn } from "@/lib/utils";

export function StatusControl({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink-200 bg-white p-4">
      <span className="mr-2 text-sm font-semibold text-ink-500">처리 상태</span>
      {INQUIRY_STATUSES.map((value) => (
        <button
          key={value}
          type="button"
          disabled={pending || value === status}
          onClick={() =>
            startTransition(async () => {
              await updateInquiryStatus(id, value);
            })
          }
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors disabled:opacity-100",
            value === status
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-ink-300 text-ink-600 hover:bg-ink-50",
            pending && "opacity-60",
          )}
        >
          {value}
        </button>
      ))}
    </div>
  );
}
