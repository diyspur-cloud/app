'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  inviteByUsername,
  removeMember,
  revokeInvitation,
  updateClub,
} from '@/features/clubs/actions';
import {
  createTopicChannelAction,
  setClubMemberRoleAction,
} from '@/features/discussions/actions';

type Member = {
  user_id: string;
  role: string;
  displayName?: string | null;
  username?: string | null;
};
type Invitation = {
  id: string;
  invited_user_id: string;
  expires_at: string;
  displayName?: string | null;
  username?: string | null;
};
type SeasonOption = { id: string; title: string; slug: string };

export function ClubManagement({
  club,
  members,
  invitations,
  seasons = [],
}: {
  club: {
    id: string;
    slug: string;
    version: number;
    name: string;
    description: string | null;
    is_private: boolean;
    kind?: string;
    current_season_id?: string | null;
  };
  members: Member[];
  invitations: Invitation[];
  seasons?: SeasonOption[];
}) {
  const router = useRouter();
  const [version, setVersion] = useState(club.version);
  const [feedback, setFeedback] = useState('');
  const [topicName, setTopicName] = useState('');
  const [topicSlug, setTopicSlug] = useState('');
  const [topicSpoilerPolicy, setTopicSpoilerPolicy] = useState<'none' | 'whole_book'>('none');
  const [busy, start] = useTransition();

  const isOfficial = club.kind === 'official';

  function save(form: FormData) {
    start(async () => {
      const seasonValue = form.get('seasonId') as string;
      const result = await updateClub({
        clubId: club.id,
        slug: club.slug,
        version,
        name: form.get('name'),
        description: form.get('description'),
        isPrivate: isOfficial ? false : form.get('private') === 'on',
        seasonId: seasonValue ? seasonValue : null,
      });
      setFeedback(result.message);
      if (result.ok) {
        if (typeof result.data?.version === 'number') {
          setVersion(result.data.version);
        }
        router.refresh();
      }
    });
  }

  function invite(form: FormData) {
    start(async () => {
      const result = await inviteByUsername({
        clubId: club.id,
        username: form.get('username'),
      });
      setFeedback(result.message);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  function handleCreateTopicChannel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    start(async () => {
      const normalizedSlug =
        topicSlug.trim() ||
        topicName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

      const result = await createTopicChannelAction({
        clubId: club.id,
        clubSlug: club.slug,
        name: topicName,
        slug: normalizedSlug,
        spoilerPolicy: topicSpoilerPolicy,
        requestId: crypto.randomUUID(),
      });
      setFeedback(result.message ?? '');
      if (result.ok) {
        setTopicName('');
        setTopicSlug('');
        router.refresh();
      }
    });
  }

  return (
    <section className="member-card">
      <div className="section-head">
        <div>
          <span className="eyebrow">Área do responsável</span>
          <h2>Administrar {isOfficial ? 'grupo oficial' : 'clube'}</h2>
        </div>
      </div>

      <form className="auth-form" action={save}>
        <label>
          Nome
          <input className="field" name="name" defaultValue={club.name} required />
        </label>
        <label>
          Descrição
          <textarea
            className="field"
            name="description"
            rows={3}
            defaultValue={club.description ?? ''}
          />
        </label>
        {seasons.length > 0 && (
          <label>
            Ciclo e temporada de leitura
            <select
              className="field"
              name="seasonId"
              defaultValue={club.current_season_id ?? ''}
            >
              <option value="">Nenhuma temporada selecionada</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.title}
                </option>
              ))}
            </select>
            <span className="field-hint">
              Ao selecionar uma temporada, os membros do clube poderão acompanhar os capítulos deste ciclo diretamente.
            </span>
          </label>
        )}
        {!isOfficial && (
          <label className="checkbox-line">
            <input type="checkbox" name="private" defaultChecked={club.is_private} /> Clube privado
          </label>
        )}
        <button className="button button-small" disabled={busy}>
          Salvar configurações
        </button>
      </form>

      <div className="timeline" style={{ marginTop: '1.5rem' }}>
        <h3>Novo canal de tópico</h3>
        <form className="auth-form" onSubmit={handleCreateTopicChannel}>
          <label>
            Nome do canal
            <input
              className="field"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="Ex.: Teorias e referências"
              minLength={2}
              maxLength={80}
              required
            />
          </label>
          <label>
            Identificador (slug opcional)
            <input
              className="field"
              value={topicSlug}
              onChange={(e) => setTopicSlug(e.target.value)}
              placeholder="Ex.: teorias-e-referencias"
            />
          </label>
          <label>
            Política de spoilers
            <select
              className="field"
              value={topicSpoilerPolicy}
              onChange={(e) => setTopicSpoilerPolicy(e.target.value as 'none' | 'whole_book')}
            >
              <option value="none">Sem spoilers</option>
              <option value="whole_book">Spoilers liberados (requer aceite)</option>
            </select>
          </label>
          <button className="button button-quiet button-small" type="submit" disabled={busy}>
            Criar canal
          </button>
        </form>
      </div>

      {!isOfficial && (
        <form className="auth-form" action={invite} style={{ marginTop: '1.5rem' }}>
          <label>
            Nome de usuário (@leitor)
            <input className="field" name="username" required placeholder="@nome_do_leitor" />
          </label>
          <button className="button button-quiet button-small" disabled={busy}>
            Convidar leitor por 7 dias
          </button>
        </form>
      )}

      {invitations.length > 0 && (
        <div className="timeline">
          <h3>Convites pendentes</h3>
          {invitations.map((inv) => (
            <div className="timeline-row" key={inv.id}>
              <span>
                {inv.displayName ??
                  (inv.username ? `@${inv.username}` : `${inv.invited_user_id.slice(0, 8)}…`)}
                {' · expira em '}
                {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(
                  new Date(inv.expires_at),
                )}
              </span>
              <button
                className="button button-quiet button-small"
                disabled={busy}
                onClick={() =>
                  start(async () => {
                    const res = await revokeInvitation({ invitationId: inv.id });
                    setFeedback(res.message);
                    if (res.ok) router.refresh();
                  })
                }
              >
                Revogar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="timeline">
        <h3>Membros ({members.length})</h3>
        {members.map((member) => (
          <div className="timeline-row" key={member.user_id}>
            <span>
              {member.displayName ?? (member.username ? `@${member.username}` : 'Leitor')}
              {' · '}
              {member.role === 'owner'
                ? 'Responsável'
                : member.role === 'moderator'
                  ? 'Moderador(a)'
                  : 'Membro'}
            </span>
            {member.role !== 'owner' && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="button button-quiet button-small"
                  disabled={busy}
                  onClick={() =>
                    start(async () => {
                      const nextRole = member.role === 'moderator' ? 'member' : 'moderator';
                      const res = await setClubMemberRoleAction({
                        clubId: club.id,
                        clubSlug: club.slug,
                        memberId: member.user_id,
                        role: nextRole,
                      });
                      setFeedback(res.message);
                      if (res.ok) router.refresh();
                    })
                  }
                >
                  {member.role === 'moderator' ? 'Tornar membro' : 'Tornar moderador'}
                </button>
                <button
                  className="button button-quiet button-small"
                  disabled={busy}
                  onClick={() =>
                    start(async () => {
                      const res = await removeMember({
                        clubId: club.id,
                        memberId: member.user_id,
                      });
                      setFeedback(res.message);
                      if (res.ok) router.refresh();
                    })
                  }
                >
                  Remover
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {feedback && (
        <p className="action-feedback" role="status">
          {feedback}
        </p>
      )}
    </section>
  );
}
