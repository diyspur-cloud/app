# CLAUDE.md — DIYSPUR frontend

Guia de implementação de produto, UI e código. Antes de propor alteração, confira os contratos no código atual; em caso de divergência, o comportamento implementado e os tipos/schema versionados prevalecem sobre esta explicação.

## Identidade de marca e estilo visual

DIYSPUR é um clube de leitura com estética **editorial, acolhedora, escura e contemplativa**. Priorize legibilidade, ritmo de leitura, conteúdo real do backend e espaço em branco. Não transforme a experiência numa dashboard genérica ou num tema claro sem solicitação.

### Paleta mapeada no código

Valores definidos em `src/styles/tokens.css`:

| Papel | Variável | Hex/valor |
|---|---|---|
| Fundo mais escuro | `--p-forest-950` / `--color-bg` | `#0a0f0d` |
| Superfície de card/nav | `--p-forest-900` / `--color-surface` | `#101815` |
| Superfície elevada | `--p-forest-850` / `--color-elevated` | `#16201b` |
| Camada overlay | `--p-forest-800` / `--color-overlay` | `#1c2a24` |
| Primária sálvia | `--p-sage` / `--color-primary` | `#7fe0a0` |
| Hover primário | `--p-sage-200` / `--color-primary-hover` | `#9cebb6` |
| Acento secundário | `--p-teal` | `#6ec9d9` |
| Acento terciário | `--p-violet` | `#a78bfa` |
| Texto primário | `--p-paper` / `--color-fg` | `#f1f5f0` |
| Texto muted | `--p-mist` / `--color-muted` | `#b7c3ba` |
| Texto sutil | `--color-subtle` | `#94a198` |
| Texto do botão primário | `--color-on-primary` | `#07110c` |
| Erro | `--color-danger` | `#ff9b91` |
| Sucesso | `--color-success` | `#6ee7a7` |
| Borda | `--p-border` / `--color-border` | `rgb(255 255 255 / 9%)` |
| Borda forte | `--p-border-strong` / `--color-border-strong` | `rgb(255 255 255 / 16%)` |

Use a ordem de tokens **primitivo → semântico → componente**. Prefira `--color-*`, `--button-*`, `--card-*` e `--input-*` nos consumidores em vez de repetir hex. Cores novas precisam justificar seu papel, ser adicionadas à camada primitiva e receber mapeamento semântico.

### Tipografia e escala

- Sans/interface: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Serif editorial: `"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif`.
- Escala: `.75rem`, `.875rem`, `1rem`, `1.125rem`, `1.25rem`, `1.5rem`, `1.875rem`, `clamp(2.2rem, 5.5vw, 4.5rem)` (`--text-xs` a `--text-4xl`).
- Espaços: base `.25rem`; `--space-1..6` `.25/.5/.75/1/1.25/1.5rem`; `--space-8/10/12/16` `2/2.5/3/4rem`.
- Raios: `8/12/18/26px` e pill `999px`; container máximo `1180px`.
- Movimento: transições `160ms` e `220ms`; sempre respeitar `prefers-reduced-motion`.

### Componentes e comportamento de UI

Reaproveite o vocabulário CSS semântico em `src/styles/global.css`: `.button`, `.button-small`, `.button-dark`, `.button-quiet`, `.book-card`, `.featured-book`, `.empty-state`, `.field`, `.auth-card`, `.meeting-row`, `.member-card`. Componentes React reutilizáveis ficam em `src/components/`.

A home usa uma composição de capa geométrica feita em CSS e uma apresentação em destaque para um único livro. As capas do banco entram no componente `BookCard`. Evite recursos visuais que reduzam contraste, links sem foco, animação sem alternativa ou textos de exemplo apresentados como dado publicado.

Breakpoints existentes: `900px` e `650px`; teste mudanças em **375, 768, 1024 e 1440px**. Mantenha HTML semântico, `<html lang="pt-BR">`, labels, alt text, `aria-label` quando necessário, skip link, foco de teclado e hit targets móveis. Não use HTML `<table>` para layout; para documentos Markdown use tabelas GFM apenas quando forem dados tabulares.

## Padrões de código e boas práticas

### Nomeação e imports

- Componentes React, tipos, interfaces, enums: `PascalCase`.
- Variáveis, funções, handlers: `camelCase`.
- Arquivos de componentes/helpers/features: `kebab-case`; manter convenções App Router para `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`.
- Rotas/classes CSS: `kebab-case`; colunas seguem naming do schema backend.
- Use `@/*` para módulos de `src/*`; agrupe dependências externas antes das internas e use `import type` para tipos.

### TypeScript e React

- `tsconfig.json` tem `strict: true`, `noEmit: true`, alias `@/*`, `moduleResolution: bundler` e runtime `react-jsx`.
- **Não use `any`, `@ts-ignore`, cast duplo para apagar erro ou desative regra sem justificativa e permissão.** Valide entradas incertas com Zod e modele a resposta explicitamente.
- Prefira Server Components e dados de servidor; transforme em Client Component apenas quando interação/browser for necessária.
- Não introduza estado client-side para dados que já possam ser obtidos com Server Component.
- Mantenha `src/features/catalog/queries.ts` como ponto comum para reads de domínio; evite SQL/PostgREST duplicado por rota.
- `src/types/database.ts` é schema/tipagem sincronizada do repositório `diyspur-cloud/db`; sincronize a fonte geradora em vez de editar o snapshot à mão.
- Não suponha que campo existe porque parece útil: confira `Database` e migrations/contracts em `db`.

### Segurança de dados

- Segredos server-only nunca usam `NEXT_PUBLIC_`. Frontend usa só URL Supabase e publishable key pública.
- Para SSR, use `src/lib/supabase/clients.ts`; para browser, `src/lib/supabase/browser.ts`. Não misture imports desses módulos.
- Autorize com `auth.getClaims()` validado e derive usuário de `claims.sub`; nunca confie em `user_metadata`, role do client ou `user_id` recebido do form.
- RLS do backend é parte do modelo de autorização, não uma alternativa ao guard de rota. Escritas novas precisam validar sessão, schema/input e policies/RPC no backend.
- Valide URL de retorno, mantenha links externos `https` e `noopener noreferrer`, sanitize valores exportados e limite consultas.
- Não faça mutações, DDL ou signup real em produção para “testar”. Use staging e fixtures/usuários de teste.

### Pastas e commits

- `src/app/`: rotas, layouts, metadados, API Route Handlers e telas de erro/loading.
- `src/components/`: componentes UI reutilizáveis.
- `src/features/<domain>/`: queries e lógica de domínio.
- `src/lib/`: clientes, funções utilitárias e segurança.
- `src/styles/`: tokens CSS e estilos globais.
- `src/types/`: tipos do schema backend.
- `tests/unit/`, `tests/e2e/`: Vitest e Playwright.

Siga commits **Conventional Commits** observados no histórico: `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`, `test: ...`. Mensagem curta, descreve a intenção, sem combinar refactor alheio ao pedido.

## Comandos principais

```bash
npm ci
npm run dev
npm run build
npm start
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run audit
npm audit
```

`npm test` executa `tests/unit/**/*.test.ts`. `npm run test:e2e` executa Playwright; instala Chromium com `npx playwright install chromium` se necessário. `npm run audit` audita somente dependências de produção; `npm audit` audita todas.

Antes de encerrar mudança, rode ao menos `npm run lint`, `npm run typecheck` e os testes afetados. Alterações em SSR, roteamento ou CSS global também exigem `npm run build`; alterações visuais exigem E2E/inspeção nos breakpoints pertinentes.

## Auth callbacks e produção

Mantenha Site URL/Redirect URLs do Supabase sincronizados com o host atual. Google/GitHub dependem de credenciais externas e configuração administrativa — não habilitar nem simular apenas adicionando um botão.

`NEXT_PUBLIC_SITE_URL` alimenta metadata, sitemap e robots (robots é prerenderizado). No deploy, defina-o **antes do build** para a URL canônica do ambiente; faça rebuild quando o domínio muda. Configure as três variáveis do `.env.example` no ambiente de deploy, sem commitar `.env.local`.
