---
order: 6
---

# CSS Grid

Ao contrário do Flexbox (ver capítulo dedicado), concebido para um único eixo de cada vez, **o CSS Grid** organiza os elementos numa verdadeira grelha **bidimensional** — linhas e colunas definidas simultaneamente, com um controle preciso da posição de cada elemento.

## Ativar uma grelha

```css
.conteneur {
    display: grid;
    grid-template-columns: 200px 200px 200px;   /* 3 colonnes de 200px chacune */
    grid-template-rows: 100px 100px;               /* 2 lignes de 100px chacune */
    gap: 10px;                                        /* espace entre les cellules, lignes ET colonnes */
}
```

## A unidade «`fr`»: distribuir o espaço disponível

```css
.conteneur {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;   /* 3 colonnes : la 2e occupe 2x plus d'espace que les 2 autres */
}
```

`fr` (*fração*) distribui o espaço **restante** após a subtração dos tamanhos fixos — muito mais flexível do que uma percentagem, especialmente quando combinada com tamanhos fixos:

```css
.conteneur {
    display: grid;
    grid-template-columns: 250px 1fr;   /* colonne latérale fixe, colonne principale qui occupe le reste */
}
```

## `repeat()` : evitar repetições

```css
.conteneur {
    display: grid;
    grid-template-columns: repeat(4, 1fr);   /* équivalent à "1fr 1fr 1fr 1fr" */
}
```

## Grelhas responsivas sem media query

```css
.conteneur {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}
```

`auto-fit` Calcula automaticamente quantas colunas **de, pelo menos**, `200px` cabem no espaço disponível e estica-as (`1fr`) para preencher o espaço restante — o número de colunas adapta-se, assim, à largura da tela, sem necessidade de escrever uma única media query (ver capítulo dedicado).

## Posicionar um elemento com precisão

```css
.element {
    grid-column: 1 / 3;   /* s'étend de la ligne de grille 1 à la ligne 3 -> occupe 2 colonnes */
    grid-row: 2 / 4;        /* s'étend sur 2 lignes verticalement */
}
```

```
Lignes de grille verticales :  1    2    3    4
                                ┌────┬────┬────┐
                          1 ┤   │    │    │    │
                                ├────┼────┼────┤
                          2 ┤   │ élément (col 1→3, row 2→4)  │
                                ├────┤              │
                          3 ┤   │    │              │
                                └────┴────┴────┘
```

## As áreas nomeadas (`grid-template-areas`): o layout mais legível

```css
.conteneur {
    display: grid;
    grid-template-columns: 200px 1fr;
    grid-template-areas:
        "entete  entete"
        "lateral principal"
        "pied    pied";
}

.entete { grid-area: entete; }
.lateral { grid-area: lateral; }
.principal { grid-area: principal; }
.pied { grid-area: pied; }
```

Cada nome em `grid-template-areas` define literalmente o layout visual da página diretamente no CSS — uma área repetida em várias linhas/colunas do esquema ocupa automaticamente esse espaço combinado (neste caso, `entete` e `pied` estendem-se por toda a largura).

## Flexbox ou Grid?

| | Flexbox | Grid |
|---|---|---|
| Dimensões | Um único eixo de cada vez | Duas dimensões simultâneas |
| Casos de utilização típicos | Alinhar elementos numa barra de navegação, centrar um conteúdo | Estruturar o layout global de uma página (cabeçalho/barra lateral/conteúdo principal/rodapé) |
| Tamanho dos elementos | Depende frequentemente do conteúdo | Definido explicitamente pela grelha |

Na prática, ambas as técnicas combinam-se frequentemente num mesmo projeto: Grid para a estrutura geral da página e Flexbox para alinhar o conteúdo no interior de cada área.
