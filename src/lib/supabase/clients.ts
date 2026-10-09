import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured. Set the public project URL and publishable key.');
  const jar = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (updates) => {
        try { updates.forEach(({ name, value, options }) => jar.set(name, value, options)); }
        catch { /* Server Components cannot mutate cookies; middleware refreshes them. */ }
      },
    },
  });
}
