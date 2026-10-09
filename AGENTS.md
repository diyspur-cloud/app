# AGENTS.md — instruções para agentes e IAs

Estas instruções valem para qualquer agente que opere neste repositório. Objetivo: entregar mudanças pequenas, verificáveis, seguras e coerentes com o produto DIYSPUR.

## Visão geral da arquitetura e stack

- **Next.js App Router 16.4 / React 19.3 / TypeScript 5.9 (`strict`)**; entrypoints de rota em `src/app`, layout global em `src/app/layout.tsx`.
- **Supabase**: `@supabase/ssr` + `@supabase/supabase-js`. `src/lib/supabase/clients.ts` é server-only; `src/lib/supabase/browser.ts` é apenas client. O `proxy.ts` conecta a renovação de sessão SSR.
- **Validação**: Zod 4.1. **UI**: React + CSS próprio em `src/styles/`; não há Tailwind, shadcn ou outro kit atualmente. **Testes**: Vitest para unit e Playwright para E2E.
- Schema e lógica backend estão em outro repositório: `diyspur-cloud/db`. `src/types/database.ts` é tipagem sincronizada/gerada desse schema e não deve ser editada manualmente como fonte de verdade.
- Detalhes de tokens, flows e comandos estão em [`CLAUDE.md`](./CLAUDE.md) e [`README.md`](./README.md). Leia ambos antes de mudanças grandes.

## Escopo: faça a menor alteração correta

1. Entenda a rota, componente, query ou schema que o pedido afeta antes de editar.
2. Modifique **apenas o necessário** para o objetivo solicitado. Não faça reformat de todo arquivo, troca de stack, “limpeza” lateral ou refatoração não pedida.
3. Não reescreva políticas/migrations, não altere o repositório `db` e não mude configuração Supabase externa sem autorização explícita.
4. Preserve o comportamento atual e registre qualquer desvio deliberado. Se faltar contrato de banco, faça leitura do schema/migrations/functions do backend antes de implementar; não invente tabela, enum, coluna ou RPC.
5. Evite adicionar dependências quando API de plataforma/CSS já resolve. Se precisar de dependência, compare manutenção, impacto de bundle, segurança e peer requirements; atualize lockfile e rode audit.

## Preservação do design system

- Leia [`CLAUDE.md`](./CLAUDE.md); use os tokens existentes em `src/styles/tokens.css` e os estilos/components de `src/styles/global.css`/`src/components/`.
- Preserve o tema dark-editorial e os papéis sémanticos. Não espalhe novos hex, fontes, breakpoints ou valores repetidos sem mapear ao token apropriado.
- Breakpoints atuais: `900px` e `650px`; verifique 375, 768, 1024 e 1440px quando afetar layout.
- Preserve português brasileiro, conteúdo verdadeiro do Supabase, empty states úteis, affordance de foco e movimento reduzido.
- Não remova labels, landmarks, skip link, alt ou `focus-visible`; não use cor sozinha para comunicar estado.

## TypeScript, React e lint

- Mantenha `strict` e os imports compatíveis com Server/Client Components.
- **Nunca use `any`, `@ts-ignore`, `eslint-disable`, `@ts-nocheck` ou coerção/cast apenas para silenciar erro sem autorização expressa e justificativa.** Use tipos do banco/union segura e valide entradas com Zod.
- Prefira nomes existentes: Componentes/tipos em PascalCase, funções/variáveis em camelCase, arquivos/helpers em kebab-case; preserve os nomes reservados do App Router.
- Use `@/*` para imports internos, `import type` para tipos e evite ciclos.
- Não crie `use client` para resolver erro de forma ampla; coloque o limite client no componente de interação mínimo.
- Erros de backend não devem vazar JWT, chave, PII, corpo completo de resposta ou URL assinada. Evite transformar falha de autorização em sucesso ou “vazio” sem decisão consciente.

## Segurança e Supabase — invariantes

1. **Nunca** coloque chave `service_role`, secret API key, senha de usuário ou OAuth secret em `NEXT_PUBLIC_*`, fonte versionada, logs ou fixtures. `.env.local` permanece ignorado; `.env.example` recebe só placeholder.
2. Use `getClaims()` para identidade verificada de SSR/route/page privada; não trate `user_metadata` como role/autoridade. Derive user ID no servidor.
3. RLS é a autoridade para rows, mas páginas/Route Handlers ainda validam identidade e escopo. Não aceite ID/role do request como verdade.
4. Queries sempre selecionam o mínimo de campos e aplicam filtros/limites explícitos. Exporte e liste somente conteúdo autorizado (`v_comments_visible` para comentários públicos).
5. Para novas mutations: inspecione policies e constraints no backend; prefira a função/RPC aprovada quando existir; valide payload com Zod; revalide sessão no servidor; trate replay/duplicidade; teste apenas em staging com conta fixture.
6. Nunca escreva/teste cadastro, comentário, progresso, deletes ou migration contra Supabase de produção. Smoke tests live atuais são read-only.
7. Use redirects locais (`safeLocalRedirect`), URL externa HTTPS, escape de dados exportados e políticas de embed consent-first.

## Fluxo recomendado de trabalho

1. Leia `README.md`, este arquivo, `CLAUDE.md` e os arquivos do subsistema afetado.
2. Localize contratos relevantes em `src/types/database.ts` e no repositório `db`; entenda quem é Server/Client e qual policy RLS opera.
3. Apresente plano mínimo quando mudança cruzar múltiplas camadas; implemente sem alterar backend/produção fora do escopo.
4. Teste em camadas: **`npm run typecheck` + `npm run lint`**, depois **`npm test`**, teste E2E/integração relevante e **`npm run build`**.
5. Para UI, valide teclado e tamanhos móveis/Desktop; confirme que CSS de `src/styles/global.css` e tokens carregam no build de produção.
6. Confira `git diff --check`, status e segurança do index. Confirme que `.env.local`, credenciais, outputs e artefatos de teste não serão commitados.
7. Atualize docs quando comandos, rotas, contratos ou restrições mudarem. Relate claramente testes realizados, não realizados e dependências administrativas.

## Comandos verdadeiros deste repositório

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

- Vitest está limitado a `tests/unit/**/*.test.ts`; E2E está em `tests/e2e/`.
- Instale Chromium para Playwright quando necessário: `npx playwright install chromium`.
- `npm run audit` corresponde a `npm audit --omit=dev`; rode `npm audit` para auditar toda a árvore.
- O `build` deve receber `NEXT_PUBLIC_SITE_URL` do ambiente alvo, pois `robots.txt` é gerado estático.

## Limites funcionais vigentes

Não declare recursos como “concluídos” sem código e teste: escritor de comentários, marcação de progresso, quizzes, histórico de leitura, notificações, desafio/ranking completo e CRUD admin são áreas ausentes ou scaffolds. Cadastro/login e leituras públicas estão codificados, mas signup/login em sessão real requer teste de staging; Google/GitHub dependem de configuração externa atualmente desabilitada.
