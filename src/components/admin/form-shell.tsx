"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/validations/admin";

export function SubmitButton({
  label = "저장",
  pendingLabel = "저장 중…",
}: {
  label?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function FormError({ state }: { state: ActionState }) {
  if (!state.error) return null;
  return (
    <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
      <p className="font-semibold">{state.error}</p>
      {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {Object.entries(state.fieldErrors).map(([field, message]) => (
            <li key={field}>
              <code className="text-xs">{field}</code> — {message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SavedNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
      저장되었습니다.
    </p>
  );
}

export function AdminCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-6">
      <h2 className="font-bold text-ink-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}
