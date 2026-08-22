import { localDriver } from "./local";
import type { StorageDriver } from "./types";

export type { StorageDriver, StoredObject } from "./types";

/**
 * STORAGE_DRIVER 로 구현을 고릅니다. 현재는 local 만 구현되어 있고,
 * Vercel Blob / Cloudflare R2 는 같은 인터페이스로 파일만 추가하면 됩니다.
 */
export function getStorage(): StorageDriver {
  const name = process.env.STORAGE_DRIVER ?? "local";
  switch (name) {
    case "local":
      return localDriver;
    default:
      throw new Error(
        `알 수 없는 STORAGE_DRIVER: ${name} (지원: local). ` +
          "새 드라이버는 src/lib/storage/ 에 StorageDriver 를 구현해 추가하세요.",
      );
  }
}
