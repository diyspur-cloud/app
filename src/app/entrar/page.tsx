import type { Metadata } from 'next';import { Suspense } from 'react';import { AuthForm } from '@/components/auth-form';
export const metadata:Metadata={title:'Entrar',robots:{index:false,follow:false}};
export default function SigninPage(){return <Suspense fallback={<div className="auth-wrap"><div className="auth-card">Carregando acesso…</div></div>}><AuthForm mode="signin"/></Suspense>;}
