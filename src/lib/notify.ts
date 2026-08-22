/**
 * 문의 접수 알림.
 * 알림 실패가 문의 저장을 되돌려서는 안 되므로, 항상 저장 커밋 이후에
 * 호출하고 내부에서 예외를 삼킵니다.
 */

type InquiryNotification = {
  id: string;
  name: string;
  company?: string | null;
  phone: string;
  email?: string | null;
  serviceType: string;
  message?: string | null;
  naverKeyword?: string | null;
  utmSource?: string | null;
};

const adminUrl = (id: string) =>
  `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin/inquiries/${id}`;

function buildText(i: InquiryNotification) {
  return [
    `[생산문의 접수] ${i.name}${i.company ? ` / ${i.company}` : ""}`,
    `유형: ${i.serviceType}`,
    `연락처: ${i.phone}`,
    i.email ? `이메일: ${i.email}` : null,
    i.naverKeyword ? `유입 키워드: ${i.naverKeyword} (${i.utmSource ?? "-"})` : null,
    "",
    i.message ?? "(상세 내용 없음)",
    "",
    adminUrl(i.id),
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendEmail(i: InquiryNotification) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = (process.env.NOTIFY_TO ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!apiKey || to.length === 0) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM ?? "noreply@example.com",
      to,
      subject: `[생산문의] ${i.name}${i.company ? ` / ${i.company}` : ""}`,
      text: buildText(i),
    }),
  });

  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return true;
}

export async function notifyNewInquiry(i: InquiryNotification) {
  try {
    const sent = await sendEmail(i);
    if (!sent) {
      // 알림 채널 미설정 시 로컬 개발 편의를 위해 콘솔 출력
      console.info("[notify] 알림 채널 미설정 — 콘솔 출력\n" + buildText(i));
    }
  } catch (error) {
    console.error("[notify] 문의 알림 전송 실패", error);
  }
}
