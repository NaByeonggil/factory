"use client";

import { useTranslations } from "next-intl";
import { Phone, MessageSquareText } from "lucide-react";
import { Link } from "@/i18n/navigation";

/** 모바일 하단 고정 전환 바 — 광고 유입 트래픽의 전환율을 좌우하는 요소 */
export function MobileCta({ tel }: { tel: string }) {
  const t = useTranslations("nav");

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-ink-200 bg-white shadow-[0_-4px_20px_rgba(15,23,42,0.08)] lg:hidden">
      <a
        href={`tel:${tel.replace(/[^0-9+]/g, "")}`}
        className="flex h-14 items-center justify-center gap-2 text-label font-semibold text-ink-800"
      >
        <Phone className="size-4" aria-hidden />
        {tel}
      </a>
      <Link
        href="/inquiry"
        className="flex h-14 items-center justify-center gap-2 bg-brand-600 text-label font-bold text-white"
      >
        <MessageSquareText className="size-4" aria-hidden />
        {t("inquiry")}
      </Link>
    </div>
  );
}
