import { describe, it, expect } from 'vitest';
import { sanitizeAnalyticsProperties } from '../../src/lib/analytics/events';

describe('Analytics Events Taxonomy and Sanitization', () => {
  it('filtra propriedades fora da allowlist documentada', () => {
    const raw = {
      page_path: '/livros',
      page_type: 'content',
      user_email: 'privado@diyspur.com',
      token: 'jwt.segredo.123',
    };

    const sanitized = sanitizeAnalyticsProperties('page_viewed', raw);

    expect(sanitized).toEqual({
      page_path: '/livros',
      page_type: 'content',
    });
    expect(sanitized).not.toHaveProperty('user_email');
    expect(sanitized).not.toHaveProperty('token');
  });

  it('trunca strings com mais de 100 caracteres', () => {
    const longPath = '/livros/' + 'a'.repeat(200);
    const sanitized = sanitizeAnalyticsProperties('page_viewed', {
      page_path: longPath,
      page_type: 'content',
    });

    expect(typeof sanitized.page_path).toBe('string');
    expect((sanitized.page_path as string).length).toBe(100);
  });

  it('permite valores numéricos finitos e booleanos válidos', () => {
    const sanitized = sanitizeAnalyticsProperties('search_performed', {
      query_length: 12,
      result_count: 5,
      search_scope: 'catalog',
    });

    expect(sanitized).toEqual({
      query_length: 12,
      result_count: 5,
      search_scope: 'catalog',
    });
  });

  it('remove propriedades não autorizadas em login_completed', () => {
    const sanitized = sanitizeAnalyticsProperties('login_completed', {
      auth_method: 'password',
      email: 'user@test.com',
      password: 'mypassword123',
    });

    expect(sanitized).toEqual({
      auth_method: 'password',
    });
    expect(sanitized).not.toHaveProperty('email');
    expect(sanitized).not.toHaveProperty('password');
  });
});
