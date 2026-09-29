import { expect, test, type Page } from '@playwright/test';

async function expectContentToFit(page: Page, scrollId: string) {
  const scroll = page.getByTestId(scrollId);
  await expect(scroll).toBeVisible();
  // Checking only document width misses overflow inside React Native ScrollViews.
  await expect.poll(() => scroll.evaluate(element => {
    element.scrollLeft = 100;
    return { extraWidth: element.scrollWidth - element.clientWidth, offset: element.scrollLeft };
  })).toEqual({ extraWidth: 0, offset: 0 });

  const overflowingControls = await page.getByRole('button').evaluateAll(elements => elements.flatMap(element => {
    const rect = element.getBoundingClientRect();
    const outside = rect.left < -1 || rect.right > window.innerWidth + 1;
    const clipped = element.scrollWidth > element.clientWidth + 1;
    return rect.width && (outside || clipped) ? [element.getAttribute('aria-label') || element.textContent] : [];
  }));
  expect(overflowingControls).toEqual([]);
}

for (const width of [280, 320, 360, 375, 390, 430]) {
  test(`conteúdo e painéis cabem em ${width}px sem rolagem lateral`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Olá, João.' })).toBeVisible();
    await expectContentToFit(page, 'home-scroll');

    for (const [button, heading] of [
      ['Ver fatura', 'Meu Ourocard'],
      ['Ver extrato', 'Extrato da conta'],
      ['Buscar serviços', 'Todos os serviços'],
      ['Falar com o BB', 'Fale com o BB'],
    ]) {
      await page.getByRole('button', { name: button, exact: true }).click();
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      if (heading === 'Todos os serviços') {
        await page.getByRole('textbox', { name: 'Buscar um serviço' }).fill('cartoes');
        await expect(page.getByRole('button', { name: 'Cartões', exact: true })).toBeVisible();
      }
      await expectContentToFit(page, 'service-scroll');
      await page.getByRole('button', { name: 'Fechar painel', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Início', exact: true }).click();
    await expect(page.getByTestId('account-balance')).toBeVisible();
    await expectContentToFit(page, 'home-scroll');
  });
}
