# Validação da implementação — 14/10/2026

Ambiente: Windows, Node.js 24.15.0, Expo SDK 57.0.28, Chromium Headless instalado pelo Playwright. Resultado: demonstração multiagente validada pela API HTTP e pela interface web; Android/iOS físicos não foram testados.

| Verificação executada | Resultado |
| --- | --- |
| `npm run check` | Exit 0: TypeScript, lint Expo e lint adicional de backend/novos testes |
| `node --experimental-strip-types --test server/tests/integration.test.ts` | 14 testes aprovados |
| `node scripts/playwright.cjs test` | 50 testes aprovados, 3 minutos na rodada final |
| `node scripts/expo.cjs export --platform web --max-workers 2` | Exit 0: 2.722 módulos, bundle web de 3,5 MB, exportação em `dist/` |
| `node scripts/expo.cjs install --check` | Exit 0: dependências diretas compatíveis com SDK 57 |
| `git diff --check` | Exit 0 |

Os comandos diretos de testes correspondem a `npm run test:agents` e `npm run test:e2e`. Os 50 testes Playwright incluem 14 testes do motor do Inspetor, dez testes novos do assistente (cinco em desktop e cinco em celular), vinte testes preexistentes da Home/Inspetor em desktop/celular e seis testes de responsividade preexistentes. O novo chat também foi verificado em 280, 320 e 430 px com resultados e detalhes, além das larguras já cobertas pela suíte antiga.

## Evidências cobertas

- Quatro pedidos reais pela API e pela interface: financeiro, cadastro individual, empresa e financeiro empresarial composto. Valores consultados/calculados no SQLite, sem modelo gerando saldos.
- Ordem empresarial → financeiro e interrupção de dependentes quando o vínculo/agente falha.
- Sessões, revogação, acesso ao próprio histórico, recusa a parâmetros/IDs de terceiros e acesso administrativo negado ao usuário comum.
- Painel administrativo autenticado, capacidades e metadados sanitizados, sem mensagens, nomes e dados financeiros.
- Falha controlada de especialista, resultado inválido e provedor indisponível/saída inválida. As falhas não são apresentadas como sucesso.
- Pedidos incompletos/ambíguos e operações financeiras indisponíveis não executam ferramentas indevidas.
- Edição real do nome no SQLite somente após confirmação do titular; expiração, cancelamento e repetição idempotente.
- Idempotência de mensagem e conflito de chave com conteúdo diferente. O teste de navegador perde deliberadamente a primeira resposta HTTP e repete o pedido sem criar segunda execução.
- Conversas/execuções restauradas após recarregar a interface; SQLite reaberto preserva nome, confirmação, histórico e idempotência.
- Recuperação de execução interrompida por reinício, estado de agente desabilitado, timeout/cancelamento, limites de mensagem/requisição e CORS.
- Conta sem registros não recebe dados inventados. Usuário sem empresa vinculada não chega ao agente financeiro PJ.
- Home, cartões, privacidade, extrato, busca, avisos, atendimento, políticas, revisão humana, auditoria e simulador do Inspetor continuam passando nas verificações preexistentes.

## Ajustes identificados durante a validação

A primeira execução de navegador iniciou antes do bundle frio; a configuração agora espera o bundle. Uma consulta do teste encontrava também o saldo da Home mantida pelo navegador; foi delimitada ao chat. A execução simultânea de exportação e Chromium causou timeout na inicialização do navegador: a rodada final foi executada isoladamente e passou integralmente.

A exportação revelou que o tsconfig original incluía JavaScript minificado em `dist/` na análise TypeScript (`allowJs` herdado do Expo). Isso provocava estouro de pilha do compilador. Artefatos gerados, caches e relatórios foram excluídos, preservando as exclusões nativas da configuração base. A rodada final de `npm run check` passou com a exportação presente.

## Auditoria de dependências e limites

`npm audit --omit=dev --json` reportou **28 alertas: 18 altos e dez moderados; nenhum crítico**. Há alertas transitivos de Metro, ferramentas Expo/RN e Router, incluindo `braces`, `node-forge`, `uuid` e `decode-uri-component`. O relatório bruto local está em `.cache/assistant-audit.json`. O comando retorna código 1 por esses alertas. Eles continuam pendentes; não foram tratados como uma auditoria aprovada.

Não foi aplicado `npm audit fix --force`: algumas sugestões do npm mudam versões principais ou até sugerem Expo 44 / React Native 0.72, incompatíveis com este projeto SDK 57. Foi aplicado apenas o patch Expo 57.0.28 recomendado pelo resolvedor de compatibilidade. Uma revisão de segurança das dependências e do ambiente é necessária antes de produção. O backend novo usa módulos nativos do Node, sem pacote de servidor/LLM adicional.

Não foram validados aparelhos físicos, builds EAS, publicação, LLM externo, banco real, pagamentos, autenticação de produção, carga ou conformidade jurídica. O modo de demonstração fica explícito na interface; o servidor recusa inicialização de produção. As sessões abertas de usuário representam a mesma identidade fictícia compartilhada, conforme o [guia](multiagente.md).

As alterações locais anteriores do usuário em Inspetor, testes e documentação foram preservadas. O PDF aberto não foi substituído; a nova arquitetura e os comandos estão no guia complementar.
