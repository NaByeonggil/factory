"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/field";
import {
  CHAPTER_COMPARISON,
  CHAPTER_OVERVIEW,
  QUASI_DRUG_CHAPTERS,
  QUASI_DRUG_META,
  type LimitChapter,
  type LimitTable,
} from "@/lib/quasi-drug-limits";
import { cn } from "@/lib/utils";

type Tab = { id: string; label: string };

const TABS: Tab[] = [
  { id: "overview", label: "개요" },
  ...QUASI_DRUG_CHAPTERS.map((c) => ({ id: c.id, label: c.short })),
  { id: "comparison", label: "장별 비교" },
];

/** 검색 대상 — 장별 표에 어느 장·어느 표에서 왔는지 꼬리표를 붙여 둡니다 */
type IndexedTable = { chapter: string; table: LimitTable };

function collectTables(): IndexedTable[] {
  const out: IndexedTable[] = [
    { chapter: "개요", table: CHAPTER_OVERVIEW },
    { chapter: "장별 비교", table: CHAPTER_COMPARISON },
  ];
  for (const chapter of QUASI_DRUG_CHAPTERS) {
    for (const section of chapter.sections) {
      for (const table of section.tables ?? []) {
        out.push({ chapter: chapter.short, table });
      }
    }
  }
  return out;
}

/** 표는 정적 데이터라 모듈을 읽을 때 한 번만 모읍니다 */
const ALL_TABLES = collectTables();

/**
 * 의약외품 배합한도 열람 화면.
 *
 * 장별 탭으로 나눠 보고, 성분명을 넣으면 4개 장의 표를 가로질러 찾습니다
 * (「벤포티아민 얼마까지 되나」를 표마다 뒤지지 않게 하려는 목적).
 */
export function QuasiDrugLimitsView() {
  const [tab, setTab] = useState<string>("overview");
  const [keyword, setKeyword] = useState("");

  const query = keyword.trim().toLowerCase();

  const results = useMemo(() => {
    if (!query) return [];
    return ALL_TABLES
      .map(({ chapter, table }) => ({
        chapter,
        table,
        rows: table.rows.filter((row) =>
          row.some((cell) => cell.toLowerCase().includes(query)),
        ),
      }))
      .filter((hit) => hit.rows.length > 0);
  }, [query]);

  const hitCount = results.reduce((sum, hit) => sum + hit.rows.length, 0);
  const chapter = QUASI_DRUG_CHAPTERS.find((c) => c.id === tab);

  return (
    <div className="space-y-6">
      <SourceCard />

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={chip(!query && tab === item.id)}
            // 검색 중에는 탭 대신 검색 결과를 보여주므로 눌림 표시를 지웁니다
          >
            {item.label}
          </button>
        ))}

        <div className="relative ml-auto w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
            aria-hidden
          />
          <label htmlFor="limit-search" className="sr-only">
            성분명 검색
          </label>
          <Input
            id="limit-search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="성분명 검색 (예: 벤포티아민)"
            className="py-2 pl-9"
          />
        </div>
      </div>

      {query ? (
        <section className="space-y-4">
          <p className="text-sm text-ink-500">
            ‘{keyword.trim()}’ 검색 결과 {hitCount}건
            <button
              type="button"
              onClick={() => setKeyword("")}
              className="ml-2 font-semibold text-brand-700 hover:underline"
            >
              검색 해제
            </button>
          </p>

          {results.map((hit) => (
            <DataTable
              key={`${hit.chapter}-${hit.table.id}`}
              table={{ ...hit.table, rows: hit.rows, notes: undefined }}
              badge={hit.chapter}
            />
          ))}

          {results.length === 0 && (
            <p className="rounded-2xl border border-ink-200 bg-white px-4 py-12 text-center text-ink-400">
              일치하는 성분이 없습니다. 고시 원문에 다른 이름으로 적혀 있을 수
              있습니다.
            </p>
          )}
        </section>
      ) : tab === "overview" ? (
        <DataTable table={CHAPTER_OVERVIEW} />
      ) : tab === "comparison" ? (
        <DataTable table={CHAPTER_COMPARISON} tone />
      ) : chapter ? (
        <ChapterView chapter={chapter} />
      ) : null}
    </div>
  );
}

function SourceCard() {
  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5">
      <dl className="grid gap-3 sm:grid-cols-[6rem_1fr]">
        <dt className="text-sm font-semibold text-ink-500">출처</dt>
        <dd className="text-sm text-ink-800">{QUASI_DRUG_META.source}</dd>
        <dt className="text-sm font-semibold text-ink-500">대상</dt>
        <dd className="text-sm text-ink-800">{QUASI_DRUG_META.target}</dd>
        <dt className="text-sm font-semibold text-ink-500">확인 시점</dt>
        <dd className="text-sm text-ink-800">{QUASI_DRUG_META.checkedAt}</dd>
      </dl>

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          {QUASI_DRUG_META.caution}{" "}
          <a
            href={QUASI_DRUG_META.lawUrl}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            국가법령정보센터
            <ExternalLink className="ml-0.5 inline size-3" aria-hidden />
          </a>{" "}
          — {QUASI_DRUG_META.lawHint}
        </span>
      </p>
    </section>
  );
}

function ChapterView({ chapter }: { chapter: LimitChapter }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-ink-200 bg-white p-5">
        <h2 className="font-bold text-ink-900">{chapter.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          <span className="font-semibold text-ink-700">적용 범위 </span>
          {chapter.scope}
        </p>
        {chapter.highlights?.map((line) => (
          <p
            key={line}
            className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm leading-relaxed text-amber-900"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{line}</span>
          </p>
        ))}
      </section>

      {chapter.sections.map((section) => (
        <section key={section.id} className="space-y-4">
          <h3 className="font-bold text-ink-900">{section.title}</h3>

          {section.body?.map((paragraph) => (
            <p
              key={paragraph}
              className="rounded-2xl border border-ink-200 bg-white p-5 text-sm leading-relaxed text-ink-700"
            >
              {paragraph}
            </p>
          ))}

          {section.bullets && (
            <ul className="space-y-2 rounded-2xl border border-ink-200 bg-white p-5">
              {section.bullets.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm leading-relaxed text-ink-700"
                >
                  <span aria-hidden className="text-ink-300">
                    ·
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          )}

          {section.points && (
            <dl className="grid gap-3 lg:grid-cols-2">
              {section.points.map((point) => (
                <div
                  key={point.title}
                  className="rounded-2xl border border-ink-200 bg-white p-5"
                >
                  <dt className="text-sm font-bold text-ink-900">
                    {point.title}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-ink-700">
                    {point.body}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {section.tables?.map((table) => (
            <DataTable key={table.id} table={table} />
          ))}
        </section>
      ))}
    </div>
  );
}

function DataTable({
  table,
  badge,
  tone = false,
}: {
  table: LimitTable;
  /** 검색 결과에서 어느 장의 표인지 알려주는 꼬리표 */
  badge?: string;
  /** 가능·불가 값을 색으로 구분할지 (장별 비교표) */
  tone?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
      <div className="flex flex-wrap items-baseline gap-2 border-b border-ink-200 px-5 py-4">
        <h4 className="font-bold text-ink-900">{table.title}</h4>
        {badge && (
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
            {badge}
          </span>
        )}
        {table.description && (
          <p className="w-full text-sm leading-relaxed text-ink-500">
            {table.description}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-2xl text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase text-ink-500">
            <tr>
              {table.columns.map((column) => (
                <th key={column} className="px-4 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {table.rows.map((row, index) => (
              <tr key={`${table.id}-${index}`} className="align-top">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      "px-4 py-3 leading-relaxed",
                      cellIndex === 0
                        ? "font-semibold whitespace-nowrap text-ink-900"
                        : "text-ink-700",
                      tone && cell.startsWith("불가") && "font-bold text-red-700",
                      tone && cell.startsWith("가능") && "text-emerald-700",
                    )}
                  >
                    {cell || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.notes?.map((note) => (
        <p
          key={note}
          className="border-t border-ink-100 bg-ink-50 px-5 py-3 text-xs leading-relaxed text-ink-500"
        >
          ※ {note}
        </p>
      ))}
    </div>
  );
}

const chip = (active: boolean) =>
  cn(
    "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
    active
      ? "border-brand-600 bg-brand-50 text-brand-700"
      : "border-ink-200 text-ink-600 hover:border-ink-300",
  );
