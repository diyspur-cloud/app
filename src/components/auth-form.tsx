'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { safeLocalRedirect } from '@/lib/safe-redirect';
import { createBrowserSupabase } from '@/lib/supabase/browser';

const schema = z.object({ email: z.email('Informe um email válido.'), password: z.string().min(10, 'Use pelo menos 10 caracteres.') });

export function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const router = useRouter(); const params = useSearchParams();
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const signup = mode === 'signup';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({ email: form.get('email'), password: form.get('password') });
    const displayName = String(form.get('displayName') ?? '').trim();
    const username = String(form.get('username') ?? '').trim().toLowerCase();
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Revise seus dados.'); return; }
    if (signup && (displayName.length < 2 || !/^[a-z0-9_]{3,24}$/.test(username))) { setError('Informe seu nome e um usuário (3–24 letras, números ou _).'); return; }
    setBusy(true);
    try {
      const supabase = createBrowserSupabase();
      if (signup) {
        const { data, error: authError } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { emailRedirectTo: `${location.origin}/auth/callback?next=/perfil`, data: { display_name: displayName, username } } });
        if (authError) throw authError;
        if (!data.session) { setMessage('Quase lá: confira seu email para confirmar o cadastro e entrar no clube.'); return; }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);
        if (authError) throw authError;
      }
      router.replace(safeLocalRedirect(params.get('redirect'))); router.refresh();
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : '';
      setError(code.toLowerCase().includes('invalid login credentials') ? 'Email ou senha não conferem.' : code.toLowerCase().includes('user already registered') ? 'Esse email já possui cadastro. Entre na sua conta.' : 'Não foi possível concluir. Confira sua conexão e tente novamente.');
    } finally { setBusy(false); }
  }
  async function magicLink() {
    setError(''); setMessage(''); const form = document.querySelector<HTMLFormElement>('#auth-form');
    const email = String(new FormData(form ?? undefined).get('email') ?? ''); const valid = z.email().safeParse(email);
    if (!valid.success) { setError('Digite seu email acima para receber o link.'); return; }
    setBusy(true);
    try { const { error: linkError } = await createBrowserSupabase().auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback?next=/perfil` } }); if (linkError) throw linkError; setMessage('Se este endereço estiver cadastrado, enviaremos um link para entrar.'); }
    catch { setError('Não foi possível enviar o link agora. Tente novamente.'); }
    finally { setBusy(false); }
  }
  return <section className="auth-wrap"><div className="auth-card"><span className="eyebrow">Seu próximo capítulo</span><h1>{signup ? 'Encontre sua turma.' : 'Bom ter você de volta.'}</h1><p>{signup ? 'Crie seu espaço de leitura e acompanhe histórias com outras pessoas.' : 'Entre para continuar suas leituras e conversas.'}</p><form id="auth-form" className="auth-form" onSubmit={submit} noValidate>{signup && <><div className="field-group"><label htmlFor="displayName">Como podemos chamar você?</label><input className="field" id="displayName" name="displayName" autoComplete="name" maxLength={80} required/></div><div className="field-group"><label htmlFor="username">Nome de usuário</label><input className="field" id="username" name="username" autoComplete="username" minLength={3} maxLength={24} pattern="[a-zA-Z0-9_]+" required/><span className="field-hint">3–24 letras, números ou _</span></div></>}<div className="field-group"><label htmlFor="email">Email</label><input className="field" id="email" name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} required/></div><div className="field-group"><label htmlFor="password">Senha</label><input className="field" id="password" name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={10} maxLength={128} required/><span className="field-hint">Pelo menos 10 caracteres.</span></div>{error && <p className="auth-alert" role="alert">{error}</p>}{message && <p className="auth-alert auth-success" role="status">{message}</p>}<button className="button" type="submit" disabled={busy}>{busy ? 'Um instante…' : signup ? 'Criar minha conta' : 'Entrar na comunidade'}</button>{!signup && <button className="button button-quiet" type="button" onClick={magicLink} disabled={busy}>Receber um link de acesso</button>}</form><p className="auth-switch">{signup ? 'Já faz parte?' : 'Ainda não tem conta?'}{' '}<Link href={signup ? '/entrar' : '/cadastro'}>{signup ? 'Entrar' : 'Conheça o clube'}</Link></p></div></section>;
}
