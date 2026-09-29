import { expect, test } from '@playwright/test';

test('início bancário responsivo e detalhes do cartão', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Olá, João.' })).toBeVisible();
  await expect(page.getByTestId('account-balance')).toContainText('4.850,75');
  await expect(page.getByTestId('invoice-amount')).toContainText('1.248,90');
  await page.getByRole('button', { name: 'Ver fatura', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Meu Ourocard' })).toBeVisible();
  await expect(page.getByText('Compras nesta fatura', { exact: true })).toBeVisible();
  await expect(page.getByText(/Nenhuma operação bancária real/)).toBeVisible();
  await page.getByRole('button', { name: 'Fechar painel', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Meu Ourocard' })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('privacidade oculta os valores da página e persiste após recarga', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ocultar valores', exact: true }).click();
  await expect(page.getByTestId('account-balance')).toHaveText('••••••');
  await expect(page.getByTestId('invoice-amount')).toHaveText('••••••');
  await expect(page.getByText(/R\$/)).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('@bb/home/preferences/v1') || '{}').valuesVisible)).toBe(false);
  await page.reload();
  await expect(page.getByTestId('account-balance')).toHaveText('••••••');
  await page.getByRole('button', { name: 'Ver fatura', exact: true }).click();
  await expect(page.getByText(/R\$/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Fechar painel', exact: true }).click();
  await page.getByRole('button', { name: 'Mostrar valores', exact: true }).click();
  await expect(page.getByTestId('account-balance')).toContainText('4.850,75');
});

test('extrato filtra entradas e saídas e a busca encontra serviços sem acentos', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ver extrato', exact: true }).click();
  const statement = page.getByTestId('statement-list');
  await expect(statement.getByText('Mariana Lima', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Entradas', exact: true }).click();
  await expect(statement.getByText('Mariana Lima', { exact: true })).toBeVisible();
  await expect(statement.getByText('Pão de Açúcar', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Saídas', exact: true }).click();
  await expect(statement.getByText('Mariana Lima', { exact: true })).toHaveCount(0);
  await expect(statement.getByText('Pão de Açúcar', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Fechar painel', exact: true }).click();
  await page.getByRole('button', { name: 'Buscar serviços', exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar um serviço' }).fill('cartoes');
  await page.getByRole('button', { name: 'Cartões', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Meu Ourocard' })).toBeVisible();
});

test('avisos são marcados como lidos e a ajuda responde na mesma página', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Notificações, 2 não lidas' }).click();
  await expect(page.getByText('Sua fatura está disponível', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Fechar painel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Notificações', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('@bb/home/preferences/v1') || '{}').notificationsRead)).toBe(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Notificações', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Falar com o BB', exact: true }).click();
  await page.getByRole('button', { name: 'Como ocultar meu saldo?' }).click();
  await expect(page.getByText('Toque no ícone de olho no bloco Conta corrente.', { exact: false })).toBeVisible();
});
