import { expect, test } from '@playwright/test';
import type { Execution } from '../src/features/assistant/contracts';

test('bot principal executa os quatro fluxos, mostra etapas e preserva a Home', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Conversar com o bot principal', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Converse com o bot principal' })).toBeVisible();
  await page.getByRole('button', { name: 'Entrar como usuário de demonstração', exact: true }).click();
  await page.getByRole('button', { name: 'Nova conversa', exact: true }).click();
  const messages = [
    'Quero consultar meu resumo financeiro.',
    'Quero verificar os dados do meu cadastro.',
    'Quero consultar as informações da minha empresa.',
    'Preciso de um resumo financeiro da minha empresa.',
  ];
  for (const [index, message] of messages.entries()) {
    await page.getByRole('textbox', { name: 'Mensagem para o bot principal' }).fill(message);
    await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
    await expect(page.getByText('Bot principal · Concluída', { exact: true })).toHaveCount(index + 1);
  }
  await expect(page.getByTestId('assistant-scroll').getByText('R$ 4.850,75', { exact: true })).toBeVisible();
  await expect(page.getByTestId('assistant-scroll').getByText('R$ 12.500,00', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ver detalhes da execução', exact: true }).last().click();
  const details = page.getByTestId('execution-details');
  await expect(details).toContainText('1. Agente empresarial');
  await expect(details).toContainText('2. Agente financeiro');
  await expect(details).toContainText('Correlação:');
  await page.getByRole('button', { name: 'Histórico de conversas', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Conversa \d/ }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Voltar ao início', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Olá, João.' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver extrato', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Extrato da conta', exact: true })).toBeVisible();
});

test('área administrativa exige senha e mostra execuções sem mensagens privadas', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByText('Acesso restrito ao administrador', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Atualizar monitoramento' })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Senha administrativa' }).fill(process.env.ASSISTANT_TEST_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar como administrador', exact: true }).click();
  await expect(page.getByText('Capacidades: finance.personal, finance.business', { exact: true })).toBeVisible();
  await expect(page.getByText('Capacidades: business.read', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Senha administrativa' })).toHaveCount(0);
  await expect(page.getByText('João Costa', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Sair da administração', exact: true }).click();
  await expect(page.getByText('Acesso restrito ao administrador', { exact: true })).toBeVisible();
});

test('chat pede esclarecimento, apresenta confirmação e cancela a proposta', async ({ page }) => {
  await page.goto('/assistant');
  await page.getByRole('button', { name: 'Entrar como usuário de demonstração', exact: true }).click();
  await page.getByRole('button', { name: 'Nova conversa', exact: true }).click();
  await page.getByRole('textbox', { name: 'Mensagem para o bot principal' }).fill('Me ajude');
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(page.getByText('Bot principal · Precisa de esclarecimento', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Mensagem para o bot principal' }).fill('Alterar meu nome para Nome de Exemplo');
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Confirmar alteração do nome', exact: true })).toBeVisible();
  await expect(page.getByText(/O cadastro ainda não foi modificado/)).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar proposta', exact: true }).click();
  await expect(page.getByText('Bot principal · Cancelada', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar alteração do nome', exact: true })).toHaveCount(0);
});

test('resposta perdida pode ser repetida sem duplicar execução e histórico sobrevive à recarga', async ({ page }) => {
  await page.goto('/assistant');
  await page.getByRole('button', { name: 'Entrar como usuário de demonstração', exact: true }).click();
  await page.getByRole('button', { name: 'Nova conversa', exact: true }).click();
  let lost: Execution | undefined;
  await page.route('**/conversations/*/messages', async route => {
    if (route.request().method() !== 'POST' || lost) { await route.continue(); return; }
    const response = await route.fetch(); lost = await response.json() as Execution;
    await route.abort();
  });
  await page.getByRole('textbox', { name: 'Mensagem para o bot principal' }).fill('Meu resumo financeiro');
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Consulte o histórico antes de reenviar');
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(page.getByText('Bot principal · Concluída', { exact: true })).toHaveCount(1);
  await page.reload();
  await page.getByRole('button', { name: 'Entrar como usuário de demonstração', exact: true }).click();
  await page.getByRole('button', { name: 'Histórico de conversas', exact: true }).click();
  await page.getByRole('button', { name: new RegExp(lost!.conversationId.slice(0, 8)) }).click();
  await expect(page.getByText('Bot principal · Concluída', { exact: true })).toHaveCount(1);
  await expect(page.getByTestId(`execution-${lost!.id}`)).toBeVisible();
});

test('chat cabe em telas compactas com resultados e detalhes', async ({ page }) => {
  await page.setViewportSize({ width: 280, height: 740 });
  await page.goto('/assistant');
  await page.getByRole('button', { name: 'Entrar como usuário de demonstração', exact: true }).click();
  await page.getByRole('button', { name: 'Nova conversa', exact: true }).click();
  await page.getByRole('textbox', { name: 'Mensagem para o bot principal' }).fill('Resumo financeiro da minha empresa');
  await page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(page.getByText('Bot principal · Concluída', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ver detalhes da execução', exact: true }).click();
  for (const width of [280, 320, 430]) {
    await page.setViewportSize({ width, height: 740 });
    await expect.poll(() => page.getByTestId('assistant-scroll').evaluate(element => element.scrollWidth - element.clientWidth)).toBe(0);
    const overflowing = await page.getByRole('button').evaluateAll(elements => elements.filter(element => {
      const rect = element.getBoundingClientRect(); return rect.width && (rect.right > window.innerWidth + 1 || rect.left < -1 || element.scrollWidth > element.clientWidth + 1);
    }).map(element => element.textContent));
    expect(overflowing).toEqual([]);
    await expect(page.getByRole('textbox', { name: 'Mensagem para o bot principal' })).toBeVisible();
  }
});
