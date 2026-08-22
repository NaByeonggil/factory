import { getTranslations } from "next-intl/server";
import { Container, Section } from "@/components/ui/section";

type LegalSection = { title: string; body: string };

/** 약관·개인정보처리방침 공용 렌더러 */
export async function LegalPage({
  locale,
  doc,
}: {
  locale: string;
  doc: "terms" | "privacy";
}) {
  const t = await getTranslations({ locale, namespace: "legal" });
  const sections = t.raw(`${doc}.sections`) as LegalSection[];

  return (
    <Section>
      <Container className="max-w-3xl">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          {t(`${doc}.title`)}
        </h1>
        <p className="mt-3 text-sm text-ink-500">
          {t("updatedLabel")} · {t("updatedAt")}
        </p>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-base font-bold text-ink-900">{section.title}</h2>
              <p className="mt-3 whitespace-pre-line text-[0.9375rem] leading-loose text-ink-700">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </Container>
    </Section>
  );
}
