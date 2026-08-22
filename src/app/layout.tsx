import type { ReactNode } from "react";

/**
 * next-intl 권장 구조: 실제 <html>/<body>는
 * app/[locale]/layout.tsx 와 app/admin/layout.tsx 가 각각 렌더링합니다.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
