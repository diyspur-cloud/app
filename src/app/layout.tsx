import type { Metadata, Viewport } from 'next';
import '@/styles/global.css';
import { SiteHeader, SiteFooter } from '@/components/site-shell';
import { JsonLd } from '@/components/json-ld';
import { PostHogProvider } from '@/components/analytics/posthog-provider';
import { AnalyticsConsentBanner } from '@/components/analytics/analytics-consent-banner';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://diyspur.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'DIYSPUR — Clube de leitura',
    template: '%s · DIYSPUR',
  },
  description: 'Leia junto. Descubra novas histórias. Converse com quem sente os livros como você.',
  applicationName: 'DIYSPUR',
  openGraph: {
    type: 'website',
    siteName: 'DIYSPUR',
    title: 'DIYSPUR — Clube de leitura',
    description: 'Um lugar para viver histórias em comunidade.',
    url: siteUrl,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DIYSPUR — Clube de leitura',
      },
    ],
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DIYSPUR — Clube de leitura',
    description: 'Leia junto. Descubra novas histórias.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0d12' },
  ],
  width: 'device-width',
  initialScale: 1,
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'DIYSPUR',
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description: 'Clube de leitura em português do Brasil.',
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'DIYSPUR',
  url: siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/livros?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
      </head>
      <body>
        <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
        <PostHogProvider>
          <SiteHeader />
          <main id="conteudo" tabIndex={-1}>{children}</main>
          <SiteFooter />
          <AnalyticsConsentBanner />
        </PostHogProvider>
      </body>
    </html>
  );
}
