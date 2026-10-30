"use client";

import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { ChevronDown, ImageIcon, Plus } from "lucide-react";
import { updateLectureStatus } from "@/actions/content";
import {
  LECTURE_STATUSES,
  LECTURE_STATUS_LABELS,
  LECTURE_TAGS,
  type LectureStatusCode,
} from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";

export type LectureCard = {
  id: string;
  title: string;
  /** ISO 문자열 — 서버에서 넘어오는 Date 는 직렬화합니다 */
  lectureAt: string | null;
  body: string;
  /** 첫 번째 자료 사진을 대표 이미지로 씁니다 */
  coverUrl: string | null;
  imageCount: number;
  status: LectureStatusCode;
  tags: string[];
};

const COLUMN_TONES: Record<LectureStatusCode, string> = {
  PLANNED: "border-t-ink-300",
  ATTENDED: "border-t-amber-400",
  DRAFTING: "border-t-brand-400",
  DONE: "border-t-brand-700",
  APPLIED: "border-t-emerald-500",
};

/** 넓은 화면에서 열마다 이만큼만 펼치고 나머지는 「더 보기」로 접습니다 */
const VISIBLE_PER_COLUMN = 4;

/** 수강 예정 카드는 남은 날짜를 보여 줍니다 */
function dateLabel(card: LectureCard) {
  if (!card.lectureAt) return "강의일 미기재";
  const date = new Date(card.lectureAt);
  if (card.status !== "PLANNED") return formatDate(date);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  const dday = days === 0 ? "D-day" : days > 0 ? `D-${days}` : `D+${-days}`;
  return `${formatDate(date)} · ${dday}`;
}

function toggleIn<T>(prev: Set<T>, value: T) {
  const next = new Set(prev);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

/**
 * 약사 강의 정리 칸반.
 *
 * 카드는 대표 이미지와 제목만 보여 주고, 누르면 날짜·태그·내용이 아코디언으로
 * 펼쳐집니다. 대표 이미지·제목 부분을 끌어 다른 열에 놓으면 단계가 바뀌고,
 * 끌기가 불편한 터치 화면에서는 펼친 카드의 선택 상자로 같은 일을 합니다.
 * 화면은 먼저 옮겨 두고 저장합니다.
 *
 * 다섯 열이 한 줄에 들어가지 않는 화면(xl 미만)에서는 열을 위아래로 쌓은
 * 아코디언으로 바꾸고, 넓은 화면에서도 카드가 많은 열은 접어 두어
 * 열 높이가 들쭉날쭉하지 않게 맞춥니다.
 */
export function LectureBoard({ cards }: { cards: LectureCard[] }) {
  const [, startTransition] = useTransition();
  const [optimistic, moveOptimistic] = useOptimistic(
    cards,
    (state, { id, status }: { id: string; status: LectureStatusCode }) =>
      state.map((card) => (card.id === id ? { ...card, status } : card)),
  );
  const [tag, setTag] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<LectureStatusCode | null>(null);
  // 좁은 화면 아코디언 — 처음에는 카드가 있는 열만 펼칩니다
  const [open, setOpen] = useState<Set<LectureStatusCode>>(
    () => new Set(cards.map((c) => c.status)),
  );
  // 넓은 화면에서 「더 보기」를 누른 열
  const [expanded, setExpanded] = useState<Set<LectureStatusCode>>(new Set());
  // 내용을 펼친 카드
  const [openCards, setOpenCards] = useState<Set<string>>(new Set());

  function move(id: string, status: LectureStatusCode) {
    const card = optimistic.find((c) => c.id === id);
    if (!card || card.status === status) return;
    startTransition(async () => {
      moveOptimistic({ id, status });
      await updateLectureStatus(id, status);
    });
  }

  const visible = tag ? optimistic.filter((c) => c.tags.includes(tag)) : optimistic;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-semibold text-ink-500">주제</span>
        {[null, ...LECTURE_TAGS].map((value) => (
          <button
            key={value ?? "all"}
            type="button"
            onClick={() => setTag(value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-semibold transition-colors",
              tag === value
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-ink-300 text-ink-600 hover:bg-ink-50",
            )}
          >
            {value ?? "전체"}
          </button>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-5 xl:items-stretch">
          {LECTURE_STATUSES.map((status) => {
            const column = visible
              .filter((c) => c.status === status)
              // 예정은 가까운 날부터, 나머지는 최근 강의부터
              .sort((a, b) => {
                const at = a.lectureAt ? Date.parse(a.lectureAt) : 0;
                const bt = b.lectureAt ? Date.parse(b.lectureAt) : 0;
                return status === "PLANNED" ? at - bt : bt - at;
              });
            const isOpen = open.has(status);
            const showAll = expanded.has(status);
            const hidden = Math.max(column.length - VISIBLE_PER_COLUMN, 0);

            return (
              <section
                key={status}
                aria-label={LECTURE_STATUS_LABELS[status]}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(status);
                }}
                onDragLeave={(e) => {
                  // 열 안의 카드 위로 지나갈 때는 강조를 유지합니다
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    setDragOver(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(null);
                  move(e.dataTransfer.getData("text/plain"), status);
                }}
                className={cn(
                  "flex min-w-0 flex-col rounded-2xl border border-t-4 border-ink-200 bg-ink-50 p-3 transition-colors xl:min-h-96",
                  COLUMN_TONES[status],
                  dragOver === status && "bg-brand-50",
                )}
              >
                <header
                  className={cn(
                    "flex items-center justify-between gap-2 xl:mb-3",
                    isOpen && "mb-3",
                  )}
                >
                  {/* 좁은 화면에서만 아코디언 버튼으로 동작합니다 */}
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen((prev) => toggleIn(prev, status))}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left xl:pointer-events-none"
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-ink-400 transition-transform xl:hidden",
                        !isOpen && "-rotate-90",
                      )}
                      aria-hidden
                    />
                    <h2 className="truncate text-sm font-bold text-ink-900">
                      {LECTURE_STATUS_LABELS[status]}
                      <span className="ml-1.5 font-semibold text-ink-400">
                        {column.length}
                      </span>
                    </h2>
                  </button>
                  <Link
                    href={`/admin/lectures/new?status=${status}`}
                    aria-label={`${LECTURE_STATUS_LABELS[status]}에 추가`}
                    className="rounded-md p-1 text-ink-400 hover:bg-white hover:text-ink-700"
                  >
                    <Plus className="size-4" aria-hidden />
                  </Link>
                </header>

                <ul
                  className={cn(
                    // 좁은 화면에서 사진이 너무 커지지 않게 두 줄로 놓습니다
                    "flex-1 items-start gap-2 sm:grid-cols-2 xl:flex xl:flex-col xl:items-stretch",
                    isOpen ? "grid" : "hidden",
                  )}
                >
                  {column.map((card, index) => {
                    const isCardOpen = openCards.has(card.id);
                    const panelId = `lecture-card-${card.id}`;
                    const toggleCard = () =>
                      setOpenCards((prev) => toggleIn(prev, card.id));

                    return (
                      <li
                        key={card.id}
                        className={cn(
                          "min-w-0 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm hover:border-brand-300",
                          // 넓은 화면에서만 열 높이를 맞추려고 접습니다
                          !showAll && index >= VISIBLE_PER_COLUMN && "xl:hidden",
                        )}
                      >
                        {/* 끌기는 여기서만 시작해, 펼친 내용의 글자는 드래그로 선택할 수 있습니다 */}
                        <div
                          role="button"
                          tabIndex={0}
                          aria-expanded={isCardOpen}
                          aria-controls={panelId}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", card.id);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onClick={toggleCard}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleCard();
                            }
                          }}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <div className="relative aspect-video bg-ink-100">
                            {card.coverUrl ? (
                              <Image
                                src={card.coverUrl}
                                alt=""
                                fill
                                sizes="(min-width: 1280px) 18vw, (min-width: 640px) 50vw, 100vw"
                                draggable={false}
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <ImageIcon
                                className="absolute inset-0 m-auto size-6 text-ink-300"
                                aria-hidden
                              />
                            )}
                          </div>
                          <div className="flex items-start gap-1.5 p-3">
                            <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ink-900">
                              {card.title}
                            </h3>
                            <ChevronDown
                              className={cn(
                                "mt-0.5 size-4 shrink-0 text-ink-400 transition-transform",
                                isCardOpen && "rotate-180",
                              )}
                              aria-hidden
                            />
                          </div>
                        </div>

                        <div
                          id={panelId}
                          hidden={!isCardOpen}
                          className="border-t border-ink-100 p-3"
                        >
                          <p className="flex items-center gap-1.5 text-xs text-ink-400">
                            {dateLabel(card)}
                            {card.imageCount > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                · <ImageIcon className="size-3" aria-hidden />
                                {card.imageCount}
                              </span>
                            )}
                          </p>
                          {card.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {card.tags.map((t) => (
                                <span
                                  key={t}
                                  className="rounded-full bg-ink-100 px-2 py-0.5 text-[0.6875rem] font-semibold text-ink-600"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* 긴 내용이 열을 밀어내지 않게 안에서 스크롤합니다 */}
                          <p className="mt-2 max-h-60 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-ink-600">
                            {card.body}
                          </p>
                          <select
                            aria-label="단계 변경"
                            value={card.status}
                            onChange={(e) =>
                              move(card.id, e.target.value as LectureStatusCode)
                            }
                            className="mt-2 w-full rounded-md border border-ink-200 bg-white px-2 py-1 text-xs text-ink-600"
                          >
                            {LECTURE_STATUSES.map((value) => (
                              <option key={value} value={value}>
                                {LECTURE_STATUS_LABELS[value]}
                              </option>
                            ))}
                          </select>
                          <Link
                            href={`/admin/lectures/${card.id}`}
                            className="mt-2 block text-center text-xs font-semibold text-brand-700 hover:underline"
                          >
                            자세히 보기
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                  {hidden > 0 && (
                    <li className="hidden xl:block">
                      <button
                        type="button"
                        aria-expanded={showAll}
                        onClick={() => setExpanded((prev) => toggleIn(prev, status))}
                        className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold text-ink-500 hover:bg-white hover:text-ink-800"
                      >
                        {showAll ? "접기" : `${hidden}건 더 보기`}
                        <ChevronDown
                          className={cn("size-3.5", showAll && "rotate-180")}
                          aria-hidden
                        />
                      </button>
                    </li>
                  )}
                  {column.length === 0 && (
                    <li className="rounded-xl border border-dashed border-ink-300 px-3 py-6 text-center text-xs text-ink-400">
                      여기로 끌어 놓기
                    </li>
                  )}
                </ul>
              </section>
            );
          })}
      </div>
    </div>
  );
}
