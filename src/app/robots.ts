import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://diyspur.vercel.app';
  return { rules: { userAgent: '*', allow: '/', disallow: ['/perfil', '/ranking', '/desafios', '/notificacoes', '/historico', '/admin', '/entrar', '/cadastro', '/recuperar-senha', '/atualizar-senha', '/auth/'] }, sitemap: new URL('/sitemap.xml', base).toString() };
}
