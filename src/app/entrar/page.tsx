import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { requireSession } from '@/lib/auth/session';
import { safeLocalRedirect } from '@/lib/safe-redirect';

export const metadata: Metadata = {
  title: 'Entrar',
  robots: { index: false, follow: false },
};

export default async function SigninPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const session = await requireSession();
  if (session) {
    const params = await searchParams;
    redirect(safeLocalRedirect(params?.redirect, '/perfil'));
  }

  return (
    <Suspense fallback={<div className="auth-wrap"><div className="auth-card">Carregando acesso…</div></div>}>
      <AuthForm mode="signin" />
    </Suspense>
  );
}
