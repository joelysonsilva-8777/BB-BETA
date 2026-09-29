# Referências e decisões de design

Pesquisa realizada em 29/09/2026. Este trabalho é um conceito independente, não uma reprodução certificada nem uma entrega oficial do Banco do Brasil.

## Fontes consultadas

1. [App BB publicado pelo Banco do Brasil na App Store](https://apps.apple.com/br/app/banco-do-brasil/id330984271). Foram examinadas as imagens promocionais e telas disponibilizadas pelo desenvolvedor, incluindo Pix, Ourocard, Minhas Finanças e Cofrinho. A apresentação confirma a relevância de saldo, extrato, cartões e atalhos.
2. [App BB publicado no Google Play](https://play.google.com/store/apps/details?id=br.com.bb.android&hl=pt_BR). Descrição e notas do próprio banco sobre serviços e personalização da tela inicial. As imagens das lojas são materiais promocionais e não garantem a mesma interface para todos os perfis de conta.
3. [Diretrizes de Marca Banco do Brasil](https://www.bb.com.br/docs/portal/dimac/Diretrizes-de-Marca-Banco-do-Brasil.pdf). O conteúdo indexado descreve o símbolo, a fonte proprietária e uma linguagem de atenção e simpatia. O download direto desse arquivo ficou indisponível neste ambiente.
4. [Manual de Identidade da Marca CCBB](https://www.bb.com.br/docs/portal/dimac/CCBB-Manual-de-identidade-da-Marca.pdf), páginas 4 e 9 do PDF. Referência pública do conglomerado para o azul `#465EFF` e amarelo `#FCFC30`. O documento é do Centro Cultural, não um manual dos componentes do aplicativo bancário.
5. [Símbolo e logotipo BB em Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Banco_do_Brasil_Logo.svg). Vetor atribuído ao Banco do Brasil, com origem indicada como bb.com.br. O componente `Brand.tsx` preserva a geometria do símbolo desse arquivo; as cores variam conforme a superfície. A marca pertence ao Banco do Brasil.

## Adaptação para este projeto

O ícone Pix usa a geometria do [Simple Icons](https://github.com/simple-icons/simple-icons), distribuída em CC0. Os demais ícones de interface são do Lucide (licença ISC).

O amarelo aparece no símbolo e em uma linha superior; o azul identifica ações. O fundo neutro e um azul mais escuro nos textos interativos mantêm o contraste e atendem à preferência por uma aparência sóbria. O Ourocard usa azul-marinho, sem efeitos luminosos.

A organização foi redesenhada para esta tela: conta corrente e atalhos, cartão, movimentações e objetivos. A saudação nominal e os textos curtos têm função prática. Não foram reproduzidos o login, senhas, fluxos de autorização ou campanhas da instituição.

A tipografia é a fonte do sistema (iOS/Android/Arial no navegador), não a fonte proprietária do BB. Os cantos menores são uma adaptação intencional ao pedido do usuário. Não se afirma identidade visual 100% idêntica ao produto oficial.

Os valores, o titular, a conta, o cartão e os lançamentos são fictícios. Os telefones de atendimento exibidos vêm da descrição oficial nas lojas. O único link externo da interface leva à página de atendimento em bb.com.br e só é aberto ao pressionar o botão correspondente.
