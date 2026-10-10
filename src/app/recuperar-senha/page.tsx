import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RecoverPasswordForm } from '@/components/recover-password-form';

export const metadata: Metadata = { title: 'Recuperar senha', robots: { index: false, follow: false } };

export default function RecoverPasswordPage() {
  return <Suspense fallback={<div className="auth-wrap"><div className="auth-card">Preparando recuperação segura…</div></div>}><RecoverPasswordForm /></Suspense>;
}
