import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * 이미지가 없는 콘텐츠도 레이아웃이 무너지지 않아야 하므로,
 * 비어 있으면 이름 첫 글자를 딴 플레이스홀더를 대신 그립니다.
 */
function Placeholder({ seed, className }: { seed: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50",
        className,
      )}
    >
      <span className="text-2xl font-extrabold text-brand-300">
        {seed.trim().charAt(0) || "·"}
      </span>
    </div>
  );
}

/**
 * 고정 비율 썸네일.
 *
 * src가 같은 오리진의 상대 경로(`/api/media/...`)라 next/image 최적화가
 * 그대로 동작합니다(webp 변환 + 반응형 리사이즈). 광고 랜딩 LCP에 직결되는
 * 부분이라 최적화를 켜둡니다.
 */
export function Thumbnail({
  src,
  alt,
  seed,
  ratio = "photo",
  className,
  sizes = "(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw",
  priority,
}: {
  src: string | null;
  alt: string;
  seed: string;
  ratio?: "square" | "photo" | "video" | "wide";
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const ratios = {
    square: "aspect-square",
    photo: "aspect-[4/3]",
    video: "aspect-video",
    wide: "aspect-[21/9]",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-ink-100",
        ratios[ratio],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <Placeholder seed={seed} className="absolute inset-0" />
      )}
    </div>
  );
}

/** 포트폴리오 상세 갤러리 */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  if (images.length === 0) return null;

  return (
    <div className="space-y-3">
      <Thumbnail
        src={images[0]}
        alt={alt}
        seed={alt}
        ratio="video"
        sizes="(min-width: 768px) 720px, 100vw"
        priority
      />
      {images.length > 1 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.slice(1).map((src, index) => (
            <li key={src}>
              <Thumbnail
                src={src}
                alt={`${alt} ${index + 2}`}
                seed={alt}
                ratio="square"
                sizes="180px"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
