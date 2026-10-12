import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://diyspur.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/auth/',
        '/perfil',
        '/notificacoes',
        '/ranking',
        '/minha-fila',
        '/metas',
        '/diario',
        '/historico',
        '/listas',
        '/leituras-compartilhadas',
        '/clubes/novo',
        '/atualizar-senha',
        '/recuperar-senha',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
