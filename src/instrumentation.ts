const SYNC_INTERVAL_MS = 3 * 60 * 1000;
const FIRST_SYNC_DELAY_MS = 30 * 1000;

/**
 * 서버가 뜰 때 Gmail 동기화 타이머를 겁니다.
 * 개발 서버는 운영과 같은 DB·메일함을 볼 수 있어 타이머를 걸지 않습니다 —
 * 관리자 화면의 「지금 동기화」로 확인합니다.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const { syncMail } = await import("@/lib/mail-sync");
  const run = () => {
    syncMail().catch((error) => console.error("[mail-sync]", error));
  };
  setTimeout(run, FIRST_SYNC_DELAY_MS).unref();
  setInterval(run, SYNC_INTERVAL_MS).unref();
}
