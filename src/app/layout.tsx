import type { Metadata, Viewport } from 'next';
import '@/styles/global.css';
import { SiteHeader, SiteFooter } from '@/components/site-shell';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'DIYSPUR — Clube de leitura', template: '%s · DIYSPUR' },
  description: 'Leia junto. Descubra novas histórias. Converse com quem sente os livros como você.',
  applicationName: 'DIYSPUR',
  openGraph: { type: 'website', siteName: 'DIYSPUR', title: 'DIYSPUR — Clube de leitura', description: 'Um lugar para viver histórias em comunidade.' },
  twitter: { card: 'summary_large_image', title: 'DIYSPUR — Clube de leitura', description: 'Leia junto. Descubra novas histórias.' },
};
export const viewport: Viewport = { themeColor: '#0a0f0d', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" data-theme="dark"><body><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><SiteHeader/><main id="conteudo" tabIndex={-1}>{children}</main><SiteFooter/></body></html>;
}
