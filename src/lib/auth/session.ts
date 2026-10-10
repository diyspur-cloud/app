import 'server-only';
import { createServerSupabase } from '@/lib/supabase/clients';

export async function requireSession() {
  const client = await createServerSupabase();
  const { data, error } = await client.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || typeof userId !== 'string') return null;
  return { client, userId };
}
