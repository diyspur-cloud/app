import type { Metadata } from 'next';
import { Suspense } from 'react';
import { UpdatePasswordForm } from '@/components/update-password-form';

export const metadata: Metadata = { title: 'Atualizar senha', robots: { index: false, follow: false } };

export default function UpdatePasswordPage() {
  return <Suspense fallback={<div className="auth-wrap"><div className="auth-card">Abrindo recuperação segura…</div></div>}><UpdatePasswordForm /></Suspense>;
}
