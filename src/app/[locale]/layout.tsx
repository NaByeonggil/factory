import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Noto_Sans_KR } from "next/font/google";
import { bcp47, routing, type AppLocale } from "@/i18n/routing";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { MobileCta } from "@/components/site/mobile-cta";
import { PopupNotice } from "@/components/site/popup-notice";
import { AttributionCapture } from "@/components/tracking/attribution-capture";
import { Analytics } from "@/components/tracking/analytics";
import { getCompanyInfo } from "@/lib/settings";
import { getActivePopups } from "@/lib/queries";
import "../globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: LayoutProps<"/[locale]">,
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("defaultTitle"),
      template: `%s | ${t("siteName")}`,
    },
    description: t("defaultDescription"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [bcp47[l], `/${l}`])),
        "x-default": `/${routing.defaultLocale}`,
      },
    },
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      title: t("defaultTitle"),
      description: t("defaultDescription"),
      url: `/${locale}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout(props: LayoutProps<"/[locale]">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // locale·messages를 명시적으로 전달합니다.
  // setRequestLocale에 의존하면 Turbopack이 next-intl 내부 모듈을 중복
  // 번들링할 때 React cache 스코프가 갈라져 기본 로케일로 폴백합니다.
  const [messages, company, popups] = await Promise.all([
    getMessages({ locale }),
    getCompanyInfo(),
    getActivePopups(locale),
  ]);

  return (
    <html
      lang={bcp47[locale as AppLocale]}
      className={`${notoSansKr.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col" data-has-mobile-cta="true">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Suspense fallback={null}>
            <AttributionCapture />
          </Suspense>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
          >
            본문 바로가기
          </a>
          <Header />
          <main id="main" className="flex-1">
            {props.children}
          </main>
          <Footer locale={locale} company={company} />
          <MobileCta tel={company.tel} />
          <PopupNotice popups={popups} />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
