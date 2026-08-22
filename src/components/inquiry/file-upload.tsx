"use client";

import { useRef, useState, useTransition } from "react";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MAX_UPLOAD_FILES,
  UPLOAD_ACCEPT,
  formatBytes,
} from "@/lib/upload";

export type Attachment = {
  key: string;
  token: string;
  filename: string;
  size: number;
  mimeType: string;
};

export function FileUpload({
  value,
  onChange,
  label,
  hint,
}: {
  value: Attachment[];
  onChange: (next: Attachment[]) => void;
  label: string;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remaining = MAX_UPLOAD_FILES - value.length;

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const picked = Array.from(files).slice(0, remaining);
    startTransition(async () => {
      const uploaded: Attachment[] = [];
      for (const file of picked) {
        const body = new FormData();
        body.append("file", file);
        try {
          const res = await fetch("/api/uploads", { method: "POST", body });
          const data = await res.json();
          if (!res.ok) {
            setError(`${file.name}: ${data.error ?? "업로드 실패"}`);
            continue;
          }
          uploaded.push(data as Attachment);
        } catch {
          setError(`${file.name}: 업로드 중 오류가 발생했습니다.`);
        }
      }
      if (uploaded.length > 0) onChange([...value, ...uploaded]);
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-800">
        {label}
        <span className="font-normal text-xs text-ink-500">{hint}</span>
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={UPLOAD_ACCEPT}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending || remaining <= 0}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="size-4" aria-hidden />
        {pending ? "업로드 중…" : "파일 선택"}
      </Button>

      {value.length > 0 && (
        <ul className="space-y-2 pt-1">
          {value.map((file) => (
            <li
              key={file.key}
              className="flex items-center gap-3 rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm"
            >
              <Paperclip className="size-4 shrink-0 text-ink-400" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-ink-800">
                {file.filename}
              </span>
              <span className="shrink-0 text-xs text-ink-400">
                {formatBytes(file.size)}
              </span>
              <button
                type="button"
                aria-label={`${file.filename} 첨부 취소`}
                onClick={() => onChange(value.filter((f) => f.key !== file.key))}
                className="shrink-0 rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
