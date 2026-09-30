/// <reference types="node" />
import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

async function openInspector(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir central de inspeção', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Supervisão, com evidências.' })).toBeVisible();
}

test('revisão humana permite retomada e persiste sem alterar a nota histórica', async ({ page }) => {
  await openInspector(page);
  await page.getByRole('button', { name: 'Investigar bloqueio', exact: true }).click();
  await expect(page.getByTestId('run-score')).toContainText('75');
  await expect(page.getByRole('button', { name: 'Retomar Atlas', exact: true })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Nota da revisão humana' }).fill('Escopo corrigido e conferido nesta simulação.');
  await page.getByRole('button', { name: 'Registrar revisão', exact: true }).click();
  await page.getByRole('button', { name: 'Retomar Atlas', exact: true }).click();
  await expect(page.getByTestId('run-score')).toContainText('75');
  await expect.poll(() => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('@bb/inspector/session/v1') || '{}');
    return saved.robots?.atlas.paused;
  })).toBe(false);
  await openInspector(page);
  await page.getByRole('button', { name: /Inspecionar RUN-0004/ }).click();
  await expect(page.getByTestId('run-score')).toContainText('75');
  await expect(page.getByText('Escopo corrigido e conferido nesta simulação.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('inspection-detail').getByText('Bloqueada', { exact: true })).toBeVisible();
});

test('cenário sem evidência gera avaliação provisória com critérios explicados', async ({ page }) => {
  await openInspector(page);
  await page.getByRole('button', { name: /^Escolher cenário:/ }).click();
  await page.getByRole('button', { name: 'Cenário: Evidência ausente', exact: true }).click();
  await page.getByRole('button', { name: 'Executar cenário', exact: true }).click();
  await page.getByRole('button', { name: /Inspecionar RUN-0005/ }).click();
  await expect(page.getByTestId('run-score')).toContainText('55');
  await expect(page.getByText('Nota provisória', { exact: true })).toBeVisible();
  await expect(page.getByText('Sem evidência suficiente', { exact: true })).toHaveCount(3);
});

test('sequência pode ser pausada e para ao sair da central', async ({ page }) => {
  await page.clock.install();
  await openInspector(page);
  await page.getByRole('button', { name: 'Iniciar sequência automática', exact: true }).click();
  await page.clock.fastForward(8100);
  await expect(page.getByRole('button', { name: /Inspecionar RUN-0005/ })).toBeVisible();
  await page.getByRole('button', { name: 'Pausar sequência', exact: true }).click();
  await page.clock.fastForward(16000);
  await expect(page.getByRole('button', { name: /Inspecionar RUN-0006/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Iniciar sequência automática', exact: true }).click();
  await page.getByRole('button', { name: 'Fechar central de inspeção', exact: true }).click();
  await page.clock.fastForward(16000);
  await page.getByRole('button', { name: 'Abrir central de inspeção', exact: true }).click();
  await expect(page.getByRole('button', { name: /Inspecionar RUN-0006/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Iniciar sequência automática', exact: true })).toBeVisible();
});

test('auditoria recalcula a sessão e exporta um relatório JSON completo', async ({ page }) => {
  await openInspector(page);
  await page.getByRole('button', { name: 'Seção Auditoria', exact: true }).click();
  await page.getByRole('button', { name: 'Auditar sessão', exact: true }).click();
  await expect(page.getByTestId('audit-events').getByText(/4 execuções recalculadas.*0 divergências/)).toBeVisible();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar relatório JSON', exact: true }).click();
  const file = await downloaded;
  const report = JSON.parse(await readFile((await file.path())!, 'utf8'));
  expect(report.simulated).toBe(true);
  expect(report.runs).toHaveLength(4);
  expect(report.rules).toHaveLength(6);
  expect(report.auditTrail.at(-1).title).toBe('Auditoria da sessão concluída');
});
