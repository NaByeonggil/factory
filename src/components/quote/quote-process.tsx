import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight, ChevronDown, ClipboardList } from "lucide-react";

type Pair = { title: string; body: string };

/**
 * 상담 진행 방식 도해.
 * 4단계 흐름과 그 결과물(제품개발 방향서)을 한 장으로 묶어,
 * 「②검토·상담에서 방향서가 나오고, 그걸로 ③견적을 낸다」는 관계까지 보여줍니다.
 */
export async function QuoteProcess({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "quote" });
  const brief = t.raw("brief") as Pair[];

  /**
   * 아이콘은 공급받은 3D 타일 이미지 (public/quote-process/).
   * 파일명이 단계 순서와 다른 것은 단계 구성이 바뀌었기 때문입니다
   * (step-3.png 는 「영업담당자 배정」 단계가 사라져 지금은 쓰지 않습니다).
   */
  const steps = [
    { key: "step1", src: "/quote-process/step-1.png" },
    { key: "step2", src: "/quote-process/step-2.png" },
    { key: "step3", src: "/quote-process/step-4.png", note: t("stepNote") },
    { key: "step4", src: "/quote-process/step-contract.png" },
  ] as const;

  /**
   * 데스크톱은 「단계-화살표-단계…」 7열 격자.
   * 방향서 패널은 ②단계 li 안에 있어 모바일에서는 ②와 ③ 사이에 자연히 끼고,
   * 데스크톱에서는 아래 행에 배치해 흐름 한 줄을 지킵니다.
   */
  const stepCol = [
    "md:col-start-1",
    "md:col-start-3",
    "md:col-start-5",
    "md:col-start-7",
  ];
  const arrowCol = ["md:col-start-2", "md:col-start-4", "md:col-start-6"];

  return (
    <section
      aria-label={t("processTitle")}
      className="rounded-card border border-ink-200 bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8"
    >
      <p className="text-label font-bold text-brand-700">{t("processTitle")}</p>

      <ol className="mt-6 flex flex-col items-stretch gap-4 md:grid md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-start md:gap-x-3 md:gap-y-0">
        {steps.map(({ key, src, ...rest }, index) => (
          <li key={key} className="contents">
            <div
              className={`flex flex-1 items-center gap-4 md:row-start-1 md:flex-col md:gap-3 md:text-center ${stepCol[index]}`}
            >
              {/* 아이콘마다 타일 배경 밝기가 달라, 같은 톤의 판 위에 올려 무게를 맞춥니다 */}
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-brand-50 ring-1 ring-brand-100 sm:size-20">
                <Image
                  src={src}
                  alt=""
                  width={160}
                  height={160}
                  className="size-14 rounded-xl sm:size-16"
                />
              </span>
              <span className="flex flex-col gap-0.5 md:items-center">
                <span className="text-sm font-bold text-ink-900">{t(key)}</span>
                {"note" in rest && rest.note && (
                  <span className="text-xs font-semibold text-accent-500">
                    {rest.note}
                  </span>
                )}
              </span>
            </div>

            {index < steps.length - 1 && (
              <ArrowRight
                className={`hidden size-5 shrink-0 text-ink-300 md:row-start-1 md:mt-7 md:block ${arrowCol[index]}`}
                aria-hidden
              />
            )}

            {/* ─── ②검토·상담에서 갈라져 나오는 결과물 ─── */}
            {key === "step2" && (
              <>
                <span
                  aria-hidden
                  className="flex flex-col items-center md:col-start-4 md:row-start-2 md:pt-2"
                >
                  <span className="h-6 w-0 border-l-2 border-dashed border-brand-300 md:h-8" />
                  <ChevronDown className="-mt-1.5 size-4 text-brand-400" />
                </span>

                <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5 sm:p-6 md:col-span-7 md:col-start-1 md:row-start-3">
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
                    <ClipboardList className="size-3.5 shrink-0" aria-hidden />
                    {t("briefBadge")}
                  </p>
                  <p className="mt-3 text-lg font-bold text-ink-900 sm:text-xl">
                    {t("briefTitle")}
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-700">
                    {t("briefDescription")}
                  </p>

                  <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {brief.map((item) => (
                      <li
                        key={item.title}
                        className="rounded-xl border border-ink-200 bg-white p-4"
                      >
                        <p className="text-[0.9375rem] font-bold text-ink-900">
                          {item.title}
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
                          {item.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>

      <p className="mt-6 border-t border-ink-100 pt-5 text-sm leading-relaxed text-ink-600">
        {t("guide")}
      </p>
    </section>
  );
}
