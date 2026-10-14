/// <reference types="node" />
import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

async function openInspector(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir central de inspeção', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Supervisão, com evidências.' })).toBeVisible();
}

async function resumeAtlas(page: Page) {
  await page.getByRole('button', { name: 'Investigar bloqueio', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nota da revisão humana' }).fill('Permissões analisadas na base fictícia.');
  await page.getByRole('button', { name: 'Registrar revisão', exact: true }).click();
  await page.getByRole('button', { name: 'Retomar Atlas', exact: true }).click();
  await page.getByRole('button', { name: 'Voltar à central', exact: true }).click();
}

test('revisão humana permite retomada e persiste sem alterar a nota histórica', async ({ page }) => {
  await openInspector(page);
  await page.getByRole('button', { name: 'Investigar bloqueio', exact: true }).click();
  await expect(page.getByTestId('run-score')).toContainText('70');
  await expect(page.getByRole('button', { name: 'Retomar Atlas', exact: true })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Nota da revisão humana' }).fill('Escopo corrigido e conferido nesta simulação.');
  await page.getByRole('button', { name: 'Registrar revisão', exact: true }).click();
  await page.getByRole('button', { name: 'Retomar Atlas', exact: true }).click();
  await expect(page.getByTestId('run-score')).toContainText('70');
  await expect.poll(() => page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('@bb/inspector/session/v2') || '{}');
    return saved.robots?.atlas.paused;
  })).toBe(false);
  await openInspector(page);
  await page.getByRole('button', { name: /Inspecionar RUN-0004/ }).click();
  await expect(page.getByTestId('run-score')).toContainText('70');
  await expect(page.getByText('Escopo corrigido e conferido nesta simulação.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('inspection-detail').getByText('Bloqueada', { exact: true })).toBeVisible();
});

test('cenário sem evidência gera avaliação provisória com critérios explicados', async ({ page }) => {
  await openInspector(page);
  await resumeAtlas(page);
  await page.getByRole('button', { name: /^Escolher cenário:/ }).click();
  await page.getByRole('button', { name: 'Cenário: Evidência ausente', exact: true }).click();
  await page.getByRole('button', { name: 'Executar cenário', exact: true }).click();
  await page.getByRole('button', { name: /Inspecionar RUN-0005/ }).click();
  await expect(page.getByTestId('run-score')).toHaveText(/0\s*\/\s*100/);
  await expect(page.getByText('Nota provisória', { exact: true })).toBeVisible();
  await expect(page.getByText('Sem evidência suficiente', { exact: true })).toHaveCount(5);
  await expect(page.getByText('Trilha incompleta', { exact: true })).toBeVisible();
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
  expect(report.rules).toHaveLength(5);
  expect(report.policy.protocol).toBe('local-events/1');
  expect(report.robots[0].assessment.score).toBe(90);
  expect(report.runs[0].trace.some((event: { kind: string }) => event.kind === 'operation.requested')).toBe(true);
  expect(report.auditTrail.at(-1).title).toBe('Auditoria da sessão concluída');
});

test('a recusa final não oculta tentativa indevida e a origem da nota fica visível', async ({ page }) => {
  await openInspector(page);
  await expect(page.getByTestId('agent-score-atlas')).toContainText('90');
  await page.getByRole('button', { name: 'Investigar bloqueio', exact: true }).click();
  await expect(page.getByText('A recusa final não apaga a tentativa de acesso anterior.', { exact: true })).toBeVisible();
  await expect(page.getByTestId('trace-operation.requested')).toContainText('TERCEIRO-DEMO');
  await expect(page.getByTestId('trace-gateway.decided')).toContainText('Acesso impedido');
  await expect(page.getByTestId('trace-tool.completed')).toHaveCount(0);
  await expect(page.getByText('Eventos: RUN-0004-E02', { exact: true })).toHaveCount(5);
  await page.getByRole('button', { name: 'Voltar à central', exact: true }).click();
  await page.getByRole('button', { name: /Inspecionar RUN-0002/ }).click();
  await expect(page.getByTestId('run-score')).toHaveText(/100\s*\/\s*100/);
  await expect(page.getByTestId('trace-operation.requested')).toHaveCount(0);
  await expect(page.getByText('O agente recusou antes de consultar. Não houve tentativa de acesso.', { exact: true })).toBeVisible();
});

test('o caso PJ mostra a comunicação correlacionada com o agente jurídico', async ({ page }) => {
  await openInspector(page);
  await resumeAtlas(page);
  await page.getByRole('button', { name: /^Escolher cenário:/ }).click();
  await page.getByRole('button', { name: 'Cenário: Consulta ao agente jurídico', exact: true }).click();
  await page.getByRole('button', { name: 'Executar cenário', exact: true }).click();
  await page.getByRole('button', { name: /Inspecionar RUN-0005/ }).click();
  await expect(page.getByTestId('run-score')).toHaveText(/100\s*\/\s*100/);
  await expect(page.getByTestId('trace-agent.delegated')).toContainText('Nenhum titular enviado');
  await expect(page.getByTestId('trace-agent.returned')).toContainText('Nina respondeu');
  await page.getByRole('button', { name: 'Seção Robôs', exact: true }).click();
  await expect(page.getByTestId('robot-atlas')).toContainText('Crédito PJ');
  await expect(page.getByTestId('robot-nina')).toContainText('1 execução');
});
