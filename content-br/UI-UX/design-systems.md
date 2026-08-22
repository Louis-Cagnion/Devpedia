---
order: 10
---

# Design systems

Os capítulos anteriores (cor, tipografia, espaçamento, hierarquia) dão princípios; em um produto de uma única página, aplicar cada um caso a caso basta. Passadas algumas dezenas de telas e várias pessoas projetando-as, reaplicar essas decisões manualmente a cada nova tela acaba divergindo: dois botões "principais" com um azul levemente diferente, um espaçamento que varia de uma tela para outra sem razão. Um **design system** é a resposta organizacional a esse problema: um conjunto único de regras, valores e componentes reutilizáveis, ao qual toda nova interface se refere em vez de redecidir cada detalhe.

## Os design tokens: nomear os valores em vez de repeti-los

Um **design token** é um valor de design (uma cor, um espaçamento, um raio de borda) ao qual se dá um nome, para referenciá-lo em todo lugar em vez de copiá-lo:

| Categoria | Exemplo de token | Valor | Vem de |
|---|---|---|---|
| Cor | `cor-destaque` | O azul de destaque escolhido para as ações principais | [Cor e contraste](/?c=ui-ux&p=couleur-et-contraste) (harmonia, contraste WCAG) |
| Espaçamento | `espaco-m` | 16px | [Espaçamento e grade](/?c=ui-ux&p=espacement-et-grille) (escala coerente) |
| Raio de borda | `raio-padrao` | 8px | Decisão de estilo própria do produto |
| Tipografia | `texto-titulo` | Família, tamanho e peso de um título | [Tipografia](/?c=ui-ux&p=typographie) (escala, pairing) |

Um token não substitui nenhum dos princípios já vistos (uma escala de espaçamento coerente, um contraste suficiente...): ele dá a eles um nome reutilizável, uma vez o valor escolhido. Tecnicamente, um token quase sempre se traduz em uma [variável CSS](/?c=langages-de-balisage&s=css&p=variables-et-cascade): este capítulo permanece no nível da decisão de projeto, não de sua sintaxe de implementação.

> **Armadilha:** deixar coexistir, para um mesmo valor, um token E ocorrências fixas em outro lugar do produto (um botão que referencia `cor-destaque`, outro que escreve diretamente o código de cor). Mudar o token corrige então apenas parte dos casos: exatamente o problema que uma [fonte única de verdade](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite) deveria evitar.
>
> **Boa prática:** uma vez criado um token, fazer sua valor ser referenciado em todo lugar onde aparece, sem exceção pontual "só dessa vez": uma única ocorrência fixa já basta para quebrar a coerência que o token deveria garantir.

## A biblioteca de componentes: construir uma vez, reutilizar em todo lugar

Uma **biblioteca de componentes** reúne os elementos de interface recorrentes (botão, campo de formulário, cartão, menu) construídos uma única vez a partir dos tokens, e depois reutilizados em cada tela em vez de redesenhados:

```text
Sem biblioteca                 Com biblioteca
------------------------       ------------------------
Tela A: botao "Confirmar"      Tela A: <BotaoPrincipal>
Tela B: botao "Confirmar"      Tela B: <BotaoPrincipal>
  (redesenhado independente-     (mesmo componente, uma unica
   mente, leve variacao)          fonte, garantido identico)
```

> **Armadilha:** duplicar um componente existente para adaptá-lo levemente a uma nova tela ("parto do botão existente mas só mudo esse detalhe"), em vez de evoluir o componente original. A cópia inevitavelmente diverge do original ao longo de retoques posteriores, e o produto acaba com várias versões ligeiramente diferentes do "mesmo" componente.
>
> **Boa prática:** evoluir o próprio componente compartilhado (com um parâmetro para a variação necessária, se ela for legítima) em vez de duplicá-lo: a mesma lógica de [fonte única de verdade](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite) e [evitar a repetição](/?c=qualite-et-architecture-du-code&p=eviter-la-repetition-structures-indexees) já vistas do lado do código se aplica igualmente aos elementos de interface.

## Armadilha: construir um design system antes de ter telas reais

Um design system emerge de padrões que realmente se repetem em várias telas já projetadas, não de uma antecipação do que um dia poderia se repetir.

> **Armadilha:** construir uma biblioteca de componentes exaustiva antes mesmo de ter projetado algumas telas reais do produto. Sem casos de uso reais para confrontá-los, os componentes antecipados frequentemente não correspondem às necessidades que emergem uma vez o produto realmente projetado: tempo investido generalizando uma necessidade ainda hipotética.
>
> **Boa prática:** deixar um design system emergir progressivamente a partir de telas reais (extrair um componente uma vez que um padrão se repetiu 2 ou 3 vezes), em vez de projetá-lo integralmente com antecedência.

## O que é preciso lembrar

| | |
|---|---|
| **Para lembrar** | Um design system nomeia os valores de design em tokens reutilizáveis (cor, espaçamento, tipografia...) e constrói uma biblioteca de componentes a partir deles, para manter um produto coerente além do que uma única pessoa pode decidir tela por tela. Ele emerge de padrões reais em vez de ser antecipado. |
| **Ferramentas utilizáveis** | Tokens de design (frequentemente [variáveis CSS](/?c=langages-de-balisage&s=css&p=variables-et-cascade)); uma biblioteca de componentes compartilhada. |
| **Armadilhas a evitar** | Deixar um valor fixo coexistir com um token que o substitui. Duplicar um componente em vez de evoluir o original. Construir um design system completo antes de ter telas reais a partir das quais generalizar. |
| **Boas práticas** | Referenciar um token em todo lugar onde seu valor aparece, sem exceção. Evoluir um componente compartilhado em vez de duplicá-lo. Deixar um design system emergir progressivamente de um padrão repetido várias vezes. |
