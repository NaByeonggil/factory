/** Cloudflare Turnstile 검증. 키 미설정 시 검증을 건너뜁니다. */
export async function verifyTurnstile(token: string | undefined, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token, remoteip: ip }),
      },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error("[turnstile] 검증 실패", error);
    return false;
  }
}
