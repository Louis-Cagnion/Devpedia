---
order: 2
---

# A ordenação por comparação

Ordenar uma lista de valores é um dos problemas mais estudados em algoritmos: existem inúmeras estratégias, com [complexidades](/?c=algorithmes&p=complexite-et-notation-big-o) muito diferentes. Uma **ordenação por comparação** dispõe apenas de uma operação básica para decidir a ordem: comparar dois elementos entre si (`a < b ?`), sem nunca acessar diretamente seu valor numérico (ao contrário de outras famílias de ordenação, fora do escopo deste capítulo, que exploram a estrutura dos próprios valores).

## A ordenação por inserção

A **ordenação por inserção** constrói a parte ordenada do array elemento por elemento: a cada etapa, ela pega o elemento seguinte e o insere na posição certa entre os já ordenados, como alguém ordenaria cartas de baralho uma a uma na mão.

```c
void ordenacaoInsercao(int array[], int tamanho)
{
    for (int i = 1; i < tamanho; i++) {
        int valor = array[i];
        int j = i - 1;

        while (j >= 0 && array[j] > valor) {
            array[j + 1] = array[j]; // desloca o elemento para a direita
            j--;
        }
        array[j + 1] = valor; // insere na posicao correta
    }
}
```

Essa ordenação é **O(n²)** no pior caso (array ordenado ao contrário: cada inserção desloca tudo o que vem antes), mas apenas **O(n)** se o array já estiver quase ordenado: uma vantagem explorada por algoritmos híbridos mais avançados.

## A ordenação por mesclagem (*merge sort*)

A **ordenação por mesclagem** aplica o princípio *dividir para conquistar*: ela corta o array em duas metades, ordena recursivamente cada metade, e depois **mescla** as duas metades ordenadas em uma única lista ordenada.

```text
[8, 3, 5, 1, 9, 2]
        |
   dividir em duas
        |
  [8, 3, 5]      [1, 9, 2]
    |                |
  ordenar          ordenar
    |                |
  [3, 5, 8]      [1, 2, 9]
        \            /
         \          /
          mesclar
              |
      [1, 2, 3, 5, 8, 9]
```

A mesclagem de duas listas já ordenadas é **O(n)**: basta comparar os dois primeiros elementos restantes de cada lista e pegar o menor, avançando progressivamente. Combinado à divisão em duas partes (`log n` níveis de divisão), o custo total da ordenação por mesclagem é **O(n log n)**, seja qual for o estado inicial do array: ao contrário da ordenação por inserção, seu pior caso não é degradado.

> **Nota:** esse compromisso entre os dois algoritmos (inserção rápida em dados quase ordenados, mesclagem estável em O(n log n) em todos os casos) é diretamente explorado por ordenações híbridas, como a ordenação por mesclagem-inserção detalhada abaixo.

## A ordenação por mesclagem-inserção de Ford-Johnson

A **ordenação por mesclagem-inserção** (*Ford-Johnson merge-insertion sort*) leva mais longe a hibridação mencionada acima: ela minimiza o número de comparações no pior caso, aproximando-se do limite teórico ótimo (`log2(n!)`), ao custo de um algoritmo bem mais elaborado que uma ordenação por inserção ou mesclagem clássica. O princípio se desenrola em 5 etapas:

1. **Agrupar os elementos em pares.**
2. **Comparar cada par** (uma única comparação por par) para separar, em cada um, o "grande" do "pequeno".
3. **Ordenar recursivamente** a sequência dos grandes (o mesmo algoritmo, aplicado a uma sequência menor; caso base: 0 ou 1 elemento) para obter uma sequência `S` já ordenada.
4. **Inserir no início de `S`** o pequeno associado ao menor grande: essa inserção é gratuita, ele é necessariamente menor que todo o resto de `S`.
5. **Inserir um a um os pequenos restantes** em `S`, por **busca binária**: como cada pequeno já é sabido menor que seu grande associado, essa informação limita a busca binária, sem necessidade de buscar além da posição de seu grande.

```text
[8, 3, 5, 1, 9, 2]
       |
1. Pares: (8,3) (5,1) (9,2)
       |
2. Grandes/pequenos: grandes = [8, 5, 9], pequenos associados = [3, 1, 2]
       |
3. Ordenacao recursiva dos grandes: S = [5, 8, 9]
       |
4. Insercao gratuita do pequeno associado ao menor grande (5 -> pequeno 1): S = [1, 5, 8, 9]
       |
5. Insercao por busca binaria dos pequenos restantes (3, 2) em S
```

> **Nota:** a versão ótima do algoritmo insere os pequenos restantes em uma ordem precisa, ditada pela **sequência de Jacobsthal**, para minimizar ainda mais o tamanho das subsequências percorridas por cada busca binária. Uma implementação que simplesmente insere os pequenos em ordem continua correta, mas perde parte da otimalidade teórica do algoritmo.
>
> **Boa prática:** essa ordenação só tem interesse real quando o número de comparações importa mais que a simplicidade do código (um exercício pedagógico, uma restrição explícita sobre o número de operações); para uso comum, uma ordenação já fornecida pela biblioteca padrão continua preferível.

## Comparando os algoritmos de ordenação

| Algoritmo | Pior caso | Caso médio | Memória adicional | Estável? |
|---|---|---|---|---|
| Ordenação bolha | O(n²) | O(n²) | O(1) | Sim |
| Ordenação por seleção | O(n²) | O(n²) | O(1) | Não |
| Ordenação por inserção | O(n²) | O(n²) | O(1) | Sim |
| Ordenação por mesclagem | O(n log n) | O(n log n) | O(n) | Sim |
| Ordenação rápida (*quicksort*) | O(n²) | O(n log n) | O(log n) | Não |

Uma ordenação é dita **estável** quando dois elementos considerados iguais pela comparação mantêm sua ordem relativa original após a ordenação (importante se, por exemplo, uma lista já ordenada por nome for ordenada de novo, desta vez por idade: duas pessoas da mesma idade devem permanecer em sua ordem alfabética).

> **Armadilha:** achar que uma ordenação por comparação pode ficar abaixo de **O(n log n)** no caso geral: isso é um limite teórico demonstrado (impossível fazer melhor comparando apenas pares de elementos), não uma simples questão de otimização de implementação.
>
> **Boa prática:** usar a implementação de ordenação já fornecida pela linguagem/biblioteca padrão (geralmente uma ordenação híbrida já otimizada) em vez de reescrever uma ordenação manualmente, a menos que haja uma restrição específica (memória limitada, restrição no número de operações permitidas, estrutura de dados particular).

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Uma ordenação por comparação só decide a ordem comparando pares de elementos. A ordenação por inserção é simples, mas O(n²); a ordenação por mesclagem garante O(n log n) em todos os casos ao custo de memória adicional. A ordenação de Ford-Johnson minimiza o número de comparações no pior caso. |
| **Ferramentas utilizáveis** | A tabela comparativa dos algoritmos de ordenação (complexidade, memória, estabilidade) para escolher o adequado conforme o contexto. |
| **Armadilhas a evitar** | Esperar ficar abaixo de O(n log n) com uma ordenação por comparação pura: isso é um limite teórico, não uma falha de implementação. |
| **Boas práticas** | Preferir a ordenação já fornecida pela linguagem, e só reimplementar uma ordenação manualmente com uma restrição precisa que a justifique. |
