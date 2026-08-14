---
order: 6
---

# CSS Grid

Ao contrário do [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox), pensado para um único eixo por vez, o **CSS Grid** organiza elementos em uma verdadeira grade em **duas dimensões**: linhas e colunas definidas simultaneamente, com um controle preciso da posição de cada elemento.

## Ativar uma grade

```css
.container {
    display: grid;
    grid-template-columns: 200px 200px 200px;  /* 3 colunas de 200px cada */
    grid-template-rows: 100px 100px;           /* 2 linhas de 100px cada */
    gap: 10px;                                 /* espaco entre as celulas, linhas E colunas */
}
```

## A unidade `fr`: distribuir o espaço disponível

```css
.container {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;   /* 3 colunas: a 2a ocupa 2x mais espaco que as outras 2 */
}
```

`fr` (*fraction*) distribui o espaço **restante** depois de subtrair os tamanhos fixos; bem mais flexível que uma porcentagem, principalmente combinando com tamanhos fixos:

```css
.container {
    display: grid;
    grid-template-columns: 250px 1fr;   /* coluna lateral fixa, coluna principal que ocupa o resto */
}
```

## `repeat()`: evitar a repetição

```css
.container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);   /* equivalente a "1fr 1fr 1fr 1fr" */
}
```

## Grades responsivas sem media query

```css
.container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}
```

`auto-fit` calcula automaticamente quantas colunas **de pelo menos** `200px` cabem no espaço disponível, e as estica (`1fr`) para preencher o espaço restante: o número de colunas então se adapta à largura da tela, sem escrever uma única [media query](/?c=langages-de-balisage&s=css&p=responsive-et-media-queries).

## Posicionar um elemento precisamente

```css
.elemento {
    grid-column: 1 / 3;  /* se estende da linha de grade 1 a linha 3 -> ocupa 2 colunas */
    grid-row: 2 / 4;     /* se estende por 2 linhas verticalmente */
}
```

```text
Linhas de grade verticais:  1    2    3    4
                                ┌────┬────┬────┐
                          1 ┤   │    │    │    │
                                ├────┼────┼────┤
                          2 ┤   │ elemento (col 1→3, row 2→4)  │
                                ├────┤              │
                          3 ┤   │    │              │
                                └────┴────┴────┘
```

## As zonas nomeadas (`grid-template-areas`): o layout mais legível

```css
.container {
    display: grid;
    grid-template-columns: 200px 1fr;
    grid-template-areas:
        "cabecalho  cabecalho"
        "lateral principal"
        "rodape    rodape";
}

.cabecalho { grid-area: cabecalho; }
.lateral { grid-area: lateral; }
.principal { grid-area: principal; }
.rodape { grid-area: rodape; }
```

Cada nome em `grid-template-areas` desenha literalmente a disposição visual da página diretamente no CSS; uma zona repetida em várias linhas/colunas do esquema ocupa automaticamente esse espaço mesclado (aqui, `cabecalho` e `rodape` se estendem por toda a largura).

## Flexbox ou Grid?

| | Flexbox | Grid |
|---|---|---|
| Dimensões | Um único eixo por vez | Duas dimensões simultâneas |
| Caso de uso típico | Alinhar elementos em uma barra de navegação, centralizar um conteúdo | Estruturar o layout global de uma página (cabeçalho/lateral/principal/rodapé) |
| Tamanho dos elementos | Frequentemente depende do conteúdo | Definido explicitamente pela grade |

Na prática, os dois se combinam muito frequentemente em um mesmo projeto: Grid para a estrutura geral da página, Flexbox para alinhar o conteúdo dentro de cada zona.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O CSS Grid organiza elementos em uma grade em duas dimensões (linhas E colunas), ao contrário do Flexbox (um único eixo). A unidade `fr` distribui o espaço restante; `grid-template-areas` nomeia visualmente cada zona. |
| **Ferramentas utilizáveis** | `display: grid`, `grid-template-columns`/`rows`, `fr`, `repeat()`, `grid-template-areas`, `grid-column`/`grid-row`. |
| **Armadilhas a evitar** | Usar Flexbox para um layout que realmente precisa de duas dimensões: o resultado logo vira um empilhamento de contornos. |
| **Boas práticas** | `repeat(auto-fit, minmax(...))` para uma grade responsiva sem escrever media query; `grid-template-areas` para uma estrutura de página legível diretamente no CSS. |
