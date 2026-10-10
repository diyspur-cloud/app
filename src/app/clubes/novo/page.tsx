import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/session';
import { ClubForm } from '@/components/clubs/club-form';
export const metadata: Metadata = { title: 'Criar clube', robots: { index: false, follow: false } };
export default async function NewClubPage() { const session = await requireSession(); if (!session) redirect('/entrar?redirect=/clubes/novo'); return <section className="container"><header className="page-intro"><span className="eyebrow">Seu espaço</span><h1>Uma conversa<br /><em style={{ color: 'var(--color-primary)' }}>com endereço.</em></h1></header><ClubForm /></section>; }
