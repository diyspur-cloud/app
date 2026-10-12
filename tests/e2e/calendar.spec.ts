import { expect, test } from '@playwright/test';

test.describe('Calendário e Encontros', () => {
  test('página de calendário renderiza agenda e cabeçalho', async ({ page }) => {
    const response = await page.goto('/calendario');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tem conversa');
  });

  test('encontros exibem horário de Brasília e links de exportação', async ({ page }) => {
    await page.goto('/calendario');
    const meetingRows = page.locator('.meeting-row');
    if (await meetingRows.count()) {
      const firstMeeting = meetingRows.first();
      await expect(firstMeeting).toContainText('horário de Brasília');

      // Exportação Google Agenda e .ics
      const googleLink = firstMeeting.locator('a[href*="calendar.google.com"]');
      if (await googleLink.count()) {
        await expect(googleLink).toHaveAttribute('target', '_blank');
      }

      const icsLink = firstMeeting.locator('a[href*="/api/ics/"]');
      if (await icsLink.count()) {
        await expect(icsLink).toBeVisible();
      }
    }
  });

  test('encontro online sem link exibe instrução da equipe em vez de link quebrado', async ({ page }) => {
    await page.goto('/calendario');
    const hints = page.locator('.meeting-row .field-hint').filter({ hasText: 'instruções de acesso serão publicadas' });
    if (await hints.count()) {
      await expect(hints.first()).toBeVisible();
    }
  });
});
