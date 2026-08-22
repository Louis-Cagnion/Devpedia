---
order: 1
---

# A complexidade e a notação Big-O

Dois algoritmos podem resolver exatamente o mesmo problema com desempenhos radicalmente diferentes, dependendo da quantidade de dados processada. A **complexidade algorítmica** mede como o tempo de execução (ou a memória usada) de um algoritmo **aumenta** quando o tamanho de seus dados de entrada aumenta, independentemente da máquina em que ele roda ou da linguagem usada para escrevê-lo.

## Por que não simplesmente medir o tempo em segundos?

Cronometrar um algoritmo dá um resultado que depende do processador, da carga da máquina no momento do teste, da linguagem usada... Esse número, portanto, não permite comparar dois algoritmos de forma confiável, nem prever o que acontecerá com 10 vezes mais dados. A complexidade responde a uma pergunta diferente e mais útil: "se eu multiplicar o tamanho dos dados por 10, o tempo de execução é multiplicado por 10? Por 100? Continua igual?"

## A notação Big-O: descrever uma tendência, não um número preciso

A **notação Big-O** (escrita `O(...)`) descreve como o custo de um algoritmo evolui em função do tamanho `n` de seus dados de entrada, no pior caso, uma vez ignorados os detalhes constantes (um fator `2×` ou uma operação fixa a mais não muda a categoria).

```c
void exibirPrimeiraVez(int array[], int tamanho)
{
    printf("%d\n", array[0]); // sempre 1 unica operacao, seja qual for "tamanho"
}
```

```c
void exibirTudo(int array[], int tamanho)
{
    for (int i = 0; i < tamanho; i++) {
        printf("%d\n", array[i]); // 1 operacao por elemento -> "tamanho" operacoes no total
    }
}
```

O primeiro exemplo é **O(1)** (tempo constante: sempre uma única operação). O segundo é **O(n)** (tempo linear: o número de operações cresce exatamente como `n`, o número de elementos).

## As classes de complexidade mais comuns

| Notação | Nome | Exemplo de operação | Para n = 1.000.000 |
|---|---|---|---|
| `O(1)` | Constante | Acessar `array[i]` por índice | 1 operação |
| `O(log n)` | Logarítmica | Busca em uma [árvore binária de busca](/?c=langages-de-programmation&s=c&p=arbres-binaires) balanceada | ~20 operações |
| `O(n)` | Linear | Percorrer todos os elementos uma vez | 1.000.000 de operações |
| `O(n log n)` | Quase linear | Uma [ordenação por mesclagem](/?c=algorithmes&p=tri-par-comparaison) | ~20.000.000 de operações |
| `O(n²)` | Quadrática | Comparar cada elemento com todos os outros (laço duplo aninhado) | 1.000.000.000.000 de operações |
| `O(2ⁿ)` | Exponencial | Testar todas as combinações possíveis de um conjunto | Astronômico, já para n = 40 |

```text
Tempo
  ^                                         O(2^n)
  |                                    ,
  |                               ,   O(n^2)
  |                          ,·''
  |                    ,·''       O(n log n)
  |              ,·''''
  |        ,·'''            O(n)
  |   ,·''''
  |,·'  ________________ O(log n) / O(1)
  +----------------------------------------> n (tamanho dos dados)
```

> **Nota:** o Big-O descreve o **pior caso** por padrão (ex.: procurar um elemento ausente em um array não ordenado obriga a percorrer tudo). Às vezes se distingue o melhor caso (*best case*), o caso médio (*average case*) e o pior caso (*worst case*), mas o Big-O sozinho, sem especificação, sempre designa o pior caso.

## Complexidade em tempo vs complexidade em memória

A mesma notação se aplica à **memória** usada por um algoritmo, não apenas à sua duração de execução: um algoritmo pode ser rápido (`O(n)` em tempo), mas custoso em memória (`O(n)` de espaço adicional alocado), ou o contrário. Os dois devem ser avaliados separadamente: um compromisso frequente em algoritmos consiste em trocar memória adicional por um tempo de execução menor, ou o inverso.

> **Armadilha:** ignorar um `O(n²)` escondido em um laço que chama uma função que é, ela mesma, `O(n)` (ex.: procurar um elemento por varredura dentro de um laço que já percorre todos os elementos): o custo real não é a soma das duas complexidades, mas o produto delas.
>
> **Boa prática:** antes de otimizar um algoritmo no nível de hardware (veja [Performance](/?c=performance)), verificar primeiro sua complexidade: um `O(n²)` substituído por um `O(n log n)` geralmente ganha muito mais do que um ajuste de baixo nível em um algoritmo cuja complexidade continua ruim.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | A notação Big-O descreve como o custo de um algoritmo evolui com o tamanho de seus dados, no pior caso, independentemente da máquina usada. |
| **Ferramentas utilizáveis** | A tabela das classes de complexidade (`O(1)`, `O(log n)`, `O(n)`, `O(n log n)`, `O(n²)`, `O(2ⁿ)`) para classificar rapidamente um algoritmo. |
| **Armadilhas a evitar** | Confundir a soma e o produto das complexidades de operações aninhadas; medir apenas em segundos sem considerar a tendência em larga escala. |
| **Boas práticas** | Avaliar a complexidade em tempo E em memória separadamente; corrigir uma complexidade ruim antes de otimizar no nível de hardware. |
