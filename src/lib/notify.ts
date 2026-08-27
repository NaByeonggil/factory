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

// ─────────────────────── 문답 게시판 ───────────────────────

type QuestionNotification = {
  id: string;
  authorName: string;
  title: string;
  body: string;
  isSecret: boolean;
};

function buildQuestionText(q: QuestionNotification) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin/qna/${q.id}`;
  return [
    `[문답 접수] ${q.title}`,
    `작성자: ${q.authorName}${q.isSecret ? " (비밀글)" : ""}`,
    "",
    q.body,
    "",
    url,
  ].join("\n");
}

export async function notifyNewQuestion(q: QuestionNotification) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const to = (process.env.NOTIFY_TO ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!apiKey || to.length === 0) {
      // 알림 채널 미설정 시 로컬 개발 편의를 위해 콘솔 출력
      console.info("[notify] 알림 채널 미설정 — 콘솔 출력\n" + buildQuestionText(q));
      return;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM ?? "noreply@example.com",
        to,
        subject: `[문답] ${q.title}`,
        text: buildQuestionText(q),
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  } catch (error) {
    console.error("[notify] 문답 알림 전송 실패", error);
  }
}

// ─────────────────────── 견적문의 답변 알림 ───────────────────────

type ReplyNotification = {
  id: string;
  name: string;
  email: string;
  locale: string;
};

/**
 * 답변 등록을 고객에게 알립니다.
 * 답변 내용은 메일에 싣지 않고, 비밀번호로 잠긴 게시판 주소만 보냅니다.
 */
export async function notifyInquiryReply(r: ReplyNotification) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !r.email) {
      console.info(
        `[notify] 알림 채널 미설정 — 콘솔 출력\n[견적문의 답변] ${r.name}님께 답변 등록 (${r.id})`,
      );
      return;
    }

    const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/${r.locale}/quote/${r.id}`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM ?? "noreply@example.com",
        to: [r.email],
        subject: "[헬씨팜바이오] 견적문의 답변이 등록되었습니다",
        text: [
          `${r.name}님, 문의해주셔서 감사합니다.`,
          "",
          "남겨주신 견적문의에 답변이 등록되었습니다.",
          "아래 주소에서 접수 시 입력하신 비밀번호로 확인하실 수 있습니다.",
          "",
          url,
        ].join("\n"),
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  } catch (error) {
    console.error("[notify] 답변 알림 전송 실패", error);
  }
}

/** 고객이 견적문의에 답글을 달면 담당자에게 알립니다 */
export async function notifyCustomerReply(r: {
  id: string;
  name: string;
  body: string;
}) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin/inquiries/${r.id}`;
  const text = [`[견적문의 답글] ${r.name}`, "", r.body, "", url].join("\n");

  try {
    const apiKey = process.env.RESEND_API_KEY;
    const to = (process.env.NOTIFY_TO ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!apiKey || to.length === 0) {
      // 알림 채널 미설정 시 로컬 개발 편의를 위해 콘솔 출력
      console.info("[notify] 알림 채널 미설정 — 콘솔 출력\n" + text);
      return;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM ?? "noreply@example.com",
        to,
        subject: `[견적문의 답글] ${r.name}`,
        text,
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  } catch (error) {
    console.error("[notify] 답글 알림 전송 실패", error);
  }
}
