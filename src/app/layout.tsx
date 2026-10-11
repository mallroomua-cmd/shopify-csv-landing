import type { Metadata, Viewport } from 'next';
import { Cormorant, Montserrat } from 'next/font/google';
import { CartProvider } from '@/components/cart-provider';
import { ConsentBanner } from '@/components/client-bits';
import { Footer, Header } from '@/components/site-chrome';
import { site } from '@/lib/config';
import { ldJson, organizationJsonLd } from '@/lib/seo';
import './globals.css';

const display = Cormorant({ subsets: ['latin', 'cyrillic'], weight: ['500', '600'], variable: '--font-cormorant', display: 'swap' });
const sans = Montserrat({ subsets: ['latin', 'cyrillic'], weight: ['400', '500', '600'], variable: '--font-montserrat', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s — ${site.name}` },
  description: site.description,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: site.locale, siteName: site.name },
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } : undefined,
};

export const viewport: Viewport = { themeColor: '#fafaf9', width: 'device-width', initialScale: 1 };

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

// Consent Mode v2: по умолчанию всё denied до выбора пользователя.
const consentDefaults = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});
gtag('set','url_passthrough',true);gtag('set','ads_data_redaction',true);`;

const gtmLoader = (id: string) =>
  `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${display.variable} ${sans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: consentDefaults }} />
        {GTM_ID && /^GTM-[A-Z0-9]+$/.test(GTM_ID) && <script dangerouslySetInnerHTML={{ __html: gtmLoader(GTM_ID) }} />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(organizationJsonLd()) }} />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-paper focus:p-2">
          Перейти до вмісту
        </a>
        <CartProvider>
          <Header />
          <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4">{children}</main>
          <Footer />
          <ConsentBanner />
        </CartProvider>
      </body>
    </html>
  );
}
