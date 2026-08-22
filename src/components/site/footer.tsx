import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/section";

export type CompanyInfo = {
  name: string;
  ceo: string;
  bizNo: string;
  address: string;
  tel: string;
  fax?: string;
};

export async function Footer({
  locale,
  company,
}: {
  locale: string;
  company: CompanyInfo;
}) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const year = 2026;

  return (
    <footer className="mt-auto bg-ink-900 text-ink-300">
      <Container className="py-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-md space-y-3">
            <p className="text-title font-extrabold text-white">{company.name}</p>
            <dl className="space-y-1 text-sm text-ink-400">
              <div className="flex gap-2">
                <dt className="shrink-0 text-ink-500">{t("ceo")}</dt>
                <dd>{company.ceo}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 text-ink-500">{t("bizNo")}</dt>
                <dd>{company.bizNo}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 text-ink-500">{t("address")}</dt>
                <dd>{company.address}</dd>
              </div>
              <div className="flex gap-4">
                <span className="flex gap-2">
                  <dt className="text-ink-500">{t("tel")}</dt>
                  <dd>
                    <a href={`tel:${company.tel.replace(/[^0-9+]/g, "")}`}>
                      {company.tel}
                    </a>
                  </dd>
                </span>
                {company.fax && (
                  <span className="flex gap-2">
                    <dt className="text-ink-500">{t("fax")}</dt>
                    <dd>{company.fax}</dd>
                  </span>
                )}
              </div>
            </dl>
          </div>

          <nav
            aria-label="푸터 메뉴"
            className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-3"
          >
            {[
              ["about", "/about"],
              ["service", "/service/oem-odm"],
              ["cdmo", "/service/cdmo"],
              ["dtc", "/service/dtc"],
              ["pet", "/service/pet"],
              ["ingredients", "/ingredients"],
              ["portfolio", "/portfolio"],
              ["news", "/community/news"],
              ["inquiry", "/inquiry"],
            ].map(([key, href]) => (
              <Link
                key={key}
                href={href}
                className="text-ink-300 hover:text-white"
              >
                {tNav(key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Copyright © {year} {company.name}. {t("rights")}
          </p>
          <div className="flex gap-4">
            <Link href="/legal/terms" className="hover:text-white">
              {t("terms")}
            </Link>
            <Link href="/legal/privacy" className="font-semibold text-ink-300 hover:text-white">
              {t("privacy")}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
