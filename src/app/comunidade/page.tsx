import type { Metadata } from 'next';
import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/clients';

export const metadata: Metadata = { title: 'Comunidade', description: 'Ideias, perguntas e conversas entre leitores DIYSPUR.' };

type CommunityPost = { id: string; chapter_id: string; content: string | null; is_spoiler: boolean; is_locked: boolean; created_at: string };

export default async function CommunityPage() {
  let posts: CommunityPost[] = [];
  const chapters = new Map<string, { id: string; title: string; number: number }>();
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    try {
      const client = await createServerSupabase();
      const { data } = await client.from('v_comments_visible').select('id,chapter_id,content,is_spoiler,is_locked,created_at').order('created_at', { ascending: false }).limit(24);
      posts = (data ?? []) as CommunityPost[];
      const chapterIds = [...new Set(posts.map((post) => post.chapter_id))];
      if (chapterIds.length) {
        const { data: chapterRows } = await client.from('chapters').select('id,title,number').in('id', chapterIds).limit(24);
        for (const chapter of chapterRows ?? []) chapters.set(chapter.id, chapter);
      }
    } catch (error) {
      console.error('Community feed unavailable', error instanceof Error ? error.name : 'unknown_error');
    }
  }
  return <section className="container"><header className="page-intro"><span className="eyebrow">Leitores, leitores</span><h1>As boas conversas<br /><em style={{ color: 'var(--color-primary)' }}>continuam aqui.</em></h1><p>Impressões, perguntas e aqueles detalhes que só aparecem quando a gente lê junto.</p></header>{posts.length ? <div className="timeline section" style={{ paddingTop: 10 }}>{posts.map((post) => { const chapter = chapters.get(post.chapter_id); return <article className="member-card" key={post.id}>{chapter && <Link className="field-hint" href={`/capitulos/${chapter.id}`}>Capítulo {chapter.number} · {chapter.title}</Link>}{post.is_locked || post.content === null ? <p className="spoiler-locked">Spoiler protegido. Avance seu progresso no capítulo para revelar este comentário.</p> : post.is_spoiler ? <details><summary className="text-link">Este comentário pode conter spoiler. Revelar?</summary><p>{post.content}</p></details> : <p>{post.content}</p>}<span className="field-hint">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(post.created_at))} · conversa do clube</span></article>; })}</div> : <div className="empty-state"><div className="empty-state-mark" aria-hidden="true">✳</div><h2>Um lugar para pensar junto</h2><p>As conversas dos capítulos aparecem por aqui conforme a leitura acontece. Quer começar? Escolha uma história e venha com suas perguntas.</p><div className="empty-actions"><Link className="button button-small" href="/livros">Encontrar uma leitura</Link></div></div>}</section>;
}
