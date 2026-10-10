'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { safeLocalRedirect } from '@/lib/safe-redirect';
import { createBrowserSupabase } from '@/lib/supabase/browser';

const emailSchema = z.email('Informe um email válido.');

export function RecoverPasswordForm() {
  const params = useSearchParams();
  const destination = safeLocalRedirect(params.get('redirect'), '/perfil');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('');
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Informe um email válido.'); return; }
    setBusy(true);
    try {
      const { error: resetError } = await createBrowserSupabase().auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(`/atualizar-senha?redirect=${encodeURIComponent(destination)}`)}`,
      });
      if (resetError) throw resetError;
      setMessage('Se houver uma conta para este endereço, enviaremos instruções para criar uma nova senha.');
    } catch { setError('Não foi possível solicitar a recuperação agora. Tente novamente.'); }
    finally { setBusy(false); }
  }

  return <section className="auth-wrap"><div className="auth-card"><span className="eyebrow">Acesso seguro</span><h1>Recupere sua senha.</h1><p>Enviaremos um link para o endereço informado. O link expira depois de um tempo.</p><form className="auth-form" onSubmit={submit} noValidate><div className="field-group"><label htmlFor="recovery-email">Email</label><input className="field" id="recovery-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>{error && <p className="auth-alert" role="alert">{error}</p>}{message && <p className="auth-alert auth-success" role="status">{message}</p>}<button className="button" disabled={busy} type="submit">{busy ? 'Enviando…' : 'Enviar instruções'}</button></form><p className="auth-switch"><Link href={{ pathname: '/entrar', query: { redirect: destination } }}>Voltar para entrar</Link></p></div></section>;
}
