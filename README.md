# BB · Conceito de aplicativo

Tela inicial de um aplicativo bancário inspirada na identidade do **Banco do Brasil**. Projeto de interface independente, com dados fictícios. Não é o aplicativo oficial e não se conecta a contas bancárias.

[Documentação completa em PDF](docs/BB-APP-Documentacao-Completa.pdf) · [Versão editável](docs/documentacao-completa.md) · [Versão HTML](docs/documentacao-completa.html)

Agora inclui um **assistente multiagente funcional**: API local, SQLite, sessões de demonstração, agentes financeiro/individual/empresarial, fluxo composto, confirmação de edição e monitoramento protegido. Execute `npm run dev:web` e toque **Conversar com o bot principal**. [Guia e roteiro da demonstração](docs/multiagente.md) · [Análise da arquitetura](docs/multiagente-analise.md). Dados fictícios, sem conexão bancária ou LLM conectado.

Inclui o **Inspetor IA**, uma central funcional de supervisão simulada de outros robôs: observa execuções, verifica regras, calcula notas explicáveis, suspende agentes com falhas críticas e registra revisões humanas e auditorias. Acesse pelo destaque na página inicial ou pelo menu **Inspetor**.

[Análise das 17 seções do relatório](docs/analise-relatorio.md) · [Experimente o MVP de crédito PJ](docs/inspector.md) · [Prévia da central](docs/inspector-mobile.png)

O MVP acompanha Atlas (crédito PJ) e Nina (jurídico), aplica cinco controles de proteção de dados e explica a nota com eventos de tentativa, bloqueio, consulta e resposta. Distingue recusa preventiva de recusa após tentativa indevida; mantém score por agente, recorrência e revisão humana. Pesos e limites são propostas documentadas, com dados fictícios.

[Prévia no celular](docs/preview-mobile.png) · [Celular de 320 px](docs/preview-mobile-small.png) · [Página completa](docs/preview-mobile-full.png) · [Prévia no desktop](docs/preview-desktop.png)

## Design

- Símbolo BB em vetor e amarelo/azul usados com moderação sobre superfícies neutras.
- Saldo e ações frequentes em primeiro plano; Ourocard, extrato, cofrinho e atendimento na sequência.
- Contornos leves, cantos de 4–8 px nos controles e ausência de neon, gradientes ou sombras decorativas.
- Tipografia do sistema para leitura nativa. A fonte proprietária BancoDoBrasil não é distribuída neste projeto.
- Barra inferior no celular e menu lateral em telas grandes. Os detalhes abrem em painéis na mesma página.
- Em celulares menores, margens compactas, atalhos em duas colunas e valores reorganizados em linhas próprias. Os painéis seguem a largura disponível, com rolagem vertical. O layout compacto também considera o tamanho de fonte configurado no aparelho.

A pesquisa, as fontes e as decisões de adaptação estão em [Referências de design](docs/design-references.md).

## Tecnologia

React Native 0.86.3, Expo SDK 57, React 19.2.3, TypeScript 6, Shopify Restyle, React Native SVG e Lucide. AsyncStorage guarda as preferências e o histórico local da simulação do inspetor.

Não há arquivos CSS, Tailwind ou NativeWind na interface. O design é definido em TypeScript pelos tokens do Restyle e pelas propriedades nativas dos componentes. React Native Web faz a conversão necessária no navegador.

## Executar

Requisito: Node.js 22.13 ou superior.

```sh
npm ci
npm start
```

Use uma versão do Expo Go compatível com SDK 57 ou um development build. O Android também pode ser aberto em um emulador já configurado. O simulador de iOS requer macOS.

```sh
npm run web         # Prévia no navegador
npm run android     # Android conectado/emulador
npm run ios         # Simulador iOS, no macOS
npm run check       # TypeScript + ESLint
npx expo-doctor     # Compatibilidade Expo
npm run export:web  # Exportação web em dist/
```

Os caches e arquivos temporários ficam em `.cache` no disco do projeto, conforme `.npmrc` e `scripts/expo.cjs`. Nenhuma variável global do sistema é alterada.

## Interações

- Ocultar e mostrar os valores em toda a interface, inclusive nos painéis. Preferência mantida ao reabrir.
- Consultar extrato com filtros Todas, Entradas e Saídas.
- Consultar os exemplos de Pix, pagamentos, transferências, fatura e limite do Ourocard.
- Acompanhar um objetivo de exemplo no Cofrinho BB.
- Buscar serviços sem precisar digitar acentos.
- Abrir notificações, marcar avisos como lidos e consultar dados demonstrativos do perfil.
- Consultar perguntas frequentes e, por ação explícita do usuário, abrir a página oficial de atendimento do BB.

Os painéis bancários continuam como consultas demonstrativas, sem contratação de produtos, transferências, Pix reais ou cobranças. A extensão multiagente adiciona sessões fictícias e senha administrativa local; não solicita credenciais bancárias nem dados financeiros reais. Veja os limites no [guia do assistente](docs/multiagente.md).

## Organização

```text
App.tsx                      Providers e carregamento
src/theme.ts                 Cores, tipografia, espaçamentos e raios
src/screens/HomeScreen.tsx   Única tela principal
src/components/BankCards.tsx Saldo, Ourocard, cofrinho e atendimento
src/components/Brand.tsx     Símbolo vetorial BB e ícone Pix
src/components/Navigation.tsx Menu lateral e barra inferior
src/components/ServiceSheet.tsx Painéis de detalhes e busca
src/components/Transactions.tsx Movimentações financeiras
src/data/bank.ts             Dados fictícios, centavos inteiros e formatação BRL
src/hooks/useBanking.ts      Preferências locais e abertura dos painéis
```

## Verificações

```sh
node scripts/playwright.cjs install chromium
npm run test:e2e
```

O comando instala o navegador compatível com a versão do Playwright em `.cache/browsers`. Temporários e downloads também ficam no projeto; `PLAYWRIGHT_BROWSERS_PATH` pode substituir esse local. Não reutilize um executável de outra revisão para validar os downloads.

Os testes cobrem celular e desktop: renderização, fatura, privacidade e persistência, filtros do extrato, busca de serviços, avisos e ajuda. A validação no navegador e a geração dos bundles não substituem os testes em aparelhos Android e iOS antes de uma publicação.

A suíte de responsividade verifica larguras de 280, 320, 360, 375, 390 e 430 px, tanto na página principal quanto nos painéis. Ela verifica também a largura interna dos componentes de rolagem e dos botões para detectar conteúdo que escaparia mesmo sem alargar a página inteira.

Os ícones do aplicativo podem ser regenerados com `node scripts/generate-icons.cjs`, após instalar o Chromium do Playwright. Para usar a instalação local, defina `PLAYWRIGHT_BROWSERS_PATH` como `.cache/browsers` nesse comando. São renderizados do mesmo símbolo vetorial utilizado na interface.
