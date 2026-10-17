import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChannelChat } from '@/components/discussions/channel-chat';
import { ChannelDirectory } from '@/components/discussions/channel-directory';
import { getChannelWorkspaceData } from '@/features/discussions/queries';
import {
  buildClubHref,
  buildClubNewEventHref,
  buildClubSettingsHref,
} from '@/lib/community-navigation';

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string; channelSlug: string }>;
type SearchParams = Promise<{
  replyTo?: string;
  msg?: string;
  videoSec?: string;
}>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug, channelSlug } = await params;
  const workspace = await getChannelWorkspaceData({ clubSlug: slug, channelSlug });
  if (!workspace) {
    return { title: 'Canal não encontrado', robots: { index: false, follow: false } };
  }
  return {
    title: `#${workspace.activeChannel.displayName} · ${workspace.club.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function ClubChannelPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug, channelSlug } = await params;
  const query = await searchParams;
  const focusMessageId = typeof query.msg === 'string' ? query.msg : null;
  const replyToId = typeof query.replyTo === 'string' ? query.replyTo : null;
  const parsedVideoSec =
    typeof query.videoSec === 'string' ? Number.parseInt(query.videoSec, 10) : NaN;
  const initialVideoSec =
    Number.isFinite(parsedVideoSec) && parsedVideoSec >= 0 ? parsedVideoSec : null;

  const workspace = await getChannelWorkspaceData({
    clubSlug: slug,
    channelSlug,
    focusMessageId,
  });

  if (!workspace) {
    notFound();
  }

  const canManage =
    workspace.isViewerAdmin ||
    workspace.viewerRole === 'owner' ||
    workspace.viewerRole === 'moderator';

  return (
    <div className="container section">
      <nav className="breadcrumb-nav" aria-label="Localização">
        <Link href="/clubes" className="text-link">
          Clubes
        </Link>
        <span aria-hidden="true"> / </span>
        {workspace.book && (
          <>
            <Link href={`/livros/${workspace.book.slug}`} className="text-link">
              {workspace.book.title}
            </Link>
            <span aria-hidden="true"> / </span>
          </>
        )}
        <Link href={buildClubHref(workspace.club.slug)} className="text-link">
          {workspace.club.name}
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">#{workspace.activeChannel.displayName}</span>
      </nav>

      <div className="channel-workspace-grid">
        <aside className="channel-workspace-sidebar" aria-label="Navegação do grupo">
          <div className="member-card">
            <span className="eyebrow">
              {workspace.club.kind === 'official' ? 'Grupo Oficial do Livro' : 'Clube de Leitura'}
            </span>
            <h2>{workspace.club.name}</h2>
            {workspace.book && (
              <p className="field-hint">
                Obra:{' '}
                <Link href={`/livros/${workspace.book.slug}`} className="text-link">
                  {workspace.book.title}
                </Link>
              </p>
            )}
            <div className="action-row" style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link className="button button-quiet button-small" href={buildClubHref(workspace.club.slug)}>
                Visão do grupo
              </Link>
              {canManage && (
                <>
                  <Link
                    className="button button-quiet button-small"
                    href={buildClubNewEventHref(workspace.club.slug)}
                  >
                    + Agendar encontro
                  </Link>
                  <Link
                    className="button button-quiet button-small"
                    href={buildClubSettingsHref(workspace.club.slug)}
                  >
                    Configurações
                  </Link>
                </>
              )}
            </div>
          </div>

          <ChannelDirectory
            clubSlug={workspace.club.slug}
            channels={workspace.channels}
            activeChannelSlug={workspace.activeChannel.slug}
          />
        </aside>

        <section className="channel-workspace-main" aria-label="Conversa do canal">
          <ChannelChat
            workspace={workspace}
            initialReplyToId={replyToId}
            initialFocusMessageId={focusMessageId}
            initialVideoSec={initialVideoSec}
          />
        </section>
      </div>
    </div>
  );
}
