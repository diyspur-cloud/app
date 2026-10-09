export function safeLocalRedirect(value: string | null | undefined, fallback = '/perfil'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  try {
    const parsed = new URL(value, 'https://local.invalid');
    return parsed.origin === 'https://local.invalid' ? `${parsed.pathname}${parsed.search}${parsed.hash}` : fallback;
  } catch { return fallback; }
}
