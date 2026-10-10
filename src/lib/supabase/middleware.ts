import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function refreshSupabaseSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (updates, headers) => {
        updates.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        updates.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  // getClaims validates the signature. Do not authorize based on user-editable user_metadata.
  const { data } = await supabase.auth.getClaims();
  const isPrivate = /^\/(perfil|ranking|notificacoes|historico)(\/|$)/.test(request.nextUrl.pathname)
    || /^\/admin(\/|$)/.test(request.nextUrl.pathname);
  if (isPrivate && !data?.claims) {
    const destination = request.nextUrl.clone();
    destination.pathname = '/entrar';
    destination.searchParams.set('redirect', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(destination);
  }
  return response;
}
