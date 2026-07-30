---
order: 3
---

# O modelo de caixa (box model)

Cada elemento HTML é representado pelo CSS como uma caixa retangular, composta por quatro camadas concêntricas — compreender este modelo é essencial para controlar tamanhos, espaçamentos e alinhamentos.

## As quatro camadas

```
┌─────────────────────────────────┐
│              margin               │  <- espace EXTÉRIEUR, en dehors de la boîte
│   ┌───────────────────────────┐   │
│   │           border            │   │  <- bordure visible
│   │   ┌───────────────────┐   │   │
│   │   │      padding        │   │   │  <- espace INTÉRIEUR, entre bordure et contenu
│   │   │   ┌───────────┐   │   │   │
│   │   │   │  content    │   │   │   │  <- le texte/image/contenu réel
│   │   │   └───────────┘   │   │   │
│   │   └───────────────────┘   │   │
│   └───────────────────────────┘   │
└─────────────────────────────────┘
```

```css
div {
    width: 300px;
    padding: 20px;
    border: 2px solid black;
    margin: 10px;
}
```

- **conteúdo**: o conteúdo propriamente dito (texto, imagem...).
- **padding**: espaço entre o conteúdo e a borda — faz parte do próprio elemento (tem a mesma cor de fundo que o conteúdo).
- **border**: a borda visível.
- **margin**: espaço fora da borda, que separa este elemento dos outros — nunca colorido, sempre transparente.

## A armadilha clássica: o comando «`width`» não inclui tudo, por predefinição

```css
div {
    width: 300px;
    padding: 20px;
    border: 2px solid black;
}
/* Largeur RÉELLEMENT occupée à l'écran : 300 + 20+20 (padding) + 2+2 (border) = 344px, PAS 300px ! */
```

> **Nota:** por predefinição (`box-sizing: content-box`), `width` define apenas o tamanho do **conteúdo** — `padding` e `border` são adicionados por cima, aumentando a área da caixa efetivamente exibida para além do valor declarado. Esta é uma causa muito frequente de layouts que «transbordam» de forma inesperada.

## `box-sizing: border-box` : a solução quase universal

```css
* {
    box-sizing: border-box;
}

div {
    width: 300px;
    padding: 20px;
    border: 2px solid black;
}
/* Largeur réelle : exactement 300px -> padding et border sont maintenant INCLUS dans cette valeur */
```

`border-box` O facto de `width` / `height` indicarem o tamanho **total** da caixa (incluindo a margem), enquanto o `padding` «consome» o espaço do conteúdo em vez de se sobrepor a ele — um comportamento muito mais previsível, que se tornou a convenção de facto na quase totalidade dos projetos modernos (frequentemente aplicado globalmente com `* { box-sizing: border-box; }`).

## Abreviaturas de escrita

```css
/* Quatre valeurs : haut droite bas gauche (sens horaire) */
margin: 10px 20px 30px 40px;

/* Deux valeurs : haut/bas puis gauche/droite */
margin: 10px 20px;

/* Une valeur : les quatre côtés identiques */
margin: 10px;

/* Cibler un seul côté */
margin-top: 10px;
padding-left: 20px;
```

## Margens que se fundem (*margin collapsing*)

```css
p { margin-bottom: 20px; }
p + p { margin-top: 30px; }
```

> **Nota:** entre dois elementos **em fluxo normal** (não em «`flexbox`» / «`grid`», ver capítulos dedicados), as margens verticais adjacentes não se somam — aplica-se apenas a maior das duas (neste caso, `30px`, e não `50px`). Este comportamento, muitas vezes surpreendente à primeira vista, aplica-se apenas às margens verticais, nunca às horizontais, e desaparece completamente num contentor Flexbox ou Grid.
