---
order: 5
---

# Flexbox

**O Flexbox** (*Flexible Box Layout*) organiza os elementos ao longo de um **único eixo** (horizontal ou vertical), distribuindo o espaço disponível entre eles — a solução moderna para alinhar, centrar e distribuir elementos, substituindo técnicas antigas muito mais frágeis (elementos flutuantes, tabelas utilizadas de forma inadequada, ver o capítulo sobre tabelas no HTML).

## Ativar o Flexbox

```css
.conteneur {
    display: flex;
}
```

Assim que a propriedade `display: flex` é aplicada a um elemento, todos os seus **filhos diretos** (e apenas esses) tornam-se «elementos flexíveis», alinhados automaticamente numa linha (por predefinição).

## O tema principal: `flex-direction`

```css
.conteneur {
    display: flex;
    flex-direction: row;      /* par défaut : gauche à droite */
    /* flex-direction: column;   -> haut en bas */
    /* flex-direction: row-reverse; */
}
```

Todo o Flexbox funciona com base no eixo** principal** (o eixo d`flex-direction`o) e no eixo** secundário** (perpendicular) — as propriedades de alinhamento abaixo aplicam-se de forma diferente consoante o eixo.

## Alinhar com o eixo principal: `justify-content`

```css
.conteneur {
    display: flex;
    justify-content: flex-start;     /* par défaut : regroupés au début */
    /* justify-content: center;        -> centrés */
    /* justify-content: space-between;  -> espace égal ENTRE les éléments, rien sur les bords */
    /* justify-content: space-around;    -> espace égal AUTOUR de chaque élément */
}
```

## Alinhar com o eixo secundário: `align-items`

```css
.conteneur {
    display: flex;
    align-items: stretch;       /* par défaut : étire les éléments sur toute la hauteur disponible */
    /* align-items: center;       -> centre verticalement (si flex-direction: row) */
    /* align-items: flex-start;     -> aligne en haut */
    /* align-items: flex-end;        -> aligne en bas */
}
```

> **O alinhamento central perfeito, um clássico resolvido em 3 linhas:**

```css
.conteneur {
    display: flex;
    justify-content: center;   /* centre horizontalement */
    align-items: center;        /* centre verticalement */
}
```

## Propriedades dos elementos filhos

```css
.element {
    flex-grow: 1;      /* peut grandir pour occuper l'espace restant (1 = part égale entre éléments) */
    flex-shrink: 1;      /* peut rétrécir si l'espace manque (par défaut) */
    flex-basis: 200px;     /* taille de départ, avant application de grow/shrink */
    order: 2;                /* change l'ordre d'affichage SANS toucher au HTML */
}
```

> **Nota (acessibilidade):** `order` altera apenas a ordem **visual** — a ordem de tabulação no teclado e a lida por um leitor de ecrã mantêm-se as do HTML. Uma discrepância entre as duas ordens pode desorientar um utilizador que utilize o teclado ou um leitor de ecrã; deve ser reservada apenas para reordenações puramente decorativas, nunca para corrigir uma ordem de conteúdo que não faça sentido no próprio HTML.

```css
.colonne-principale { flex-grow: 2; }   /* occupe deux fois plus d'espace que .colonne-laterale */
.colonne-laterale { flex-grow: 1; }
```

## Nova linha: `flex-wrap`

```css
.conteneur {
    display: flex;
    flex-wrap: nowrap;   /* par défaut : tout tient sur une seule ligne, rétrécit si besoin */
    /* flex-wrap: wrap;     -> passe à la ligne suivante si manque de place */
}
```

## Resumo visual

```
justify-content (axe principal, ici horizontal) :
[■]                    [■] [■] [■]              [■]       [■]       [■]
flex-start             center                    space-between

align-items (axe secondaire, ici vertical) :
[■]                    [■]                        [■]
[ ]  flex-start        [ ]  center                [ ]  flex-end
[ ]                    [ ]                        [■]
```

Consulte também o capítulo sobre CSS Grid, para um layout bidimensional (linhas E colunas simultaneamente), enquanto o Flexbox continua a ser concebido fundamentalmente para um único eixo de cada vez.
