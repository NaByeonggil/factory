"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { ImagePlus, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMAGE_ACCEPT } from "@/lib/upload";

async function uploadImage(file: File) {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/admin/uploads", { method: "POST", body });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "업로드 실패");
  return data.url;
}

function Picker({
  label,
  hint,
  pending,
  onPick,
  disabled,
}: {
  label: string;
  hint?: string;
  pending: boolean;
  onPick: (files: FileList) => void;
  disabled?: boolean;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-800">
        {label}
        {hint && <span className="font-normal text-xs text-ink-500">{hint}</span>}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        className="sr-only"
        onChange={(e) => e.target.files && onPick(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending || disabled}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="size-4" aria-hidden />
        {pending ? "업로드 중…" : "이미지 선택"}
      </Button>
    </>
  );
}

function Thumb({ url, onRemove }: { url: string; onRemove: () => void }) {
  return (
    <div className="group relative size-28 overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
      <Image
        src={url}
        alt=""
        fill
        sizes="112px"
        className="object-cover"
        unoptimized
      />
      <button
        type="button"
        aria-label="이미지 제거"
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-ink-600 shadow-sm hover:bg-white hover:text-red-600"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

/** 단일 이미지 (원료 썸네일, 게시물 커버) */
export function ImageField({
  name,
  label,
  hint,
  defaultValue,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pick(files: FileList) {
    setError(null);
    const file = files[0];
    if (!file) return;
    startTransition(async () => {
      try {
        setUrl(await uploadImage(file));
      } catch (e) {
        setError(e instanceof Error ? e.message : "업로드 실패");
      }
    });
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url} />
      <Picker label={label} hint={hint} pending={pending} onPick={pick} />
      {url && (
        <div className="pt-1">
          <Thumb url={url} onRemove={() => setUrl("")} />
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** 다중 이미지 (포트폴리오). 순서는 위에서부터 앞쪽입니다. */
export function ImageListField({
  name,
  label,
  hint,
  defaultValue,
  max = 6,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue: string[];
  max?: number;
}) {
  const [urls, setUrls] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pick(files: FileList) {
    setError(null);
    const picked = Array.from(files).slice(0, max - urls.length);
    startTransition(async () => {
      const added: string[] = [];
      for (const file of picked) {
        try {
          added.push(await uploadImage(file));
        } catch (e) {
          setError(`${file.name}: ${e instanceof Error ? e.message : "업로드 실패"}`);
        }
      }
      if (added.length) setUrls((prev) => [...prev, ...added]);
    });
  }

  function move(index: number, delta: number) {
    setUrls((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {/* 서버 액션은 줄바꿈으로 구분된 문자열을 읽습니다 */}
      <input type="hidden" name={name} value={urls.join("\n")} />
      <Picker
        label={label}
        hint={hint}
        pending={pending}
        onPick={pick}
        disabled={urls.length >= max}
      />
      {urls.length > 0 && (
        <ul className="flex flex-wrap gap-3 pt-1">
          {urls.map((url, index) => (
            <li key={url} className="space-y-1">
              <Thumb
                url={url}
                onRemove={() => setUrls((prev) => prev.filter((u) => u !== url))}
              />
              <div className="flex items-center justify-center gap-1 text-ink-400">
                <GripVertical className="size-3" aria-hidden />
                <button
                  type="button"
                  aria-label="앞으로"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="px-1 text-xs disabled:opacity-30"
                >
                  ←
                </button>
                <span className="text-xs">{index + 1}</span>
                <button
                  type="button"
                  aria-label="뒤로"
                  disabled={index === urls.length - 1}
                  onClick={() => move(index, 1)}
                  className="px-1 text-xs disabled:opacity-30"
                >
                  →
                </button>
              </div>
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
