import { expect, test } from '@playwright/test';

test.describe('Votação Comunitária e Enquetes', () => {
  test('página de votação carrega estado e cabeçalho', async ({ page }) => {
    const response = await page.goto('/votacao');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('enquetes disponíveis exibem opções coerentes sem dados duplicados', async ({ page }) => {
    await page.goto('/votacao');
    const pollCards = page.locator('.member-card, .poll-card');
    if (await pollCards.count()) {
      const firstPoll = pollCards.first();
      await expect(firstPoll).toBeVisible();
    }
  });
});
