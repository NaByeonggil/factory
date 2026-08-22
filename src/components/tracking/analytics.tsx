import Script from "next/script";

/** GA4 — 광고 전환 측정. 미설정 시 아무것도 렌더링하지 않습니다. */
export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());gtag('config','${gaId}');`}
      </Script>
    </>
  );
}

/**
 * 전환 완료 페이지에서만 발화하는 태그.
 * 네이버 프리미엄 로그분석 전환 스크립트를 여기에 넣습니다.
 */
export function ConversionTags() {
  const naverId = process.env.NEXT_PUBLIC_NAVER_CONVERSION_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      {gaId && (
        <Script id="ga4-conversion" strategy="afterInteractive">
          {`window.gtag&&gtag('event','generate_lead',{currency:'KRW',value:1});`}
        </Script>
      )}
      {naverId && (
        <>
          <Script
            src="//wcs.naver.net/wcslog.js"
            strategy="afterInteractive"
          />
          <Script id="naver-conversion" strategy="afterInteractive">
            {`if(window.wcs){wcs_add=window.wcs_add||{};wcs_add['wa']='${naverId}';
window.wcs.inflow();wcs.cnv(wcs.cnvType||'2','1');}`}
          </Script>
        </>
      )}
    </>
  );
}
