import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight, FileCheck2 } from "lucide-react";

/**
 * 견적문의 접수 프로세스 스테퍼.
 * 접수 후 무엇이 언제까지 진행되는지 먼저 보여줘 이탈을 줄이는 자리입니다.
 */
export async function QuoteProcess({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "quote" });

  /**
   * 아이콘은 공급받은 3D 타일 이미지 (public/quote-process/).
   * 「견적서 발송」에 맞는 타일이 아직 없어 선 아이콘으로 대신합니다.
   * 같은 톤의 이미지가 준비되면 src 를 넣어 교체하세요.
   * (step-3.png 는 「영업담당자 배정」 단계가 사라져 지금은 쓰지 않습니다)
   */
  const steps = [
    { key: "step1", src: "/quote-process/step-1.png" },
    { key: "step2", src: "/quote-process/step-2.png" },
    { key: "step3", src: "/quote-process/step-4.png", note: t("stepNote") },
    { key: "step4", src: null },
  ] as const;

  return (
    <section
      aria-label={t("processTitle")}
      className="rounded-card border border-ink-200 bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8"
    >
      <p className="text-label font-bold text-brand-700">{t("processTitle")}</p>

      <ol className="mt-6 flex flex-col items-stretch gap-4 md:flex-row md:items-center">
        {steps.map(({ key, src, ...rest }, index) => (
          <li key={key} className="contents">
            <div className="flex flex-1 items-center gap-4 md:flex-col md:gap-3 md:text-center">
              {/* 아이콘마다 타일 배경 밝기가 달라, 같은 톤의 판 위에 올려 무게를 맞춥니다 */}
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-brand-50 ring-1 ring-brand-100 sm:size-20">
                {src ? (
                  <Image
                    src={src}
                    alt=""
                    width={160}
                    height={160}
                    className="size-14 rounded-xl sm:size-16"
                  />
                ) : (
                  <FileCheck2
                    className="size-9 text-brand-700 sm:size-10"
                    aria-hidden
                  />
                )}
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
                className="hidden size-5 shrink-0 text-ink-300 md:block"
                aria-hidden
              />
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
