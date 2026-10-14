# Análise anterior à implementação — 14/10/2026

## Arquitetura encontrada

Aplicativo independente React Native 0.86.3 / React 19 / Expo SDK 57, TypeScript, Restyle e Lucide. Entrada `index.ts` → `App.tsx` → `HomeScreen`. Navegação existente por painéis locais, sem Expo Router. Sem backend, autenticação, banco remoto, modelo de usuários/organizações, SDK de IA, credenciais ou integração bancária. AsyncStorage persiste preferências e a simulação do Inspetor. Testes Playwright cobrem interface, responsividade e motor de políticas.

`src/data/bank.ts` contém conta e movimentos fictícios em centavos. O Inspetor tem contratos, políticas, auditoria e eventos correlacionados úteis como referência, mas seus robôs Atlas/Nina são um simulador, sem ferramentas externas. Nina representa orientação jurídica genérica; não representa cadastro empresarial. Não há definição específica de usuário civil: nesta extensão significa cadastro individual de demonstração.

Há alterações locais prévias em telas, Inspetor, testes e documentação, que devem ser preservadas.

## Reaproveitamento e problemas

Preservar todas as telas/painéis, simulador e suas políticas. Reutilizar tokens, componentes acessíveis, fixtures financeiras, formatação BRL e infraestrutura Playwright. O frontend não constitui uma fronteira de autorização; agentes reais precisam executar no servidor. O saldo existente é um instantâneo: o relatório deve distinguir saldo inicial, movimentos e saldo final. Não há vínculo empresarial existente para reutilizar. Não apresentar simulações antigas como execuções do novo backend.

## Implementação prevista

- `server/`: API HTTP Node, SQLite transacional, sessões temporárias com bearer token, registro de agentes, serviços com autorização, roteador determinístico, abstração injetável de interpretação por LLM, orquestrador e dispatcher.
- `src/features/assistant/`: contratos compartilhados, cliente API, contexto de sessão e chat/monitoramento.
- `src/app/`: layout e rotas Expo Router (início preservado, assistente, administração).
- Ajustes incrementais em entrada, configuração Expo, atalhos da Home, scripts npm e configuração Playwright.
- Testes de integração com HTTP/SQLite reais e testes de interface; documentação de execução e limites.

## Modelo de execução

MainOrchestratorAgent recebe mensagem autenticada e chave de idempotência, persiste conversa/execução, interpreta a intenção, consulta AgentRegistry e delega tarefas validadas ao TaskDispatcher. FinancialAgent consulta movimentos e calcula totais; IndividualUserAgent consulta perfil e propõe alteração de nome com confirmação explícita; BusinessUserAgent verifica associação antes de consultar empresa. Relatório PJ executa empresa → financeiro, sem permitir IDs escolhidos pelo modelo. Cada etapa tem estado, correlação, duração, erro seguro e resultado estruturado. Etapas limitadas, timeout, cancelamento cooperativo e recuperação de execuções interrompidas. Sem comandos arbitrários ou movimentação de dinheiro.

Histórico privado pertence ao usuário autenticado. Monitoramento administrativo recebe somente metadados, sem mensagens, nomes cadastrais ou valores. A configuração dos agentes é persistida e alterada somente por administrador. Alterações cadastrais usam propostas expirantes e confirmação transacional, com resultado idempotente.

## Fluxos e dependências

Quatro consultas demonstráveis: financeiro individual, cadastro próprio, empresa vinculada, financeiro empresarial composto. Edição demonstrativa do próprio nome mediante proposta/confirmar. Base SQLite usa fixtures claramente fictícias, inicialmente derivadas dos movimentos da Home. Autenticação é exclusiva do ambiente de demonstração; administrador exige senha gerada no servidor ou variável de ambiente. Não existe autenticação bancária nem promessa de prontidão para produção.

Adicionar somente dependências oficiais do Expo Router com `expo install` (SDK 57), preservando as versões existentes. Backend usa módulos nativos do Node, inclusive SQLite, sem serviço externo nem chave obrigatória. A abstração de IA aceita interpretação validada, com contingência determinística; não será anunciada integração LLM inexistente. Node >=22.13, conforme projeto. Documentação oficial consultada: https://docs.expo.dev/versions/v57.0.0/, https://docs.expo.dev/llms.txt, https://docs.expo.dev/router/installation/, https://nodejs.org/api/sqlite.html.
