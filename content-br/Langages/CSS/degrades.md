---
order: 8
---

# Os degradês CSS (linear, radial, conic)

Um **degradê** (*gradient*) é uma transição progressiva entre várias cores, utilizável em qualquer lugar onde uma cor simples seria usada (`background`, `border-image`...), sem imagem nem arquivo externo. Existem três formas, distinguidas pela **direção** em que a cor progride.

## `linear-gradient()`: uma progressão em linha reta

```css
.barra {
    background: linear-gradient(to right, #4a90d9, #d94a90);
    /* progride em linha reta, da esquerda para a direita */
}
```

| Parâmetro | Papel |
|---|---|
| Direção (`to right`, `45deg`...) | O eixo ao longo do qual a cor progride |
| Cores (2 ou mais, separadas por vírgulas) | As etapas da transição, distribuídas uniformemente por padrão |

## `radial-gradient()`: uma progressão em círculos concêntricos

```css
.halo {
    background: radial-gradient(circle, #ffffff, #000000);
    /* progride do centro para fora, em circulos concentricos */
}
```

Parte de um ponto central e progride para fora, em círculos (ou elipses) cada vez maiores, em vez de em linha reta.

## `conic-gradient()`: uma progressão angular, em torno de um ponto central

```css
.anel-progresso {
    width: 100px;
    height: 100px;
    border-radius: 50%;   /* torna o elemento redondo */
    background: conic-gradient(#4a90d9 75%, #e0e0e0 0);
    /* a cor "gira" em torno do centro, como os ponteiros de um relógio */
}
```

Diferente dos dois anteriores, a cor não progride em linha reta nem em círculos concêntricos: ela **gira** em torno de um ponto central, como os ponteiros de um relógio. `conic-gradient(#4a90d9 75%, #e0e0e0 0)` preenche 75% da volta em azul, e o resto em cinza: combinado com `border-radius: 50%`, esse padrão desenha um anel de progresso circular sem nenhum SVG (`stroke-dasharray`) nem JavaScript para calcular a forma.

| | `linear-gradient` | `radial-gradient` | `conic-gradient` |
|---|---|---|---|
| Direção da progressão | Linha reta | Círculos concêntricos, do centro para fora | Rotação em torno de um ponto central |
| Caso de uso típico | Fundo, botão, sobreposição de legibilidade em uma imagem | Halo luminoso, vinheta | Anel/medidor de progresso, roda de cores |

> **Boa prática:** `conic-gradient()` em um elemento `border-radius: 50%` é uma alternativa leve a um anel de progresso em SVG, desde que a forma permaneça um simples círculo preenchido por porcentagem; passar para SVG assim que o medidor precisar de uma espessura de traço variável ou extremidades arredondadas (`stroke-linecap`), que `conic-gradient()` não consegue produzir.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um degradê faz a transição entre várias cores sem precisar de imagem. `linear-gradient` progride em linha reta, `radial-gradient` em círculos concêntricos a partir de um centro, `conic-gradient` girando em torno de um ponto central. |
| **Ferramentas utilizáveis** | `linear-gradient(direcao, cores...)`, `radial-gradient(forma, cores...)`, `conic-gradient(cores...)` combinado com `border-radius: 50%` para um anel de progresso. |
| **Armadilhas a evitar** | Recriar em SVG/JavaScript um anel de progresso circular simples que `conic-gradient()` desenha em uma única linha de CSS. |
| **Boas práticas** | Escolher a forma do degradê conforme a direção real da progressão desejada, não por hábito de usar sempre a mesma. Passar para SVG somente quando `conic-gradient()` não bastar mais (espessura/extremidades variáveis). |
