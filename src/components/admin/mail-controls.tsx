"use client";

import { useOptimistic, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import {
  disconnectGmail,
  retryMail,
  setMailApplyLabels,
  syncMailNow,
  updateMailCategory,
} from "@/actions/mail";
import { Button } from "@/components/ui/button";
import { MAIL_CATEGORIES, MAIL_CATEGORY_LABELS } from "@/lib/constants";

export function MailSyncButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => syncMailNow())}
    >
      <RefreshCw className="h-4 w-4" aria-hidden />
      {pending ? "동기화 중…" : "지금 동기화"}
    </Button>
  );
}

export function MailLabelToggle({ enabled }: { enabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useOptimistic(enabled);
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
      <input
        type="checkbox"
        className="size-4"
        checked={checked}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.checked;
          startTransition(async () => {
            setChecked(next);
            await setMailApplyLabels(next);
          });
        }}
      />
      Gmail에 라벨 달기
    </label>
  );
}

export function MailDisconnectButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (window.confirm("Gmail 연결을 해제할까요? 정리된 메일 기록은 남습니다.")) {
          startTransition(() => disconnectGmail());
        }
      }}
    >
      연결 해제
    </Button>
  );
}

export function MailCategorySelect({
  id,
  category,
}: {
  id: string;
  category: string;
}) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useOptimistic(category);
  return (
    <select
      aria-label="분류 변경"
      value={value}
      disabled={pending}
      onChange={(event) => {
        const next = event.target.value;
        startTransition(async () => {
          setValue(next);
          await updateMailCategory(id, next);
        });
      }}
      className="h-8 rounded-lg border border-ink-300 bg-white px-2 text-xs font-semibold"
    >
      {MAIL_CATEGORIES.map((code) => (
        <option key={code} value={code}>
          {MAIL_CATEGORY_LABELS[code]}
        </option>
      ))}
    </select>
  );
}

export function MailRetryButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => retryMail(id))}
    >
      다시 정리
    </Button>
  );
}
