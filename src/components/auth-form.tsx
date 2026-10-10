'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { safeLocalRedirect } from '@/lib/safe-redirect';
import { createBrowserSupabase } from '@/lib/supabase/browser';

const emailSchema = z.email('Informe um email válido.');
const passwordSchema = z.string().min(1, 'Informe sua senha.').max(128, 'A senha deve ter até 128 caracteres.');
const signupPasswordSchema = z.string().min(10, 'Use pelo menos 10 caracteres.').max(128, 'A senha deve ter até 128 caracteres.');

function callbackUrl(destination: string): string {
  return `${location.origin}/auth/callback?next=${encodeURIComponent(destination)}`;
}

function callbackMessage(value: string | null): string {
  if (value === 'callback') return 'O link expirou ou já foi usado. Solicite um novo acesso.';
  if (value === 'recovery') return 'Não foi possível abrir a recuperação de senha. Solicite outro email.';
  return value ? 'Não foi possível concluir este acesso. Tente novamente.' : '';
}

export function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState(() => callbackMessage(params.get('erro')));
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const signup = mode === 'signup';
  const readOnlyPreview = process.env.NEXT_PUBLIC_READ_ONLY_PREVIEW === '1';
  const destination = safeLocalRedirect(params.get('redirect'), '/perfil');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    const emailResult = emailSchema.safeParse(form.get('email'));
    const passwordResult = (signup ? signupPasswordSchema : passwordSchema).safeParse(form.get('password'));
    const displayName = String(form.get('displayName') ?? '').trim();
    const username = String(form.get('username') ?? '').trim().toLowerCase();
    if (!emailResult.success) { setError(emailResult.error.issues[0]?.message ?? 'Informe um email válido.'); return; }
    if (!passwordResult.success) { setError(passwordResult.error.issues[0]?.message ?? 'Revise sua senha.'); return; }
    if (signup && readOnlyPreview) { setError('O cadastro está desativado na prévia pública.'); return; }
    if (signup && (displayName.length < 2 || !/^[a-z0-9_]{3,24}$/.test(username))) { setError('Informe seu nome e um usuário (3–24 letras, números ou _).'); return; }
    setBusy(true);
    try {
      const supabase = createBrowserSupabase();
      if (signup) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: emailResult.data,
          password: passwordResult.data,
          options: { emailRedirectTo: callbackUrl(destination), data: { display_name: displayName, username } },
        });
        if (authError) throw authError;
        if (!data.session) { setMessage('Quase lá: confira seu email para confirmar o cadastro e continuar.'); return; }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: emailResult.data, password: passwordResult.data });
        if (authError) throw authError;
      }
      router.replace(destination); router.refresh();
    } catch (cause) {
      const code = cause instanceof Error ? cause.message.toLowerCase() : '';
      setError(code.includes('invalid login credentials') ? 'Email ou senha não conferem.' : code.includes('user already registered') ? 'Esse email já possui cadastro. Entre na sua conta.' : code.includes('email not confirmed') ? 'Confirme seu email antes de entrar.' : 'Não foi possível concluir. Confira sua conexão e tente novamente.');
    } finally { setBusy(false); }
  }

  async function magicLink() {
    setError(''); setMessage('');
    const form = document.querySelector<HTMLFormElement>('#auth-form');
    const email = String(new FormData(form ?? undefined).get('email') ?? '').trim();
    const valid = emailSchema.safeParse(email);
    if (!valid.success) { setError('Digite seu email acima para receber o link.'); return; }
    setBusy(true);
    try {
      const { error: linkError } = await createBrowserSupabase().auth.signInWithOtp({ email: valid.data, options: { emailRedirectTo: callbackUrl(destination) } });
      if (linkError) throw linkError;
      setMessage('Se este endereço estiver cadastrado, enviaremos um link para entrar.');
    } catch { setError('Não foi possível enviar o link agora. Tente novamente.'); }
    finally { setBusy(false); }
  }

  return <section className="auth-wrap"><div className="auth-card"><span className="eyebrow">Seu próximo capítulo</span><h1>{signup ? 'Encontre sua turma.' : 'Bom ter você de volta.'}</h1><p>{signup ? 'Crie seu espaço de leitura e acompanhe histórias com outras pessoas.' : 'Entre para continuar suas leituras e conversas.'}</p><form id="auth-form" className="auth-form" onSubmit={submit} noValidate>{signup && <><div className="field-group"><label htmlFor="displayName">Como podemos chamar você?</label><input className="field" id="displayName" name="displayName" autoComplete="name" maxLength={80} required /></div><div className="field-group"><label htmlFor="username">Nome de usuário</label><input className="field" id="username" name="username" autoComplete="username" minLength={3} maxLength={24} pattern="[a-zA-Z0-9_]+" required /><span className="field-hint">3–24 letras, números ou _</span></div></>}<div className="field-group"><label htmlFor="email">Email</label><input className="field" id="email" name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} required /></div><div className="field-group"><label htmlFor="password">Senha</label><div className="password-field"><input className="field" id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} minLength={signup ? 10 : 1} maxLength={128} required /><button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? 'Ocultar' : 'Mostrar'}</button></div><span className="field-hint">{signup ? 'Pelo menos 10 caracteres.' : 'Use a senha cadastrada.'}</span></div>{error && <p className="auth-alert" role="alert">{error}</p>}{message && <p className="auth-alert auth-success" role="status">{message}</p>}<button className="button" type="submit" disabled={busy || (signup && readOnlyPreview)}>{busy ? 'Um instante…' : signup ? 'Criar minha conta' : 'Entrar na comunidade'}</button>{!signup && <><button className="button button-quiet" type="button" onClick={magicLink} disabled={busy || readOnlyPreview}>Receber um link de acesso</button><Link className="text-link auth-recovery-link" href={{ pathname: '/recuperar-senha', query: { redirect: destination } }}>Esqueci minha senha</Link></>}</form><p className="auth-switch">{signup ? 'Já faz parte?' : 'Ainda não tem conta?'}{' '}<Link href={{ pathname: signup ? '/entrar' : '/cadastro', query: { redirect: destination } }}>{signup ? 'Entrar' : 'Conheça o clube'}</Link></p></div></section>;
}
