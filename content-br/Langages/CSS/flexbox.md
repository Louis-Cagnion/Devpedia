---
order: 5
---

# Flexbox

O **Flexbox** (*Flexible Box Layout*) organiza elementos ao longo de um **único eixo** (horizontal ou vertical), distribuindo o espaço disponível entre eles, a solução moderna para alinhar, centralizar e distribuir elementos, substituindo técnicas históricas bem mais frágeis (floats, [tabelas](/?c=langages-de-balisage&s=html&p=tableaux) desviadas de seu uso original).

## Ativar o Flexbox

```css
.container {
    display: flex;
}
```

Assim que `display: flex` é colocado em um elemento, todos os seus **filhos diretos** (e apenas eles) se tornam "itens flexíveis", alinhados automaticamente em uma linha (por padrão).

## O eixo principal: `flex-direction`

```css
.container {
    display: flex;
    flex-direction: row;      /* padrao: esquerda para direita */
    /* flex-direction: column;   -> de cima para baixo */
    /* flex-direction: row-reverse; */
}
```

Todo Flexbox raciocina em termos de **eixo principal** (o de `flex-direction`) e **eixo secundário** (perpendicular): as propriedades de alinhamento abaixo se aplicam de forma diferente conforme esse eixo.

## Alinhar no eixo principal: `justify-content`

```css
.container {
    display: flex;
    justify-content: flex-start;     /* padrao: agrupados no inicio */
    /* justify-content: center;        -> centralizados */
    /* justify-content: space-between;  -> espaco igual ENTRE os elementos, nada nas bordas */
    /* justify-content: space-around;    -> espaco igual AO REDOR de cada elemento */
}
```

## Alinhar no eixo secundário: `align-items`

```css
.container {
    display: flex;
    align-items: stretch;       /* padrao: estica os elementos por toda a altura disponivel */
    /* align-items: center;       -> centraliza verticalmente (se flex-direction: row) */
    /* align-items: flex-start;     -> alinha no topo */
    /* align-items: flex-end;        -> alinha embaixo */
}
```

> **O centro perfeito, um clássico resolvido em 3 linhas:**

```css
.container {
    display: flex;
    justify-content: center;  /* centraliza horizontalmente */
    align-items: center;      /* centraliza verticalmente */
}
```

## As propriedades nos filhos

```css
.elemento {
    flex-grow: 1;       /* pode crescer para ocupar o espaco restante (1 = parte igual entre elementos) */
    flex-shrink: 1;     /* pode encolher se faltar espaco (padrao) */
    flex-basis: 200px;  /* tamanho inicial, antes de aplicar grow/shrink */
    order: 2;           /* muda a ordem de exibicao SEM tocar no HTML */
}
```

> **Nota (acessibilidade):** `order` só muda a ordem **visual**: a ordem de tabulação pelo teclado e a lida por um leitor de tela continuam sendo as do HTML. Um descompasso entre as duas pode desorientar um usuário de teclado ou de leitor de tela; a reservar para reordenações puramente decorativas, nunca para consertar uma ordem de conteúdo que não faz sentido no próprio HTML.

```css
.coluna-principal { flex-grow: 2; }   /* ocupa duas vezes mais espaco que .coluna-lateral */
.coluna-lateral { flex-grow: 1; }
```

## Quebra de linha: `flex-wrap`

```css
.container {
    display: flex;
    flex-wrap: nowrap;   /* padrao: tudo cabe em uma unica linha, encolhe se necessario */
    /* flex-wrap: wrap;     -> passa para a linha seguinte se faltar espaco */
}
```

## Resumo visual

```text
justify-content (eixo principal, aqui horizontal):
[■]                    [■] [■] [■]              [■]       [■]       [■]
flex-start             center                    space-between

align-items (eixo secundario, aqui vertical):
[■]                    [■]                        [■]
[ ]  flex-start        [ ]  center                [ ]  flex-end
[ ]                    [ ]                        [■]
```

Veja também [CSS Grid](/?c=langages-de-balisage&s=css&p=grid), para um layout em **duas** dimensões (linhas E colunas simultaneamente), enquanto o Flexbox continua fundamentalmente pensado para um único eixo por vez.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O Flexbox alinha elementos em um único eixo (`flex-direction`). `justify-content` alinha no eixo principal, `align-items` no eixo secundário. `flex-grow`/`flex-shrink`/`flex-basis` controlam o tamanho dos filhos. |
| **Ferramentas utilizáveis** | `display: flex`, `justify-content`, `align-items`, `flex-wrap`, `flex-grow`/`shrink`/`basis`, `order`. |
| **Armadilhas a evitar** | Usar `order` para reordenar um conteúdo que tem uma ordem de leitura real: a ordem visual muda, mas não a ordem de tabulação pelo teclado nem a lida por um leitor de tela. |
| **Boas práticas** | Reservar `order` para reordenações puramente decorativas; usar Grid em vez de Flexbox assim que o layout precisar de duas dimensões (linhas E colunas). |
