import { ImageResponse } from "next/og";

/**
 * Safari 는 apple-touch-icon 으로 SVG 를 쓰지 않으므로 PNG 가 필요합니다.
 * 외부 래스터라이저 없이 빌드 시 icon.svg 와 같은 그림을 PNG 로 생성합니다.
 * (모양을 바꿀 때는 src/app/icon.svg · src/components/site/logo.tsx 와 함께 수정하세요)
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const GLYPH = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="180" height="180">
<g transform="translate(11 12) scale(0.98)" fill="none" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
<path d="M13 20c1-3 1-5 1-7"/>
<path d="M14 13c-5-1-6-6-3-9 5 1 6 6 3 9Z"/>
<path d="M14 13c-1-6 4-10 9-9 1 6-4 10-9 9Z"/>
<path d="M4 37V24l8-6v6l8-6v6h5V8h6v29"/>
<path d="M3 37h38"/>
</g></svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#127a58",
        }}
      >
        <img
          width={180}
          height={180}
          alt=""
          src={`data:image/svg+xml;base64,${Buffer.from(GLYPH).toString("base64")}`}
        />
      </div>
    ),
    size,
  );
}
