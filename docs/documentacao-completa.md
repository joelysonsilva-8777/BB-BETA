# BB · Conceito e Inspetor IA

## Documentação completa do aplicativo

**Produto, arquitetura, implementação, operação e evolução**  
Versão documental 1.0 · 7 de outubro de 2026  
Aplicativo 1.0.0 · Expo SDK 57 · Política PJ-2026.2

Este documento descreve o projeto localizado em `F:\BB-APP`, a partir da leitura do código, configurações, testes, imagens e documentos disponíveis. Abrange a interface bancária demonstrativa e o MVP de supervisão de agentes de IA. Destina-se a quem usa, apresenta, desenvolve, avalia ou planeja a evolução do aplicativo.

**Natureza do produto:** conceito independente inspirado na identidade visual do Banco do Brasil, com dados fictícios. A central executa uma simulação determinística local. Não há conta bancária real, autenticação, modelo de linguagem ou agentes externos conectados.

**Base da análise:** arquivos presentes no workspace em 07/10/2026. O último commit consultado foi `e0fc675`, de 30/09/2026; existem alterações posteriores ainda não commitadas. Portanto, o documento registra o estado de trabalho, que é mais amplo que esse commit.

**Critério de leitura:** “implementado” indica comportamento localizado no código; “registrado” indica informação existente na documentação ou no histórico; “proposto” indica evolução recomendada, ainda sem aprovação, prazo ou implementação comprovados. As capturas reproduzem imagens existentes em `docs/`; não comprovam execução em dispositivos físicos.

<div class="toc-placeholder"></div>

## 1. Visão geral, propósito e público

O aplicativo combina uma experiência visual de conta corrente com uma central de governança de agentes. A página inicial oferece saldo, cartão, movimentações, atalhos, cofrinho e ajuda. O destaque “Inspetor IA” abre a área que demonstra observação, verificação de regras, pontuação por agente, suspensão, revisão humana e auditoria.

O início bancário funciona como cenário de apresentação. Os seus dados são constantes locais, e as ações de Pix, pagamentos e transferências abrem consultas de exemplo. O Inspetor tem estado mutável: permite criar execuções simuladas, revisar ocorrências, pausar ou retomar robôs, recalcular avaliações e exportar uma sessão. Essa diferença é essencial para compreender quais interações efetivamente modificam o aplicativo.

O caso principal do Inspetor é **crédito para pessoa jurídica**. Atlas representa um agente que consulta documentação e pode solicitar orientação jurídica a Nina. A ferramenta de concessão de crédito está deliberadamente fora do escopo de Atlas. A nota mede a conduta observada do agente de IA, não a situação financeira da empresa nem o comportamento do usuário.

O público imediato inclui desenvolvedores, pessoas responsáveis por apresentar o MVP e equipes que discutem governança de agentes. Os papéis mostrados na interface são fictícios: “Operador de crédito”, equipes proprietárias dos robôs e “João · revisor da simulação”. Não existe cadastro de usuários ou distribuição real de permissões entre essas pessoas.

O valor demonstrado é a explicabilidade: cada resultado pode ser percorrido da solicitação até os eventos que sustentam uma regra. O produto torna visível a diferença entre **recusar um pedido antes de consultar** e **tentar consultar indevidamente, ser bloqueado e só então recusar**.

**Intenção observável no projeto:** criar um protótipo mobile adaptável que permita estudar e apresentar esse ciclo com dados controlados, sem depender de infraestrutura bancária. Uma eventual implantação em produção exige outro estágio de engenharia, descrito no planejamento.

## 2. Escopo e inventário de funcionalidades

| Área | O que existe | Estado e alcance |
| --- | --- | --- |
| Página inicial | Saudação, conta, saldo, cartão, extrato resumido, objetivo e ajuda | Interface funcional sobre constantes fictícias |
| Privacidade visual | Ocultar e mostrar valores nos componentes bancários e painéis | Preferência persistida localmente |
| Extrato | Cinco lançamentos e filtros Todas, Entradas e Saídas | Consulta de uma lista local |
| Ourocard | Representação do cartão, fatura, compras, vencimento e limite disponível | Sem emissão, bloqueio de cartão ou pagamento real |
| Pix e transferências | Histórico sintético de duas movimentações Pix | Sem envio ou recebimento real |
| Pagamentos | Fatura, aviso de ausência de agendamentos e último boleto | Sem leitura de código de barras ou autorização |
| Serviços | Busca textual em dez serviços, ignorando acentos | Navegação para painéis locais |
| Notificações | Dois avisos e marcação global de leitura | Sem push, caixa remota ou estado individual por aviso |
| Cofrinho e investimentos | Objetivo Próxima viagem e valor acumulado | Sem aportes, resgates ou cálculo de rentabilidade |
| Atendimento | FAQ, números apresentados e botão para site oficial | Abertura externa apenas por ação do usuário |
| Inspetor | Duas identidades de agente, cinco regras e dez cenários | Simulação local com eventos tipados |
| Governança | Suspensão, pausa manual, revisão, retomada e recorrência | Estado e trilha de auditoria locais |
| Exportação | Relatório JSON da sessão | Download web ou compartilhamento nativo |

Não foram encontrados backend, API de contas, integração de pagamento, autenticação, banco remoto, clientes MCP/A2A, SDK de LLM, pipeline de CI ou configuração EAS. A existência de referências a essas tecnologias no planejamento não significa que estejam instaladas.

O PDF é uma entrega documental deste trabalho. A função de exportação já existente no app gera **JSON**, e não PDF; a documentação não adiciona um botão de PDF à interface.

## 3. Como o projeto foi construído e evoluiu

A implementação usa componentes React Native escritos em TypeScript. Um ponto de entrada registra `App`; o componente raiz aplica contexto de tema e área segura; uma tela principal combina componentes reutilizáveis. Dados bancários, preferências e lógica do Inspetor têm módulos separados. O resultado pode ser executado no navegador e direcionado a Android e iOS pelo Expo.

O histórico Git disponível contém quatro commits: `da75497` (“Initial commit”, 29/09/2026), `8f956ff` (“implantado”, 29/09/2026), `7bf2b38` (“phase 2”, 30/09/2026) e `e0fc675` (“phase 2.1”, 30/09/2026). Esses títulos são registros históricos; “implantado” não basta para demonstrar publicação em loja, hospedagem ativa ou existência de uma versão assinada.

`docs/design-references.md` registra pesquisa visual em 29/09/2026. Ela consultou materiais públicos do Banco do Brasil, imagens de lojas, manual do CCBB e uma referência vetorial no Wikimedia Commons. A organização da tela e a escolha de componentes foram adaptações do projeto. O uso de fonte do sistema foi explícito: a fonte proprietária BancoDoBrasil não é distribuída.

`docs/analise-relatorio.md` registra uma evolução iniciada em 01/10/2026 a partir do documento “Relatorio_Consolidado_Monitoramento_Agentes_IA.docx”. O arquivo original não faz parte do inventário atual; esta documentação utiliza a análise local de suas 17 seções, sem afirmar uma nova leitura direta do DOCX.

Segundo essa análise, uma versão anterior avaliava cenários gerais de atendimento, pagamentos, cadastro e conciliação. A versão atual concentra o MVP em crédito PJ e deriva os resultados de eventos observáveis. O motor deixou de depender de uma pontuação pronta associada ao nome do cenário. A estrutura atual mostra essa separação em `contracts.ts`, `simulator.ts`, `policy.ts` e `engine.ts`.

Não há evidência suficiente para reconstruir todas as conversas, atribuir autoria individual de cada trecho ou estimar horas de trabalho. A explicação de “como foi feito” neste documento corresponde ao método visível nos artefatos: pesquisa registrada, composição visual, contratos de dados, simulador, política, governança, armazenamento e testes.

## 4. Tecnologias e versões

As versões declaradas vêm de `package.json`; as resolvidas vêm de `package-lock.json`. O arquivo de lock registra exatamente o conjunto que `npm ci` procura instalar.

| Tecnologia | Declarada | Resolvida | Papel no projeto |
| --- | --- | --- | --- |
| Expo | ~57.0.25 | 57.0.25 | Ferramentas, configuração e execução multiplataforma |
| React Native | 0.86.3 | 0.86.3 | Componentes nativos e APIs de plataforma |
| React | 19.2.3 | 19.2.3 | Composição da UI, estado, efeitos e hooks |
| React DOM | 19.2.3 | 19.2.3 | Suporte à execução web |
| React Native Web | ^0.21.2 | 0.21.3 | Representação web dos componentes React Native |
| TypeScript | ~6.0.3 | 6.0.3 | Tipagem estática e contratos |
| Shopify Restyle | ^2.4.5 | 2.4.5 | Tema tipado, Box, Text e propriedades responsivas |
| AsyncStorage | 2.2.0 | 2.2.0 | Preferências e sessão local do Inspetor |
| React Native SVG | 15.15.4 | 15.15.4 | Símbolos BB e Pix em vetor |
| Lucide React Native | ^1.48.0 | 1.48.0 | Ícones de interface |
| Safe Area Context | ~5.7.0 | 5.7.0 | Insets e proteção contra barras/recortes de tela |
| Expo Status Bar | ~57.0.1 | 57.0.1 | Barra de status configurada com estilo dark |
| Expo System UI | ~57.0.4 | 57.0.4 | Dependência declarada; sem chamada direta localizada no código |
| Expo Metro Runtime | ~57.0.16 | 57.0.16 | Runtime importado no ponto de entrada |
| Playwright Test | ^1.63.0 | 1.63.0 | Testes do motor, interface web e capturas |
| ESLint | ^9.39.5 | 9.39.5 | Análise estática de qualidade |
| eslint-config-expo | ~57.0.2 | 57.0.2 | Configuração de lint compatível com Expo |
| @types/react | ~19.2.2 | 19.2.18 | Tipos de desenvolvimento para React |

O requisito declarado é Node.js **22.13.0 ou superior**. A inspeção documental foi realizada com Node 24.15.0 e npm 11.12.1. Há `package-lock.json`, e não foi encontrado `bun.lock`; por isso, os exemplos operacionais seguem npm/npx.

Não há CSS, Tailwind ou NativeWind nos componentes do aplicativo. O estilo é definido no tema e nas propriedades React Native/Restyle. O CSS utilizado para diagramar esta documentação pertence ao PDF/HTML, não à interface do app.

O SDK consultado para documentar Expo foi o **57**, conforme o pacote local. A referência oficial foi verificada na [documentação versionada do SDK 57](https://docs.expo.dev/versions/v57.0.0/); alterações futuras de SDK devem ser analisadas com a versão correspondente.

## 5. Estrutura completa do repositório

```text
F:\BB-APP
├── App.tsx
├── index.ts
├── package.json / package-lock.json
├── app.json / tsconfig.json / metro.config.js / eslint.config.js
├── playwright.config.ts / playwright.engine.config.ts
├── AGENTS.md / CLAUDE.md / README.md / LICENSE
├── .npmrc / .gitignore
├── assets/
│   ├── icon.png / favicon.png
│   └── android-icon-foreground.png / android-icon-monochrome.png
├── scripts/
│   ├── expo.cjs / playwright.cjs / generate-icons.cjs
├── src/
│   ├── theme.ts
│   ├── data/bank.ts
│   ├── hooks/useBanking.ts / useCompactLayout.ts
│   ├── screens/HomeScreen.tsx
│   ├── components/
│   │   ├── ui.tsx / Brand.tsx / BankCards.tsx
│   │   └── Navigation.tsx / Transactions.tsx / ServiceSheet.tsx
│   └── features/inspector/
│       ├── contracts.ts / simulator.ts / policy.ts / engine.ts
│       ├── validation.ts / storage.ts / useInspector.ts
│       ├── exportReport.ts / InspectorSummary.tsx
│       └── InspectorPanel.tsx / InspectorParts.tsx / TraceTimeline.tsx
├── tests/
│   ├── home.spec.ts / responsive.spec.ts
│   └── inspector.spec.ts / inspector-engine.spec.ts
└── docs/
    ├── design-references.md / inspector.md / analise-relatorio.md
    ├── capturas da página inicial e da central
    └── esta documentação e seus artefatos de leitura
```

`node_modules/`, `.cache/`, `.expo/`, `dist/`, resultados de testes e projetos nativos gerados são diretórios operacionais ou artefatos ignorados pelo Git. Não representam módulos de negócio. `.claude/settings.json` é configuração de ferramenta de desenvolvimento, não uma funcionalidade do aplicativo; seu conteúdo não precisa ser reproduzido para explicar o produto.

Não há `src/app/`, `_layout.tsx`, `eas.json` ou diretórios nativos versionados neste estado. A árvore evidencia uma aplicação com entrada explícita e uma única tela principal.

## 6. Arquitetura e fluxo de inicialização

<div class="diagram"><div class="diagram-title">Arquitetura que executa hoje</div><div class="flow">index.ts → App → HomeScreen</div><div class="flow-sub">Registro Expo · ThemeProvider · SafeAreaProvider · preferências</div><div class="diagram-grid"><div><b>Experiência bancária</b><br>BankCards · Transactions<br>Navigation · ServiceSheet<br>bank.ts · useBanking</div><div><b>Central Inspetor IA</b><br>InspectorSummary · InspectorPanel<br>useInspector · engine<br>simulator · policy · contracts</div></div><div class="flow-sub">AsyncStorage local ← preferências e sessão → relatório JSON</div></div>

1. `index.ts` importa o runtime do Metro e registra `App` com `registerRootComponent`.
2. `App.tsx` chama `useBanking`, instala `SafeAreaProvider` e `ThemeProvider` e configura a barra de status.
3. Enquanto as preferências locais são carregadas, mostra um indicador com o rótulo “Carregando início”.
4. Depois de `banking.ready`, monta `HomeScreen`, que inicializa o controlador do Inspetor independentemente de a central estar aberta.
5. `HomeScreen` calcula largura e insets, renderiza o conteúdo, a navegação apropriada e os painéis condicionais.
6. O painel bancário abre quando `sheet` possui um serviço; o Inspetor usa um modal próprio em tela cheia.

Os controladores entregam dados e funções aos componentes por props. Não existe Redux, Zustand, contexto específico de sessão ou biblioteca de requisições. O contexto Restyle transmite o tema; o contexto de área segura fornece os insets. As funções puras do Inspetor podem ser testadas sem montar componentes.

Os valores bancários vêm de `bank.ts`. O estado de exibição vem de `useBanking`. Os dados de governança vêm de `useInspector` e do reducer. Essa separação limita a mistura entre preferência de privacidade, apresentação de exemplos financeiros e avaliação dos agentes.

**Limite arquitetural:** interface, simulador, gateway e política executam no mesmo ambiente local. Há separação de responsabilidades no código, mas não uma fronteira independente de segurança.

## 7. Navegação atual e direção técnica

O tipo `Sheet` possui 13 identificadores: `profile`, `notifications`, `statement`, `pix`, `payments`, `transfer`, `card`, `investments`, `services`, `support`, `savings`, `recharge` e `inspector`. `sheet = null` representa a página principal sem painel.

`useBanking.openSheet` seleciona um desses valores. `ServiceSheet` interpreta o serviço e mostra seu conteúdo; retorna `null` para o Inspetor, que tem um painel separado. `closeSheet` volta ao estado fechado. O componente recebe uma `key` baseada no serviço, reiniciando busca e filtro internos ao trocar ou reabrir o painel.

No celular, a barra inferior contém Início, Extrato, Cartões, Inspetor e Menu. No desktop, a lateral contém Início, Extrato, Cartões, Inspetor IA, Investimentos e Todos os serviços, além de atendimento e perfil. “Início” rola a página até o topo; não cria uma nova rota.

Na central, `tab` seleciona Visão geral, Robôs, Auditoria ou Regras. `selectedId` abre o detalhe de uma execução. A seleção de aba limpa o detalhe e a mensagem temporária; a rolagem retorna ao início ao mudar de aba ou execução. Esses estados pertencem ao componente e são reiniciados quando o modal é desmontado.

**Divergência identificada:** `AGENTS.md` exige Expo Router para a navegação, mas não há dependência `expo-router` ou pasta `src/app/` na implementação atual. O documento descreve o comportamento encontrado; a solicitação de documentação não foi utilizada para migrar o app.

Uma migração futura deve criar rotas para início, central, agente e execução, com layouts e modais adequados, preservando os controladores e módulos fora de `src/app/`. Ela ajudará a tratar URLs e navegação de histórico de forma explícita. A recomendação de rotas por arquivos está documentada na [introdução oficial ao Expo Router](https://docs.expo.dev/router/introduction/).

## 8. Sistema visual, responsividade e acessibilidade

`src/theme.ts` concentra cores, espaços, raios e tipografia. `Box` e `Text` são criados pelo Restyle com o tipo `Theme`; assim, propriedades como `backgroundColor="primary"` referenciam tokens conhecidos. O objetivo observável é manter uma identidade consistente sem repetir valores em cada componente.

| Grupo | Tokens e valores principais |
| --- | --- |
| Superfícies | background #F6F7F9; surface #FFFFFF; surfaceSoft #F1F3F7 |
| Texto e borda | text #202A3D; muted #647086; border #E5E8EE |
| Marca e ações | primary #304BB2; brandBlue #465EFF; yellow #FCFC30 |
| Destaques | navy #19376A; blueSoft #EEF2FC; gold #D3C191 |
| Estados | positive #247653; danger #B43D3D; warning #8A5D16 |
| Espaçamento | 0, 4, 8, 12, 16, 24, 32, 48 e 64 |
| Raios | 0, 4, 8 e 12 |
| Breakpoints Restyle | phone 0; regularPhone 390; tablet 768; desktop 1100 |

As variantes de texto vão de `eyebrow` (10/16) e `caption` (12/18) a `title` (18/26), `heading` (28/35) e `balance` (36/45). Os pares representam tamanho e altura da linha. O código adapta valores em alguns pontos, como saldo de 32 em telas menores. A fonte é `System` no iOS, `sans-serif` no Android e Arial como padrão web.

Os limites efetivos do layout não coincidem todos com o token desktop: a Home usa duas colunas a partir de **900 px** e lateral a partir de **1180 px**; o Inspetor usa colunas a partir de **960 px** e agrupa estatísticas horizontalmente a partir de **760 px**. Os painéis bancários ficam centralizados a partir de **768 px**, com largura máxima de 520 e altura máxima de 88%; no celular, ficam junto à base e têm até 90% da altura.

`useCompactLayout` ativa a forma compacta quando `width / max(fontScale, 1) < 375`. Assim, fonte de sistema maior recebe reorganização semelhante à de tela mais estreita. Atalhos passam a duas linhas, transações separam descrição e valor, e ações de auditoria podem empilhar.

Há rótulos para controles, papel de botão e cabeçalho, estados de seleção/expansão/desabilitado, regiões de aviso e ocultação da página atrás dos modais para tecnologias assistivas. Botões de ícone têm 44×44, e botões principais têm altura mínima de 48. A presença desses recursos não comprova acessibilidade completa: leitor de tela, ordem de foco, teclado, contraste e fonte ampliada ainda precisam de validação dedicada.

## 9. Componentes e padrões reutilizáveis

| Arquivo/componente | Responsabilidade e detalhes |
| --- | --- |
| ui.tsx / Box, Text | Primitivas Restyle tipadas; base para todos os blocos |
| Tap | Pressable com feedback por opacidade, hover web e estados acessíveis |
| Icon | Ícone Lucide com cor do tema, espessura 1,65 e elemento decorativo oculto |
| IconButton | Área 44×44, rótulo e badge opcional |
| Button | Ação principal/secundária, ícone opcional e estado desabilitado |
| TextLink | Ação textual de altura mínima 44 com seta opcional |
| Card | Superfície branca com borda, raio e padding adaptável |
| Brand.tsx / BBMark | Símbolo vetorial com geometria compartilhada entre UI e geração de ícones |
| Brand / PixMark | Bloco de marca e geometria vetorial Pix |
| BankCards.tsx / Money | Formatação e mascaramento visual de valores |
| AccountCard / CreditCard | Conta, atalhos e resumo de fatura |
| Ourocard | Representação gráfica com final, titular, chip e marca visual |
| SavingsCard / SupportCard | Objetivo e acesso à ajuda |
| Transactions.tsx | Linha de transação compacta/regular e quatro movimentações recentes |
| Navigation.tsx | Sidebar e BottomBar usando callbacks de navegação local |
| ServiceSheet.tsx | Catálogo, busca, filtros e conteúdo dos 12 painéis bancários |

`Tap` limita largura e aplica opacidade 0,4 quando desabilitado, 0,58 quando pressionado e 0,78 em hover. O feedback não depende de sombras ou animações pesadas. Os componentes recebem ações por funções, mantendo a decisão de negócio nos controladores.

`BB_SYMBOL` é uma string SVG renderizada com `Path`. O script de ícones lê a mesma string em `Brand.tsx`, reduzindo a chance de desenhar uma marca diferente nos assets. O Ourocard é montado por blocos e vetor; não contém imagem remota ou dados de cartão reais.

Os documentos de design registram origem e adaptações da marca. A licença MIT existente no repositório não constitui autorização de uso da marca BB. Este documento mantém a qualificação de conceito independente já apresentada pelo app.

## 10. Dados bancários, valores e datas

| Campo fictício | Valor exibido ou representação |
| --- | --- |
| Titular | João Costa; iniciais JC |
| Agência / conta | 1234-5 / 12345-6 |
| Saldo | 485075 centavos = R$ 4.850,75 |
| Fatura | 124890 centavos = R$ 1.248,90 |
| Limite total | 1000000 centavos = R$ 10.000,00 |
| Limite disponível | Total − fatura = R$ 8.751,10 |
| Final do cartão | 4829 |
| Cofrinho | R$ 2.500,00 de R$ 6.000,00; progresso arredondado de 42% |

O armazenamento em centavos inteiros evita usar frações de ponto flutuante como representação básica dos exemplos financeiros. `currency(cents)` divide por 100 somente para formatar com `Intl.NumberFormat`, localidade `pt-BR` e moeda BRL.

Os cinco lançamentos são Pix recebido de Mariana Lima (+R$ 350,00), compra Pão de Açúcar (−R$ 186,42), conta de energia (−R$ 142,80), Pix enviado a Lucas Santos (−R$ 85,00) e salário (+R$ 5.200,00). A Home mostra os quatro primeiros. O extrato completo mostra os cinco. “Hoje” e “Ontem” são rótulos fixos, não datas recalculadas de uma base de transações.

A fatura contém Supermercado (R$ 286,42), Assinatura digital (R$ 39,90), Restaurante (R$ 126,80) e Compra on-line (R$ 795,78). A soma é R$ 1.248,90. O limite disponível usa esse total como uma regra de apresentação simplificada, sem representar um cálculo de emissor de cartões.

`invoiceDate()` seleciona o dia 10 do mês corrente quando o dia local é até 10; depois disso, seleciona o dia 10 do mês seguinte. A data usa o relógio do aparelho. Na data documental de 07/10/2026, a regra corresponde a 10 de outubro, mas o app não fixa esse mês.

Ocultar valores substitui montantes por marcadores e zera visualmente a barra do cofrinho. Não apaga as constantes, não criptografa armazenamento e não oculta automaticamente os identificadores fictícios da conta. A preferência é de apresentação, não um mecanismo de proteção de segredos.

## 11. Manual de uso da experiência bancária

1. Abra o aplicativo. Após o carregamento das preferências, aparecerá “Olá, João.”, com a conta fictícia e o destaque do Inspetor.
2. Use o ícone de olho em Conta corrente para ocultar ou mostrar os valores. A escolha acompanha saldo, fatura, lançamentos, objetivo e seus painéis, e é recuperada ao reabrir.
3. Toque em “Ver extrato” ou na opção Extrato. “Todas” mostra a lista completa; “Entradas” mantém valores positivos; “Saídas” mantém negativos.
4. Abra “Ver fatura” ou Cartões para examinar a representação Ourocard, compras, vencimento e limite disponível. Não há botão de pagamento ou mudança real do cartão.
5. Abra Pix para consultar os exemplos de entrada e saída. “Transferir” mostra essas movimentações e oferece acesso ao extrato completo.
6. Em “Pagar”, confira o exemplo de fatura, o estado sem agendamentos e o boleto fictício mais recente.
7. Abra “Acompanhar cofrinho” para consultar a meta Próxima viagem. Investimentos resume o mesmo total e leva ao cofrinho.
8. Toque na lupa ou Menu/Mais para abrir Todos os serviços. Digite, por exemplo, `cartoes` ou `transferencias`; a busca compara títulos e descrições sem exigir acentos.
9. Abra o sino para ler os dois avisos. Abrir esse painel marca a preferência global `notificationsRead` como verdadeira. O badge desaparece; os avisos permanecem acessíveis.
10. Toque nos dados da conta ou no perfil lateral para consultar o titular demonstrativo e alternar a preferência de valores.
11. Abra atendimento, expanda uma pergunta frequente e consulte a resposta local. O botão “Abrir atendimento oficial” solicita a abertura de `https://www.bb.com.br/atendimento`.
12. Feche o painel com o botão X, pelo fundo quando disponível ou pelo mecanismo de fechamento da plataforma.

Os filtros, a busca e a pergunta de FAQ aberta não são preferências permanentes. Trocar ou reabrir o painel reinicia seus estados locais. “Recarga de celular” é uma tela vazia explicativa; não possui campo de telefone nem cobrança.

Um erro de armazenamento pode fazer a preferência funcionar apenas em memória. A Home exibe aviso quando o controlador identifica falha. O conteúdo bancário continua disponível porque não depende de rede ou autenticação.

## 12. Inspetor IA: objetivos e responsabilidades

O Inspetor possui quatro responsabilidades de produto: **observar**, registrando fatos da execução; **verificar**, comparando operações com regras; **dar nota**, calculando resultado por execução e média por agente; **auditar**, recalculando fatos e preservando decisões humanas.

<div class="diagram"><div class="diagram-title">Pipeline demonstrativo de supervisão</div><div class="flow">Pedido → Intenção → Gateway → Execução ou bloqueio</div><div class="flow">Eventos → Política → Nota → Governança → Painel</div><div class="flow-sub">A tentativa permanece na trilha mesmo quando nenhuma ferramenta executa.</div></div>

A arquitetura explicita o que pode ser observado sem depender do raciocínio interno de um modelo: pedido, ferramenta solicitada, recurso, finalidade, titulares sintéticos, referências de autorização, decisão do gateway, resultado de ferramenta, delegação e resposta final. Não é necessário armazenar cadeia de pensamento para demonstrar o ciclo.

Atlas e Nina são identidades no simulador. Não são processos independentes, serviços externos ou instâncias de um modelo. A orientação de Nina é uma mensagem determinística emitida na função de simulação. A marca “IA” expressa o domínio do produto, enquanto o algoritmo de supervisão atual é determinístico.

A política compartilhada é usada em dois momentos: o gateway verifica uma intenção antes de a ferramenta sintética executar; depois, o avaliador inspeciona a trilha registrada. Isso separa prevenção e avaliação comportamental no fluxo, mas ambas as partes usam módulos locais e não oferecem independência operacional.

**Benefício demonstrado:** uma resposta final aparentemente segura não elimina uma tentativa anterior indevida. A interface expõe essa tentativa, a regra afetada, os eventos relacionados e a suspensão resultante.

**Limites:** o app não escuta telemetria real, não intercepta servidores MCP e não consegue desligar um agente externo. Toda suspensão impede novas chamadas ao simulador para aquela identidade, dentro desta sessão.

## 13. Agentes, ferramentas e base sintética

| Propriedade | Atlas | Nina |
| --- | --- | --- |
| ID | atlas | nina |
| Papel | Crédito PJ | Jurídico |
| Versão demonstrativa | 0.2.0 | 0.2.0 |
| Responsável | Equipe de crédito · fictícia | Equipe jurídica · fictícia |
| Finalidade | analisar-credito-pj | orientar-documentacao |
| Recursos | cadastro-sintetico; orientacao-juridica | orientacao-juridica |
| Delegações permitidas | nina | Nenhuma |
| Ferramentas | consultar_cadastro_pj; consultar_lote; exportar_dossie; consultar_juridico | consultar_norma_demo |

O catálogo de ferramentas é explícito. `conceder_credito` não está na lista de Atlas, embora seja usado no cenário de risco para demonstrar uma ação fora do escopo. Um nome permitido sozinho não basta: o recurso, a finalidade e o destinatário da delegação também precisam corresponder ao cadastro.

`DEMO_DATA` gera 25 pessoas com IDs de `PESSOA-DEMO-001` a `PESSOA-DEMO-025`, vinculadas a `EMPRESA-DEMO-001`. A segunda pessoa é menor; as outras 24 são adultas. O registro contém apenas uma mensagem sintética de disponibilidade documental. Não existem CPF, documento de identidade, endereço ou dados bancários reais nessa base.

`DEMO_USER` contém `OPERADOR-DEMO-001`, referência `AUTORIZACAO-DEMO-001` e autorização sintética para os 25 IDs. `TERCEIRO-DEMO` é colocado fora dessa lista no cenário indevido. A presença de uma string de autorização serve para testar a lógica; não representa uma verificação de identidade ou consentimento real.

Atlas pode delegar uma dúvida genérica para Nina sem enviar titulares. Essa execução pertence a Atlas. O fato de Nina aparecer em `agent.returned` não cria automaticamente uma execução pontuada para Nina. Para ela, há um cenário próprio: “Orientação jurídica genérica”.

## 14. Contratos de dados: entidades e operações

`contracts.ts` centraliza os tipos e parâmetros compartilhados. As uniões de strings limitam os valores válidos em desenvolvimento, enquanto `validation.ts` verifica os dados carregados em runtime.

| Entidade | Campos e função |
| --- | --- |
| Operation | Ferramenta, recurso, tipo, finalidade, base demonstrativa, titulares, acesso, aprovações, destinatário e agente-alvo |
| TraceEvent | Envelope de correlação + payload específico do evento |
| Check | ID da regra, status, evidência, recomendação e IDs de eventos |
| Run | Identidade, cenário, agente, política, entrada/saída, diagnósticos, avaliação, revisão e trilha |
| Review | Data, justificativa e autor demonstrativo |
| AuditEvent | ID, data, autor, título, detalhe e execução opcional |
| InspectorState | schema 2, sequência, cursor, execuções, controles dos robôs e eventos de governança |

O envelope de operação contém `tool`, `resource`, `kind` e `purpose`. Os tipos de operação são `read`, `export`, `delegate` e `execute`. `subjects` é uma lista de `{ id, age }`, em que idade é classificada como `adult`, `minor` ou `unknown`.

`access` traz `principalId`, `grantRef` e `subjectIds`: identidade declarada do operador, referência da autorização e conjunto permitido. `legalBasisRef` apresenta uma hipótese demonstrativa. Os controles específicos usam `childAssessmentRef`, `batchApprovalRef` e `sharingApprovalRef`. `recipient` distingue `internal` e `external`; `targetAgent` identifica uma delegação ou recebe `null`.

`Run` preserva a trilha inteira e a avaliação: `score`, `coverage`, `decision`, `observationComplete` e `observationIssues`. `review` começa como `null`. Os campos `durationMs` e `costCents` podem ser nulos, embora o simulador atual forneça valores sintéticos.

IDs legíveis são gerados como `RUN-0001`, `pj-trace-000001` e `RUN-0001-E01`. Essa convenção facilita a apresentação, mas não implementa unicidade global entre aparelhos, organizações ou sessões independentes. Uma integração distribuída precisará de identificação apropriada.

## 15. Eventos e rastreabilidade

Todo evento tem `id`, `runId`, `traceId`, `sequence`, `at`, `actor` e `parentId`. O horário é uma string ISO; a sequência começa em 1. `actor` pode ser Atlas, Nina, operador fictício ou gateway. Eventos de decisão/resultado fazem referência ao ID da operação solicitada por `requestId`.

| Evento | Significado | Payload característico |
| --- | --- | --- |
| request.received | Entrada observada do operador | detail |
| operation.requested | Intenção de chamar ferramenta/ação | operation |
| gateway.decided | Permissão ou negação antes da execução | requestId; outcome; ruleIds |
| tool.completed | Resultado sintético de ferramenta | requestId; records; detail |
| agent.delegated | Acionamento de outro agente | requestId; target; detail |
| agent.returned | Retorno correlacionado de agente | requestId; detail |
| response.produced | Resposta final ou recusa | outcome; detail |
| trace.closed | Encerramento declarado da coleta | detail |

Uma consulta autorizada normalmente possui seis eventos: pedido, intenção, permissão, resultado, resposta e encerramento. Uma tentativa bloqueada possui cinco, sem `tool.completed`. A recusa preventiva possui três: pedido, recusa e encerramento. A delegação possui sete, com eventos de delegação e retorno no lugar do resultado de ferramenta simples.

O emissor do simulador espaça os horários em **80 ms por evento**. A duração corresponde ao intervalo entre início e último evento da trilha completa: não mede latência de uma API ou desempenho de modelo. O custo é fixado em **4 centavos fictícios** por execução e não corresponde a cobrança.

`parentId` referencia por padrão o último evento emitido. `requestId` vincula decisões e resultados à intenção específica. Na tela, `TraceTimeline` mostra autor, ordem, horário, resumo, identificador e origem. Nas regras, `eventIds` permite relacionar uma evidência ao fato que a produziu.

**Distinção de trilhas:** `Run.trace` contém eventos de execução; `state.events` contém decisões e registros de governança, como revisão, atualização de score e suspensão. O limite de 500 aplica-se à segunda lista, não à soma dos eventos internos de todas as execuções.

## 16. Os dez cenários, detalhe por detalhe

| ID / cenário | Intenção e controle acionado | Nota / decisão |
| --- | --- | --- |
| healthy / Consulta autorizada | Cadastro da pessoa 001, dentro da autorização, recurso e finalidade | 100; approved |
| refusal / Recusa antes da consulta | Pedido de terceiro recusado sem operação solicitada | 100; approved |
| third-party / Tentativa de acesso a terceiro | Solicita TERCEIRO-DEMO, ausente da autorização; gateway nega | 70; blocked |
| minors / Dados de menor | Pessoa 002 sem referência de avaliação de melhor interesse | 80; blocked |
| bulk / Consulta em massa | 24 adultos sem aprovação de lote, acima do limite 10 | 85; blocked |
| sharing / Exportação sem autorização | exportar_dossie, tipo export, destinatário externo, sem aprovação | 80; blocked |
| scope / Ação fora do escopo | conceder_credito com tipo execute, fora da lista permitida | 85; blocked |
| delegation / Consulta ao agente jurídico | Atlas chama Nina para documentação genérica, sem titulares | 100; approved |
| telemetry / Evidência ausente | Simula consulta, mas remove tool.completed da observação entregue | 0 provisório; review |
| legal / Orientação jurídica genérica | Nina consulta consultar_norma_demo, sem titulares | 100; approved |

O cenário `healthy` consulta a base sintética e emite resultado, mas não concede crédito. `refusal` e `third-party` recebem o mesmo pedido indevido: essa escolha permite comparar comportamento seguro e tentativa imprópria sem mudar a demanda do operador.

Em `minors`, a pessoa já está na autorização sintética. A falha decorre especificamente da ausência de avaliação demonstrativa para menores. Em `bulk`, apenas os 24 adultos são incluídos, para isolar a regra de massa da proteção de menores. Em `sharing`, Atlas pode usar a ferramenta de exportação, mas falta a autorização específica: permissão de ferramenta e aprovação de compartilhamento são controles distintos.

Em `scope`, a ferramenta solicitada é a principal razão da falha. Em `delegation`, o simulador emite o acionamento e uma resposta textual de Nina, com a mesma origem de operação. Em `legal`, a execução é de Nina e respeita sua própria finalidade.

Em `telemetry`, a ferramenta executa no fluxo sintético, mas o evento de resultado é removido da trilha recebida pelo avaliador. A lacuna de sequência e o resultado ausente tornam a comprovação insuficiente. O resultado zero não significa cinco violações comprovadas: cada critério fica `unknown`.

Os cenários não armazenam notas predefinidas. `simulateRun` cria operações e eventos; `assessTrace` deriva a avaliação. Os testes alteram os fatos de uma trilha mantendo o nome do cenário, e verificam que a nota acompanha os fatos.

## 17. Política PJ-2026.2 e cinco controles

| Regra | Peso | Condição implementada |
| --- | ---: | --- |
| authorization | 30 | grantRef e legalBasisRef presentes; todo titular solicitado deve constar em access.subjectIds |
| minors | 20 | Menor exige childAssessmentRef; idade unknown torna o critério desconhecido |
| bulk | 15 | Mais de 10 titulares requer batchApprovalRef; avaliação agrega distintos por execução |
| sharing | 20 | kind export ou recipient external exige sharingApprovalRef |
| scope | 15 | Ferramenta, recurso e finalidade pertencem ao cadastro; delegação tem alvo permitido |

Todos os controles estão marcados `critical: true`. Na política atual, qualquer falha verificada leva a decisão `blocked` e suspensão local. Uma nota de 85 pode ser bloqueada; a decisão não é um corte fixo de pontuação.

`evaluateOperation` inspeciona cada intenção separadamente. Se há menores sem referência, a falha prevalece; se não há essa falha mas alguma idade é desconhecida, o resultado da regra fica desconhecido. Uma exportação interna também exige aprovação porque o tipo `export` já ativa o controle de compartilhamento.

`scope` compara igualdade da finalidade e inclusão nas listas de ferramentas/recursos. Uma operação `delegate` precisa de alvo não nulo. Quando há alvo, ele deve constar na lista de delegações permitidas, mesmo que outro tipo de operação tenha sido informado.

`assessTrace` agrega titulares distintos em todas as intenções do agente na execução. Se o conjunto passa de 10 e alguma operação não tem aprovação de lote, a regra massa falha. Isso impede que uma consulta de 12 pessoas dividida em duas chamadas de seis pareça estar dentro do limite demonstrativo.

**Parâmetros propostos, não exigências legais:** pesos, limite de dez titulares, janela de vinte e recorrência de três são escolhas do MVP. As referências a finalidade, necessidade, hipóteses de tratamento, menores e segurança constam na [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm). O [Enunciado ANPD nº 1/2023](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes/Enunciado1ANPD.pdf) orienta o melhor interesse de crianças e adolescentes. O código verifica referências demonstrativas; não decide sua validade jurídica nem certifica conformidade.

## 18. Fórmulas de nota, cobertura e score do agente

Cada regra recebe `pass`, `fail` ou `unknown`. A nota soma pesos apenas dos critérios `pass`. Uma regra conta uma única vez por execução, ainda que várias operações a violem. Uma operação posterior correta não compensa uma falha anterior na mesma execução.

```text
Nota da execução = soma(peso da regra quando status = pass)
Cobertura = soma(peso da regra quando status = pass ou fail)
Score do agente = arredondar(média das suas últimas até 20 notas)
Score médio da central = arredondar(média dos agentes avaliados)
```

A cobertura mede quanto foi possível decidir, incluindo falhas. Uma execução com nota 70 e cobertura 100 tem evidências suficientes, mas falhou em autorização. Uma execução com nota 0 e cobertura 0 não teve seus critérios comprovados. Se há falha observada e outra evidência ausente, a decisão continua bloqueada e a cobertura pode ser parcial.

A prioridade é: qualquer `fail` produz `blocked`; sem falha, algum `unknown` produz `review`; todos os critérios decididos como `pass` produzem `approved`. Os textos exibidos são Aprovada, Revisão necessária e Bloqueada.

No início de uma sessão nova, Atlas tem 100, 100 e 70: `(100 + 100 + 70) / 3 = 90`. Nina tem 100. A média da central é `(90 + 100) / 2 = 95`. A média das quatro execuções seria 92,5, mas não é essa a métrica central escolhida.

Agente sem execução tem `score = null`, evitando uma nota inventada. Se alguma execução da janela tem cobertura abaixo de 100, o score do agente é marcado provisório. Registrar revisão não remove essa condição, pois a nota e a cobertura originais são preservadas.

O histórico do gráfico mostra evolução da média, e não uma barra de cada nota individual. Para cada execução mostrada, calcula a janela vigente naquele ponto. Assim, a primeira barra visível pode incorporar execuções anteriores à janela atualmente exibida.

**Interpretação:** score resume histórico recente; suspensão é um estado operacional separado. Mesmo com média alta, um agente fica suspenso após uma falha crítica até revisão e retomada explícita.

## 19. Qualidade da observação e ausência de evidência

`observationIssues` verifica o início `request.received` e o término `trace.closed`; IDs duplicados; ordem sequencial; correlação com execução e trace; horários não regressivos; relação de origem com eventos anteriores; referências a operações válidas; e presença de uma única resposta final do agente avaliado.

Para cada `operation.requested`, exige exatamente uma decisão de gateway. A autoria dessa decisão deve ser `gateway`. Uma operação permitida deve ter um único resultado (`tool.completed` ou `agent.returned`); uma negada não deve ter resultado executado. Um resultado anterior à decisão é sinalizado como inconsistência. Operação solicitada por outro agente demanda avaliação própria.

Quando alguma dessas verificações encontra um problema, os critérios que não possuem falha já comprovada tornam-se `unknown`. Essa política é conservadora: uma lacuna compromete a comprovação das regras da execução, sem fabricar cinco violações. Falhas que já aparecem nas intenções permanecem `fail`.

O teste de trilha bloqueada sem encerramento demonstra esse caso: autorização continua falha; outros controles tornam-se desconhecidos; nota cai para zero, cobertura é 30 e decisão continua bloqueada. A prioridade preserva a violação, apesar da incompletude.

O validador de formato e o verificador de observação têm funções diferentes. Um JSON pode ter estrutura correta e ainda representar uma trilha incompleta. A restauração aceita determinados casos estruturados com evidência insuficiente, recalcula a nota e mantém a necessidade de revisão.

**Limites para produção:** as verificações não autenticam autores, não assinam eventos e não provam que o coletor viu todas as chamadas. Os campos de decisão e as referências recebidas são locais. A avaliação de regra se baseia principalmente na intenção solicitada; contradições detalhadas entre decisão, resultado e autorização precisam de uma suíte mais ampla e de um coletor confiável.

## 20. Governança: estados, revisão, suspensão e recorrência

`reduceInspector` recebe quatro famílias de ação: `simulate`, `review`, `toggleRobot` e `audit`. Copia o estado anterior e produz o próximo, sem alterar o snapshot anterior. Quando uma operação é inválida ou impedida, devolve o estado anterior.

Uma simulação cria nova execução, incrementa a sequência e insere a execução no início da lista. Registra observação, inspeção e atualização do score. Quando ocorre uma nova recorrência, registra o padrão. Quando a decisão é bloqueada, marca o agente pausado e adiciona a suspensão.

Uma revisão exige execução existente, decisão diferente de aprovada, ausência de revisão anterior e justificativa com **12 a 1000 caracteres após trim**. A revisão guarda horário, nota e autor fictício. Não altera score, decisão, fatos ou histórico e não retoma o robô automaticamente.

Retomar um agente suspenso é impedido enquanto existir execução bloqueada desse agente sem revisão. Depois de revisar todas as críticas, a pessoa pode retomar explicitamente. Pendências `review` por falta de evidência não produzem suspensão automática nesta política. A interface permite pausar manualmente um agente disponível e registra essa escolha.

<div class="diagram"><div class="diagram-title">Fluxo de uma ocorrência crítica</div><div class="flow">Disponível → Execução com falha → Suspenso</div><div class="flow">Suspenso → Revisão das críticas → Retomada explícita</div><div class="flow-sub">Revisão encerra a pendência; a execução histórica continua bloqueada.</div></div>

Recorrência significa uma mesma regra falhar em **pelo menos três execuções entre as últimas vinte do agente**. Eventos múltiplos da mesma execução não contam várias vezes. O registro “Recorrência identificada” é emitido quando o padrão passa a existir; não a cada nova execução enquanto ele já está ativo. Se as falhas saem da janela e o padrão reaparece posteriormente, uma nova identificação pode ocorrer.

A recorrência é um diagnóstico, não um desconto extra. As execuções já possuem as notas correspondentes. O histórico permite distinguir falha pontual, repetição recente e estado atual de suspensão.

## 21. Sessão inicial, sequência automática e limites

`createInspector` monta uma sessão de `schema: 2` e executa, nessa ordem, `healthy`, `refusal`, `legal` e `third-party`. Os horários são distribuídos entre quatro e um minuto antes do momento de criação.

| Execução inicial | Agente / caso | Resultado |
| --- | --- | --- |
| RUN-0001 | Atlas / consulta autorizada | 100, aprovada |
| RUN-0002 | Atlas / recusa preventiva | 100, aprovada |
| RUN-0003 | Nina / norma demonstrativa | 100, aprovada |
| RUN-0004 | Atlas / tentativa de terceiro | 70, bloqueada; Atlas suspenso |

As métricas iniciais são quatro execuções, média 95, uma revisão pendente, uma crítica e um agente disponível. O início apresenta um problema já preparado para investigação, sem exigir que o usuário crie o primeiro incidente.

O laboratório permite escolher um cenário explicitamente ou iniciar uma sequência a cada **oito segundos**. A sequência percorre o catálogo com um cursor e ignora agentes pausados. Na sessão inicial, Atlas está suspenso; por isso, a sequência disponível pode executar os cenários de Nina até Atlas ser retomado.

`useInspector` só mantém o intervalo quando está pronto, o modo automático está ativado, a central está visível, o app está ativo, existe agente disponível e o limite de execuções não foi atingido. Ao fechar a central, `stop()` desativa o modo automático. Ao sair do primeiro plano, o intervalo é removido; ao voltar com a central aberta e o modo ainda ativo, pode recomeçar.

Não existe serviço em segundo plano, fila remota ou recuperação de ticks perdidos. A sequência simula uma nova execução por intervalo ativo. Botões de execução ficam desabilitados para agente pausado, sessão em carregamento ou limite cheio.

O limite é **100 execuções por sessão**. O motor interrompe novas execuções ao atingir esse número, preservando as existentes e suas pendências. A trilha de governança retém os últimos **500 registros**. A janela de score é **20 por agente**. A interface carrega oito execuções ou quinze registros por vez, com botão Mostrar mais.

Não foi encontrado botão de “zerar sessão”, importação de relatórios ou migração automática da versão anterior. Limpeza de armazenamento durante desenvolvimento deve ser consciente e precedida de exportação quando o histórico importar.

## 22. Persistência, restauração e validação

| Chave local | Conteúdo | Comportamento |
| --- | --- | --- |
| @bb/home/preferences/v1 | valuesVisible e notificationsRead | Preferências booleanas; painel e filtros não persistem |
| @bb/inspector/session/v2 | Estado completo do Inspetor | Execuções, traces, revisões, pausas, sequência, cursor e auditoria |

Os hooks carregam AsyncStorage em efeito de montagem. Um sinal `active` impede atualizações tardias após desmontagem. `ready` habilita as ações após a leitura. Um marcador `dirty` evita escrever a sessão inicial automaticamente antes de haver interação. Uma cadeia de Promises serializa gravações para reduzir inversão de ordem.

No controlador bancário, os dados recuperados precisam conter dois booleanos. JSON inválido ou falha de leitura ativa aviso. No Inspetor, `restoreInspector` faz análise detalhada e pode recusar a sessão, apresentando uma nova demonstração e mensagem de validação.

A restauração exige schema 2, política corrente, limites de listas, sequência consistente, cenários/agentes conhecidos, IDs de execução coerentes, datas válidas e formatos corretos. Reconstrói entrada, saída e ferramentas a partir dos eventos e recalcula a avaliação com `reassess`; não confia na nota salva.

Se há execução bloqueada não revisada, a restauração força o agente a permanecer suspenso, mesmo se o campo salvo disser disponível. Uma revisão precisa de nota válida e não pode ser associada a execução aprovada. Eventos de governança devem ter IDs EVT numéricos em ordem crescente e referências existentes quando apontam para uma execução.

`validation.ts` limita a 200 eventos por trace, 100 titulares e 100 IDs de acesso por operação, referências até 120 caracteres e detalhes até 2000. Duração/custo são nulos ou inteiros seguros entre zero e 1.000.000. A validação verifica formato e coerência local, sem consulta externa às referências.

O armazenamento v1 do Inspetor não é reinterpretado como política PJ atual. O código registra a intenção de preservar a chave antiga, pois sua política anterior não pode ser convertida silenciosamente em avaliação de privacidade.

**Consequências práticas:** dados ficam neste aparelho/navegador; não sincronizam entre dispositivos; podem desaparecer ao limpar os dados; e não constituem armazenamento imutável. Alterar a trilha pode alterar a avaliação recalculada, pois não existe assinatura. Em erro de gravação, a sessão atual segue em memória e a interface avisa.

## 23. Manual de uso do Inspetor e roteiro de apresentação

1. Abra o destaque “Abrir central de inspeção” ou o item Inspetor. Confira a identificação de simulação e os quatro indicadores iniciais.
2. Observe Atlas com score 90 e investigue o bloqueio. O detalhe de RUN-0004 apresenta nota 70, cobertura 100, uma tentativa e nenhuma ação executada.
3. Percorra a linha do tempo: pedido de terceiro, intenção registrada, gateway negando, recusa final e encerramento. A regra Acesso autorizado mostra zero de 30 e o evento que sustenta a falha.
4. Volte à central e abra RUN-0002. Compare: a mesma solicitação foi recusada sem tentativa, nota 100. Este é o exemplo central para explicar o produto.
5. Volte a RUN-0004. Digite uma justificativa, como “Permissões conferidas na base fictícia.”, e registre a revisão. O botão de retomada passa a ser permitido quando não restam críticas sem revisão.
6. Retome Atlas explicitamente. Confirme que RUN-0004 continua bloqueada e com nota 70. Revisão registrada e agente disponível são estados diferentes.
7. Na Visão geral, escolha “Consulta ao agente jurídico” e execute. Abra a nova execução: a nota é 100, e os eventos mostram Atlas → Nina → retorno, sem titulares enviados.
8. Escolha “Evidência ausente”. Abra o detalhe: nota zero provisória, cobertura zero, cinco critérios sem comprovação e avisos da trilha. Explique que isso é falta de evidência, não cinco violações confirmadas.
9. Experimente os cinco riscos. Cada ocorrência crítica exige revisão e retomada antes de novo cenário de Atlas. Para demonstrar recorrência, repita a mesma violação até alcançar três execuções na janela, incluindo a inicial quando aplicável.
10. Na aba Robôs, confira responsável fictício, versão, ferramentas, delegações, score, ocorrências e estado. Use Pausar/Retomar para demonstrar decisões manuais.
11. Na aba Regras, confira atribuições e pesos. Na aba Auditoria, pressione Auditar sessão e examine o registro com divergências, pendências e trilhas incompletas.
12. Exporte o relatório JSON. No navegador, será iniciado um download; em Android/iOS, o conteúdo será entregue ao compartilhamento do sistema.

Para apresentação, reserve tempo para três comparações: recusa preventiva versus tentativa; nota de execução versus score do agente; falha comprovada versus evidência insuficiente. Não é necessário executar todos os cenários numa apresentação curta, mas o catálogo completo permanece disponível para exploração.

## 24. Exportação, auditoria e interpretação do relatório

`createReport` reúne `title`, `generatedAt`, `simulated`, `schema`, `policy`, `rules`, `scoreSubject`, `scope`, `scoring`, `metrics`, `demoUser`, `robots`, `runs` e `auditTrail`. Cada robô inclui cadastro, estado e `assessment`, com média, janela, histórico e recorrências.

O relatório inclui as operações e referências sintéticas dentro dos traces, evidências por regra e revisões humanas. Ele identifica explicitamente o agente como objeto do score e informa o alcance local e os limites de retenção. Pode ser usado para demonstrar e inspecionar a sessão, sem representar uma certificação.

No web, `exportReport` cria um Blob JSON UTF-8, uma URL temporária e um link com nome `inspetor-simulacao-N.json`, em que N é a sequência corrente. O link é removido após o clique e a URL é revogada após 60 segundos para permitir consumo assíncrono do arquivo.

No nativo, usa `Share.share` com título e JSON como mensagem. A escolha de destino pertence ao aparelho e aos aplicativos disponíveis. A implementação não garante criação de um anexo físico `.json` em todas as plataformas. O retorno distingue cancelamento e envio ao mecanismo de compartilhamento.

A auditoria reaplica `reassess` a cada execução e compara nota, cobertura, decisão, critérios, completude e problemas de observação. Registra quantas divergências encontrou, mas **não substitui as notas históricas durante essa ação**. Os testes verificam explicitamente que uma nota alterada é detectada e preservada no snapshot auditado.

Isso difere da restauração: ao carregar uma sessão, a avaliação é reconstruída a partir da trilha. Auditar é conferir e registrar; restaurar é reconstruir o estado válido para uso.

O relatório não é enviado automaticamente a servidor ou equipe. Exportar é uma ação explícita. A interface desabilita a ação durante a geração e apresenta resultado ou erro. Não existe importação correspondente ou histórico compartilhado entre revisores.

## 25. Catálogo técnico de todos os módulos

| Caminho | Como participa da aplicação |
| --- | --- |
| index.ts | Runtime Metro e registro da raiz Expo |
| App.tsx | Providers, StatusBar e estado de carregamento bancário |
| src/theme.ts | Design tokens e tipos Theme/Color |
| src/data/bank.ts | Sheet, Transaction, conta, lançamentos, fatura e funções BRL/data |
| src/hooks/useBanking.ts | Preferências, leitura/escrita local e controle de painéis |
| src/hooks/useCompactLayout.ts | Decisão compacta por largura efetiva e escala de fonte |
| src/screens/HomeScreen.tsx | Composição principal e integração do controlador Inspetor |
| src/components/ui.tsx | Primitivas, controles e superfícies reutilizáveis |
| src/components/Brand.tsx | Geometria BB, bloco de marca e marca Pix |
| src/components/BankCards.tsx | Conta, cartão, valores, objetivo e ajuda |
| src/components/Navigation.tsx | Navegação lateral e inferior por callbacks |
| src/components/Transactions.tsx | Linhas financeiras e resumo de quatro lançamentos |
| src/components/ServiceSheet.tsx | Modal de serviços, busca, filtros, FAQ e link externo |
| src/features/inspector/contracts.ts | Tipos, política, regras, limites e agentes |
| src/features/inspector/simulator.ts | Base sintética, operador, cenários e emissor de eventos |
| src/features/inspector/policy.ts | Operações, integridade da observação, nota e reassess |
| src/features/inspector/engine.ts | Reducer, seed inicial, médias, recorrência, auditoria e relatório |
| src/features/inspector/validation.ts | Validadores runtime de formatos e operações |
| src/features/inspector/storage.ts | Chave v2 e restauração coerente por recálculo |
| src/features/inspector/useInspector.ts | Persistência, ciclo de vida, timer e API do controlador |
| src/features/inspector/InspectorSummary.tsx | Destaque da Home e pendências |
| src/features/inspector/InspectorPanel.tsx | Quatro abas, estatísticas, laboratório, filtros e exportação |
| src/features/inspector/InspectorParts.tsx | Badges, lista/detalhe de execução e formulário de revisão |
| src/features/inspector/TraceTimeline.tsx | Apresentação da trilha e suas referências |
| src/features/inspector/exportReport.ts | Download web e Share nativo |
| scripts/expo.cjs | Launcher Expo com temporários no projeto |
| scripts/playwright.cjs | Launcher de testes com caches locais |
| scripts/generate-icons.cjs | Renderização de assets pelo Chromium, a partir de BB_SYMBOL |
| tests/home.spec.ts | Quatro jornadas bancárias, executadas em mobile e desktop |
| tests/inspector.spec.ts | Seis jornadas da central, executadas em mobile e desktop |
| tests/responsive.spec.ts | Seis larguras de 280 a 430, home, central e serviços |
| tests/inspector-engine.spec.ts | Quatorze testes puros de regras, governança e restauração |
| docs/design-references.md | Pesquisa visual, fontes e decisões de adaptação |
| docs/inspector.md | Roteiro, política e limites do MVP |
| docs/analise-relatorio.md | Mapeamento de requisitos, decisões provisórias e evolução |

As configurações e assets são detalhados no próximo capítulo. Esta organização permite localizar a responsabilidade antes de modificar comportamento. Para alterar uma regra, o caminho começa em contrato/política; para alterar sua apresentação, começa em Parts/Panel; para alterar persistência, começa em storage/validation/hook.

## 26. Configurações, assets e ferramentas de desenvolvimento

`app.json` define nome “BB · Conceito”, slug `bb-home-conceito`, versão 1.0.0, orientação portrait e estilo light. Habilita suporte a tablet no iOS; o Android tem ícone adaptativo e suporte configurado ao gesto preditivo de voltar. O web utiliza favicon.

Os assets são `icon.png`, `favicon.png`, `android-icon-foreground.png` e `android-icon-monochrome.png`. O script gera 1024 px para ícone/foreground/monochrome e 64 px para favicon. Foreground e monochrome são transparentes; monochrome usa símbolo branco. A UI usa vetor, não esses bitmaps para desenhar o cabeçalho.

`tsconfig.json` estende `expo/tsconfig.base` e habilita `strict: true`. A configuração encontrada não define aliases próprios. `eslint.config.js` usa o formato flat e ignora `dist`, `.cache`, `test-results` e `playwright-report`.

`metro.config.js` parte de `getDefaultConfig` do Expo e acrescenta bloqueios para caches e resultados de testes. Assim, o bundler não precisa rastrear esses artefatos como fonte do aplicativo. `.npmrc` direciona o cache npm para `.cache/npm`.

Os launchers Expo e Playwright criam `.cache/tmp` e ajustam `TEMP`, `TMP` e `TMPDIR` somente no processo filho. Playwright define `.cache/browsers` por padrão, mantendo possibilidade de substituir `PLAYWRIGHT_BROWSERS_PATH`. A configuração de testes separa downloads por ID de processo.

`AGENTS.md` contém regras de desenvolvimento: consultar a documentação da versão Expo, instalar pacotes com Expo Install, usar Router, priorizar mobile e executar lint/typecheck. `CLAUDE.md` remete a esse arquivo. São instruções para manutenção, não telas do produto.

O arquivo `LICENSE` contém licença MIT com atribuição à Expo/650 Industries. A distribuição deve conservar avisos aplicáveis. Fontes visuais externas e dependências possuem seus próprios termos; o documento de design registra origem de BB, Pix e ícones. Essa informação pertence ao inventário de manutenção e não altera os direitos sobre a marca.

## 27. Instalação, execução e comandos

Requisitos: Node 22.13+; npm; acesso para instalar dependências; dispositivo/ambiente compatível para testar plataformas. No Windows do projeto, o caminho pode ser aberto com PowerShell:

```powershell
Set-Location -LiteralPath 'F:\BB-APP'
npm ci
npm start
```

`npm ci` utiliza o lockfile. `npm start` chama o launcher local do Expo. Para o navegador, use `npm run web`; para dispositivo Android/emulador configurado, `npm run android`. `npm run ios` exige ambiente de simulador iOS disponível em macOS; não disponibiliza um simulador iOS no Windows.

| Comando | Finalidade |
| --- | --- |
| npm start | Servidor de desenvolvimento Expo |
| npm run web | Servidor e abertura web |
| npm run android | Solicitar abertura no Android disponível |
| npm run ios | Solicitar abertura iOS no ambiente compatível |
| npm run typecheck | tsc --noEmit |
| npm run lint | Lint pelo launcher Expo |
| npm run check | Typecheck seguido de lint |
| npm run test:engine | Testes puros sem servidor web ou navegador |
| npm run test:e2e | Suite completa e servidor configurado |
| npm run export:web | Bundle web em dist/ |
| npx expo-doctor | Diagnóstico de compatibilidade e configuração |
| npx expo install --fix | Ajuste intencional de versões incompatíveis |
| npx expo install pacote | Adição de dependência com versão compatível |

O app precisa de Expo Go compatível com SDK 57 ou development build adequado. Bibliotecas nativas não presentes no cliente exigem reconstrução; a distinção é descrita na [documentação de development builds](https://docs.expo.dev/develop/development-builds/introduction/).

Para preparar Chromium e executar testes:

```powershell
node scripts/playwright.cjs install chromium
npm run test:engine
npm run test:e2e
```

Para regenerar ícones usando o cache local:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = '.cache/browsers'
node scripts/generate-icons.cjs
```

Não troque o navegador pela revisão de outra instalação apenas para evitar o download. Use o binário compatível com a versão do Playwright. Os exemplos não pressupõem credenciais bancárias ou variáveis secretas, pois o runtime atual é local e sintético.

## 28. Estratégia de testes e validação desta documentação

A suíte completa configura quatro projetos: `engine`, `desktop`, `mobile` e `compact`. O desktop usa 1440×1100; mobile/compact usam um perfil Pixel 7 no Chromium. Há dois workers, timeout geral de 120 s e espera de assertivas de até 10 s. O servidor de teste usa Expo web na porta 8081, offline, com CI e telemetria Expo desativada para esse processo.

As falhas retêm trace e captura. A configuração independente `playwright.engine.config.ts` executa somente o motor, sem precisar de servidor Expo. O uso de Playwright para lógica pura permite compartilhar a mesma ferramenta sem obrigar navegador nesses testes.

| Grupo | Casos no código | O que comprova |
| --- | ---: | --- |
| Motor | 14 | Regras, evidência, delegação, score, recorrência, revisão, limites e restauração |
| Home desktop/mobile | 4 × 2 | Saldo/fatura, privacidade persistida, extrato/busca, avisos/FAQ |
| Inspetor desktop/mobile | 6 × 2 | Revisão, evidência ausente, sequência, auditoria/download, tentativa e delegação |
| Responsividade | 6 | 280, 320, 360, 375, 390 e 430 px, com componentes e modais |
| Total configurado | 40 | Lógica local e experiência web demonstrativa |

A responsividade verifica a largura interna do ScrollView e os limites de botões, além da página inteira. Isso detecta conteúdo que poderia escapar dentro de um contêiner sem ampliar o documento externo. Os testes de sequência controlam o relógio para avançar os intervalos, em vez de depender de espera real longa.

Os testes do motor verificam também operações autorizadas para menores/lotes/compartilhamento, falta de referência, recurso/finalidade/alvo indevidos, consulta fracionada, nota alterada, suspensão adulterada no snapshot e limites de retenção. Não são apenas verificações de textos na tela.

**Resultado da rodada atual:** veja o arquivo `docs/validacao-documentacao.json`, incorporado à edição PDF. Ele separa verificações executadas agora dos registros históricos de 01/10/2026 em `docs/analise-relatorio.md`. Não confundir os dois momentos.

O escopo de comprovação é local/web. Não demonstra aprovação em Android/iOS físicos, desempenho sob carga, revisão jurídica, segurança de backend inexistente ou publicação. Bundles exportados também não equivalem a APK/IPA assinados. A cobertura percentual de código não foi medida nesta análise.

## 29. Segurança, privacidade e riscos técnicos reais

O runtime não coleta senha, não pede autorização de pagamento e não chama conta bancária. A base é sintética; o único link externo funcional identificado na interface é a página de atendimento, aberto por escolha do usuário. As notificações são conteúdo local, sem SDK de push.

Os controles do Inspetor são regras de demonstração. As referências de base, autorização e aprovação são strings verificadas por presença ou associação local. Elas não são obtidas de uma identidade autenticada, não têm assinatura, prazo ou emissor confiável e não provam consentimento ou outra hipótese de tratamento.

AsyncStorage guarda dados localmente sem um mecanismo de criptografia implementado pelo app. Ocultar valores é uma preferência visual. O log de auditoria pode ser alterado ou eliminado por quem controla o ambiente local; o formato validado não o torna imutável.

| Risco atual | Efeito prático | Próxima resposta proposta |
| --- | --- | --- |
| Autores não autenticados | Autor fictício não identifica revisor real | Autenticação e papéis de operador/revisor/admin |
| Gateway no cliente | Pode ser contornado fora do simulador | Enforcement no servidor, sem acesso alternativo às ferramentas |
| Referências declaradas | Aprovação técnica pode ser apenas uma string | Serviço de autorização e validação de escopo/finalidade |
| Evidência local editável | Recálculo não detecta falsificação de origem | Coletor confiável, proteção e integridade dos registros |
| Política única atual | Mudanças podem invalidar restauração antiga | Versionamento e migrações explícitas |
| Limite de sessão | Não atende observação contínua | Retenção, paginação e armazenamento remoto |
| Compartilhamento manual | Revisores não compartilham uma central comum | Serviço de relatório com controle de acesso |
| Falta de teste nativo atual | Comportamento pode variar por plataforma | Matriz de aparelhos e development builds |

Essas lacunas explicam o planejamento de produção. Não impedem o uso atual como demonstração controlada, mas delimitam o significado de “segurança”, “auditoria” e “monitoramento” nos materiais de apresentação.

## 30. Performance e compatibilidade multiplataforma

A aplicação mantém o estado inteiro no cliente. A Home utiliza `ScrollView`; a central limita a exibição inicial e aumenta por botão. Não há FlatList virtualizada, processamento remoto, upload, streaming ou sincronização. Os limites de 100 execuções e 500 registros ajudam a conter o crescimento, mas não constituem um teste de carga.

`agentMetrics` filtra, ordena e calcula médias e histórico quando chamado pela UI. A restauração percorre e recalcula as execuções. Cada mudança de sessão grava um snapshot JSON completo. Essas escolhas simplificam o MVP; numa central extensa, podem aumentar custo de CPU, memória e escrita.

O timer roda somente na central visível e em primeiro plano. Isso evita simular trabalho quando o usuário está em outra tela ou o app está inativo. A remoção do intervalo em cleanup evita timers duplicados entre mudanças de condição.

Os vetores evitam carregar imagens de rede para marca e ícones. A fonte do sistema elimina download de fonte própria. O layout usa área segura e dimensão de janela, e componentes têm limites de largura e quebra para telas pequenas.

Pontos que exigem medição futura: tempo de inicialização com histórico cheio; custo de serialize/reassess; navegação no detalhe longo; responsividade sob fonte ampliada; uso de memória; e latência da integração real. Otimizações como memoização, lista virtualizada, escrita incremental ou separação de serviço devem ser escolhidas a partir dessas medições.

| Plataforma | Situação documentada |
| --- | --- |
| Web | Testável com React Native Web e Playwright; download JSON implementado |
| Android | Alvo Expo configurado; comportamento nativo precisa de teste em aparelho/build |
| iOS | Alvo Expo e tablets configurados; simulador depende de macOS; teste físico pendente |
| Tablets/desktop | Layout adaptável por largura; evidências atuais incluem imagens e testes web |

Não foi executada nesta documentação uma mudança de API Expo/React Native. O trabalho produz documentos e ferramentas para sua geração, preservando o aplicativo analisado.

## 31. Publicação, builds e manutenção operacional

Não há `eas.json`, IDs nativos de distribuição ou evidência de submissão a lojas neste workspace. A configuração de app e a possibilidade de exportar bundles não bastam para afirmar que o produto está pronto para publicar.

O caminho de distribuição proposto segue as instruções do projeto: usar EAS para builds assinados, submissão e atualizações. A [visão geral oficial do EAS](https://docs.expo.dev/eas/) descreve esses serviços. A configuração de projeto, perfis, credenciais e identificação de aplicativo deve ocorrer como tarefa própria.

```powershell
# Exemplos para uma futura configuração de distribuição:
npx eas-cli@latest build:configure
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile development --platform ios
# Somente após configurar um perfil production e validar o produto:
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --platform android
npx eas-cli@latest submit --platform ios
```

Não executar essas etapas apenas por constarem no manual: elas pressupõem decisões de publicação e configuração compatível. O development build precisará dos pacotes e perfis apropriados. EAS Update requer configuração de atualização, política de runtime/canais e validação de compatibilidade; o app atual não declara `expo-updates`.

Sem `ios/` e `android/` versionados, o projeto segue a estratégia de geração nativa prevista nas instruções locais. Configuração de comportamento nativo deve permanecer em app config/config plugins, em vez de criar projetos manuais. A referência é [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/).

Para manutenção cotidiana: instalar de modo reprodutível, conferir mudanças de SDK com documentação versionada, executar check, rodar testes relevantes, revisar artefatos e testar as plataformas afetadas. Mudanças de política devem informar versão, expectativas de score e estratégia para sessões já salvas.

## 32. Diagnóstico de problemas e uso em demonstração

| Sintoma | Explicação provável | Ação prática |
| --- | --- | --- |
| Executar cenário desabilitado | Atlas suspenso, carregamento ou limite cheio | Conferir Robôs, revisar críticas e retomar; observar limite |
| Retomar Atlas desabilitado | Existe bloqueio não revisado | Registrar revisão de todas as críticas de Atlas |
| Nota não aumenta após revisão | Revisão preserva avaliação histórica | Explicar a distinção; novas execuções alteram média |
| Zero sem cinco falhas | Trilha com evidência incompleta | Conferir cobertura, status unknown e problemas de observação |
| Sequência gera apenas Nina | Atlas suspenso; cursor ignora agentes indisponíveis | Revisar e retomar Atlas se desejar seus cenários |
| Sequência para ao fechar | Comportamento explícito de stop | Reabrir e iniciar novamente |
| Preferência/histórico não salva | Erro de AsyncStorage ou ambiente sem persistência | Ver aviso; exportar enquanto a sessão estiver em memória |
| Sessão reiniciada com aviso | JSON/política/formato não passou na restauração | Preservar o raw para diagnóstico, sem expor dados reais |
| Chromium não encontrado | Navegador compatível não instalado no cache configurado | Executar launcher install chromium |
| Teste não sobe na porta 8081 | Conflito ou servidor não disponível | Conferir processo/porta antes de trocar configuração |
| Expo Go não abre projeto | Cliente e SDK podem ser incompatíveis | Usar cliente compatível ou development build |
| Link de ajuda falha | Navegador/rede não abriu URL | Interface mostra mensagem e o endereço de atendimento |

Para restaurar a demonstração inicial em ambiente de desenvolvimento, remova somente a chave de sessão do Inspetor por ferramentas do ambiente, após exportar o que precisar. A UI atual não possui comando de reset. Evite orientar limpeza de todo o armazenamento quando apenas uma chave interessa.

Uma apresentação deve começar com o estado salvo conhecido. Se já houver interações anteriores, as notas e IDs podem diferir do roteiro inicial. O documento usa RUN-0001 a RUN-0004 como seed de uma sessão nova, e não promete que toda abertura sempre volta a esse estado.

## 33. Planejamento existente e decisões em aberto

A análise local do relatório registra uma parcial documental em “2 de outubro” e apresentação na “primeira semana de dezembro”, sem ano explícito no documento de origem. Não há comprovação de agenda confirmada, aceite da parcial ou entrega externa. Este PDF não converte esses marcos em compromisso aprovado.

As decisões implementadas como propostas são: score do agente; cinco controles; pesos 30/20/15/20/15; limite de dez titulares; média de vinte execuções; recorrência de três; pausa após falha; revisão sem mudança retroativa da nota; e eventos locais `local-events/1`.

| Questão para a equipe | O que o MVP escolheu | O que falta decidir |
| --- | --- | --- |
| Pesos | Somam 100 | Validade por domínio e explicação dos tradeoffs |
| Severidade | Toda falha é crítica | Diferenciar alerta, revisão e bloqueio por regra |
| Janela | Últimas 20 | Volume, período temporal e política de retenção |
| Recorrência | 3 execuções por regra | Escalonamento, responsáveis e ação corretiva |
| Telemetria ausente | Zero provisório, revisão | SLA de coleta, expiração e tratamento de atrasos |
| Revisão humana | Nota textual e retomada separada | Papéis, dupla aprovação e comprovação de correção |
| Protocolo | Contrato tipado local | MCP, A2A ou adaptação conforme arquitetura real |
| Avaliação | Fatos de chamada observados | Escopo e riscos de avaliação semântica futura |
| Independência | Mesmo processo local | Separação de coletor, gateway, política e UI |
| Distribuição | Sem configuração de loja | Público, identidade do produto e builds de avaliação |

A pesquisa prévia de MCP e A2A está registrada em `docs/analise-relatorio.md`. Nenhum desses protocolos foi instalado. Escolher um protocolo não substitui identidade, autorização, observação confiável ou bloqueio efetivo. A primeira integração deve demonstrar o percurso real de uma ferramenta antes de ampliar o catálogo.

## 34. Roadmap proposto, entregáveis e critérios de aceite

Este roadmap organiza as lacunas encontradas. **Não é um cronograma aprovado**; não pressupõe orçamento, equipe ou fornecedores. Os critérios indicam como reconhecer a conclusão de cada etapa.

| Etapa / prioridade | Entregável proposto | Critério de aceite |
| --- | --- | --- |
| A · P0 · consolidar política | Documento acordado de pesos, limites, severidade e janela | Casos bons, ruins e incompletos têm expectativa aprovada e reproduzível |
| B · P0 · integrar um agente | Serviço separado com agente controlado, ferramenta e gateway | Eventos do pedido ao resultado correlacionados; operação negada não executa |
| C · P0 · identidade e autorização | Operadores, agentes, revisores e escopos confiáveis | Usuário sem papel não revisa; agente sem permissão não chama ferramenta |
| D · P0 · evidência protegida | Ingestão validada, deduplicação, retenção e armazenamento | Duplicatas/atrasos/reordenação não inventam aprovação; autoria verificável |
| E · P1 · navegação | Migração para Expo Router | Rotas em src/app e retorno/link de execução testados nas plataformas |
| F · P1 · governança operacional | Fluxo de pendências, motivos, responsáveis e correção | Bloqueio, revisão e retomada são auditáveis e não apagáveis silenciosamente |
| G · P1 · qualidade nativa | Matriz Android/iOS, acessibilidade e desempenho | Uso principal aprovado em aparelhos reais e fontes ampliadas |
| H · P1 · distribuição de avaliação | EAS configurado, development/preview builds | Equipe instala e avalia uma versão identificável e reproduzível |
| I · P2 · expansão | Mais agentes e domínios com contratos estáveis | Novo agente não contorna escopo nem altera regras existentes sem versão |
| J · P2 · análise semântica | Avaliação complementar, se necessária | Métricas e falsos positivos definidos; score continua explicável |

Para a primeira integração, a arquitetura proposta é: aplicativo → serviço autenticado → gateway de política → ferramenta/agente → coletor → avaliador → armazenamento protegido → aplicativo. Credenciais de ferramentas e poder de bloqueio devem ficar no serviço. O cliente consulta e solicita ações autorizadas.

Uma implementação inicial deve priorizar um caminho pequeno: uma chamada autorizada, uma negada, uma delegação e uma falha de telemetria. Compare seus eventos com os cenários sintéticos para verificar se o contrato suporta os fatos reais.

Depois disso, planeje testes de duplicidade, atraso, eventos fora de ordem, indisponibilidade, falsificação de autoria e caminho que tenta contornar o gateway. O código atual sinaliza lacunas, mas não implementa recuperação distribuída. Em seguida, evolua armazenamento, paginação, filtros, autenticação e alertas conforme necessidade observada.

## 35. Backlog detalhado e indicadores futuros

| Item proposto | Dependência principal | Evidência de conclusão |
| --- | --- | --- |
| Definir proprietário da política | Equipe de produto/governança | Versão e aprovadores identificados |
| Separar coletor do simulador | Contrato de eventos | Mesmo avaliador consome coleta real controlada |
| Validar autorizações no servidor | Identidade e fonte confiável | Referência inválida/expirada/fora do conjunto é negada |
| Proteger isolamento entre organizações | Modelo de usuários/tenants | Uma organização não consulta traces de outra |
| Versionar e migrar sessões/políticas | Modelo persistente | Dados anteriores são preservados ou rejeitados com motivo explícito |
| Acrescentar revisão de atraso/timeout | Política de observação | Trilha pendente tem destino previsível sem aprovação por silêncio |
| Paginar e virtualizar históricos | Armazenamento remoto | Navegação utilizável com volume definido pela equipe |
| Separar score de alerta operacional | Regras/severidade aprovadas | Média alta não libera bloqueio pendente |
| Garantir exportação por papel | Serviço de relatórios | Campos e alcance respeitam permissão do solicitante |
| Tratar foco e leitor de tela | Navegação e componentes | Jornadas testadas com VoiceOver/TalkBack/teclado |
| Criar pipeline de validação | Ambiente de CI | Check e suites relevantes executam em cada alteração |
| Definir identidade de distribuição | Decisão de produto | Materiais e builds descrevem claramente o conceito independente |

Indicadores a considerar numa integração: proporção de execuções com observação completa; tempo até decisão preventiva; atraso de ingestão; quantidade de bloqueios por regra; tempo para revisão; recorrências por agente; retomadas com justificativa; divergências de auditoria; e falhas de coleta. Metas numéricas devem ser definidas depois de medir o caminho real.

Para produto e UX, medir sucesso na investigação de uma ocorrência, entendimento de nota versus cobertura e conclusão da revisão. Para engenharia mobile, medir início, memória e tempo de interação com histórico representativo. Nenhum desses indicadores está instrumentado atualmente como analytics remoto.

## 36. Galeria comentada da interface

As imagens abaixo são artefatos existentes do projeto. São úteis para entender hierarquia e responsividade; a data de geração exata não foi inferida a partir de horário de arquivo. Textos e posições podem mudar conforme largura e histórico salvo.

<figure class="phone-figure"><img src="preview-mobile.png" alt="Página inicial no celular"><figcaption>Figura 1 · Página inicial mobile: destaque do Inspetor, conta e acesso às ações.</figcaption></figure>

<figure class="wide-figure"><img src="preview-desktop.png" alt="Página inicial no desktop"><figcaption>Figura 2 · Layout desktop: menu lateral e distribuição em colunas.</figcaption></figure>

<figure class="phone-figure"><img src="preview-mobile-small.png" alt="Página inicial em largura de 320 pixels"><figcaption>Figura 3 · Forma compacta: adaptação de conteúdo e atalhos em 320 px.</figcaption></figure>

<figure class="phone-figure"><img src="inspector-mobile.png" alt="Visão geral do Inspetor"><figcaption>Figura 4 · Central mobile: indicadores e início da investigação.</figcaption></figure>

<figure class="wide-figure"><img src="inspector-desktop.png" alt="Central do Inspetor no desktop"><figcaption>Figura 5 · Visão geral desktop: laboratório e lista de execuções.</figcaption></figure>

<figure class="phone-figure"><img src="inspector-mobile-detail.png" alt="Detalhe de inspeção no celular"><figcaption>Figura 6 · Detalhe da execução: nota, cobertura e contexto do agente.</figcaption></figure>

<figure class="phone-figure"><img src="inspector-mobile-trace.png" alt="Linha do tempo dos eventos"><figcaption>Figura 7 · Linha do tempo: tentativa, decisão e evidências correlacionadas.</figcaption></figure>

<figure class="wide-figure"><img src="inspector-desktop-detail.png" alt="Relatório de execução no desktop"><figcaption>Figura 8 · Relatório de inspeção em tela ampla.</figcaption></figure>

As capturas completas (`preview-mobile-full.png`, `preview-desktop-full.png` e variantes pequenas) permanecem em `docs/` para consulta adicional. Evitou-se comprimi-las em uma única página a ponto de tornar textos ilegíveis.

## 37. Glossário e referências

| Termo | Significado neste projeto |
| --- | --- |
| Agente | Identidade sintética Atlas ou Nina, com escopo explícito |
| Inspetor | Pipeline local de avaliação e governança de execuções |
| Gateway | Função preventiva que permite ou nega operações no simulador |
| Trace | Conjunto correlacionado de eventos de uma execução |
| Run | Execução com entrada, eventos, avaliação e revisão opcional |
| Score | Média recente do agente; a nota individual pertence à execução |
| Cobertura | Soma dos pesos que puderam ser decididos, inclusive falhas |
| Unknown | Critério sem comprovação suficiente, diferente de fail |
| Recorrência | Mesma regra violada em três ou mais execuções na janela |
| Revisão | Registro humano demonstrativo que encerra uma pendência |
| Suspensão | Impedimento local de novas simulações para um agente |
| MCP/A2A | Protocolos investigados; não conectados no código atual |
| CNG | Geração de projetos nativos a partir da configuração Expo |
| EAS | Serviços Expo propostos para builds, submissão e atualizações |
| MVP | Recorte funcional pequeno para validar comportamento e produto |

**Fontes locais primárias:** código em `src/`, App/index, configurações, lockfile, testes e documentos citados. A análise inclui o estado não commitado; a documentação não presume que ele tenha sido publicado.

**Fontes oficiais consultadas nesta edição:** [SDK Expo 57](https://docs.expo.dev/versions/v57.0.0/), [índice Expo para agentes](https://docs.expo.dev/llms.txt), [Expo Router](https://docs.expo.dev/router/introduction/), [EAS](https://docs.expo.dev/eas/), [CNG](https://docs.expo.dev/workflow/continuous-native-generation/), [development builds](https://docs.expo.dev/develop/development-builds/introduction/), [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) e [Enunciado ANPD 1/2023](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes/Enunciado1ANPD.pdf). Consulta em 07/10/2026.

**Fontes de pesquisa visual registradas pelo projeto:** App Store e Google Play do Banco do Brasil; diretrizes de marca citadas; manual CCBB; vetor BB em Wikimedia Commons; Simple Icons para Pix e Lucide para ícones. O detalhe de acesso, disponibilidade e atribuição está no apêndice de referências de design.

**Manutenção da documentação:** atualizar versões, catálogo de cenários, fórmulas, limites, estrutura e evidências quando mudar o código. Regenerar o PDF após editar este Markdown e conferir a validação de páginas. Cada roadmap deve permanecer identificado como proposta até ser acordado e implementado.

## 38. Evidências e documentos de apoio

A edição PDF inclui, a seguir, um painel de validação da rodada atual e os três documentos de apoio existentes: análise das 17 seções, guia do MVP e referências de design. Eles preservam o contexto e as decisões anteriores em vez de ocultar detalhes atrás de um resumo.

Informações históricas nesses apêndices permanecem atribuídas às datas originais. A validação de 01/10/2026 citada no relatório local é distinta das verificações executadas para gerar esta documentação. O planejamento proposto nos capítulos anteriores não modifica o código ou o estado de aprovação desses textos.

