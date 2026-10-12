export function assertApprovedStaging() {
  const target = __ENV.BASE_URL;
  if (!target) throw new Error('Defina BASE_URL para o ambiente aprovado de staging.');

  const url = new URL(target);
  const forbiddenHosts = new Set([
    'diyspur.vercel.app',
    'diyspur.com',
    'www.diyspur.com',
  ]);
  if (forbiddenHosts.has(url.hostname.toLowerCase())) {
    throw new Error(`Carga bloqueada: ${url.hostname} é host de produção.`);
  }
  if (url.protocol !== 'https:' && url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
    throw new Error('Staging remoto deve usar HTTPS.');
  }
  if (__ENV.LOAD_TEST_APPROVED !== 'yes') {
    throw new Error('Defina LOAD_TEST_APPROVED=yes apenas após aprovação explícita da janela.');
  }
  return target.replace(/\/$/, '');
}
