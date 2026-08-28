"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import type { QuoteSearchField } from "@/lib/queries";

/**
 * 목록 검색. 본문은 비밀번호로 잠긴 내용이라
 * 검색 대상은 제목·작성자까지만 둡니다.
 */
export function QuoteSearch({
  field,
  keyword,
  /** 검색 결과가 열릴 게시판 경로 (전체 / 펫 전용) */
  basePath = "/quote",
}: {
  field: QuoteSearchField;
  keyword: string;
  basePath?: string;
}) {
  const t = useTranslations("quote");
  const router = useRouter();
  const [value, setValue] = useState(keyword);
  const [target, setTarget] = useState<QuoteSearchField>(field);

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const query = value.trim();
        router.push(
          query
            ? `${basePath}?field=${target}&q=${encodeURIComponent(query)}`
            : basePath,
        );
      }}
    >
      <label htmlFor="quote-search-field" className="sr-only">
        {t("searchField")}
      </label>
      <Select
        id="quote-search-field"
        value={target}
        onChange={(e) => setTarget(e.target.value as QuoteSearchField)}
        className="w-auto py-2.5"
      >
        <option value="title">{t("searchByTitle")}</option>
        <option value="author">{t("searchByAuthor")}</option>
      </Select>

      <label htmlFor="quote-search-keyword" className="sr-only">
        {t("search")}
      </label>
      <Input
        id="quote-search-keyword"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("searchPlaceholder")}
        maxLength={60}
        className="w-48 py-2.5 sm:w-56"
      />

      <Button type="submit" size="sm" variant="outline">
        <Search className="size-4" aria-hidden />
        {t("search")}
      </Button>

      {keyword && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setValue("");
            router.push(basePath);
          }}
        >
          <X className="size-4" aria-hidden />
          {t("searchReset")}
        </Button>
      )}
    </form>
  );
}
