"use client";

import { useActionState, useState } from "react";
import { addAdminReply, deleteQuoteReply } from "@/actions/quote";
import { FormError, SubmitButton } from "@/components/admin/form-shell";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/field";
import { FileUpload, type Attachment } from "@/components/inquiry/file-upload";
import {
  AttachmentList,
  type AttachmentItem,
} from "@/components/quote/attachment-list";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/validations/admin";

export type AdminReply = {
  id: string;
  authorType: "CUSTOMER" | "ADMIN";
  authorName: string;
  body: string;
  createdAt: string;
  files: AttachmentItem[];
};

/**
 * 견적문의 답글 스레드 (관리자).
 * 여기에 남긴 답글은 고객이 게시판에서 비밀번호로 열람할 때 그대로 보입니다.
 */
export function ReplyThread({
  id,
  replies,
  hasEmail,
}: {
  id: string;
  replies: AdminReply[];
  hasEmail: boolean;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    addAdminReply,
    {},
  );
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-6">
      <h2 className="font-bold">
        답글
        {replies.length > 0 && (
          <span className="ml-2 text-sm font-normal text-ink-400">
            {replies.length}
          </span>
        )}
      </h2>
      <p className="mt-1 text-sm text-ink-500">
        고객이 견적문의 게시판에서 보는 대화입니다.
      </p>

      {replies.length === 0 ? (
        <p className="mt-4 text-sm text-ink-400">아직 답글이 없습니다.</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {replies.map((reply) => {
            const isAdmin = reply.authorType === "ADMIN";
            return (
              <li
                key={reply.id}
                className={cn(
                  "rounded-xl p-4 text-sm",
                  isAdmin ? "bg-brand-50" : "bg-ink-50",
                )}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge tone={isAdmin ? "brand" : "neutral"}>
                    {isAdmin ? "담당자" : "고객"}
                  </Badge>
                  <span className="font-semibold text-ink-700">
                    {reply.authorName}
                  </span>
                  <span className="text-ink-400">{reply.createdAt}</span>
                  {/* 삭제는 별도 form (form 중첩은 무효) */}
                  <form action={deleteQuoteReply} className="ml-auto">
                    <input type="hidden" name="replyId" value={reply.id} />
                    <button
                      type="submit"
                      className="text-xs text-ink-400 hover:text-red-600"
                    >
                      삭제
                    </button>
                  </form>
                </div>
                {reply.body && (
                  <p className="mt-2 whitespace-pre-line text-ink-800">
                    {reply.body}
                  </p>
                )}
                {reply.files.length > 0 && (
                  <div className="mt-3">
                    <AttachmentList files={reply.files} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form action={formAction} className="mt-6 space-y-3 border-t border-ink-100 pt-6">
        <input type="hidden" name="id" value={id} />
        <FormError state={state} />

        <label htmlFor="body" className="sr-only">
          답글
        </label>
        <Textarea
          id="body"
          name="body"
          maxLength={2000}
          className="min-h-28"
          placeholder="고객에게 보낼 답글을 입력하세요."
        />

        {/* 업로드는 /api/uploads 가 처리하고, 폼에는 key + 서명 토큰만 실립니다 */}
        <input
          type="hidden"
          name="attachments"
          value={JSON.stringify(attachments)}
        />
        <FileUpload
          value={attachments}
          onChange={setAttachments}
          label="첨부파일"
          hint="견적서 PDF 등 최대 3개, 파일당 5MB"
          dropHint="여기로 끌어다 놓아도 됩니다"
          browseLabel="파일 선택"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              name="notifyCustomer"
              defaultChecked={hasEmail}
              disabled={!hasEmail}
              className="size-4 accent-brand-600"
            />
            {hasEmail ? "고객에게 메일로 알림" : "이메일 없음 — 알림 불가"}
          </label>
          <SubmitButton label="답글 등록" pendingLabel="등록 중…" />
        </div>
      </form>
    </section>
  );
}
