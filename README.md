

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

O frontend consome as seguintes funções, definidas no backend:

- `remove_own_chapter_comment(comment_id, chapter_id)` — retorna `boolean` e só aceita o autor autenticado;
- `get_own_chapter_comment_for_edit(comment_id, chapter_id)` — retorna o texto somente para o autor e somente enquanto o comentário não foi removido;
- `get_visible_video_timed_comments(chapter_id, limit)` — retorna conteúdo mascarado conforme `user_progress`;
- `get_season_chapter_access(season_id)` — retorna apenas metadados de temporadas `active` ou `finished`.

A migration também cria um trigger de integridade para impedir regressão de progresso e revoga DML direto em clubes, preservando as RPCs de ciclo de vida.

### Fluxo de desenvolvimento e release

1. Crie uma branch a partir de `main`.
2. Faça a migration incremental no repositório `db`; nunca edite migration aplicada.
3. Valide SQL em staging e aplique o backend antes de publicar o frontend.
4. Gere/sincronize `src/types/database.ts`.
5. Execute:

   ```bash
   npm ci
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

6. Rode E2E público e smoke tests autenticados no ambiente aprovado.
7. Abra PRs para os dois repositórios e faça merge somente com checks verdes.
8. Confirme o deployment Vercel e registre a versão do schema remoto.

### Verificação manual da release

- Quiz: tentar enviar sem nenhuma resposta e com apenas uma resposta; ambos devem ser rejeitados sem criar tentativa.
- Progresso: concluir capítulo, atualizar a página e confirmar que “Salvar progresso” não aparece; uma chamada direta de regressão deve falhar.
- Spoiler próprio: criar comentário com limiar baixo, abrir “Editar” e confirmar que o texto original aparece; em outra conta, a RPC deve retornar negação/vazio.
- Remoção: remover comentário próprio, recarregar capítulo/comunidade e confirmar `deleted_at`; repetir a operação sem gerar novo XP.
- Spoiler temporizado: publicar spoiler, consultar como visitante/usuário sem progresso e confirmar `content = null`; após o limiar, o conteúdo deve aparecer.
- Listas: incluir, repetir inclusão, remover e mover itens; `items_count` deve coincidir com a contagem real.
- Segurança: testar visitante, titular, outra conta e admin; não aceitar `user_id`, role, score ou gabarito vindo do cliente.

### Variáveis e segredos

O frontend usa apenas `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_SITE_URL`. A chave `service_role`, tokens de deploy, senhas e segredos de providers nunca podem estar em `NEXT_PUBLIC_*`, no bundle, no README ou no Git.

### Estado de validação

- TypeScript: aprovado.
- ESLint: aprovado.
- Vitest: 13 testes aprovados.
- Build de produção: aprovado quando executado com as variáveis Supabase do ambiente.
- Migrations novas: versionadas no repositório backend; aplicar e confirmar remotamente antes do smoke autenticado.
- Teste completo no navegador: deve ser executado após o deployment da migration e do frontend, porque os novos RPCs não existem em ambientes que ainda não receberam a migration.
