"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ATTRIBUTION_STORAGE_KEY,
  hasAnySignal,
  parseAttribution,
} from "@/lib/tracking";

/**
 * 최초 랜딩 시점의 유입 파라미터를 sessionStorage에 고정 저장.
 * 이후 사용자가 여러 페이지를 거쳐 문의 폼에 도달해도 유입 출처가 유지됩니다.
 * (이미 저장된 값이 있으면 first-touch를 우선해 덮어쓰지 않음)
 */
export function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)) return;

      const attribution = parseAttribution(
        new URLSearchParams(searchParams.toString()),
        pathname,
        document.referrer,
      );
      if (!hasAnySignal(attribution)) return;

      window.sessionStorage.setItem(
        ATTRIBUTION_STORAGE_KEY,
        JSON.stringify(attribution),
      );
    } catch {
      // 시크릿 모드 등 저장소 접근 불가 — 추적 없이 진행
    }
  }, [pathname, searchParams]);

  return null;
}
