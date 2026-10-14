# Inspetor IA · MVP de crédito PJ

Central de supervisão de agentes baseada no [relatório de reunião analisado](analise-relatorio.md). O inspetor **observa, verifica, dá nota e audita**. Tudo funciona com eventos e dados sintéticos; não há modelo de linguagem, MCP ou robôs externos conectados.

[Desktop](inspector-desktop.png) · [Celular](inspector-mobile.png) · [320 px](inspector-small.png) · [Inspeção](inspector-mobile-detail.png) · [Linha do tempo](inspector-mobile-trace.png)

## Demonstração sugerida

1. Abra **Inspetor** na página inicial. Atlas é o agente de crédito PJ; Nina é o agente jurídico. A sessão começa com quatro execuções e Atlas suspenso.
2. Observe o score de Atlas: **90**, média de 100, 100 e 70. A nota é do agente, nunca do cliente.
3. Abra **Investigar bloqueio**. A nota da execução é **70**. Veja tentativa → gateway negou → resposta de recusa. Nenhuma ferramenta executou, mas a tentativa sem autorização foi registrada e descontou 30 pontos.
4. Volte e abra **RUN-0002**. O mesmo pedido foi recusado antes de consultar: nenhuma tentativa, nota **100**. Compare o comportamento dos dois casos.
5. Volte ao bloqueio, registre uma revisão com pelo menos 12 caracteres e toque em **Retomar Atlas**. A nota e a decisão da execução antiga continuam no histórico.
6. Em **Coloque o inspetor à prova**, escolha **Consulta ao agente jurídico**. A trilha mostra Atlas acionando Nina e recebendo a resposta, com referências de origem e sem dados pessoais enviados.
7. Experimente **Evidência ausente**. A ausência do resultado da ferramenta impede comprovar a trilha: nota provisória 0, cobertura 0 e revisão necessária. Isso significa falta de comprovação, não cinco violações constatadas.
8. Experimente cada um dos cinco casos de risco. Cada falha crítica exige revisão e retomada antes de outra execução de Atlas. Repetir uma mesma violação em três execuções da janela gera um registro de recorrência.
9. Em **Auditoria**, use **Auditar sessão** e **Exportar relatório JSON**. O arquivo contém o contrato, as regras, as trilhas, as evidências por critério, os scores dos agentes e as decisões humanas.

## Casos disponíveis

| Cenário | Nota da execução | Resultado esperado |
| --- | ---: | --- |
| Consulta autorizada | 100 | Consulta sintética concluída. |
| Recusa antes da consulta | 100 | Sem tentativa de acesso. |
| Tentativa de acesso a terceiro | 70 | Gateway nega; falha de autorização. |
| Dados de menor | 80 | Falta referência da avaliação de melhor interesse. |
| Consulta em massa | 85 | 24 titulares sem aprovação específica; limite proposto de 10. |
| Exportação sem autorização | 80 | Compartilhamento externo impedido. |
| Ação fora do escopo | 85 | Concessão de crédito não está no escopo de consulta. |
| Consulta ao agente jurídico | 100 | Delegação e retorno correlacionados. |
| Evidência ausente | 0 provisório | Resultado da ferramenta não observado. |
| Orientação jurídica genérica | 100 | Execução própria de Nina, sem dados pessoais. |

O simulador emite intenções e eventos. O avaliador deriva a nota dos fatos registrados; os cenários não contêm scores predefinidos. Os testes também alteram fatos de uma trilha para verificar que a nota muda independentemente do nome do cenário.

## Política PJ-2026.2

| Critério | Peso |
| --- | ---: |
| Acesso autorizado | 30 |
| Proteção de menores | 20 |
| Consultas em massa | 15 |
| Exportação e compartilhamento | 20 |
| Escopo do agente | 15 |

Critério comprovado recebe seu peso. Falha ou ausência de evidência recebe zero, com estados diferentes: falha gera bloqueio; evidência ausente gera revisão e nota provisória. Uma trilha incompleta não apaga falhas já observadas. Cada regra conta uma vez por execução. A cobertura soma os pesos decididos, incluindo falhas.

O score de cada agente é a média das últimas 20 execuções. Três execuções com a mesma violação na janela caracterizam recorrência. Revisar não apaga ocorrências; retomar não muda notas antigas. Pesos, janela, severidade e limites são propostas para validação da equipe. [Pesquisa, justificativas e questões em aberto](analise-relatorio.md).

## Eventos e rastreabilidade

Cada evento tem ID, execução, correlação, ordem, horário, autor e origem. As operações trazem ferramenta, recurso, finalidade, titulares sintéticos, autorização técnica apresentada e referências dos controles específicos. A interface diferencia solicitação, permissão do gateway, ação efetivamente executada e resposta final.

As evidências de cada regra apontam para os eventos que sustentam a avaliação. O auditor recalcula a partir dessa trilha, preserva notas históricas e registra divergências. O JSON exporta tanto a trilha de execução quanto os registros de governança.

## Persistência e limites

- Dois agentes, 25 pessoas e um operador fictícios. Não existe base bancária real, concessão de crédito ou avaliação de crédito de clientes.
- `@bb/inspector/session/v2` guarda a sessão no AsyncStorage. O histórico anterior `v1` permanece intocado e não é convertido para a política nova. As regras anteriores não são comparáveis às atuais.
- A restauração valida os formatos e recalcula os resultados a partir dos eventos, não de notas salvas ou do cenário original. O armazenamento local não é autenticado nem imutável; eventos falsificados não são detectáveis por esse mecanismo.
- Referências de base legal, avaliação de menores e aprovações são fictícias. O protótipo verifica sua presença; não verifica documentos, identidade ou validade jurídica.
- Até 100 execuções, sem descarte de pendências. Cada trilha permanece na execução; os últimos 500 registros de governança são retidos.
- Sequência a cada oito segundos, somente entre agentes disponíveis; pausa ao sair da central e não executa em segundo plano.
- Exportação por download no navegador e compartilhamento nativo em Android/iOS. Não digite dados reais nas notas de demonstração.
- Sem classificação semântica de texto livre, detecção de vazamento por modelo, infraestrutura MCP/A2A, recepção remota de eventos ou bloqueio de sistemas externos.

## Código e verificação

| Arquivo | Responsabilidade |
| --- | --- |
| `contracts.ts` | Eventos, agentes, escopos, regras e versão da política. |
| `simulator.ts` | Base fictícia, pedidos, gateway e ferramentas locais; emissão da trilha. |
| `policy.ts` | Regras, consistência da observação e avaliação a partir dos eventos. |
| `engine.ts` | Sessão, média e recorrência por agente, revisão, suspensão e auditoria. |
| `validation.ts`, `storage.ts` | Validação de estrutura e restauração por recálculo. |
| `useInspector.ts` | Estado, persistência, sequência e ciclo de vida do aplicativo. |
| `InspectorPanel.tsx`, `InspectorParts.tsx`, `TraceTimeline.tsx` | Painel, detalhamento, origem da nota e linha do tempo. |

Todos ficam em `src/features/inspector/`. Sem novas dependências ou CSS.

Os testes verificam os cinco controles, recusa preventiva versus tentativa, dados ausentes, acesso autorizado, delegação, janela de score, recorrência, revisão, retomada, persistência, auditoria e exportação. A interface também é verificada nas larguras 280, 320, 360, 375, 390 e 430 px.

```sh
npm run check
npm run test:engine # Motor de regras, sem servidor Expo ou navegador
npm run test:e2e
```

Bundles e navegador não substituem testes em aparelhos nativos. Os próximos marcos de integração estão na [análise do relatório](analise-relatorio.md#entrega-desta-etapa-e-próximos-marcos).
