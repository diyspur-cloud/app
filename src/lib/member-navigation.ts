export const memberLinks = [
  { href: '/perfil', label: 'Visão geral' },
  { href: '/historico', label: 'Histórico de leitura' },
  { href: '/diario', label: 'Diário de leitura' },
  { href: '/metas', label: 'Metas do ano' },
  { href: '/minha-fila', label: 'Minha fila' },
  { href: '/listas', label: 'Minhas listas' },
  { href: '/leituras-compartilhadas', label: 'Leituras compartilhadas' },
  { href: '/desafios', label: 'Desafios' },
  { href: '/ranking', label: 'Ranking' },
  { href: '/notificacoes', label: 'Notificações' },
] as const;

export type MemberLink = (typeof memberLinks)[number];

