---
order: 3
---

# O modelo de caixa (box model)

Cada elemento [HTML](/?c=langages-de-balisage&s=html&p=html) é representado pelo CSS como uma caixa retangular, composta de quatro camadas concêntricas: entender esse modelo é indispensável para dominar tamanhos, espaçamentos e alinhamentos.

## As quatro camadas

```text
┌─────────────────────────────────┐
│              margin               │  <- espaco EXTERIOR, fora da caixa
│   ┌───────────────────────────┐   │
│   │           border            │   │  <- borda visivel
│   │   ┌───────────────────┐   │   │
│   │   │      padding        │   │   │  <- espaco INTERIOR, entre borda e conteudo
│   │   │   ┌───────────┐   │   │   │
│   │   │   │  content    │   │   │   │  <- o texto/imagem/conteudo real
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

- **content**: o conteúdo real (texto, imagem...).
- **padding**: espaço entre o conteúdo e a borda, faz parte do próprio elemento (mesma cor de fundo do conteúdo).
- **border**: a borda visível.
- **margin**: espaço fora da borda, que separa esse elemento dos outros, nunca colorido, sempre transparente.

## A armadilha clássica: `width` não inclui tudo, por padrão

```css
div {
    width: 300px;
    padding: 20px;
    border: 2px solid black;
}
/* Largura REALMENTE ocupada na tela: 300 + 20+20 (padding) + 2+2 (border) = 344px, NAO 300px! */
```

> **Nota:** por padrão (`box-sizing: content-box`), `width` só define o tamanho do **conteúdo**: `padding` e `border` se somam por cima, aumentando a caixa realmente exibida além do valor declarado. É uma fonte muito frequente de layouts que "transbordam" de forma inesperada.

## `box-sizing: border-box`: a solução quase universal

```css
* {
    box-sizing: border-box;
}

div {
    width: 300px;
    padding: 20px;
    border: 2px solid black;
}
/* Largura real: exatamente 300px -> padding e border agora estao INCLUIDOS nesse valor */
```

`border-box` faz com que `width`/`height` designem o tamanho **total** da caixa (borda incluída), o `padding` "corroendo" o espaço do conteúdo em vez de se somar por cima, um comportamento bem mais previsível, que se tornou a convenção de fato na quase totalidade dos projetos modernos (frequentemente aplicado globalmente com `* { box-sizing: border-box; }`).

## Os atalhos de escrita

```css
/* Quatro valores: cima direita baixo esquerda (sentido horario) */
margin: 10px 20px 30px 40px;

/* Dois valores: cima/baixo e depois esquerda/direita */
margin: 10px 20px;

/* Um valor: os quatro lados identicos */
margin: 10px;

/* Mirar em um unico lado */
margin-top: 10px;
padding-left: 20px;
```

## As margens que se fundem (*margin collapsing*)

```css
p { margin-bottom: 20px; }
p + p { margin-top: 30px; }
```

> **Nota:** entre dois elementos **em fluxo normal** (não em [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox)/[Grid](/?c=langages-de-balisage&s=css&p=grid)), as margens verticais adjacentes **não** se somam: apenas a maior das duas se aplica (aqui, `30px`, não `50px`). Esse comportamento, frequentemente surpreendente à primeira vista, só se aplica a margens verticais, nunca horizontais, e desaparece inteiramente em um contêiner Flexbox ou Grid.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Cada elemento é uma caixa com 4 camadas concêntricas: content, padding, border, margin. Por padrão, `width` só define o conteúdo (`padding`/`border` se somam); `box-sizing: border-box` inclui tudo no valor declarado. |
| **Ferramentas utilizáveis** | `box-sizing: border-box` (frequentemente aplicado globalmente), os atalhos `margin`/`padding` com 1, 2 ou 4 valores. |
| **Armadilhas a evitar** | Esquecer que `width` não inclui `padding`/`border` por padrão: uma caixa de "300px" pode ocupar 344 na tela. |
| **Boas práticas** | Aplicar `* { box-sizing: border-box; }` globalmente no início do projeto: comportamento mais previsível, que se tornou a convenção de fato. |
