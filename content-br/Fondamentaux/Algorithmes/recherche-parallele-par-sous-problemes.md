---
order: 7
---

# Paralelizar uma busca: dividir em subproblemas independentes (EPS)

Um [backtracking](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes) testa as escolhas possíveis uma a uma, voltando atrás a cada beco sem saída. Um computador moderno tem vários **núcleos** (unidades de cálculo capazes de trabalhar ao mesmo tempo, ver [O paralelismo](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)): dá para explorar várias pistas ao mesmo tempo? A **EPS** (*Embarrassingly Parallel Search*, "busca constrangedoramente paralela", ou seja, tão fácil de paralelizar que chega a ser constrangedor) é uma resposta simples: primeiro dividir o problema em muitos pequenos problemas independentes e depois distribuí-los.

## A árvore de busca, vista como uma lista de subproblemas

Cada escolha do backtracking abre um ramo. Tudo o que está sob um ramo é um **subproblema**: o problema de partida, com algumas variáveis já fixadas.

```
                     (problema completo)
              /              |              \
         A = 1            A = 2            A = 3          <- 1ª escolha: 3 subproblemas
        /     \          /     \          /     \
    B = 1   B = 2    B = 1   B = 3    B = 2   B = 3       <- 2ª escolha: 6 subproblemas
```

Dois subproblemas do mesmo nível não compartilham nada: buscar em `A = 1` não diz nada sobre `A = 2`. Portanto, eles podem ser confiados a **workers** diferentes (um worker é uma thread ou um processo que trata uma tarefa, ver [As threads](/?c=langages&s=c&p=threads)).

## Por que são necessários muito mais subproblemas do que workers

| Abordagem | O que acontece |
|---|---|
| Lançar N threads sobre o **mesmo** estado de busca | Elas modificam a mesma memória ao mesmo tempo: resultados errados (ver [Memória compartilhada](/?c=langages&s=c&p=threads#memoria-compartilhada-uma-vantagem-e-um-perigo)). |
| **Um** subproblema por worker | Os subproblemas não têm a mesma dificuldade: um worker termina em 1 segundo e espera, enquanto outro sofre por 9 segundos. |
| **30 a 100** subproblemas por worker, em uma fila | Um worker que termina cedo pega imediatamente o próximo: a carga se equilibra sozinha. |

Exemplo com números, 4 workers:

| Divisão | Durações dos subproblemas | Tempo total |
|---|---|---|
| 4 subproblemas | 1 s, 1 s, 1 s, 9 s | 9 s (três workers esperam 8 s) |
| 40 subproblemas, mesmo trabalho total (12 s) | cerca de 0,3 s cada | cerca de 3 s (12 s ÷ 4) |

## As três etapas da EPS

```
 1. Dividir                  2. Distribuir                 3. Resolver
 (um único worker)           (fila compartilhada)          (cada um por sua conta)

 raiz                        [sp1][sp2][sp3]...[sp240]     worker 1: sp1, sp5, sp9...
   -> desenvolver a       ->        |    |    |       ->   worker 2: sp2, sp6...
      árvore até 240                v    v    v            worker 3: sp3, sp7...
      subproblemas                pegar o próximo          (backtracking comum)
```

| Etapa | O que se faz | Sincronização necessária |
|---|---|---|
| 1. Dividir | Desenvolver a árvore a partir da raiz até o objetivo (ex.: 30 × número de workers), aplicando a [propagação de restrições](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#reduzir-os-dominios-antes-mesmo-de-tentar-a-propagacao-de-restricoes) a cada subproblema: os que já são impossíveis desaparecem. | Nenhuma (um único worker) |
| 2. Distribuir | Guardar os subproblemas em uma fila; cada worker pega o próximo quando fica livre. | Só para "pegar o próximo" (um [mutex](/?c=langages&s=c&p=threads#proteger-um-dado-compartilhado-com-um-mutex)) |
| 3. Resolver | Cada worker executa um backtracking sequencial normal no seu subproblema. | Nenhuma durante a busca |

Se você procura **uma única** solução, acrescente uma flag compartilhada "solução encontrada": o primeiro worker que consegue a levanta, e os outros param assim que a veem.

## Escolher qual subproblema dividir

Para atingir o objetivo em poucas etapas, divide-se sempre o subproblema que vai produzir **mais** subproblemas novos: aquele cuja próxima variável (escolhida por [MRV](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#escolher-a-variavel-certa-primeiro-a-heuristica-mrv), a mais restrita) tem mais valores possíveis.

| Subproblema | Valores possíveis da sua variável MRV | Dividi-lo dá |
|---|---|---|
| sp1 | 2 | +1 subproblema (1 substituído por 2) |
| sp2 | 5 | +4 subproblemas: **dividir este primeiro** |

## Copiar o estado: a condição do "sem sincronização"

Cada subproblema deve ter **sua própria cópia** de todos os seus dados: uma *cópia profunda*. Uma cópia que mantivesse um ponteiro para os dados de outro subproblema (uma *cópia rasa*) colocaria de novo dois workers sobre a mesma memória.

```c
typedef struct {
    int  n;          // número de variáveis
    int *valores;    // valores[i] = valor escolhido para a variável i, ou -1
} t_estado;

t_estado *copiar_estado(const t_estado *src)
{
    t_estado *copia = malloc(sizeof(t_estado));          // nova estrutura
    copia->n = src->n;                                   // um inteiro é copiado como está
    copia->valores = malloc(src->n * sizeof(int));       // NOVO array, não o de src
    memcpy(copia->valores, src->valores, src->n * sizeof(int)); // recopia o seu conteúdo
    return copia;                                        // nenhum ponteiro compartilhado com src
}
```

Escrever `copia->valores = src->valores;` no lugar das duas linhas `malloc`/`memcpy` seria uma cópia rasa: os dois estados modificariam então o mesmo array.

## Quando a EPS não ganha nada: um caso medido

A EPS foi testada em um solucionador do quebra-cabeça *Skyscraper* (backtracking com MRV e propagação, em C, 8 threads) e depois retirada:

| Grade | Sequencial | EPS (240 subproblemas) |
|---|---|---|
| 10 × 10 | 1,08 s | 13,06 s (12 vezes mais lento) |
| 11 × 11 | 14 a 16 s | 82 s a mais de 90 s |

| Causa | Explicação |
|---|---|
| Dividir custa caro | Cada subproblema criado exige uma propagação completa: 240 propagações antes mesmo de começar a buscar, enquanto a busca sequencial só explorava de 7 a 50 nós. |
| A árvore real é estreita | MRV e a propagação podam tanto que quase todo o trabalho cabe em poucos ramos. Com um subproblema por thread, o tempo volta ao do sequencial, sem ganho: 110% de uso do processador em 8 threads, pouco mais de um núcleo ocupado. |

A lição: a EPS compensa quando a árvore é **larga** e os subproblemas custam pouco para criar. Antes de paralelizar, é preciso [medir](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser) para onde o tempo realmente vai.

Fonte: *Embarrassingly Parallel Search*, Régin, Rezgui e Malapert, JAIR 2016 ([jair.org/index.php/jair/article/view/11031](https://jair.org/index.php/jair/article/view/11031)).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | A EPS divide a árvore de busca em subproblemas independentes (30 a 100 por worker), guarda-os em uma fila e deixa cada worker fazer um backtracking comum sem se comunicar. |
| **Ferramentas utilizáveis** | Propagação de restrições durante a divisão, MRV para escolher o subproblema a dividir, uma fila protegida por um mutex, uma flag compartilhada para parar os outros workers. |
| **Armadilhas a evitar** | Um único subproblema por worker (carga desequilibrada); uma cópia rasa do estado (memória compartilhada); paralelizar uma busca cuja árvore já é estreita. |
| **Boas práticas** | Medir o sequencial antes e depois; manter a divisão barata; copiar o estado em profundidade para cada subproblema. |
