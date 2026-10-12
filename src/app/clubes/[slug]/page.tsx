import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClubPage } from '@/features/clubs/queries';
import { ClubMembershipActions } from '@/components/clubs/club-membership-actions';
import { ClubManagement } from '@/components/clubs/club-management';
import { createServerSupabase } from '@/lib/supabase/clients';

export const metadata: Metadata = {
  title: 'Clube de leitura',
  robots: { index: false, follow: false },
};

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getClubPage(slug);
  if (!data.club) notFound();
  const club = data.club;
  const isOwner = data.userId === club.owner_id;

  const client = await createServerSupabase();

  const [currentSeasonData, adminData] = await Promise.all([
    club.current_season_id
      ? (async () => {
          const { data: season } = await client
            .from('seasons')
            .select('id,title,slug,book_id,cover_url')
            .eq('id', club.current_season_id)
            .maybeSingle();
          if (!season) return null;
          const { data: book } = await client
            .from('books')
            .select('id,title,slug,cover_url')
            .eq('id', season.book_id)
            .maybeSingle();
          return { season, book };
        })()
      : Promise.resolve(null),
    isOwner
      ? (async () => {
          const [{ data: members }, { data: invitations }, { data: seasons }] = await Promise.all([
            client
              .from('user_club_members')
              .select('user_id,role')
              .eq('club_id', club.id)
              .order('joined_at'),
            client
              .from('user_club_invitations')
              .select('id,invited_user_id,expires_at')
              .eq('club_id', club.id)
              .is('accepted_at', null)
              .is('revoked_at', null)
              .order('created_at', { ascending: false }),
            client
              .from('seasons')
              .select('id,title,slug')
              .in('status', ['active', 'finished'])
              .order('starts_at', { ascending: false }),
          ]);

          const rawMembers = members ?? [];
          const rawInvitations = invitations ?? [];
          const userIds = [...new Set([
            ...rawMembers.map((m) => m.user_id),
            ...rawInvitations.map((i) => i.invited_user_id),
          ])];
          const { data: profiles } = userIds.length
            ? await client.from('v_profiles_public').select('id,display_name,username').in('id', userIds)
            : { data: [] };
          const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

          return {
            members: rawMembers.map((m) => ({
              ...m,
              displayName: profileMap.get(m.user_id)?.display_name ?? null,
              username: profileMap.get(m.user_id)?.username ?? null,
            })),
            invitations: rawInvitations.map((i) => ({
              ...i,
              displayName: profileMap.get(i.invited_user_id)?.display_name ?? null,
              username: profileMap.get(i.invited_user_id)?.username ?? null,
            })),
            seasons: seasons ?? [],
          };
        })()
      : Promise.resolve(null),
  ]);

  return (
    <section className="container">
      <header className="club-header-card">
        <div className="club-header-info">
          <div className="detail-pills">
            <span className="status-pill">{club.is_private ? 'Clube privado' : 'Clube público'}</span>
          </div>
          <h1 className="club-header-title">{club.name}</h1>
          {club.description && <p className="club-header-desc">{club.description}</p>}
          <div className="club-member-indicator">
            <span className="club-member-dot" aria-hidden="true" />
            <span>
              <strong>{data.totalMembers}</strong> {data.totalMembers === 1 ? 'leitor participando' : 'leitores participando'}
            </span>
          </div>
        </div>
        <div className="club-header-actions">
          <ClubMembershipActions
            clubId={club.id}
            isMember={data.isMember}
            isOwner={isOwner}
            isPrivate={club.is_private}
          />
        </div>
      </header>

      <div className="member-grid">
        <section aria-labelledby="club-season-heading" className="member-card">
          <div className="section-head">
            <div>
              <span className="eyebrow">Ciclo de leitura</span>
              <h2 id="club-season-heading">
                {currentSeasonData?.season ? 'Temporada em andamento' : 'Painel de leitura'}
              </h2>
            </div>
          </div>

          {currentSeasonData?.season ? (
            <div className="club-reading-panel">
              <span className="eyebrow">Leitura ativa</span>
              <h3 style={{ marginTop: '4px', marginBottom: '8px' }}>
                {currentSeasonData.book?.title ?? currentSeasonData.season.title}
              </h3>
              <p className="field-hint" style={{ marginBottom: '16px' }}>
                Ciclo: {currentSeasonData.season.title}
              </p>
              <Link className="btn btn-primary btn-sm" href={`/temporadas/${currentSeasonData.season.slug}`}>
                Acompanhar capítulos do ciclo →
              </Link>
            </div>
          ) : (
            <p className="field-hint">
              O painel de leitura do clube aparecerá aqui quando um ciclo e temporada forem definidos pelo responsável.
            </p>
          )}
        </section>

        <aside className="chapter-aside">
          <h2>Seu acesso</h2>
          <p>
            {isOwner
              ? 'Você é o responsável por este clube.'
              : data.isMember
                ? 'Você participa deste clube.'
                : club.is_private
                  ? 'Este clube aceita leitores por convite.'
                  : 'Entre para acompanhar a leitura.'}
          </p>
        </aside>
      </div>

      {adminData && (
        <section className="section">
          <ClubManagement
            club={{
              id: club.id,
              slug: club.slug,
              version: club.version,
              name: club.name,
              description: club.description,
              is_private: club.is_private,
              current_season_id: club.current_season_id,
            }}
            members={adminData.members}
            invitations={adminData.invitations}
            seasons={adminData.seasons}
          />
        </section>
      )}
    </section>
  );
}
