import { expect, test } from '@playwright/test';

const viewports = [375, 640, 768, 860, 1024, 1440];
const publicRoutes = ['/', '/livros', '/clubes', '/calendario', '/comunidade'];

test.describe('Acessibilidade e Responsividade Visual', () => {
  for (const route of publicRoutes) {
    for (const width of viewports) {
      test(`${route} sem overflow horizontal em ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        await expect.poll(async () => {
          return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
        }).toBe(true);
      });
    }
  }

  test('foco visível e salto de acessibilidade funcionam via teclado', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' });
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    const mainContent = page.locator('main#conteudo');
    await expect(mainContent).toBeFocused();
  });
});
