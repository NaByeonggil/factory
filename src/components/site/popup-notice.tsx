"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import type { PopupCard } from "@/lib/queries";
import { POPUP_SIZE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "popup-hidden:";

/** "오늘 하루 보지 않기" 만료 시각 — 다음 자정 */
function endOfToday() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

function isHidden(id: string) {
  try {
    const until = Number(localStorage.getItem(STORAGE_PREFIX + id));
    return until > Date.now();
  } catch {
    // 시크릿 모드 등 localStorage 접근이 막힌 환경
    return false;
  }
}

/**
 * localStorage 는 React 밖의 상태라 useSyncExternalStore 로 읽습니다.
 * (서버 렌더에서는 "숨김 없음"으로 보고, 마운트 후 실제 값으로 맞춥니다)
 */
let listeners: (() => void)[] = [];

function subscribe(onChange: () => void) {
  listeners = [...listeners, onChange];
  return () => {
    listeners = listeners.filter((l) => l !== onChange);
  };
}

function hideToday(id: string) {
  try {
    localStorage.setItem(STORAGE_PREFIX + id, String(endOfToday()));
  } catch {
    /* 저장 못 해도 닫기는 동작해야 합니다 */
  }
  for (const listener of listeners) listener();
}

/**
 * 진입 팝업 공지. 카드 크기는 핸드폰 화면 규격(320×480)으로 고정이라
 * 데스크톱에서도 같은 크기로 보입니다. 여러 건이면 가로로 나란히 놓고,
 * 폭이 모자라면 스냅 스크롤로 넘깁니다.
 */
export function PopupNotice({ popups }: { popups: PopupCard[] }) {
  const t = useTranslations("popup");
  // 이번 방문에서 닫은 팝업 (새로고침하면 다시 뜹니다)
  const [closed, setClosed] = useState<string[]>([]);

  // "0101…" 형태의 문자열이라 값이 같으면 재렌더가 일어나지 않습니다
  const hiddenFlags = useSyncExternalStore(
    subscribe,
    useCallback(
      () => popups.map((p) => (isHidden(p.id) ? "1" : "0")).join(""),
      [popups],
    ),
    useCallback(() => "0".repeat(popups.length), [popups.length]),
  );

  const shown = popups.filter(
    (p, i) => hiddenFlags[i] !== "1" && !closed.includes(p.id),
  );

  useEffect(() => {
    if (shown.length === 0) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setClosed(popups.map((p) => p.id));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [popups, shown.length]);

  if (shown.length === 0) return null;

  const close = (id: string) => setClosed((prev) => [...prev, id]);

  return (
    // 컨테이너는 화면 전체를 덮으므로 빈 영역의 클릭을 가로채지 않게 합니다
    <aside
      aria-label={t("notice")}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex snap-x snap-mandatory overflow-x-auto overscroll-contain px-4 pt-4 pb-24 lg:pb-4"
    >
      {/* mx-auto 는 남는 폭이 있을 때만 먹으므로, 넘칠 때는 왼쪽부터 스크롤됩니다
          (justify-center 로 가운데 정렬하면 왼쪽으로 넘친 영역에 닿을 수 없습니다) */}
      <div className="mx-auto flex gap-4">
        {shown.map((popup) => (
          <PopupItem
            key={popup.id}
            popup={popup}
            onClose={() => close(popup.id)}
            onHideToday={() => hideToday(popup.id)}
          />
        ))}
      </div>
    </aside>
  );
}

function PopupItem({
  popup,
  onClose,
  onHideToday,
}: {
  popup: PopupCard;
  onClose: () => void;
  onHideToday: () => void;
}) {
  const t = useTranslations("popup");
  const hasLink = Boolean(popup.linkUrl);

  const body = (
    <>
      {popup.imageUrl && (
        <div className="relative aspect-4/5 w-full bg-ink-100">
          <Image
            src={popup.imageUrl}
            alt=""
            fill
            sizes={`${POPUP_SIZE.width}px`}
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div className={cn("space-y-2 px-5 py-4", !popup.imageUrl && "py-6")}>
        <p className="text-base font-bold text-ink-900">{popup.title}</p>
        {popup.body && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink-600">
            {popup.body}
          </p>
        )}
        {hasLink && (
          <p className="pt-1 text-sm font-semibold text-brand-700">
            {popup.linkLabel ?? t("detail")} →
          </p>
        )}
      </div>
    </>
  );

  return (
    <section
      // 핸드폰 규격 고정 — 좁은 화면에서는 화면 폭에 맞춰 줄입니다
      style={{ width: POPUP_SIZE.width, maxWidth: "calc(100vw - 2rem)" }}
      className="pointer-events-auto flex max-h-[calc(100dvh-8rem)] shrink-0 snap-center flex-col overflow-hidden rounded-2xl bg-white shadow-soft-lg ring-1 ring-ink-200"
    >
      <div className="relative flex-1 overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 text-ink-600 shadow-sm hover:bg-white hover:text-ink-900"
        >
          <X className="size-4" aria-hidden />
        </button>

        {hasLink ? (
          <a
            href={popup.linkUrl!}
            className="block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600"
          >
            {body}
          </a>
        ) : (
          body
        )}
      </div>

      <div className="flex items-center justify-between border-t border-ink-200 bg-ink-50 text-sm">
        <button
          type="button"
          onClick={onHideToday}
          className="px-4 py-3 font-medium text-ink-600 hover:text-ink-900"
        >
          {t("hideToday")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-3 font-semibold text-ink-800 hover:text-brand-700"
        >
          {t("close")}
        </button>
      </div>
    </section>
  );
}
