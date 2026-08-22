/** 업로드 대상 저장소 드라이버. 로컬 → Vercel Blob / R2 로 교체 가능. */
export type StoredObject = {
  /** 드라이버 내부 식별자. DB의 InquiryFile.storageKey 에 저장됩니다. */
  key: string;
  /**
   * 브라우저가 접근할 주소.
   * 로컬 드라이버는 관리자 인증이 걸린 `/api/files/<key>` 를 돌려주고,
   * 퍼블릭 CDN 드라이버는 자체 URL을 돌려줍니다.
   */
  url: string;
  size: number;
  mimeType: string;
};

export type StorageDriver = {
  name: string;
  put(input: {
    key: string;
    body: Uint8Array;
    mimeType: string;
  }): Promise<StoredObject>;
  /** 존재하지 않는 키에 대해서도 조용히 성공해야 합니다. */
  delete(key: string): Promise<void>;
  /** 관리자 다운로드용. 퍼블릭 드라이버는 지원하지 않을 수 있습니다. */
  read?(key: string): Promise<Uint8Array | null>;
  /** 고아 파일 정리를 위한 목록 조회. */
  list?(): Promise<{ key: string; modifiedAt: Date }[]>;
};
