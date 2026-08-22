import { ImageResponse } from "next/og";

/**
 * Safari 는 apple-touch-icon 으로 SVG 를 쓰지 않으므로 PNG 가 필요합니다.
 * 외부 래스터라이저 없이 빌드 시 icon.svg 와 같은 그림을 PNG 로 생성합니다.
 * (모양을 바꿀 때는 src/app/icon.svg 와 함께 수정하세요)
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const GLYPH = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="180" height="180">
<g fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
<path d="M12 47V33h10V20h9v13h21v14"/>
<path d="M10 47h44"/>
<path d="M31 20c0-4 2-7 5-8"/>
<path d="M36 12c-3-5 2-9 8-8 1 6-4 10-8 8Z"/>
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
