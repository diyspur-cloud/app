import { expect, test } from '@playwright/test';

test.describe('Autenticação e Feedback Contextual', () => {
  test('visita anônima ao diário redireciona para entrar com reason=login-required', async ({ page }) => {
    await page.goto('/diario');
    const url = new URL(page.url());
    expect(url.pathname).toBe('/entrar');
    expect(url.searchParams.get('redirect')).toBe('/diario');
    expect(url.searchParams.get('reason')).toBe('login-required');

    const contextualNotice = page.locator('p.notice');
    await expect(contextualNotice).toBeVisible();
    await expect(contextualNotice).toContainText('Entre na sua conta para acessar este espaço');
  });

  test('botão de mostrar/ocultar senha alterna tipo do input', async ({ page }) => {
    await page.goto('/entrar');
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.locator('.password-toggle');

    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('cadastro exige senha de pelo menos 10 caracteres', async ({ page }) => {
    await page.goto('/cadastro');
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toHaveAttribute('minlength', '10');
  });

  test('bloqueia open redirect malicioso para domínios externos', async ({ page }) => {
    await page.goto('/entrar?redirect=https%3A%2F%2Fevil.example.com');
    await expect(page.getByRole('button', { name: 'Entrar na comunidade' })).toBeVisible();
    await page.goto('/entrar?redirect=%2F%2Fevil.example.com');
    await expect(page.getByRole('button', { name: 'Entrar na comunidade' })).toBeVisible();
  });
});
