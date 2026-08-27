"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Pencil, Search, Star, Eye, EyeOff } from "lucide-react";
import {
  deleteIngredient,
  moveIngredient,
  toggleIngredientFlag,
  updateIngredientCategory,
} from "@/actions/content";
import { DeleteButton } from "@/components/admin/delete-button";
import { QuickCreate } from "@/components/admin/ingredient-quick-create";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { INGREDIENT_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const CATEGORY_LABELS: Record<string, string> = {
  HOT_TREND: "HOT 트렌드",
  INDIVIDUAL_APPROVED: "개별인정형",
  PATENT: "특허보유",
  BASIC: "기본",
  SUPERFOOD: "슈퍼푸드",
};

export type IngredientRow = {
  id: string;
  slug: string;
  category: string;
  thumbnailUrl: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
  name: string;
  locales: string[];
};

/**
 * 보유 원료 목록 — 상세 폼에 들어가지 않고 이 화면에서
 * 공개 여부·메인 노출·정렬 순서를 바로 바꿉니다.
 */
export function IngredientTable({
  rows,
  canDelete,
}: {
  rows: IngredientRow[];
  /** 삭제는 ADMIN 권한에서만 노출합니다 */
  canDelete: boolean;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return rows.filter((row) => {
      if (category && row.category !== category) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) || row.slug.toLowerCase().includes(q)
      );
    });
  }, [rows, category, keyword]);

  // 순서는 전체 목록 기준이라 걸러진 상태에서는 헷갈립니다
  const canReorder = !category && keyword.trim().length === 0;

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of rows) map[row.category] = (map[row.category] ?? 0) + 1;
    return map;
  }, [rows]);

  return (
    <div className="space-y-4">
      <QuickCreate />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={chip(category === null)}
        >
          전체 {rows.length}
        </button>
        {INGREDIENT_CATEGORIES.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setCategory(code)}
            className={chip(category === code)}
          >
            {CATEGORY_LABELS[code]} {counts[code] ?? 0}
          </button>
        ))}

        <div className="relative ml-auto w-full sm:w-64">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
            aria-hidden
          />
          <label htmlFor="ingredient-search" className="sr-only">
            원료명·slug 검색
          </label>
          <Input
            id="ingredient-search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="원료명 · slug 검색"
            className="py-2 pl-9"
          />
        </div>
      </div>

      {!canReorder && (
        <p className="text-xs text-ink-400">
          순서 변경은 필터·검색을 해제한 전체 목록에서만 할 수 있습니다.
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-4xl text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase text-ink-500">
            <tr>
              <th className="px-4 py-3 font-semibold">순서</th>
              <th className="px-4 py-3 font-semibold">원료</th>
              <th className="px-4 py-3 font-semibold">분류</th>
              <th className="px-4 py-3 font-semibold">번역</th>
              <th className="px-4 py-3 font-semibold">공개</th>
              <th className="px-4 py-3 font-semibold">메인 노출</th>
              <th className="px-4 py-3 font-semibold">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {visible.map((row) => {
              const index = rows.findIndex((r) => r.id === row.id);
              return (
                <tr key={row.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="위로"
                        disabled={!canReorder || pending || index === 0}
                        onClick={() =>
                          startTransition(async () => {
                            await moveIngredient(row.id, "up");
                          })
                        }
                        className={arrow}
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="아래로"
                        disabled={
                          !canReorder || pending || index === rows.length - 1
                        }
                        onClick={() =>
                          startTransition(async () => {
                            await moveIngredient(row.id, "down");
                          })
                        }
                        className={arrow}
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                      <span className="ml-1 text-xs text-ink-400">
                        {row.sortOrder}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/ingredients/${row.id}`}
                      className="flex items-center gap-3"
                    >
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                        {row.thumbnailUrl && (
                          <Image
                            src={row.thumbnailUrl}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-ink-900">
                          {row.name}
                        </span>
                        <span className="block font-mono text-xs text-ink-400">
                          {row.slug}
                        </span>
                      </span>
                    </Link>
                  </td>

                  <td className="px-4 py-3">
                    <label className="sr-only" htmlFor={`category-${row.id}`}>
                      분류
                    </label>
                    <select
                      id={`category-${row.id}`}
                      value={row.category}
                      disabled={pending}
                      onChange={(e) => {
                        const next = e.target.value;
                        startTransition(async () => {
                          await updateIngredientCategory(row.id, next);
                        });
                      }}
                      className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-sm text-ink-700 disabled:opacity-60"
                    >
                      {INGREDIENT_CATEGORIES.map((code) => (
                        <option key={code} value={code}>
                          {CATEGORY_LABELS[code]}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3 font-mono text-xs text-ink-500">
                    {["KO", "EN", "ZH"]
                      .map((l) => (row.locales.includes(l) ? l : "·"))
                      .join(" ")}
                  </td>

                  <td className="px-4 py-3">
                    <ToggleButton
                      on={row.isPublished}
                      pending={pending}
                      onToggle={() =>
                        startTransition(async () => {
                          await toggleIngredientFlag(
                            row.id,
                            "isPublished",
                            !row.isPublished,
                          );
                        })
                      }
                      onLabel="공개"
                      offLabel="비공개"
                      OnIcon={Eye}
                      OffIcon={EyeOff}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <ToggleButton
                      on={row.isFeatured}
                      pending={pending}
                      onToggle={() =>
                        startTransition(async () => {
                          await toggleIngredientFlag(
                            row.id,
                            "isFeatured",
                            !row.isFeatured,
                          );
                        })
                      }
                      onLabel="메인"
                      offLabel="미노출"
                      OnIcon={Star}
                      OffIcon={Star}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/ingredients/${row.id}`}
                        className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                      >
                        <Pencil className="mr-1 inline size-3" aria-hidden />
                        수정
                      </Link>
                      {canDelete && (
                        <DeleteButton
                          action={deleteIngredient}
                          id={row.id}
                          label="삭제"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-ink-400">
                  {rows.length === 0
                    ? "등록된 원료가 없습니다."
                    : "조건에 맞는 원료가 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ToggleButton({
  on,
  pending,
  onToggle,
  onLabel,
  offLabel,
  OnIcon,
  OffIcon,
}: {
  on: boolean;
  pending: boolean;
  onToggle: () => void;
  onLabel: string;
  offLabel: string;
  OnIcon: React.ComponentType<{ className?: string }>;
  OffIcon: React.ComponentType<{ className?: string }>;
}) {
  const Icon = on ? OnIcon : OffIcon;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onToggle}
      aria-pressed={on}
      className="disabled:opacity-60"
    >
      <Badge tone={on ? "success" : "neutral"}>
        <Icon className="mr-1 size-3" />
        {on ? onLabel : offLabel}
      </Badge>
    </button>
  );
}

const chip = (active: boolean) =>
  cn(
    "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
    active
      ? "border-brand-600 bg-brand-50 text-brand-700"
      : "border-ink-200 text-ink-600 hover:border-ink-300",
  );

const arrow =
  "rounded-md border border-ink-200 p-1 text-ink-500 hover:bg-ink-100 disabled:opacity-30 disabled:hover:bg-transparent";
