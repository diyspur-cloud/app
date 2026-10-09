# DIYSPUR — Clube de leitura

Aplicação web do clube DIYSPUR: catálogo de livros, temporadas e capítulos, agenda de encontros e espaços de comunidade. O frontend usa **Next.js App Router**, **React**, **TypeScript** e **Supabase**. A interface está em pt-BR e segue um tema editorial escuro com verde-sálvia, superfícies de floresta, tipografia sistêmica e geometria CSS.

> Este repositório contém o frontend. O schema, as políticas e as funções backend são mantidos separadamente em [`diyspur-cloud/db`](https://github.com/diyspur-cloud/db). O frontend não cria nem migra schema.

## Índice

- [Estado e escopo](#estado-e-escopo)
- [Stack](#stack)
- [Arquitetura e organização](#arquitetura-e-organização)
- [Rotas e experiência](#rotas-e-experiência)
- [Integração Supabase e modelo de dados](#integração-supabase-e-modelo-de-dados)
- [Autenticação e sessão](#autenticação-e-sessão)
- [Design system](#design-system)
- [Configuração local](#configuração-local)
- [Segurança e privacidade](#segurança-e-privacidade)
- [Qualidade, comandos e testes](#qualidade-comandos-e-testes)
- [Build e deploy](#build-e-deploy)
- [Limites conhecidos e próximos passos](#limites-conhecidos-e-próximos-passos)

## Estado e escopo

A aplicação está implementada como um **frontend funcional e integrado em modo de leitura**. Páginas públicas consultam tabelas e uma view do Supabase; o catálogo usa os registros presentes, sem criar conteúdo fictício, e mostra estados vazios claros quando não há dados. Login/cadastro por email, link mágico, callback, logout e proteção de rotas estão implementados no cliente e no servidor.

As gravações na base não foram exercitadas contra produção. Recursos que exigem ações autenticadas (por exemplo, comentar, registrar progresso, responder quizzes ou administrar conteúdo) não devem ser considerados completos enquanto não houver implementação validada em ambiente de staging e/ou contas de teste dedicadas.

**Leitura integrada observada em 2026-10-09:** consultas anônimas de leitura responderam para `books`, `authors`, `chapters` e `v_comments_visible`; o snapshot retornou 1 livro, 1 autor, 5 capítulos e 0 comentários visíveis. Auth por email estava habilitado e provedores Google/GitHub estavam desabilitados. São observações daquele momento, não pressupostos fixos de interface.

## Stack

| Área | Tecnologia | Versão pinada |
|---|---|---:|
| Framework e roteamento | Next.js App Router | 16.4.0 |
| UI | React / React DOM | 19.3.0 |
| Linguagem e verificação | TypeScript (`strict`) | 5.9.3 |
| Supabase server/browser | `@supabase/ssr` | 0.12.7 |
| Supabase client | `@supabase/supabase-js` | 2.117.3 |
| Validação de formulários | Zod | 4.1.12 |
| Lint | ESLint + `typescript-eslint` flat config | 9.39.1 / 8.71.1 |
| Unit tests | Vitest | 4.1.11 |
| Navegador E2E | Playwright | 1.56.1 |
| Estilos | CSS global + custom properties; sem Tailwind/UI kit | — |

As versões declaradas são fixas no `package.json`; `package-lock.json` deve ser atualizado junto a mudanças intencionais de dependências. Não há Prettier, Biome, Tailwind, shadcn/ui ou Material UI configurados.

## Arquitetura e organização

```text
.
├── src/
│   ├── app/                     # rotas, layouts, metadata e Route Handlers
│   │   ├── api/ics/[meetingId]/ # exportação de encontro como calendário .ics
│   │   ├── auth/                 # troca de code e logout
│   │   └── ...                  # páginas públicas/privadas
│   ├── components/              # UI reutilizável e componentes client pontuais
│   ├── features/catalog/         # consultas e tipos de domínio do catálogo
│   ├── lib/                      # clientes Supabase e helpers puros
│   ├── styles/                   # tokens.css e global.css
│   └── types/database.ts         # tipos gerados/sincronizados com backend db
├── proxy.ts                     # integração do proxy Next 16 com auth SSR
├── tests/unit/                  # Vitest
├── tests/e2e/                   # Playwright
├── eslint.config.mjs
├── next.config.mjs
├── playwright.config.ts
├── tsconfig.json
└── vitest.config.ts
```

### Fronteira Server/Client Components

- Por padrão, módulos em `src/app/**` são **Server Components**. Busque dados públicos no servidor e envie para a UI apenas os campos que a página usa.
- Use `'use client'` somente quando a interação exigir estado, eventos de browser ou API client-side. No momento, formulário de auth e fachada do player são exemplos.
- `src/lib/supabase/clients.ts` importa `server-only`, lê cookies por request e cria o client SSR. Não importe esse módulo de componentes Client.
- `src/lib/supabase/browser.ts` é o factory exclusivo do browser. Não o use para verificar autorização de servidor.
- O alias `@/*` aponta para `src/*`. Rotas dinâmicas seguem as APIs assíncronas do App Router/Next 16 (`params` e `searchParams` como `Promise`).
- `src/features/catalog/queries.ts` centraliza as consultas Supabase e os tipos de domínio (`Book`, `Season`, `Chapter`, `Meeting`); páginas não devem duplicar essas queries.

### Convenção de nomes

- Componentes e tipos React: `PascalCase` (`BookCard`, `Book`).
- Variáveis, funções e hooks: `camelCase` (`getBook`, `createServerSupabase`).
- Arquivos de componentes, utilities e features: `kebab-case`; nomes convencionais do App Router ficam `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`.
- Rotas e classes CSS: segmentos e classes semânticos `kebab-case` (`/calendario`, `.book-card`).
- Nomes de colunas/objetos de banco respeitam o schema existente; o backend pode usar `snake_case`.

## Rotas e experiência

| Rota | Acesso | Responsabilidade |
|---|---|---|
| `/` | Público | Home editorial; destaques de livros e próximos encontros carregados do backend; empty state real quando necessário. |
| `/livros` | Público | Catálogo; filtro por título via query `q`; até 36 livros por consulta. |
| `/livros/[slug]` | Público | Detalhe de livro, autor, metadados e temporadas. |
| `/temporadas/[slug]` | Público | Uma temporada e a timeline ordenada de capítulos. |
| `/capitulos/[id]` | Público | Detalhe/resumo do capítulo, vídeo sob demanda e comentários visíveis em modo leitura. |
| `/calendario` | Público | Encontros futuros e links para exportação ICS. |
| `/comunidade` | Público | Feed de comentários visíveis; não publica comentários. |
| `/entrar`, `/cadastro` | Público | Email/senha e link mágico; telas marcadas `noindex`. |
| `/auth/callback` | Callback público | Troca `code` do Supabase por sessão e retorno somente para caminho local. |
| `/perfil` | Privado | Leitura do perfil associado ao `sub` validado na sessão. |
| `/historico`, `/desafios`, `/ranking`, `/notificacoes` | Privado | Estruturas-base do espaço do membro; não possuem ainda todo o comportamento de produto. |
| `/admin` | Privado e restrito | Faz verificação de role `admin` consultando o perfil no servidor; CRUD editorial não está implementado. |
| `/api/ics/[meetingId]` | Leitura pública | Busca evento existente e devolve `text/calendar` com dados escapados. |
| `/privacidade`, `/termos` | Público | Informações do produto. |
| `/robots.txt`, `/sitemap.xml`, `/icon.svg` | Público | SEO técnico, URL base `NEXT_PUBLIC_SITE_URL` e favicon. |

Rotas privadas também são protegidas nas páginas de destino; middleware/proxy sozinho não é a única fronteira de autorização. A rota genérica `src/app/[memberPage]` atualmente restringe as quatro páginas de membro nomeadas acima e retorna 404 para outras.

## Integração Supabase e modelo de dados

A fonte de verdade é o projeto Supabase DIYSPUR definido por `NEXT_PUBLIC_SUPABASE_URL`. O schema tipado em `src/types/database.ts` acompanha as definições do repositório `db`; ao mudar backend/schema, regenere/sincronize os tipos a partir do repositório backend — não edite o snapshot gerado manualmente.

### Consultas atualmente implementadas

| Função | Fonte e comportamento |
|---|---|
| `getBooks(search?)` | `books`, ordena por `created_at DESC`, limita 36, filtra opcionalmente `title ILIKE`, busca nomes em `authors` e associa no servidor. |
| `getBook(slug)` | Lê um `books` por `slug`, seu `authors.name` e `seasons` por `book_id`. Retorna `null` quando não encontra. |
| `getSeason(slug)` | Busca `seasons`; em paralelo consulta livro relacionado e `chapters`, ordenados por número. |
| `getMeetings()` | Consulta `meetings` com `scheduled_at >= now`, ordem crescente e limite 20. |
| `getChapters(id)` | Busca capítulo, temporada/livro relacionados e até 50 entradas de `v_comments_visible` para aquele capítulo. |
| `/comunidade` | Lê até 24 registros da view `v_comments_visible`, em ordem decrescente. |
| `/perfil` e `/admin` | Consultam apenas a linha `profiles` do ID `sub` obtido de claims assinadas. |

Páginas tratam resultados ausentes com empty states ou 404; elas não devem fabricar livros/encontros. Erros em algumas queries são logados no servidor só com código e convertidos em `[]`/`null`; isso é uma decisão de fallback, não um sinal de que backend respondeu sem dados.

### Modelo de acesso e RLS

1. Frontend usa exclusivamente `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, apropriada para client pública; ela **não é** a chave `service_role`/secret.
2. Requests passam pela sessão SSR/cookies e pelas policies de **Row Level Security (RLS)** do backend. Mover uma chamada para Server Component não dá privilégio extra ao usuário.
3. Toda leitura deve selecionar só colunas necessárias, filtrar por chave/tenant/usuário quando aplicável e aplicar limite/paginação. Queries deste app têm limites explícitos para listas.
4. Antes de implementar escrita, leia no repositório `db` a tabela, os constraints/índices, as policies, as RPCs/Edge Functions e os contratos. Valide a identidade no servidor e deixe RLS impor o escopo. Nunca aceite `user_id`/role do formulário como autoridade.
5. Não aplique DDL, escreva fixtures ou teste mutação no banco de produção como parte de um smoke test. Use um projeto Supabase de staging e usuários de teste dedicados.

## Autenticação e sessão

- Cadastro: Zod valida email e senha de pelo menos 10 caracteres; nome e username são validados no browser e enviados apenas como metadados do usuário para `auth.signUp`.
- Login: `auth.signInWithPassword`; interface expõe respostas genéricas para erro e evita divulgar se um endereço existe no fluxo de link mágico.
- Link mágico: `auth.signInWithOtp`, com `emailRedirectTo` para `/auth/callback`.
- Callback: `exchangeCodeForSession`. O destino usa caminho interno local; URLs `https://`, `//` e prefixos com barra invertida são rejeitados por `safeLocalRedirect`/verificação correspondente.
- Proxy SSR: sincroniza cookies request/response e consulta `auth.getClaims()` para validar assinatura da identidade. Ele não autoriza por `user_metadata` editável.
- Logout: POST `/auth/signout` revoga sessão pelo Supabase SSR e redireciona para `/`.
- `/perfil` e `/admin` repetem verificação server-side; o admin consulta `profiles.role` para negar acesso a quem não for admin.

Antes de habilitar o fluxo publicado, configure Supabase Auth **Site URL** e **Redirect URLs** para cada origem/ambiente (local, staging, produção). Google e GitHub requerem OAuth client credentials e configuração do administrador; não assuma que estão habilitados.

## Design system

O sistema está dividido em três camadas no `src/styles/tokens.css`: primitivos (`--p-*`), semânticos (`--color-*`) e componentes (`--button-*`, `--card-*`, `--input-*`). `global.css` consome esses tokens, componentes não devem reintroduzir hex/tamanhos ad hoc sem motivo.

### Paleta atual

| Uso | Token/CSS | Valor |
|---|---|---|
| Background base | `--p-forest-950`, `--color-bg` | `#0a0f0d` |
| Superfície | `--p-forest-900`, `--color-surface` | `#101815` |
| Superfície elevada | `--p-forest-850`, `--color-elevated` | `#16201b` |
| Overlay | `--p-forest-800`, `--color-overlay` | `#1c2a24` |
| Primária/sálvia | `--p-sage`, `--color-primary`, `--button-bg` | `#7fe0a0` |
| Hover primário | `--p-sage-200`, `--color-primary-hover` | `#9cebb6` |
| Acento secundário | `--p-teal` | `#6ec9d9` |
| Acento terciário | `--p-violet` | `#a78bfa` |
| Texto principal | `--p-paper`, `--color-fg` | `#f1f5f0` |
| Texto de apoio | `--p-mist`, `--color-muted` | `#b7c3ba` |
| Texto sutil | `--color-subtle` | `#94a198` |
| Texto em botão primário | `--color-on-primary` | `#07110c` |
| Erro | `--color-danger` | `#ff9b91` |
| Sucesso | `--color-success` | `#6ee7a7` |
| Borda padrão | `--p-border` / `--color-border` | `rgb(255 255 255 / 9%)` |
| Borda reforçada | `--p-border-strong` / `--color-border-strong` | `rgb(255 255 255 / 16%)` |
| Marca em degradê | `--gradient-brand` | sálvia → teal (`56%`) → violeta |

### Tipografia, escala e responsividade

- Texto de interface: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` (fallbacks locais; não depende de download de fonte para build).
- Títulos editoriais: `"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif`.
- Escala tipográfica: `--text-xs` `.75rem`; `--text-sm` `.875rem`; `--text-base` `1rem`; `--text-lg` `1.125rem`; `--text-xl` `1.25rem`; `--text-2xl` `1.5rem`; `--text-3xl` `1.875rem`; `--text-4xl` `clamp(2.2rem, 5.5vw, 4.5rem)`.
- Espaçamento base `.25rem`; tokens `--space-1..6` = `.25, .5, .75, 1, 1.25, 1.5rem`; `--space-8/10/12/16` = `2/2.5/3/4rem`.
- Bordas: `8/12/18/26px`, ou pill `999px`; transições rápidas `160ms`, base `220ms`; container `1180px`.
- Breakpoints documentados pelo CSS: `900px` (grid/tablet) e `650px` (mobile). Grid principal passa de quatro colunas desktop para três em tablet e duas em mobile. As páginas são testadas em `375, 768, 1024, 1440px` sem overflow horizontal.
- Acessibilidade transversal: `<html lang="pt-BR">`, link “Pular para o conteúdo”, foco `:focus-visible`, `prefers-reduced-motion`, landmarks/labels e botões com área mínima adequada.

Os estilos são CSS próprio com classes semânticas como `.site-header`, `.hero`, `.book-grid`, `.book-card`, `.auth-card`, `.chapter-layout`, `.member-card`. Não há catálogo de componentes externo; use componentes do projeto antes de criar outro sistema de UI.

## Configuração local

Requisitos recomendados: Node.js `>=20.9` (Next 16), npm e acesso de rede ao endpoint Supabase de desenvolvimento.

```bash
cp .env.example .env.local
# Edite .env.local. Use apenas uma chave publishable de desenvolvimento.
npm ci
npm run dev
```

Variáveis necessárias:

| Nome | Descrição | Exemplo sem credencial |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave pública publishable do projeto | `sb_publishable_…` |
| `NEXT_PUBLIC_SITE_URL` | Base canônica pública da aplicação | `http://localhost:3000` local |

O prefixo `NEXT_PUBLIC_` significa que os valores são embutidos/visíveis no browser; só URL e chave **publishable** podem usar esse prefixo. Nunca adicione `service_role`, secret API key, tokens OAuth ou senhas a `.env.example`, JS client, logs ou commits. `.env.local` e `.env.*` são ignorados pelo Git; `.env.example` é mantido versionado e sem credencial utilizável.

Após alterar Redirect URLs do Supabase, teste cadastro/login em **staging**. Para o callback local, permita `http://localhost:3000/auth/callback`. O SMTP/serviço de email e as restrições de signup devem ser configurados no painel backend, não no frontend.

## Segurança e privacidade

- Headers globais em `next.config.mjs`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` sem câmera/microfone/geolocalização e `poweredByHeader: false`. CSP/HSTS não estão configurados neste app; só adicioná-los após validar requisitos de script, embeds e hosting.
- Auth SSR usa cookies gerenciados pelo Supabase. Claims são verificados com `getClaims()`; não conceda papel de acesso por metadata editável.
- Redirect pós-login é validado para evitar open redirect.
- Conteúdo e comentários são renderizados por React (escape padrão); view `v_comments_visible` limita leitura à superfície pública backend.
- Iframe YouTube só é inserido após clique e usa `youtube-nocookie.com`; player tem `title` e `referrerPolicy`.
- Link externo de afiliado do livro só é exibido para URL `https://` e usa `rel="sponsored noopener noreferrer"`.
- ICS valida o UUID, busca o evento no backend e escapa barra, newline, vírgula e ponto e vírgula antes de criar o arquivo.
- `admin` não confia no navegador: a role é consultada no perfil pela sessão validada no servidor.
- Logs de query em falha devem evitar payloads pessoais, JWTs, URLs assinadas ou chaves.

## Qualidade, comandos e testes

Scripts reais do `package.json`:

```bash
npm run dev          # Next dev local (porta default 3000)
npm run build        # build otimizado
npm run start        # serve build existente
npm run lint         # ESLint flat config (typescript-eslint recommended)
npm run typecheck    # tsc --noEmit
npm test             # Vitest: somente tests/unit/**/*.test.ts
npm run test:e2e     # Playwright: tests/e2e/**
npm run audit        # npm audit --omit=dev
npm audit            # auditoria de todas as dependências
```

Playwright precisa do browser Chromium instalado uma vez por ambiente: `npx playwright install chromium`. Sem `PLAYWRIGHT_BASE_URL`, Playwright inicia `npm run dev` em `127.0.0.1:3000`; para verificar um ambiente já servido, defina `PLAYWRIGHT_BASE_URL=https://<host>` e não se inicia outro web server.

Cobertura atual inclui redirects locais anti-open-redirect (Vitest), home/navegação, catálogo e detalhe do primeiro livro disponível, rótulos/login/cadastro, robots, proteção de `/perfil`, ausência de overflow em 375–1440px e skip link por teclado. O teste E2E de catálogo lê Supabase real/anônimo e não cadastra usuário nem modifica dados.

`eslint.config.mjs` aplica `typescript-eslint` recomendado e ignora `src/types/database.ts` (arquivo gerado). Não há `format` script nem formatter padronizado ainda.

## Build e deploy

Antes de um build que será hospedado publicamente, defina o URL público **durante o build**. `robots.txt` é estático/prerenderizado; `NEXT_PUBLIC_SITE_URL` em `robots.ts`, `sitemap.ts` e `metadataBase` precisa refletir o host final:

```bash
NEXT_PUBLIC_SITE_URL=https://app.example.com npm ci
NEXT_PUBLIC_SITE_URL=https://app.example.com npm run build
npm run start
```

O ambiente deploy deve fornecer também `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Atualize Site URL e Redirect URLs no Supabase para o mesmo domínio HTTPS. Não assuma que build-local pode ser promovido sem rebuild se URL base mudar: a URL pública é incorporada às rotas/metadados estáticos.

## Limites conhecidos e próximos passos

1. Criar ambiente Supabase staging e contas de teste; validar cadastro, confirmação de email, login, magic link, logout, redirecionamento de sessão e consulta perfil em sessão real.
2. Implementar escrita segura de comentários/progresso/quizzes só após conferir contracts/RLS/RPCs/Edge Functions do repositório backend; adicionar testes isolados e política anti-duplicate.
3. Completar histórico, desafios, ranking, notificações e painel admin em alinhamento com schema e contratos reais.
4. Habilitar OAuth Google/GitHub apenas após configurar secrets de provedor, callback/Redirect URLs e testes em staging.
5. Revisar o conteúdo legal com pessoa responsável antes de usar como política publicada; textos atuais são uma base técnica, não parecer jurídico.
6. Adicionar E2E autenticado isolado e testes adicionais do ICS/erro de backend/teclado, mantendo a regra de não escrever em produção.
7. Planejar CSP e otimização/allowlist de imagens remotas antes de aceitar novas origens arbitrárias.

Para alterações no design, autenticação, banco ou documentação para agentes, leia também [`CLAUDE.md`](./CLAUDE.md) e [`AGENTS.md`](./AGENTS.md).
