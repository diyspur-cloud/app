# DIYSPUR — frontend do clube de leitura

Frontend web do DIYSPUR, um clube de leitura em português do Brasil para descobrir livros, acompanhar temporadas e capítulos, participar de quizzes, conversar sem spoilers, responder enquetes, acompanhar encontros e organizar o próprio ritmo de leitura.

- **Produção:** <https://diyspur.vercel.app/>
- **Repositório:** <https://github.com/diyspur-cloud/app>
- **Backend e banco:** <https://github.com/diyspur-cloud/db>
- **Stack:** Next.js App Router, React, TypeScript, Supabase SSR e CSS próprio.

> O frontend não contém a chave `service_role`, não executa DDL e não substitui as policies/RPCs do repositório backend. Toda identidade, score, XP, papel administrativo e acesso a conteúdo protegido precisa ser confirmado no servidor/Supabase.

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

## Rotas

| Rota | Acesso | Responsabilidade |
|---|---|---|
| `/` | Público | Home editorial, destaques e próximos encontros. |
| `/livros` | Público | Catálogo e busca por título. |
| `/livros/[slug]` | Público | Ficha do livro, avisos, temporadas e listas do leitor autenticado. |
| `/temporadas/[slug]` | Público | Temporada, milestones e capítulos disponíveis/bloqueados. |
| `/capitulos/[id]` | Público/autenticado | Leitura, vídeo, quiz, progresso, comentários e pergunta do anfitrião. |
| `/calendario` | Público/autenticado | Encontros, status, RSVP e exportação ICS. |
| `/comunidade` | Público | Feed de comentários visíveis e contexto editorial. |
| `/votacao` | Público/autenticado | Votação aberta e resultados encerrados. |
| `/desafios` | Privado | Desafios publicados e inscrição do leitor. |
| `/listas` | Privado | Listas privadas do leitor. |
| `/perfil` | Privado | Perfil, XP, médias, badges e atividade. |
| `/historico` | Privado | Progresso e tentativas recentes. |
| `/ranking` | Privado | Ranking da temporada por XP. |
| `/notificacoes` | Privado | Notificações do leitor. |
| `/leituras-compartilhadas` | Privado | Área de leituras compartilhadas disponível no contrato atual. |
| `/admin` | Privado/admin | Área restrita por autorização server-side. |
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

- lint e TypeScript sem erros;
- 13 testes unitários aprovados;
- 6 testes E2E públicos aprovados;
- build de produção aprovado;
- smoke de rotas, robots e sitemap;
- larguras de viewport de 375, 768, 1024 e 1440 px sem overflow horizontal;
- validação manual autenticada dos fluxos de leitura, quiz, progresso, RSVP, listas, desafio, comentários, votação, perfil e admin.

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

Esta seção documenta a correção dos achados confirmados no reteste autenticado. A release está organizada na branch `fix/auditoria-20261010` e será integrada à `main` após as validações de schema e produção.

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

TypeScript, ESLint, 13 testes unitários e build de produção foram aprovados com as variáveis Supabase do ambiente. As migrations estão versionadas no backend; o smoke autenticado deve ocorrer após sua aplicação remota.
