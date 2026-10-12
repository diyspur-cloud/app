import { describe, it, expect, vi } from 'vitest';
import { logStructured } from '../../src/lib/observability/logger';

describe('Structured Observability Logger', () => {
  it('formata logs em linha JSON com campos allowlisted', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logStructured({
      level: 'error',
      event: 'catalog_query_failed',
      route: '/livros',
      error_code: 'db_timeout',
      request_id: 'req-12345',
    });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const loggedRaw = errorSpy.mock.calls[0]?.[0];
    const parsed = JSON.parse(loggedRaw as string);

    expect(parsed.level).toBe('error');
    expect(parsed.event).toBe('catalog_query_failed');
    expect(parsed.route).toBe('/livros');
    expect(parsed.error_code).toBe('db_timeout');
    expect(parsed.request_id).toBe('req-12345');
    expect(parsed.service).toBe('diyspur-web');

    errorSpy.mockRestore();
  });

  it('redige e trunca strings longas', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const longRoute = '/livros/' + 'x'.repeat(300);
    logStructured({
      level: 'info',
      event: 'page_render',
      route: longRoute,
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(infoSpy.mock.calls[0]?.[0] as string);
    expect((parsed.route as string).length).toBe(200);

    infoSpy.mockRestore();
  });
});
