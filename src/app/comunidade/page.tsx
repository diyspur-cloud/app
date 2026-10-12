import type { Metadata } from 'next';
import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/clients';
import { ReportButton } from '@/components/moderation/report-button';
import { CommentSpoilerCard } from '@/components/comments/comment-spoiler-card';

export const metadata: Metadata = {
  title: 'Comunidade',
  description: 'Ideias, perguntas e conversas entre leitores DIYSPUR.',
  alternates: { canonical: '/comunidade' },
};

type CommunityPost = {
  id: string;
  chapter_id: string;
  user_id: string;
  content: string | null;
  is_spoiler: boolean;
  is_locked: boolean;
  created_at: string;
};

export default async function CommunityPage() {
  let posts: CommunityPost[] = [];
  let viewerId: string | null = null;
  let hasError = false;
  const chapters = new Map<string, { id: string; title: string; number: number }>();
  const authors = new Map<string, { display_name: string | null; username: string | null }>();

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    try {
      const client = await createServerSupabase();
      const { data: claims } = await client.auth.getClaims();
      viewerId = typeof claims?.claims?.sub === 'string' ? claims.claims.sub : null;
      const { data, error } = await client
        .from('v_comments_visible')
        .select('id,chapter_id,user_id,content,is_spoiler,is_locked,created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Community feed query failed', error.code);
        hasError = true;
      } else {
        posts = (data ?? []) as CommunityPost[];
        const chapterIds = [...new Set(posts.map((post) => post.chapter_id))];
        const userIds = [...new Set(posts.map((post) => post.user_id))];
        const [{ data: chapterRows }, { data: authorRows }] = await Promise.all([
          client.from('chapters').select('id,title,number').in('id', chapterIds),
          client.from('v_profiles_public').select('id,display_name,username').in('id', userIds),
        ]);
        for (const chapter of chapterRows ?? []) chapters.set(chapter.id, chapter);
        for (const author of authorRows ?? []) if (author.id) authors.set(author.id, author);
      }
    } catch (error) {
      console.error('Community feed unavailable', error instanceof Error ? error.name : 'unknown_error');
      hasError = true;
    }
  }

  return (
    <section className="container">
      <header className="page-intro">
        <span className="eyebrow">Leitores, leitores</span>
        <h1>
          As boas conversas<br />
          <em>continuam aqui.</em>
        </h1>
        <p>Impressões, perguntas e aqueles detalhes que só aparecem quando a gente lê junto.</p>
      </header>

      {hasError ? (
        <div className="empty-state">
          <h2>Não foi possível carregar as conversas da comunidade agora.</h2>
          <p>Tente atualizar a página em alguns instantes.</p>
        </div>
      ) : posts.length ? (
        <div className="section" style={{ paddingTop: 10 }}>
          <div className="timeline">
            {posts.map((post) => {
              const chapter = chapters.get(post.chapter_id);
              const author = authors.get(post.user_id);
              return (
                <article className="member-card" key={post.id}>
                  {chapter && (
                    <Link className="field-hint" href={`/capitulos/${chapter.id}`}>
                      Capítulo {chapter.number} · {chapter.title}
                    </Link>
                  )}
                  <CommentSpoilerCard
                    content={post.content}
                    isSpoiler={post.is_spoiler}
                    isLocked={post.is_locked}
                    chapterNumber={chapter?.number}
                  />
                  <span className="field-hint">
                    {author?.display_name ?? (author?.username ? `@${author.username}` : 'Leitor da comunidade')} ·{' '}
                    {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(post.created_at))}
                  </span>
                  {viewerId && <ReportButton contentType="comment" contentId={post.id} path="/comunidade" />}
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-mark" aria-hidden="true">✳</div>
          <h2>Um lugar para pensar junto</h2>
          <p>
            As conversas dos capítulos aparecem por aqui conforme a leitura acontece. Quer começar? Escolha uma história e venha com suas perguntas.
          </p>
          <div className="empty-actions">
            <Link className="button button-small" href="/livros">
              Encontrar uma leitura
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
