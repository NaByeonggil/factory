"use client";

import { FileText, Paperclip } from "lucide-react";
import { formatBytes } from "@/lib/upload";

export type AttachmentItem = {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
};

const isImage = (mimeType: string) => mimeType.startsWith("image/");
const isPdf = (mimeType: string) => mimeType === "application/pdf";

/**
 * 답글·문의 첨부 목록.
 *
 * PDF와 이미지는 새 탭에서 바로 열립니다(서버가 inline 으로 내려줍니다).
 * 그 외 포맷(docx·xlsx·hwp)은 브라우저가 볼 수 없어 내려받기로 처리합니다.
 */
export function AttachmentList({ files }: { files: AttachmentItem[] }) {
  if (files.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-3">
      {files.map((file) => {
        const viewable = isImage(file.mimeType) || isPdf(file.mimeType);
        return (
          <li key={file.id}>
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="flex w-44 flex-col overflow-hidden rounded-xl border border-ink-200 bg-white transition-colors hover:border-brand-300"
            >
              {isImage(file.mimeType) ? (
                // 서명 주소라 next/image 최적화 대상이 아닙니다 (30분 만료)
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.url}
                  alt={file.filename}
                  className="h-28 w-full bg-ink-50 object-cover"
                />
              ) : (
                <span className="flex h-28 w-full items-center justify-center bg-ink-50">
                  {isPdf(file.mimeType) ? (
                    <FileText className="size-8 text-brand-600" aria-hidden />
                  ) : (
                    <Paperclip className="size-7 text-ink-400" aria-hidden />
                  )}
                </span>
              )}
              <span className="flex flex-col gap-0.5 px-3 py-2">
                <span className="truncate text-sm font-medium text-brand-700">
                  {file.filename}
                </span>
                <span className="text-xs text-ink-400">
                  {formatBytes(file.size)} · {viewable ? "바로 보기" : "내려받기"}
                </span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
