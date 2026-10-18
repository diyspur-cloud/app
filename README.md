# DIYSPUR — frontend do clube de leitura

Frontend web do DIYSPUR, um clube de leitura em português do Brasil para descobrir livros, acompanhar temporadas e capítulos, participar de quizzes, conversar sem spoilers, responder enquetes, acompanhar encontros e organizar o próprio ritmo de leitura.

- **Produção:** <https://diyspur.vercel.app/>
- **Repositório:** <https://github.com/diyspur-cloud/app>
- **Backend e banco:** <https://github.com/diyspur-cloud/db>
- **Documentação centralizada:** <https://github.com/diyspur/docs>
- **Stack:** Next.js App Router, React, TypeScript, Supabase SSR e CSS próprio.

> O frontend não contém a chave `service_role`, não executa DDL e não substitui as policies/RPCs do repositório backend. Toda identidade, score, XP, papel administrativo e acesso a conteúdo protegido precisa ser confirmado no servidor/Supabase.

## Manual do usuário

[Manual completo com guias por página, capturas, referência técnica e cobertura QA](../docs/app-docs/manual/00-overview.md). A rodada documentada distingue navegação executada de mutações e validações pendentes.

## Índice

- [Estado atual](#estado-atual)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Rotas](#rotas)
- [Supabase e autenticação](#supabase-e-autenticação)
- [Configuração local](#configuração-local)
- [Comandos](#comandos)
- [Testes e critérios de qualidade](#testes-e-critérios-de-qualidade)
- [Deploy no Vercel](#deploy-no-vercel)
- [Segurança](#segurança)
- [Como contribuir](#como-contribuir)
- [Limites conhecidos](#limites-conhecidos)

## Estado atual

A aplicação está publicada e integrada ao projeto Supabase configurado no backend. O ciclo editorial Verity usado na auditoria possui livro, temporada, capítulos, quiz, pergunta do anfitrião, encontro, votação encerrada, avisos de conteúdo e desafio de leitura.

Os principais fluxos autenticados foram exercitados com uma conta QA dedicada:

- cadastro, login, logout e recuperação de senha;
- quiz com validação server-side, retry e desbloqueio do capítulo seguinte;
- progresso intermediário e conclusão de capítulo;
- XP, conquistas e ranking;
- resposta e troca da resposta na pergunta do anfitrião;
- RSVP de encontro;
- comentários de capítulo e comentários sincronizados com timestamp;
- listas privadas e inclusão de livro;
- inscrição idempotente em desafio;
- perfil, histórico, médias de quiz e badges;
- bloqueio server-side do painel administrativo.

Não coloque credenciais QA, senhas, tokens ou variáveis locais neste repositório.

## Funcionalidades

### Catálogo e leitura

- catálogo público com busca por título;
- ficha de livro com autor, edição, metadados, avisos de conteúdo e temporadas;
- timeline de capítulos com estados disponíveis/bloqueados;
- proteção de capítulos futuros e gate por quiz;
- player/fachada YouTube com allowlist de hosts oficiais;
- progresso percentual persistido e conclusão server-side;
- próximo capítulo e retorno ao ponto da leitura;
- horários de encontros exibidos explicitamente em `America/Sao_Paulo`.

### Comunidade e gamificação

- comentários de capítulo com suporte a spoiler;
- comentários sincronizados por segundo do vídeo;
- contagem agregada de leitores por trecho;
- feed público com contexto do capítulo;
- quiz com score validado no backend;
- pergunta do anfitrião com três respostas, resultado agregado e troca de voto;
- enquetes abertas e resultados de enquetes encerradas;
- XP idempotente para atividades elegíveis;
- badges avaliadas pelo banco e ranking por XP;
- desafio anual com inscrição privada e idempotente;
- milestones da temporada.

### Conta e organização

- cadastro e login por email/senha;
- magic link com destino local preservado;
- recuperação e atualização de senha;
- redirects locais protegidos contra open redirect;
- perfil e histórico privados;
- listas privadas: criação e adição de livros;
- RSVP e exportação ICS de encontros;
- redirect afiliado Amazon server-side com allowlist e registro mínimo de clique.

## Arquitetura

```text
src/
├── app/                         # App Router, páginas, metadata e Route Handlers
│   ├── api/affiliate/[slug]/    # registra clique e redireciona para Amazon allowlisted
│   ├── api/ics/[meetingId]/     # exporta encontro como text/calendar
│   ├── auth/                    # callback e logout
│   ├── capitulos/[id]/          # leitura, quiz, progresso e conversas
│   ├── desafios/                # consulta e inscrição em desafios
│   ├── listas/                  # listas privadas
│   ├── livros/                  # catálogo e fichas
│   └── ...                      # calendário, perfil, ranking, votação etc.
├── components/                 # componentes reutilizáveis e componentes client
├── features/                   # queries, actions e schemas por domínio
│   ├── catalog/
│   ├── chapters/
│   ├── lists/
│   ├── meetings/
│   ├── polls/
│   ├── profile/
│   └── video-comments/
├── lib/
│   ├── supabase/               # clients SSR/browser e helpers
│   └── safe-redirect.ts        # validação de destino local
├── styles/                     # tokens e CSS global
├── types/database.ts           # contrato TypeScript sincronizado com o backend
└── proxy.ts                    # sincronização SSR de cookies de sessão

tests/
├── unit/                       # Vitest
└── e2e/                        # Playwright
```

### Server Components, Client Components e Server Actions

- páginas e queries de leitura são Server Components por padrão;
- componentes Client existem apenas quando precisam de estado, eventos ou APIs do browser;
- Server Actions derivam `user_id` de claims autenticadas e nunca aceitam identidade/role do formulário;
- queries selecionam colunas explícitas e usam limites estáveis;
- mutações são protegidas simultaneamente por validação server-side e RLS.

### Design System e Interface (Nimble)

O frontend adota o design system do **Nimble (gitnimble.com)** com arquitetura estritamente **Mobile First**, tipografia **Inter**, suporte nativo e instantâneo aos temas **Light (padrão)** e **Dark**, alternador de tema acessível (`ThemeSwitch`) com zero FOUC, e componentes de alta precisão visual:

- **Tokens e Bitematismo**: Cores de marca (`--brand: #005bff`), superfícies progressivas (`--surface-1..3`), textos de alta legibilidade (`--text-primary..tertiary`) e retrocompatibilidade com tokens legados (`--color-*`). Script inline no `<head>` previne qualquer flash de conteúdo não estilizado (FOUC).
- **Mobile First Rigoroso**: Todo o layout foi reconstruído a partir do viewport de **375px**, expandindo com `@media (min-width: ...)` para tablet (640px/768px) e desktop (860px/1024px+). Touch targets possuem $\ge 48\text{px}$ de altura e CTAs ocupam largura total no mobile (`.btn-block`).
- **Navegação Adaptativa**: Menu mobile em drawer suspenso (`MobileNav`) com backdrop escurecido, links acessíveis, animação fluida e suporte a fechamento por tecla `Escape` ou clique fora.
- **Componentes Padronizados**:
  - Botões estilo pill (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-block`, `.btn-lg`, `.btn-sm`);
  - Moldura de janela macOS (`.mac-window-frame`) com semáforo Apple, toolbar e indicador live;
  - Feature Grid em 3 colunas (`.feature-grid`) com divisores de 1px usando `--separator`;
  - Card de adesão/preço de alta conversão (`.price-card`);
  - Cards de livros verticais com aspecto 2:2.9 e elevação suave (`.book-card`);
  - Cards interativos de enquetes e votações com barras de porcentagem (`.poll-card`);
  - Grids de métricas para progresso, XP e badges (`.metric-grid`, `.metric-card`);
  - Lista de notificações com dots de status (`.notification-list`);
  - Fachada leve para vídeos do YouTube (`.video-facade`) com poster em alta resolução e carregamento sob demanda;
  - Pergunta semanal do anfitrião (`.host-prompt-card`) com feedback otimista e contadores;
  - Estados vazios ilustrados (`EmptyState`) e botões com status de envio (`SubmitButton`).
- **Resolução de Duplicação Editorial**: A rota `/temporadas/[slug]` (ex: `/temporadas/t1-verity`) elimina a redundância visual entre capítulos e marcos de leitura (milestones) que compartilham o mesmo número, suprimindo cards repetidos, higienizando prefixos (`"Capítulo X — "`) e corrigindo breadcrumbs duplicados.

A especificação detalhada de cada token, componente e classe CSS está disponível no guia canônico:
👉 [`../docs/app-docs/design-system.md`](../docs/app-docs/design-system.md)

## Rotas

| Rota | Acesso | Responsabilidade |
|---|---|---|
| `/` | Público | Home editorial, destaques e próximos encontros. |
| `/livros` | Público | Catálogo e busca por título. |
| `/livros/[slug]` | Público | Ficha do livro, avisos, temporadas e listas do leitor autenticado. |
| `/temporadas/[slug]` | Público | Temporada, milestones e capítulos disponíveis/bloqueados. |
| `/capitulos/[id]` | Público/autenticado | Leitura, vídeo, quiz, progresso, comentários e pergunta do anfitrião. |
| `/calendario` | Público/autenticado | Encontros, status, RSVP e exportação ICS. |
| `/clubes` | Público/autenticado | Descoberta e listagem de clubes de leitura. |
| `/clubes/novo` | Privado | Criação de novo clube de leitura com idempotência. |
| `/clubes/[slug]` | Público/autenticado | Ficha do clube, ciclo de leitura ativo, membros e gestão do titular. |
| `/comunidade` | Público | Feed de comentários visíveis e contexto editorial com tratamento de falhas. |
| `/votacao` | Público/autenticado | Votação aberta e resultados encerrados. |
| `/desafios` | Privado | Desafios publicados e inscrição segura do leitor. |
| `/diario` | Privado | Diário de leitura pessoal, notas, minutos lidos e abas de ativos/arquivados. |
| `/listas` | Privado | Listas privadas do leitor. |
| `/metas` | Privado | Metas de leitura anuais (livros, páginas e minutos) com cálculo automático de progresso. |
| `/minha-fila` | Privado | Fila de leitura prioritária ("Up Next") com adição e remoção atômica. |
| `/perfil` | Privado | Perfil, XP, médias, badges e atividade. |
| `/historico` | Privado | Progresso e tentativas recentes. |
| `/ranking` | Privado | Ranking da temporada por XP. |
| `/notificacoes` | Privado | Notificações do leitor. |
| `/leituras-compartilhadas` | Privado | Área de leituras compartilhadas disponível no contrato atual. |
| `/admin` | Privado/admin | Área restrita por autorização server-side (livros, capítulos, moderação, rascunhos). |
| `/entrar`, `/cadastro` | Público | Autenticação; páginas `noindex`. |
| `/recuperar-senha`, `/atualizar-senha` | Público autenticado conforme etapa | Recuperação de senha. |
| `/api/affiliate/[slug]` | Público | Valida livro, registra clique e redireciona. |
| `/api/ics/[meetingId]` | Público | Retorna evento ICS de encontro existente. |
| `/robots.txt`, `/sitemap.xml` | Público | SEO técnico com domínio canônico. |

## Supabase e autenticação

O frontend usa duas fábricas de cliente:

- `src/lib/supabase/clients.ts`: Server Components, Server Actions e Route Handlers; lê cookies da requisição;
- `src/lib/supabase/browser.ts`: somente componentes Client e eventos do browser.

O contrato tipado em `src/types/database.ts` acompanha as tabelas, views, funções e enums do repositório [`diyspur-cloud/db`](https://github.com/diyspur-cloud/db). Quando o schema mudar:

1. crie uma migration incremental no backend;
2. aplique/teste a migration no projeto Supabase correto;
3. regenere ou sincronize os tipos;
4. atualize queries/actions do frontend;
5. rode lint, typecheck, unitários, build e E2E.

### Fluxo de autenticação

1. O usuário entra ou se cadastra em `/entrar` ou `/cadastro`.
2. O destino desejado é validado por `safeLocalRedirect`.
3. Supabase Auth envia a sessão para `/auth/callback`.
4. A callback troca o code por sessão e redireciona apenas para um caminho local.
5. `src/proxy.ts` atualiza cookies SSR e impede acesso anônimo às rotas privadas.
6. Páginas e actions repetem a autorização no servidor; o proxy não é a única barreira.

No Supabase Auth de cada ambiente, configure **Site URL** e **Redirect URLs** para:

- `http://localhost:3000` em desenvolvimento;
- `https://diyspur.vercel.app` em produção;
- eventuais previews Vercel autorizados, caso sejam usados.

## Configuração local

### Requisitos

- Node.js `>=20.9`;
- npm;
- acesso ao projeto Supabase de desenvolvimento/staging;
- Chromium instalado para Playwright (`npx playwright install chromium`).

### Instalação

```bash
git clone https://github.com/diyspur-cloud/app.git
cd app
cp .env.example .env.local
npm ci
npm run dev
```

Abra <http://localhost:3000>.

### Variáveis de ambiente

| Variável | Obrigatória | Uso |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL pública do projeto Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sim | Chave publishable; nunca use `service_role` aqui. |
| `NEXT_PUBLIC_SITE_URL` | Sim | Origem canônica usada por metadata, robots, sitemap e callbacks. |

Exemplo local:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`.env.local` é ignorado pelo Git. Não commite senhas, tokens OAuth, chaves de provider ou credenciais QA.

## Comandos

```bash
npm ci                 # instala exatamente o package-lock.json
npm run dev            # servidor de desenvolvimento
npm run lint           # ESLint
npm run typecheck      # TypeScript sem emitir arquivos
npm test               # Vitest
npm run build          # build de produção Next.js
npm start              # serve o build produzido
npm run test:e2e       # Playwright contra PLAYWRIGHT_BASE_URL ou localhost
npm run audit          # npm audit sem dependências de desenvolvimento
```

Exemplo de E2E contra produção:

```bash
PLAYWRIGHT_BASE_URL=https://diyspur.vercel.app npm run test:e2e
```

## Testes e critérios de qualidade

A validação final desta versão incluiu:

- lint e TypeScript com zero erros (`npm run lint && npm run typecheck`);
- 21 testes unitários aprovados em 6 suítes (Vitest: `goals-schemas`, `newsletter-schemas`, `meeting-state`, `safe-redirect`, `polls`, `chapter-schemas`);
- 6 testes E2E públicos aprovados (Playwright);
- build de produção Turbopack aprovado gerando 32 rotas estáticas e dinâmicas;
- smoke de rotas, robots e sitemap;
- larguras de viewport de 375, 640, 768, 860, 1024 e 1440 px sem overflow horizontal e com hit-targets de toque $\ge 48\text{px}$;
- validação manual autenticada dos fluxos de leitura, quiz com 5 questões, progresso, metas, minha fila, diário com cursor e arquivamento, RSVP, listas, desafio, comentários, votação, perfil e admin.

Ao alterar uma migration ou action, não considere um build verde suficiente: confirme também RLS, constraints, idempotência e isolamento entre usuários.

## Deploy no Vercel

O repositório está conectado ao projeto Vercel que serve `https://diyspur.vercel.app`. O fluxo recomendado é:

1. executar `npm run lint && npm run typecheck && npm test && npm run build`;
2. executar `npm run test:e2e` contra o ambiente desejado;
3. revisar `git diff --check`;
4. fazer commit e push para `main`;
5. aguardar o deploy automático do Vercel;
6. verificar as rotas públicas, autenticação, `robots.txt`, `sitemap.xml` e os fluxos alterados.

Configure no Vercel, em **Settings → Environment Variables**, para Production, Preview e Development conforme necessário:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`;
- `NEXT_PUBLIC_SITE_URL`.

O deploy do frontend não aplica migrations. Migrations e Edge Functions pertencem ao repositório backend e devem seguir o procedimento controlado documentado em [`diyspur-cloud/db`](https://github.com/diyspur-cloud/db).

## Segurança

- RLS do Supabase é a barreira final de acesso;
- `user_id`, role, score, XP e gabarito nunca vêm do cliente como autoridade;
- destinos de callback são locais e validados;
- embeds de vídeo aceitam somente hosts/formats permitidos;
- links afiliados só redirecionam para hosts Amazon allowlisted;
- dados privados não são renderizados em páginas públicas;
- comentários com spoiler são sinalizados e tratados como conteúdo editorial sensível;
- erros técnicos não são exibidos crus ao leitor;
- chaves publishable podem estar no browser; secrets nunca podem estar no bundle.

## Como contribuir

1. Crie uma branch a partir de `main`.
2. Leia o README do backend antes de alterar tabelas, views, RPCs ou policies.
3. Mantenha queries e actions no domínio correspondente.
4. Adicione ou atualize testes para comportamento novo.
5. Execute lint, typecheck, unitários e build.
6. Faça E2E quando a mudança afetar navegação, autenticação ou responsividade.
7. Use commits pequenos e descritivos.
8. Nunca reescreva uma migration já aplicada; crie uma migration corretiva incremental.

## Limites conhecidos

- O catálogo e o sitemap usam limites de consulta; paginação/cursor completo deve ser tratado antes de operar em escala grande.
- OAuth social, newsletter, pagamentos/Stripe, matching e recomendações dependem de credenciais, providers e aceite operacional externo; o frontend não presume que essas integrações estejam habilitadas.
- O conteúdo editorial deve ser revisado antes de expandir quizzes, prompts, avisos ou temporadas.
- Clubes básicos e diário privado estão implementados; convites/transferência de titularidade, edição completa de listas e jornadas avançadas de leituras compartilhadas ainda dependem de contratos adicionais.

## Licença e contato

Este repositório é privado/gerenciado pela organização DIYSPUR. Para alterações de produto, schema ou publicação, use os repositórios oficiais e preserve as regras de segurança descritas acima.

## Entrega editorial full-stack — 2026-10-10

Esta seção registra o estado operacional da entrega implementada no produto e não substitui o histórico de migrations. Os PRs da implementação foram integrados em `main`, a migration `20261010120000_editorial_product_lifecycle.sql` foi aplicada ao projeto Supabase `xjhehhfhhoomblcggjpk` e o push para `main` aciona o deploy automático do projeto Vercel `diyspur`.

### Clubes de leitura

As rotas `/clubes`, `/clubes/novo` e `/clubes/[slug]` permitem descobrir clubes públicos, criar um clube autenticado e consultar o detalhe autorizado. A criação usa `requestId` como chave de idempotência. O titular é derivado de `auth.uid()` no servidor, não do formulário. Clubes privados não podem ser ingressados pelo RPC público de entrada: a jornada de convite permanece explicitamente separada para evitar que um slug funcione como autorização.

A edição usa `version` e bloqueio transacional para rejeitar gravações concorrentes. O titular não pode sair do próprio clube; o contrato exige arquivamento ou futura transferência de titularidade. A leitura de memberships é protegida por RLS e pelo helper privado não recursivo `private.can_view_user_club`.

### Diário privado

A rota `/diario` lista somente registros autorizados para a sessão. O formulário valida UUID do livro, data ISO, corpo obrigatório, páginas, percentual, minutos e spoiler. A action deriva `user_id` da sessão e grava `visibility = 'private'`. O banco também valida páginas, duração e compartilhamento: um registro `visibility = 'club'` sem `shared_club_id` não é exposto a ninguém além do titular.

O diário não transforma texto em XP, conclusão ou recomendação. Anexos continuam subordinados ao bucket privado e às policies de Storage existentes. A publicação de uma entrada exige uma decisão editorial posterior, não apenas uma flag no navegador.

### Listas e concorrência

`reading_lists.version` e a RPC `reorder_reading_list(list, version, item_ids)` formam o contrato de ordenação atômica. A função bloqueia a lista, verifica a versão, exige exatamente todos os itens pertencentes à lista e incrementa a versão em uma única transação. IDs de itens de outra lista ou ordens incompletas são rejeitados.

### Contrato entre frontend e Supabase

Quando uma migration é aplicada, o fluxo obrigatório é: criar migration incremental no repositório `db`; aplicar em staging/produção controladamente; gerar `src/types/database.ts`; atualizar queries/actions; executar lint, typecheck, unitários, build e E2E; só então publicar no Vercel. O snapshot atual foi gerado diretamente do projeto remoto depois da migration e inclui as colunas `version`, `archived_at` e `shared_club_id`, a tabela de convites e as RPCs novas.

### Deploy Vercel

O projeto Vercel se chama `diyspur` e está conectado ao repositório `diyspur-cloud/app`. O deploy de produção é acionado pelo push em `main`; o Vercel não executa migrations. Depois de cada deploy, valide:

```bash
curl -fsS https://diyspur.vercel.app/ >/dev/null
curl -fsS https://diyspur.vercel.app/robots.txt
curl -fsS https://diyspur.vercel.app/sitemap.xml
PLAYWRIGHT_BASE_URL=https://diyspur.vercel.app npm run test:e2e
```

As variáveis obrigatórias de produção são `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_SITE_URL=https://diyspur.vercel.app`. A chave `service_role` nunca deve ser configurada como variável `NEXT_PUBLIC_*` nem enviada ao bundle.

### Checklist de release

| Gate | Evidência esperada |
|---|---|
| Código em `main` | `git log origin/main` contém o merge do PR |
| Schema remoto | migration aparece em `list_migrations` com versão `20261010030848` |
| Contrato tipado | `src/types/database.ts` gerado após o apply |
| Qualidade | lint, typecheck, unitários, build e E2E verdes |
| Produção | domínio Vercel responde 200 e rotas públicas carregam |
| Segurança | RLS/RPC/Auth testados com anon, titular, outro usuário e admin |

O Supabase ainda pode apresentar advisories preexistentes, como extensions no schema `public`, funções de acesso de capítulos marcadas como `SECURITY DEFINER`, proteção de senha vazada desabilitada e índices não utilizados. Esses avisos não foram silenciosamente tratados nesta entrega; devem ser avaliados como hardening separado.

## Release de hardening da auditoria — 2026-10-10

Esta seção documenta a correção dos achados confirmados no reteste autenticado. A release foi integrada à `main` pelo PR #3 e publicada no deployment Vercel de produção associado ao commit `7d0f824c9118d35e1cd154987447929079258915`.

### Correções incluídas

| Área | Comportamento garantido |
|---|---|
| Quiz | A interface só envia quando todas as perguntas estão respondidas; a Edge Function rejeita payload vazio/incompleto e continua calculando score no servidor. |
| Progresso | Capítulos concluídos não exibem mais “Salvar progresso”; a action e o trigger do banco impedem regressão de `read` para `reading`. |
| Comentário próprio | Edição de spoiler busca o texto original através de RPC autenticada; remoção usa soft delete por RPC idempotente e não depende de retornar uma linha já ocultada. |
| Comentário temporizado | Suporta spoiler, percentual mínimo e leitura mascarada no servidor; o conteúdo bruto não é enviado a leitores não elegíveis. |
| Listas | A contagem exibida vem dos itens carregados; o backend faz backfill e mantém `items_count` por trigger atômico em inclusão, remoção e movimentação. |
| Disponibilidade | Escritas de progresso e comentários exigem capítulo publicado em temporada ativa/finalizada e gate de quiz quando aplicável. |

### Contrato de chamadas novas

O frontend consome `remove_own_chapter_comment`, `get_own_chapter_comment_for_edit`, `get_visible_video_timed_comments` e `get_season_chapter_access`, definidos no backend. As duas primeiras são restritas ao autor autenticado; a terceira mascara spoilers no servidor; a quarta oculta temporadas que não estejam publicadas.

### Fluxo de desenvolvimento e release

1. Crie branch a partir de `main`.
2. Faça migration incremental no repositório `db`; nunca edite migration aplicada.
3. Valide SQL em staging e aplique o backend antes de publicar o frontend.
4. Gere/sincronize `src/types/database.ts`.
5. Execute `npm ci`, `npm run typecheck`, `npm run lint`, `npm test` e `npm run build`.
6. Rode E2E público e smoke tests autenticados no ambiente aprovado.
7. Abra PRs para os dois repositórios e faça merge somente com checks verdes.
8. Confirme o deployment Vercel e registre a versão do schema remoto.

### Verificação manual da release

- tentar enviar quiz sem nenhuma resposta e com apenas uma resposta; ambos devem ser rejeitados sem criar tentativa;
- concluir capítulo e confirmar que “Salvar progresso” não aparece e que uma regressão direta falha;
- editar spoiler próprio e confirmar o texto original; outra conta não pode acessar esse texto;
- remover comentário próprio, confirmar `deleted_at` e repetir sem gerar novo XP;
- publicar spoiler temporizado, verificar `content = null` antes do limiar e conteúdo após o limiar;
- incluir, repetir, remover e mover itens de lista; `items_count` deve coincidir com a contagem real;
- testar visitante, titular, outra conta e admin sem confiar em `user_id`, role, score ou gabarito enviados pelo cliente.

### Variáveis e segredos

O frontend usa apenas `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_SITE_URL`. `service_role`, tokens, senhas e segredos nunca podem estar em `NEXT_PUBLIC_*`, no bundle, no README ou no Git.

### Estado de validação

TypeScript, ESLint, 13 testes unitários e build de produção foram aprovados. As migrations foram aplicadas no projeto Supabase `xjhehhfhhoomblcggjpk` nas versões remotas `20261010165108` e `20261010165112`; o smoke público de produção foi executado em `/`, `/livros`, `/livros/verity`, `/temporadas/t1-verity`, `/capitulos/3a687744-7a0f-4dbf-9bad-f5ad3d920732`, `/listas` e `/admin` em 10/10/2026.

## Release de conformidade de auditoria e novas jornadas de leitura — 2026-10-11

Esta release consolida o fechamento dos gaps de auditoria de produção (itens B01 a B19), a introdução das jornadas de produto da Seção 5.2 e o refinamento de acessibilidade e design system Mobile First (Nimble).

### Novas jornadas de produto

1. **Metas de Leitura Anuais (`/metas`)**:
   - Criação e atualização de metas do leitor para o ano corrente (livros meta, páginas meta e minutos diários meta).
   - Acompanhamento de progresso derivado automaticamente do histórico de leituras concluídas e das sessões do diário.
   - Validação server-side estrita com Zod (`src/features/goals/actions.ts` e `src/features/goals/queries.ts`).

2. **Minha Fila de Leitura (`/minha-fila`)**:
   - Fila prioritária de leitura ("Up Next") para organizar as próximas obras a serem consumidas.
   - Ações atômicas de inclusão direta do catálogo e remoção (`RemoveQueueButton`).

3. **Inscrição em Newsletter com Consentimento**:
   - Formulário de captura de email com checkbox explícito e obrigatório de consentimento nos termos da LGPD (`src/components/newsletter/signup-form.tsx`).

4. **Ciclo de Leitura em Clubes (`/clubes/[slug]`)**:
   - Gestão de leitura ativa pelo titular no painel `ClubManagement`, permitindo vincular a temporada/livro em andamento (B15).
   - Card de leitura atual com indicador de progresso e links diretos para a timeline de capítulos.

### Correções e melhorias de engenharia e acessibilidade

- **B08, B09, B10 & B11 (Diário Pessoal):**
  - **Paginação estável:** Implementado cursor composto em base64url `(entry_date, id)` que elimina saltos ou duplicação de itens com mesma data.
  - **Validação de mutações:** Verificação de contagem de linhas afetadas nas Server Actions de arquivamento e restauração.
  - **Acessibilidade & Feedback:** Estado pendente nos botões de ação com feedback para leitores de tela via `role="status"` e `aria-live="polite"`.
  - **Abas de navegação:** Separação entre leituras "Ativas" e "Arquivadas" com restauração em 1 clique.
- **B12 & B13 (Acessibilidade WCAG 2.2):**
  - `MobileNav`: Menu móvel fechado recebe `hidden={!open}` e atributos dinâmicos `aria-modal`/`role="dialog"`, sendo completamente excluído da árvore de foco e de acessibilidade quando inativo.
  - Alvo de toque do botão de menu `.mobile-nav-toggle` ampliado para $48\times 48\text{px}$, em conformidade com as diretrizes de acessibilidade para dispositivos móveis.
  - Eliminação de marco `<main>` duplicado na página do clube, mantendo um único ponto de referência principal no documento.
- **B05 (Segurança de Desafios):**
  - Payload cliente restrito estritamente a `(user_id, challenge_id)` ao entrar em um desafio, impedindo qualquer manipulação de progresso inicial ou data de conclusão.
- **B06 & B07 (Administração e Qualidade):**
  - Validação mandatória de 5 perguntas revisadas antes de permitir a publicação de um quiz (`src/app/admin/actions.ts`).
  - Suporte explícito ao estado `is_draft` no ciclo de vida e edição de capítulos.
- **B14 & B16 (Experiência do Usuário e Observabilidade):**
  - Prévia da home sinalizada explicitamente como demonstração ilustrativa da experiência.
  - Página da comunidade com tratamento e exibição clara de estados de erro na recuperação do feed.
- **Capítulo Concluído:**
  - Botão de ação do leitor atualizado para estado inativo "✓ Capítulo concluído" quando o status registrado já for `read`.

### Estado de validação da release

- **TypeScript (`tsc --noEmit`):** 0 erros.
- **ESLint (`eslint .`):** 0 avisos ou erros.
- **Vitest (`vitest run`):** 21 testes aprovados em 6 suítes unitárias (`goals-schemas`, `newsletter-schemas`, `meeting-state`, `safe-redirect`, `polls`, `chapter-schemas`).
- **Turbopack Build (`next build`):** 32 rotas estáticas e dinâmicas compiladas com sucesso para produção.


## Release de Implementação do SDD e Auditoria Multidisciplinar — 2026-10-11

Esta release conclui a implementação das recomendações prioritárias da auditoria multidisciplinar e do SDD de produção do DIYSPUR:

### 1. Correções Críticas (P0)
- **UX-01 (Página de Clubes):** Reestruturação completa do cabeçalho da rota `/clubes/[slug]` (`.club-header-card`) com container flexível fluido, indicador pulsante de leitores ativos e separação clara entre metadados e botão de ação, eliminando de forma definitiva o problema de sobreposição visual do botão "Entrar no clube".
- **SEC-01 (Sanitização de Open Redirect):** Implementação da função utilitária `getSafeRedirectUrl` em `src/lib/safe-redirect.ts`, garantindo que parâmetros de redirecionamento sejam estritamente caminhos relativos internos, bloqueando esquemas arbitrários (`http:`, `https:`, `javascript:`) e sequências maliciosas (`//`, `/\`).
- **ENG-01 (Proteção contra Spoilers):** Componente unificado `CommentSpoilerCard` (`src/components/comments/comment-spoiler-card.tsx`) com banner de aviso âmbar (`⚠️ Este comentário contém spoiler deste capítulo`), botão interativo de revelação ("Revelar comentário") e opção de ocultar novamente, integrado tanto nos capítulos (`src/components/chapters/chapter-interactions.tsx`) quanto no feed comunitário (`src/app/comunidade/page.tsx`), preservando o bloqueio server-side (`is_locked`).

### 2. Refinamento de Navegação e Home (P1)
- **NAV-01 (Navegação Desktop e Mobile):** Criação do componente `DesktopNav` (`src/components/desktop-nav.tsx`) com menus dropdown temáticos acessíveis:
  - **Explorar ▾:** Catálogo de Livros (`/livros`) e Clubes de Leitura (`/clubes`).
  - **Comunidade ▾:** Conversas e Debates (`/comunidade`), Calendário de Encontros (`/calendario`) e Votações (`/votacao`).
  - **Diário:** Atalho direto prioritário (`/diario`).
  - `MobileNav` reorganizado em seções identificadas (*Explorar*, *Comunidade*, *Pessoal*), reduzindo a sobrecarga cognitiva e evitando quebras de menu em telas médias.
- **HOME-01 (Redesenho da Página Inicial):** Implementação do wireframe completo da Seção 7.1 do relatório de auditoria:
  - Hero com H1 ajustado, CTAs direcionados ("Começar a ler junto ↗", "Descobrir leituras ↗" e "Ver como funciona ↓").
  - Seção explicativa **"Como funciona o DIYSPUR em 3 passos"** (Escolha a Temporada, Leia no Seu Ritmo, Debata Sem Spoilers).
  - Bloco **Temporada em Destaque (Season Spotlight)** consultando automaticamente o ciclo ativo (`getActiveSeason`), com capa, progresso da comunidade, dados do próximo encontro e link direto.
  - Grade em 2 colunas com **Próximos Encontros** e **Votação Popular**.
  - Seção de **Prova Social e Depoimentos** reais da comunidade.
- **CAL-01 (Calendário Google Agenda):** Integração de link web direto para adicionar encontros ao Google Agenda (`src/lib/calendar-links.ts`) ao lado do arquivo `.ics` para download.

### 3. SEO, Monetização e Social (P1/P2)
- **SEO-01 (Dados Estruturados Schema.org):** Injeção de Schema.org `Book` nas fichas de livros (`/livros/[slug]`) e Schema.org `Event`/`VirtualEvent` no calendário (`/calendario`), com títulos e meta descrições otimizadas para busca orgânica no Brasil.
- **MON-01 (Onde Comprar & Afiliados):** Bloco "Onde comprar seu exemplar" na ficha técnica dos livros com botão de compra na Amazon via `/api/affiliate/[slug]`.
- **SOCIAL-01 (Buddy Read / Convidar Amigo):** Componente `ShareBookButton` (`src/components/books/share-book-button.tsx`) com suporte a `navigator.share` nativo em mobile e cópia assistida com feedback visual temporário.
- **ACC-01 (Acessibilidade WCAG 2.2 AA):** Inputs do formulário de autenticação enriquecidos com `aria-invalid` e `aria-describedby` conectados às mensagens de validação.
- **OBS-01 (Telemetria & Analytics):** Módulo de telemetria tipado `src/lib/analytics.ts` com o dicionário de eventos da auditoria (Seção 14.2), suportando PostHog com fallback gracioso.

### 4. Estado de Validação
- **TypeScript (`tsc --noEmit`):** 0 erros.
- **ESLint (`eslint .`):** 0 avisos ou erros.
- **Vitest (`vitest run`):** 31 testes aprovados em 8 suítes unitárias (`analytics`, `calendar-links`, `chapter-schemas`, `goals-schemas`, `meeting-state`, `newsletter-schemas`, `polls`, `safe-redirect`).
- **Turbopack Build (`next build`):** 32 rotas estáticas e dinâmicas compiladas com sucesso para produção.

---

## Release de Remediação da Auditoria de QA e UX — 2026-10-12

Esta release executa todas as melhorias e correções aprovadas no plano de remediação integral (QA-01 a QA-17):

### 1. Fila de Leitura e Catálogo (QA-01, QA-02)
- **QA-01 (Fila Atômica no Backend):** Criação da migration `20261012160000_add_to_up_next_atomic.sql` com advisory lock transacional, distribuição ordenada 1..5 e tratamento de duplicações; tipos sincronizados em `src/types/database.ts` e Server Action `addToUpNext` conectada.
- **QA-02 (Botão de Fila na Ficha do Livro):** Componente `AddQueueButton` (`src/components/up-next/add-queue-button.tsx`) inserido condicionalmente em `/livros/[slug]`, com verificação de login, prevenção de escrita em preview e feedback visual imediato.

### 2. Criação Editorial e Auditoria (QA-03, QA-12)
- **QA-03 / QA-12 (Cadastro de Obras no Admin):** Migration `20261012161000_create_editorial_book.sql` com checagem estrita de `is_admin()`, sanitização de dados e auditoria transacional em `editorial_audit_log`; Server Action `createBook`, endurecimento de `updateBook` com retorno `not_found` seguro e revalidação de rotas; interface `BookCreator` no painel `/admin/books`.

### 3. Metas de Leitura e Clubes (QA-04, QA-05)
- **QA-04 (Metas sem Zero Fictício):** Distinção clara em `/metas` entre ausência de meta configurada e progresso zerado, substituindo falsos zeros por card encorajador de boas-vindas.
- **QA-05 (Identificação por @usuário):** Substituição de UUIDs por `@username` e nome de exibição nos cards de membros e convites de clubes (`src/components/clubs/club-management.tsx`); tradução de papéis (`Criador`, `Moderador`, `Leitor`); action `inviteByUsername` consultando `v_profiles_public`.

### 4. Navegação, Landmarks e Acessibilidade (QA-06, QA-10, QA-11)
- **QA-06 (Navegação Pessoal Unificada):** Módulo centralizado `src/lib/member-navigation.ts` com os 10 links pessoais (`memberLinks`), sincronizado em `DesktopNav`, `MobileNav`, `/perfil` e `/historico`.
- **QA-10 (Deduplicação de Títulos de Capítulos):** Utilitários `cleanChapterTitle` e `chapterLabel` (`src/lib/chapter-label.ts`) eliminando repetições como `"Capítulo 1 · Capítulo 1 — Início"` em `/comunidade`, `/historico` e `/capitulos/[id]`.
- **QA-11 (Landmark `<main>` Único):** Substituição de `<main className="member-card">` por `<div>` em `/historico`, garantindo estritamente um elemento `<main id="conteudo">` por página.

### 5. Fuso Horário e Encontros Futuros (QA-13, QA-14)
- **QA-13 (Horário Local no Editor Administrativo):** Função `toLocalDateTime` (`src/components/admin/admin-controls.tsx`) convertendo strings ISO UTC para o formato local `YYYY-MM-DDTHH:mm` esperado por `<input type="datetime-local">`, eliminando drift de fuso (+3h).
- **QA-14 (Filtro de Encontros Futuros):** Query `getUpcomingMeetings` filtrando status `scheduled`/`live` e data futura; na temporada ativa, amarração obrigatória dos encontros aos capítulos do ciclo.

### 6. Microcópia, Privacidade e Marca (QA-07, QA-15, QA-16, QA-17)
- **QA-07 (Banner e Preferências de Privacidade):** Estilização de `.privacy-preferences-trigger` e `.analytics-consent` com touch targets $\ge 48\text{px}$ e botões padronizados `.btn`.
- **QA-15 (Inspeção de Resíduos de Teste):** Script SQL read-only `db/scripts/ops/inspect-qa-residual.sql` e diretrizes de higiene documentadas.
- **QA-16 (Microcópia Humanizada):** Substituição de jargões técnicos ("idempotente") em `/desafios`, instruções em minutos/segundos em `timed-comment-list.tsx`, `ShareBookButton` com feedback único e fallback de erro, e link para explorar clubes em `/leituras-compartilhadas`.
- **QA-17 (Marca Única e E-mail Centralizado):** Módulo `src/lib/site-contact.ts` exportando `supportEmail = 'oi@diyspur.com'`, aplicado em rodapés, termos e privacidade; remoção de `| DIYSPUR` duplicado de `/livros/[slug]`.

### 7. Estado de Validação Integral
- **TypeScript (`tsc --noEmit`):** 0 erros.
- **ESLint (`eslint .`):** 0 erros e 0 avisos.
- **Vitest (`vitest run`):** 94 testes aprovados em 26 suítes unitárias.
- **Plano de Deploy Oficial:** Consulte [`../docs/app-docs/deploy/README.md`](../docs/app-docs/deploy/README.md) ou o [Guia Completo de Deploy na documentação oficial](https://github.com/diyspur/docs) para as instruções completas com interação no navegador web.

