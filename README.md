# DIYSPUR · Clube de leitura

Frontend Next.js App Router + TypeScript para leitura guiada e comunidade, integrado ao projeto Supabase DIYSPUR.

## Desenvolvimento local

1. `cp .env.example .env.local` e configure URL, chave **publishable** e URL pública do app.
2. `npm ci`
3. `npm run dev`
4. `npm run typecheck && npm test && npm run build`

Nunca coloque uma chave `service_role`/secret no navegador nem no repositório. O frontend usa somente a chave publishable; políticas RLS do backend são a autoridade para acesso a linhas. Configure Site URL e Redirect URLs em Supabase Auth antes de habilitar links mágicos.

## Estrutura

- `src/app`: rotas e layouts App Router (páginas de conteúdo são Server Components).
- `src/lib/supabase`: cliente server/browser, atualização e validação de sessão.
- `src/features`: consultas de domínio restritas ao schema verificado do repositório `diyspur-cloud/db`.
- `src/styles/tokens`: tokens primitivos → semânticos → componentes; CSS Modules/CSS global, sem framework de UI.

## Estado de integração

O app consulta o catálogo e agenda existentes; nenhum DDL foi aplicado pelo frontend. O projeto consultado contém RLS ativado nas tabelas centrais. A conta de catálogo atualmente não expõe livros publicados/encontros, por isso estados vazios explicativos são parte da experiência. OAuth Google/GitHub depende de credenciais e Redirect URLs configurados pelo administrador no Supabase e não é ativado por código do cliente.

## Segurança e validação

- `getClaims()` para validar identidade em rotas privadas; nunca confiar em session claims de metadados editáveis pelo usuário.
- Server actions revalidam identidade, validam entrada com Zod e delegam autoridade às políticas/RPCs Supabase.
- Testes automatizados usam stubs isolados; verificações live deste projeto são somente leitura. Não execute testes mutáveis contra produção.
- `.env.local` é ignorado pelo Git.
