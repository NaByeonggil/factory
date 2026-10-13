import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { UseDraftButton } from "@/components/admin/use-draft-button";
import { getInquiryAnalysis, pushInquiryToDatahealth } from "@/lib/datahealth";
import { formatDateTime } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  quotation: "견적 문의",
  product: "제품 문의",
  simple: "단순 문의",
  urgent: "긴급 문의",
  spam: "스팸 의심",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "낮음",
  normal: "보통",
  high: "높음",
  urgent: "긴급",
};

function Shell({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-6">
      <h2 className="font-bold">
        AI 분석
        <span className="ml-2 text-xs font-normal text-ink-400">
          {note ?? "견적·원가 시스템이 만든 내부 참고용 — 고객에게 보이지 않습니다"}
        </span>
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * 견적·원가 시스템(datahealth)이 만든 문의 분석과 답변 초안.
 * 상대 앱이 꺼져 있어도 이 화면은 떠야 하므로, 어떤 실패든 안내 문구로 끝냅니다.
 */
export async function AiAnalysisPanel({
  inquiryId,
  replyFieldId,
}: {
  inquiryId: string;
  replyFieldId: string;
}) {
  let result = await getInquiryAnalysis(inquiryId);
  if (result.state === "disabled") return null;

  // 접수 때 전달이 실패했거나 연동 이전에 들어온 문의 — 지금 넘기고 다음에 열 때 보여줍니다
  if (result.state === "missing") {
    const pushed = await pushInquiryToDatahealth(inquiryId);
    if (pushed) result = await getInquiryAnalysis(inquiryId);
  }

  const refresh = (
    <Link href={`/admin/inquiries/${inquiryId}`} className="text-sm font-semibold text-brand-700 underline">
      새로고침
    </Link>
  );

  if (result.state !== "ok") {
    return (
      <Shell>
        <p className="text-sm text-ink-500">
          견적·원가 시스템에 연결하지 못했습니다. 문의 응대는 그대로 진행하실 수 있습니다. {refresh}
        </p>
      </Shell>
    );
  }

  const a = result.analysis;

  if (a.status === "pending" || a.status === "ai_processing") {
    return (
      <Shell>
        <p className="text-sm text-ink-500">
          {a.status === "pending"
            ? "분석 대기 중입니다. AI 서버가 꺼져 있으면 켜진 뒤에 처리됩니다."
            : "분석 중입니다. 30초쯤 뒤에 다시 확인해주세요."}{" "}
          {refresh}
        </p>
      </Shell>
    );
  }

  const extracted = a.extracted;
  const facts: [string, string | null][] = [
    ["제형", extracted?.productType ?? null],
    ["생산 수량", extracted?.productionQty ? `${extracted.productionQty.toLocaleString("ko-KR")}개` : null],
    [
      "원료",
      extracted?.materials?.length
        ? extracted.materials.map((m) => [m.name, m.quantity].filter(Boolean).join(" ")).join(", ")
        : null,
    ],
  ];

  return (
    <Shell>
      <div className="flex flex-wrap items-center gap-2">
        {a.inquiryType && (
          <Badge tone={a.inquiryType === "spam" ? "danger" : "brand"}>
            {TYPE_LABELS[a.inquiryType] ?? a.inquiryType}
          </Badge>
        )}
        <Badge tone={a.priority === "urgent" || a.priority === "high" ? "accent" : "neutral"}>
          우선순위 {PRIORITY_LABELS[a.priority] ?? a.priority}
        </Badge>
        {a.confidence != null && (
          <span className="text-xs text-ink-500">신뢰도 {Math.round(a.confidence * 100)}%</span>
        )}
        {a.processedAt && (
          <span className="ml-auto text-xs text-ink-400">{formatDateTime(a.processedAt)}</span>
        )}
      </div>

      {a.error && (
        <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{a.error}</p>
      )}

      {facts.some(([, value]) => value) && (
        <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-3">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold text-ink-400">{label}</dt>
              <dd className="mt-0.5 text-sm text-ink-800">{value ?? "-"}</dd>
            </div>
          ))}
        </dl>
      )}

      {extracted?.missingInfo && extracted.missingInfo.length > 0 && (
        <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">견적에 더 필요한 정보</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
            {extracted.missingInfo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {a.draft && (
        <div className="mt-5 border-t border-ink-100 pt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink-800">답변 초안</p>
            <UseDraftButton draft={a.draft} targetId={replyFieldId} />
          </div>
          <p className="mt-3 whitespace-pre-line rounded-xl bg-ink-50 p-4 text-sm leading-relaxed text-ink-800">
            {a.draft}
          </p>
          <p className="mt-2 text-xs text-ink-400">
            AI가 쓴 초안입니다. 사실과 금액을 확인하고 고친 뒤 저장해주세요.
          </p>
        </div>
      )}
    </Shell>
  );
}
