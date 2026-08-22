import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageDriver, StoredObject } from "./types";

/**
 * 로컬 파일시스템 드라이버.
 *
 * 저장 위치는 `public/` 바깥입니다. 문의 첨부는 고객사의 기획서·스펙시트가
 * 들어오는 자리라 정적 서빙하면 URL만 알면 누구나 받을 수 있게 됩니다.
 * 실제 다운로드는 관리자 인증이 걸린 /api/files/[...key] 를 거칩니다.
 */
const ROOT = path.resolve(process.env.UPLOAD_DIR ?? "./storage/uploads");

/** `../` 탈출과 절대경로 주입을 차단하고 실제 파일 경로를 만든다 */
export function resolveKey(key: string) {
  if (!/^[a-zA-Z0-9/_.-]+$/.test(key) || key.includes("..")) return null;
  const target = path.resolve(ROOT, key);
  const rootWithSep = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;
  if (!target.startsWith(rootWithSep)) return null;
  return target;
}

export const localDriver: StorageDriver = {
  name: "local",

  async put({ key, body, mimeType }): Promise<StoredObject> {
    const target = resolveKey(key);
    if (!target) throw new Error(`유효하지 않은 storage key: ${key}`);

    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body, { flag: "wx" });

    return {
      key,
      url: `/api/files/${key}`,
      size: body.byteLength,
      mimeType,
    };
  },

  async delete(key) {
    const target = resolveKey(key);
    if (!target) return;
    await rm(target, { force: true });
  },

  async read(key) {
    const target = resolveKey(key);
    if (!target) return null;
    try {
      return new Uint8Array(await readFile(target));
    } catch {
      return null;
    }
  },

  async list() {
    const out: { key: string; modifiedAt: Date }[] = [];
    async function walk(dir: string) {
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else {
          const info = await stat(full);
          out.push({
            key: path.relative(ROOT, full).split(path.sep).join("/"),
            modifiedAt: info.mtime,
          });
        }
      }
    }
    await walk(ROOT);
    return out;
  },
};

/** 저장 경로에 원본 파일명을 쓰지 않기 위한 결정적 해시 (디버깅용) */
export function hashName(input: string) {
  return createHash("sha256").update(input).digest("hex").slice(0, 12);
}
