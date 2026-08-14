---
order: 4
---

# O logaritmo

Este capítulo apresenta o logaritmo, uma noção retomada mais adiante para medir o quanto uma predição é boa ou ruim em um modelo de machine learning.

## O inverso da potência

Elevar um número a uma potência (`b^y`) equivale a multiplicar `b` por ele mesmo `y` vezes: `10^3 = 10 × 10 × 10 = 1000`. O **logaritmo** faz a pergunta inversa: a que potência é preciso elevar uma base dada para obter um número dado?

```text
10^2 = 100   ->  log10(100) = 2   ("e preciso elevar 10 a potencia 2 para obter 100")
10^3 = 1000  ->  log10(1000) = 3
10^0 = 1     ->  log10(1) = 0
```

> **Analogia:** dobrar uma folha de papel na metade, repetir a operação. Depois de 1 dobra, 2 camadas; depois de 2 dobras, 4; depois de 3, 8. `log2(8) = 3` responde exatamente à pergunta "quantas vezes é preciso dobrar a folha para obter 8 camadas?".

## As bases mais comuns

| Base | Notação | Responde a | Área de uso típica |
|---|---|---|---|
| 10 | `log10(x)` ou `log(x)` | Quantas vezes multiplicar por 10? | Ordens de grandeza, escalas ([Richter](https://en.wikipedia.org/wiki/Richter_magnitude_scale), [decibéis](https://en.wikipedia.org/wiki/Decibel)) |
| 2 | `log2(x)` | Quantas vezes dobrar? | Computação (busca em uma árvore, complexidade de um algoritmo) |
| *e* (≈ 2,718) | `ln(x)` | Nenhuma pergunta tão intuitiva quanto as duas anteriores: essa base é escolhida porque simplifica muitos cálculos matemáticos | A maioria das fórmulas usadas em estatística e machine learning |

> **Cuidado:** confundir as bases. `log2(8) = 3` mas `log10(8) ≈ 0,9`: o resultado depende inteiramente da base escolhida; dois logaritmos de bases diferentes nunca se comparam diretamente sem conversão.
>
> **Boa prática:** sempre verificar qual base uma função ou fórmula usa antes de interpretar seu resultado (`log` em [Python](/?c=langages-de-programmation&s=python&p=python), por exemplo, designa o logaritmo **natural** (base *e*), não base 10, ao contrário do que o nome poderia sugerir).

## O formato de sua curva: muito lento para x grandes, muito rápido perto de 0

O gráfico abaixo posiciona cada ponto `(x, log10(x))` em sua posição real, em um eixo `x` **linear** (cada intervalo horizontal representa a mesma diferença de `x`, diferente da tabela acima):

```plot-fonction
fn: x => log(x)
domaine: 0.05, 12
label: log10(x)
```

Entre `x = 0,1` e `x = 1` (uma parte bem pequena desse eixo linear), a curva já sobe de -1 para 0: uma variação de 1 unidade. Entre `x = 1` e `x = 10` (nove vezes mais largo), ela sobe apenas de 0 para 1: a **mesma** variação de 1 unidade, mas espalhada por uma distância muito maior. O resultado visual é essa forma assimétrica: uma subida acentuada à esquerda (perto de 0), seguida de um achatamento progressivo à medida que `x` cresce.

Essa compressão perto de 0 se prolonga sem limite: quanto mais `x` se aproxima de 0, mais `log10(x)` despenca para números negativos grandes, em um intervalo de `x` cada vez mais estreito (veja a tabela abaixo). Uma fórmula que aplica `-log(x)` a um número próximo de 0 herda essa mesma compressão: o resultado explode em um intervalo bem pequeno, uma das formas de penalizar fortemente um resultado quase nulo.

| x | log10(x) |
|---|---|
| 0,001 | -3 |
| 0,01 | -2 |
| 0,1 | -1 |
| 1 | 0 |
| 10 | 1 |
| 100 | 2 |
| 1.000 | 3 |

## Cuidado: o logaritmo não é definido em todo lugar

`log(0)` não é definido: o valor diminui sem limite à medida que `x` se aproxima de 0, sem nunca alcançar um resultado finito. O logaritmo de um número negativo também não é definido (nos números reais).

> **Cuidado:** aplicar um logaritmo a um valor que pode valer exatamente 0 (uma probabilidade, por exemplo) provoca um erro ou um valor infinito em um programa, não um resultado inusual mas válido.
>
> **Boa prática:** em um cálculo que aplica um logaritmo a uma probabilidade, adicionar um valor bem pequeno antes do cálculo (`log(p + 0.0000001)`, por exemplo) evita esse caso limite, em vez de deixar o cálculo falhar ou retornar um valor infinito.

## Propriedade útil: transformar uma multiplicação em soma

```text
log(a × b) = log(a) + log(b)
```

Essa propriedade permite substituir uma multiplicação por uma soma, geralmente mais simples de calcular e menos sujeita a produzir um número que se torne muito pequeno ou muito grande para ser representado corretamente na memória (veja [os números de ponto flutuante](/?c=representation-des-donnees&p=nombres-flottants)), útil principalmente quando muitos números pequenos precisam ser multiplicados entre si.

## O que reter

| | |
|---|---|
| **O que reter** | O logaritmo responde a "a que potência elevar essa base para obter esse número?" (o inverso da potência). Ele cresce muito lentamente para valores grandes, e despenca para menos infinito perto de 0. |
| **Ferramentas úteis** | `log10()`, `log2()`, `log()` (natural, base *e*) na maioria das linguagens: verificar sistematicamente qual é usada. |
| **Armadilhas a evitar** | Confundir dois logaritmos de bases diferentes. Aplicar um logaritmo a um valor que pode ser 0 ou negativo. |
| **Boas práticas** | Verificar a base usada por uma função antes de interpretar seu resultado. Adicionar um valor pequeno antes de um `log()` aplicado a uma probabilidade, para evitar `log(0)`. |
