# Inspetor IA — supervisão de outros agentes

O Inspetor IA é uma central de supervisão simulada integrada ao aplicativo. O papel principal é acompanhar outros robôs: **observar, verificar, dar nota e auditar**. Não é um chatbot e não está conectado a uma API de inteligência artificial.

[Desktop](inspector-desktop.png) · [Celular](inspector-mobile.png) · [Celular de 320 px](inspector-small.png) · [Inspeção detalhada](inspector-mobile-detail.png)

## Experimentar

1. Abra **Inspetor** no menu ou **Abrir central de inspeção** na tela inicial.
2. A sessão começa com quatro execuções. Atlas já está suspenso por tentar usar uma ferramenta não permitida.
3. Toque em **Investigar bloqueio**. Confira pedido, ferramenta, saída, rastreamento e cada critério da nota.
4. Escreva uma análise de pelo menos 12 caracteres e registre a revisão. Depois, retome Atlas explicitamente. A execução antiga continua bloqueada, com nota 75.
5. Escolha **Dado sem proteção** e execute o cenário. Íris será suspenso automaticamente. Todo conteúdo é sintético e o exemplo de dado exposto já é redigido na interface e no relatório.
6. Experimente **Evidência ausente**: a nota é provisória, a cobertura cai para 55% e a execução exige revisão.
7. Em **Auditoria**, recalcule a sessão e exporte o JSON com regras, execuções, evidências, revisões e eventos.

A sequência automática cria um evento de execução a cada oito segundos, alternando entre os cenários de robôs disponíveis. Pode ser pausada e termina ao sair da central. Não há monitoramento em segundo plano.

## Responsabilidades

| Etapa | O que acontece |
| --- | --- |
| Observar | Captura um cenário com tarefa, entrada, saída, ferramenta, duração, custo e identificador de rastreamento. |
| Verificar | Compara a telemetria sintética com uma política versionada e o escopo do robô. |
| Dar nota | Soma os pesos dos critérios comprovados, de 0 a 100, exibindo as evidências e as recomendações. |
| Auditar | Acrescenta eventos ao histórico, registra decisões humanas e recalcula os resultados em busca de divergências. |

## Política demonstrativa POL-2026.1

| Critério | Peso | Regra |
| --- | ---: | --- |
| Qualidade | 30 | Três itens do checklist da tarefa comprovados. |
| Permissão | 25 | Ferramenta na lista permitida para o robô. Falha crítica. |
| Privacidade | 20 | Validador sintético confirma mascaramento. Falha crítica. |
| Tempo | 10 | Até 2.000 ms. |
| Custo | 10 | Até R$ 0,12 fictícios por execução. |
| Rastreamento | 5 | Identificador de execução presente. |

Critério comprovado recebe seu peso inteiro. Falha ou ausência de evidência recebe zero. A cobertura soma os pesos dos critérios que puderam ser verificados, inclusive os que falharam. Evidências ausentes deixam a nota provisória; nunca são convertidas em aprovação.

Qualquer falha crítica bloqueia a execução e suspende o robô simulado, mesmo que a nota seja alta. Outras falhas e evidências ausentes exigem revisão. Somente a aprovação de todos os critérios gera uma execução aprovada.

A revisão não apaga nem muda a classificação histórica. Ela encerra a pendência, acrescenta um registro com autor, horário e justificativa e permite uma retomada explícita. Executar novamente um cenário crítico depois da retomada suspende o robô de novo.

## Dados e limites

- Quatro agentes sintéticos: Nina (atendimento), Atlas (pagamentos), Íris (cadastro) e Lia (conciliação).
- Sete cenários determinísticos. Nenhum evento é recebido de robôs reais e nenhum pagamento é executado.
- A avaliação de qualidade e privacidade usa fatos predefinidos nos cenários. Não há inferência semântica, detecção real de dados pessoais ou modelo de linguagem avaliando respostas.
- Histórico em AsyncStorage, na chave `@bb/inspector/session/v1`. Estrutura validada na leitura; notas e critérios reconstruídos dos cenários. Isso não oferece autenticação ou resistência a adulteração.
- Até 100 execuções por sessão, sem descarte silencioso de execuções pendentes. Ao atingir o limite, a geração para. A trilha mantém os últimos 500 eventos.
- Os dados de revisão ficam no aparelho. No navegador, exportar baixa um arquivo JSON; no Android/iOS, abre o compartilhamento nativo por ação do usuário. A interface trata falhas de gravação e exportação.
- Custos, limites, versões de robô, checklists e decisões são demonstrativos, sem valor de certificação ou aprovação financeira.

## Organização do código

`src/features/inspector/engine.ts` contém o motor puro, cenários, avaliações, transições e relatório. `storage.ts` valida a restauração. `useInspector.ts` coordena persistência, sequência e estado do aplicativo. `InspectorPanel.tsx`, `InspectorParts.tsx` e `InspectorSummary.tsx` apresentam a experiência com componentes nativos e Restyle. Não foram adicionadas dependências ou arquivos CSS.

Os testes do motor verificam notas, bloqueios, cobertura, restauração e divergências. Os testes de interface cobrem revisão, retomada, persistência, execução sem evidência, pausa, saída da central, auditoria e exportação. A suíte de largura testa a central e suas seções entre 280 e 430 px. A validação no navegador não substitui testes em dispositivos nativos.

## Caminho para uma versão conectada

O contrato de cada execução separa identificação do agente, ferramenta, entrada/saída redigidas, duração, custo e rastreamento. Essa separação é compatível em conceito com os campos de observabilidade descritos nas [convenções GenAI do OpenTelemetry](https://opentelemetry.io/docs/specs/semconv/gen-ai/); esta implementação não exporta spans OTLP nem declara conformidade com essas convenções.

Uma versão real precisará de ingestão autenticada de telemetria no servidor, identidade e permissões de revisores, validadores independentes, avaliação de qualidade com conjuntos de referência, armazenamento de auditoria protegido e um mecanismo de execução que respeite os bloqueios. Um avaliador baseado em LLM poderá complementar os validadores; decisões críticas não devem depender apenas de uma nota de modelo. A interface atual é a demonstração funcional desse fluxo, não um mecanismo de segurança para sistemas externos.
