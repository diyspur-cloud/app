'use client';

import { useState, useTransition } from 'react';
import {
  inviteByUsername,
  removeMember,
  revokeInvitation,
  updateClub,
} from '@/features/clubs/actions';

type Member = { user_id: string; role: string; displayName?: string | null; username?: string | null };
type Invitation = { id: string; invited_user_id: string; expires_at: string; displayName?: string | null; username?: string | null };
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
    current_season_id?: string | null;
  };
  members: Member[];
  invitations: Invitation[];
  seasons?: SeasonOption[];
}) {
  const [feedback, setFeedback] = useState('');
  const [busy, start] = useTransition();

  function save(form: FormData) {
    start(async () => {
      const seasonValue = form.get('seasonId') as string;
      const result = await updateClub({
        clubId: club.id,
        slug: club.slug,
        version: club.version,
        name: form.get('name'),
        description: form.get('description'),
        isPrivate: form.get('private') === 'on',
        seasonId: seasonValue ? seasonValue : null,
      });
      setFeedback(result.message);
    });
  }

  function invite(form: FormData) {
    start(async () => {
      const result = await inviteByUsername({
        clubId: club.id,
        username: form.get('username'),
      });
      setFeedback(result.message);
    });
  }

  return (
    <section className="member-card">
      <div className="section-head">
        <div>
          <span className="eyebrow">Área do responsável</span>
          <h2>Administrar clube</h2>
        </div>
      </div>

      <form className="auth-form" action={save}>
        <label>
          Nome
          <input className="field" name="name" defaultValue={club.name} />
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
        <label className="checkbox-line">
          <input type="checkbox" name="private" defaultChecked={club.is_private} /> Clube privado
        </label>
        <button className="button button-small" disabled={busy}>
          Salvar configurações
        </button>
      </form>

      <form className="auth-form" action={invite}>
        <label>
          Nome de usuário (@leitor)
          <input className="field" name="username" required placeholder="@nome_do_leitor" />
        </label>
        <button className="button button-quiet button-small" disabled={busy}>
          Convidar leitor por 7 dias
        </button>
      </form>

      {invitations.length > 0 && (
        <div className="timeline">
          <h3>Convites pendentes</h3>
          {invitations.map((inv) => (
            <div className="timeline-row" key={inv.id}>
              <span>
                {inv.displayName ?? (inv.username ? `@${inv.username}` : `${inv.invited_user_id.slice(0, 8)}…`)}
                {' · expira em '}
                {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(
                  new Date(inv.expires_at)
                )}
              </span>
              <button
                className="button button-quiet button-small"
                disabled={busy}
                onClick={() =>
                  start(async () =>
                    setFeedback((await revokeInvitation({ invitationId: inv.id })).message)
                  )
                }
              >
                Revogar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="timeline">
        <h3>Membros</h3>
        {members.map((member) => (
          <div className="timeline-row" key={member.user_id}>
            <span>
              {member.displayName ?? (member.username ? `@${member.username}` : 'Leitor')}
              {' · '}
              {member.role === 'owner' ? 'Responsável' : 'Membro'}
            </span>
            {member.role !== 'owner' && (
              <button
                className="button button-quiet button-small"
                disabled={busy}
                onClick={() =>
                  start(async () =>
                    setFeedback(
                      (
                        await removeMember({
                          clubId: club.id,
                          memberId: member.user_id,
                        })
                      ).message
                    )
                  )
                }
              >
                Remover
              </button>
            )}
          </div>
        ))}
      </div>

      {feedback && <p className="action-feedback" role="status">{feedback}</p>}
    </section>
  );
}
