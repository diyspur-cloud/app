import type { Metadata } from 'next';import { Suspense } from 'react';import { AuthForm } from '@/components/auth-form';
export const metadata:Metadata={title:'Fazer parte',robots:{index:false,follow:false}};
export default function SignupPage(){return <Suspense fallback={<div className="auth-wrap"><div className="auth-card">Preparando seu cadastro…</div></div>}><AuthForm mode="signup"/></Suspense>;}
