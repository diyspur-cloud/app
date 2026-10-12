/**
 * Modo de prévia pública somente leitura (`DIYSPUR_READ_ONLY_PREVIEW=1`).
 * Centraliza a checagem antes repetida em cada Server Action de escrita.
 */
export const READ_ONLY_PREVIEW_MESSAGE = 'A prévia pública está em modo somente leitura.';

export function isReadOnlyPreview(): boolean {
  return process.env.DIYSPUR_READ_ONLY_PREVIEW === '1';
}
