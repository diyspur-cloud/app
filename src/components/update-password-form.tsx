'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { safeLocalRedirect } from '@/lib/safe-redirect';
import { createBrowserSupabase } from '@/lib/supabase/browser';

const passwordSchema = z.string().min(10, 'Use pelo menos 10 caracteres.').max(128, 'A senha deve ter até 128 caracteres.');

export function UpdatePasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const destination = safeLocalRedirect(params.get('redirect'), '/perfil');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('');
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Revise sua senha.'); return; }
    if (password !== confirmation) { setError('As senhas precisam ser iguais.'); return; }
    setBusy(true);
    try {
      const { error: updateError } = await createBrowserSupabase().auth.updateUser({ password: parsed.data });
      if (updateError) throw updateError;
      setMessage('Senha atualizada. Você já pode continuar sua leitura.');
      window.setTimeout(() => { router.replace(destination); router.refresh(); }, 500);
    } catch {
      setError('O link pode ter expirado. Solicite uma nova recuperação e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="auth-wrap"><div className="auth-card"><span className="eyebrow">Acesso seguro</span><h1>Crie uma nova senha.</h1><p>Escolha uma senha com pelo menos 10 caracteres.</p><form className="auth-form" onSubmit={submit} noValidate><div className="field-group"><label htmlFor="new-password">Nova senha</label><input className="field" id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div><div className="field-group"><label htmlFor="new-password-confirmation">Repita a nova senha</label><input className="field" id="new-password-confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></div>{error && <p className="auth-alert" role="alert">{error}</p>}{message && <p className="auth-alert auth-success" role="status">{message}</p>}<button className="button" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Atualizar senha'}</button></form><p className="auth-switch"><Link href="/entrar">Voltar para entrar</Link></p></div></section>;
}
