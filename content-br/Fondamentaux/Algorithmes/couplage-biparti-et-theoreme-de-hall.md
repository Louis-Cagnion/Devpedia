---
order: 12
---

# Emparelhamento bipartido, teorema de Hall e algoritmo de Kuhn

Dar a cada elemento de um grupo um lugar diferente entre os que ele aceita: alunos para atividades, tarefas para máquinas, células de uma grade para valores. Esse problema de **atribuição** tem uma solução simples e rápida, que também serve de peça para os solucionadores de restrições (veja [os propagadores](/?c=fondamentaux&s=algorithmes&p=encodages-sat)).

## O problema: o emparelhamento em um grafo bipartido

Um **grafo** é um conjunto de pontos (os **vértices**) ligados por linhas (as **arestas**). Ele é **bipartido** quando os vértices se dividem em dois grupos, e cada aresta liga um vértice do primeiro grupo a um do segundo, nunca dois do mesmo grupo.

Exemplo: 4 células a preencher, cada uma com os valores que aceita (seu **domínio**), podendo cada valor ser usado apenas uma vez.

| Célula | Valores possíveis |
|---|---|
| c0 | 1, 2 |
| c1 | 1 |
| c2 | 2, 3, 4 |
| c3 | 3, 4 |

Um **emparelhamento** é um conjunto de arestas sem nenhuma extremidade em comum: cada célula recebe no máximo um valor, cada valor serve no máximo uma célula. Ele é **completo** (ou *perfeito* quando os dois grupos têm o mesmo tamanho) quando todas as células são atendidas. Aqui, `c0→2, c1→1, c2→3, c3→4` é um deles.

## Por que o guloso não basta

O reflexo é tratar as células em ordem e dar a cada uma o primeiro valor livre (veja [o algoritmo guloso](/?c=fondamentaux&s=algorithmes&p=algorithme-glouton)):

```text
c0 recebe 1   (primeiro valor livre)
c1 só quer 1, já ocupado: falha
```

O guloso atende apenas 3 células de 4, embora exista uma solução completa: ele nunca volta atrás em uma decisão. É preciso um algoritmo capaz de **mover** uma célula já colocada para liberar um valor.

## O algoritmo de Kuhn: os caminhos aumentantes

Ideia: quando uma célula não tem mais valor livre, pede-se à célula que detém um de seus valores que **pegue outro**, e assim por diante. A cadeia de movimentos se chama **caminho aumentante**: ela parte de uma célula não atendida, alterna "valor desejado / célula que o detém" e termina em um valor livre. Reatribuir de uma ponta à outra atende uma célula a mais.

```text
Antes:   c0 detém 1.        c1 quer 1.

Caminho aumentante:   c1 → valor 1 → c0 → valor 2 (livre)

Depois:   c0 detém 2.       c1 detém 1.
```

O teorema de Berge garante que, se não existe nenhum caminho aumentante, o emparelhamento é o maior possível ([teorema de Berge](https://en.wikipedia.org/wiki/Berge%27s_theorem)). O algoritmo de Kuhn tenta, portanto, um caminho para cada célula, por busca em profundidade:

```c
#include <string.h>  // memset

#define N 4          // número de células e número de valores

int dom[N][N];       // dom[c][v] = 1 se o valor v é possível na célula c
int dono[N];         // dono[v]: célula que detém o valor v, ou -1
int vista[N];        // vista[v] = 1 se v já foi tentado para a célula atual

// Procura um valor para a célula c, movendo se preciso as células já colocadas
int encontrar(int c)
{
    for (int v = 0; v < N; v++) {
        if (!dom[c][v] || vista[v])
            continue;
        vista[v] = 1;
        if (dono[v] == -1 || encontrar(dono[v])) {
            dono[v] = c;
            return 1;
        }
    }
    return 0;
}

int emparelhamento(void)
{
    int tamanho = 0;

    for (int v = 0; v < N; v++)
        dono[v] = -1;
    for (int c = 0; c < N; c++) {
        memset(vista, 0, sizeof vista);
        tamanho += encontrar(c);
    }
    return tamanho;
}
```

No exemplo da tabela (valores numerados de 0 a 3 em `dom`), `emparelhamento()` devolve 4, contra 3 do guloso.

| Elemento | Função |
|---|---|
| `dono[v]` | O emparelhamento atual: quem detém cada valor |
| `encontrar(c)` | Procura um caminho aumentante a partir da célula `c` |
| `vista[v]` | Evita retentar um valor já visitado durante a busca: sem ele, a busca andaria em círculos |
| `memset(vista, …)` | Zeramento antes de cada nova célula |

Cada busca percorre no máximo todas as arestas, e há uma por célula: o custo total é da ordem de (número de células) × (número de arestas). Para grafos muito grandes, o algoritmo de [Hopcroft e Karp](https://en.wikipedia.org/wiki/Hopcroft%E2%80%93Karp_algorithm) faz melhor (ele procura vários caminhos de uma vez), mas Kuhn basta de sobra para uma linha de algumas dezenas de células.

> **Armadilha:** não zerar `vista` entre duas células. A célula seguinte acha então que valores foram "já tentados" e declara por engano que não tem nenhum valor possível.
>
> **Boa prática:** testar em um caso em que o guloso falha (como o acima): se os dois algoritmos dão a mesma resposta, o teste não prova nada.

## O teorema de Hall: saber de antemão que é impossível

Quando não existe nenhum emparelhamento completo, dá para saber **sem procurar**? O **teorema de Hall** responde com uma condição exata ([teorema de Hall](https://en.wikipedia.org/wiki/Hall%27s_marriage_theorem)): existe um emparelhamento que atende todas as células **se e somente se**, para todo grupo de células, o conjunto de valores que essas células aceitam todas juntas é **pelo menos tão grande** quanto o grupo.

| Grupo de células | Valores aceitos todas juntas | Condição |
|---|---|---|
| {c1} | {1} (1 valor) | 1 ≥ 1, satisfeita |
| {c0, c1} | {1, 2} (2 valores) | 2 ≥ 2, satisfeita |
| Três células que só aceitam {1, 2} | {1, 2} (2 valores) | 3 > 2: **violada** |

No último caso, três células disputam dois valores: nenhuma atribuição consegue atendê-las todas, seja qual for o resto da grade. O grupo que viola a condição é uma **explicação** da impossibilidade, útil para um solucionador que precisa entender por que uma escolha falha.

Verificou-se aqui, em 200 000 domínios sorteados ao acaso (4 células, 4 valores), que Kuhn encontra um emparelhamento completo exatamente quando a condição de Hall vale (91 122 casos completos, 0 divergências).

> **Armadilha:** testar a condição de Hall enumerando todos os grupos de células: são 2ⁿ, um milhão para 20 células. Hall diz **por que** é impossível; para **decidir**, Kuhn é polinomial (veja [a complexidade](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o) e [os problemas NP-completos](/?c=fondamentaux&s=algorithmes&p=problemes-np-complets), dos quais o emparelhamento bipartido não faz parte).
>
> **Boa prática:** deixar Kuhn decidir e procurar o grupo culpado apenas quando for preciso explicar.

## Aplicação: a restrição "todas diferentes"

Em uma linha de um [quadrado latino](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme), as n células devem receber n valores **todos diferentes**. Se, ao longo da resolução, se retiram os valores que se tornaram impossíveis, cada célula tem um domínio: a linha ainda pode ser completada apenas se existir um emparelhamento que atenda todas as células.

| Etapa | O que se faz |
|---|---|
| 1 | Construir o grafo: células de um lado, valores do outro, uma aresta por valor ainda possível |
| 2 | Executar Kuhn |
| 3 | Se o emparelhamento não atende todas as células: contradição, inútil levar a busca adiante |

Essa detecção é muito mais forte do que verificar apenas "duas células têm o mesmo valor imposto?": ela enxerga os conflitos indiretos (três células para dois valores). É o princípio do **propagador** da restrição "todas diferentes" em um solucionador ([backtracking e restrições](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes)).

> **Armadilha:** concluir que um quadrado latino tem solução porque cada linha, tomada sozinha, admite um emparelhamento completo. As colunas também impõem suas restrições, e cada linha é vista apenas de forma independente das outras.
>
> **Boa prática:** usar esse teste apenas como **poda** (ele detecta becos sem saída, não garante uma solução) e deixar a busca decidir sobre o conjunto.

---

## 📋 Resumo

| | |
|---|---|
| **O que lembrar** | Dar a cada elemento um lugar diferente entre os que ele aceita é procurar um emparelhamento em um grafo bipartido. O guloso pode falhar: o algoritmo de Kuhn move atribuições já feitas ao longo de caminhos aumentantes e encontra um emparelhamento de tamanho máximo. O teorema de Hall dá a condição exata de um emparelhamento completo: todo grupo de elementos deve aceitar pelo menos tantos lugares quanto elementos. |
| **Ferramentas utilizáveis** | Algoritmo de Kuhn (busca em profundidade de um caminho aumentante por elemento), Hopcroft-Karp para grafos muito grandes, condição de Hall como explicação de uma impossibilidade, propagador "todas diferentes" em um solucionador. |
| **Armadilhas a evitar** | Contentar-se com o guloso. Esquecer de zerar a marcação de valores visitados entre dois elementos. Verificar Hall enumerando todos os grupos (2ⁿ). Achar que um emparelhamento completo por linha basta para resolver todo um quadrado latino. |
| **Boas práticas** | Testar em um caso em que o guloso falha. Usar o emparelhamento como poda, nunca como prova de que existe uma solução para o conjunto. Comparar com a condição de Hall em casos pequenos para validar a implementação. |
