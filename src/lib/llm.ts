/**
 * 로컬 LLM(OpenAI 호환 API) 호출.
 *
 * LLM_BASE_URL 이나 LLM_MODEL 이 비어 있으면 AI 기능 전체가 꺼집니다.
 * 부가 기능이므로 예외를 던지지 않고 실패 사유를 돌려줍니다.
 */

/** nginx 의 proxy_read_timeout(300초)보다 먼저 끝나야 사용자에게 오류를 보여 줄 수 있습니다 */
const TIMEOUT_MS = 240 * 1000;
const MAX_OUTPUT_TOKENS = 4096;

export type LlmFailure =
  /** 입력이 모델의 컨텍스트 크기를 넘음 */
  | "TOO_LONG"
  /** 답변이 토큰 한도에서 잘림 */
  | "TRUNCATED"
  /** 서버 연결 실패, 시간 초과, 오류 응답, 빈 답변 */
  | "UNAVAILABLE";

export type LlmResult =
  | { ok: true; content: string }
  | { ok: false; reason: LlmFailure };

function config() {
  const baseUrl = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;
  if (!baseUrl || !model) return null;
  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    model,
    apiKey: process.env.LLM_API_KEY,
  };
}

export const llmConfigured = () => config() !== null;

export async function chatCompletion(
  system: string,
  user: string,
): Promise<LlmResult> {
  const cfg = config();
  if (!cfg) return { ok: false, reason: "UNAVAILABLE" };

  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.2,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const error = data?.error;
      if (
        error?.type === "exceed_context_size_error" ||
        error?.code === "context_length_exceeded"
      ) {
        return { ok: false, reason: "TOO_LONG" };
      }
      console.error("[llm] HTTP", res.status);
      return { ok: false, reason: "UNAVAILABLE" };
    }

    const choice = data?.choices?.[0];
    if (choice?.finish_reason === "length") {
      return { ok: false, reason: "TRUNCATED" };
    }
    const content = choice?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return { ok: false, reason: "UNAVAILABLE" };
    }
    return { ok: true, content: content.trim() };
  } catch (error) {
    console.error("[llm]", error);
    return { ok: false, reason: "UNAVAILABLE" };
  }
}
