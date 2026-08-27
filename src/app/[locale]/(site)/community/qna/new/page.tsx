import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container, Section, SectionHeading } from "@/components/ui/section";
import { QuestionForm } from "@/components/qna/question-form";

export async function generateMetadata(
  props: PageProps<"/[locale]/community/qna/new">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "qna" });
  return {
    title: t("formTitle"),
    // 작성 폼은 색인 대상이 아님
    robots: { index: false, follow: true },
  };
}

export default async function NewQuestionPage(
  props: PageProps<"/[locale]/community/qna/new">,
) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "qna" });

  return (
    <Section>
      <Container className="max-w-3xl">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("formTitle")}
          description={t("formDescription")}
        />
        <div className="mt-10">
          <QuestionForm />
        </div>
        <div className="mt-8">
          <Link
            href="/community/qna"
            className="text-sm font-semibold text-ink-600 hover:text-brand-700"
          >
            ← {t("backToList")}
          </Link>
        </div>
      </Container>
    </Section>
  );
}
