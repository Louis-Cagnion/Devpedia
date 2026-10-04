---
order: 12
---

# Emparelhamentos, teste de Hall e filtragem de Régin

O [teorema de Hall](/?c=fondamentaux&s=algorithmes&p=problemes-np-complets#o-teorema-de-hall-quando-as-casas-se-bloqueiam-entre-si) explica por que casas podem se bloquear entre si sem que nenhuma, sozinha, tenha problema. Este capítulo mostra **como um programa detecta isso** e como ele vai além: retirar de uma casa os valores que ela nunca poderá assumir. É o que faz o solucionador de Skyscraper nas linhas e colunas quase preenchidas da sua grade (veja os [solucionadores SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl)).

## A restrição «todos diferentes»

Uma linha de um [quadrado latino](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme) contém cada valor exatamente uma vez. Cada casa tem um **domínio**: a lista de valores ainda não excluídos (veja [a propagação de restrições](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#reduzir-os-dominios-antes-mesmo-de-tentar-a-propagacao-de-restricoes)). Uma regra como «estas casas assumem valores todos diferentes» chama-se **restrição global**: ela envolve várias casas ao mesmo tempo.

A propagação simples só retira um valor quando uma casa está **fixada**: a casa X1 vale 2, então o 2 some das outras. Ela deixa passar deduções que exigem raciocinar sobre um grupo:

| Casa | Domínio | Dedução possível |
|---|---|---|
| X1 | 1 ou 2 | |
| X2 | 1 ou 2 | |
| X3 | 1, 2, 3 ou 4 | X1 e X2 dividem o 1 e o 2: X3 não pode valer nem 1 nem 2 |

Nenhuma casa está fixada, a propagação simples não vê nada. No entanto, X3 vale 3 ou 4. Um trecho de código dedicado a essa restrição, um [propagador](/?c=fondamentaux&s=algorithmes&p=encodages-sat#propagadores-e-geracao-preguicosa-de-clausulas), pode fazer esse raciocínio.

## Desenhar o problema: casas de um lado, valores do outro

Um **grafo** é um conjunto de pontos ligados por traços. Aqui há duas famílias de pontos: as casas à esquerda, os valores à direita, e um traço entre uma casa e cada valor do seu domínio. Um grafo cujos pontos se dividem em duas famílias, sem nenhum traço dentro de uma mesma família, chama-se **bipartido**.

| Casa | Domínio = traços para os valores |
|---|---|
| A | 1, 2 |
| B | 1, 3 |
| C | 1 |
| D | 3, 4 |

Um **emparelhamento** é uma escolha de traços sem extremidade em comum: cada casa tem no máximo um valor, cada valor no máximo uma casa. Um **emparelhamento perfeito** emparelha **todas** as casas: é exatamente uma maneira de preencher a linha com valores todos diferentes.

```
casas :     A    B    C    D
            │    │    │    │
valores :   2    3    1    4        um emparelhamento perfeito
```

| Vocabulário | Significado |
|---|---|
| Emparelhamento | Traços sem extremidade em comum |
| Emparelhamento perfeito | Um traço para cada casa |
| Detentor de um valor | A casa emparelhada com esse valor |
| Conjunto de Hall | Um grupo de k casas cujos domínios reunidos somam menos de k valores |

## Encontrar um emparelhamento: o caminho aumentante (algoritmo de Kuhn)

As casas são colocadas uma a uma. Quando o valor desejado já está ocupado, não se desiste: **pede-se ao seu detentor que se afaste**, se ele puder assumir outro valor; e esse pode, por sua vez, pedir a outro... A sequência desses deslocamentos chama-se **caminho aumentante**: no fim, uma casa a mais tem valor. Esse método, conhecido como algoritmo de Kuhn, deriva do método húngaro de [Kuhn (1955)](https://doi.org/10.1002/nav.3800020109).

| Etapa | Casa | O que acontece | Emparelhamento depois |
|---|---|---|---|
| 1 | A | Assume 1 | A=1 |
| 2 | B | Quer 1, detido por A. A pode assumir 2: A se afasta, B assume 1 | B=1 A=2 |
| 3 | C | Quer 1, detido por B. B pode assumir 3: B se afasta, C assume 1 | C=1 A=2 B=3 |
| 4 | D | Quer 3, detido por B, que não tem mais valor livre (seu valor 1 é detido por C, que não tem outra escolha). Tenta 4: livre | C=1 A=2 B=3 D=4 |

Cada domínio é uma **máscara de bits** (o bit `v` vale 1 se o valor `v` é possível; veja [as máscaras](/?c=langages&s=c&p=operateurs-binaires#as-mascaras-a-real-utilidade-no-dia-a-dia)): um `uint64_t` basta para 64 valores, e «pegar o menor valor possível» é uma única instrução (`__builtin_ctzll`, veja [percorrer os bits 1](/?c=langages&s=c&p=operateurs-binaires#percorrer-os-bits-1-as-funcoes-embutidas-do-compilador)).

O código deste capítulo fica em um arquivo de cabeçalho chamado `emparelhamento.h`, que os exemplos seguintes incluem.

```c
/* Emparelhamento casas / valores, teste de Hall e filtragem de Régin.
   dominio[i]: máscara da casa i, o bit v vale 1 se o valor v ainda é possível.
   No máximo 64 casas e 64 valores: uma máscara cabe em um uint64_t. */
#include <stdint.h>

/* Procura um caminho aumentante a partir da casa i (algoritmo de Kuhn).
   vistas: valores já tentados durante esta busca. */
static inline int aumentar(int i, const uint64_t *dominio, int *detentor, uint64_t *vistas)
{
    uint64_t m;

    while ((m = dominio[i] & ~*vistas)) {       /* valores possíveis ainda não tentados */
        int v = __builtin_ctzll(m);             /* a menor delas */

        *vistas |= 1ull << v;                   /* cada valor é tentado uma única vez */
        if (detentor[v] < 0 || aumentar(detentor[v], dominio, detentor, vistas)) {
            detentor[v] = i;                    /* i toma v; o anterior se move */
            return 1;
        }
    }
    return 0;
}

/* Emparelha as n casas com valores todos diferentes.
   Devolve -1 se tudo está emparelhado, senão a primeira casa sem valor; *vistas
   contém então os valores que a busca alcançou: o conjunto de Hall. */
static inline int emparelhar(int n, const uint64_t *dominio, int *detentor, uint64_t *vistas)
{
    for (int v = 0; v < 64; v++)
        detentor[v] = -1;
    for (int i = 0; i < n; i++) {
        *vistas = 0;
        if (!aumentar(i, dominio, detentor, vistas))
            return i;
    }
    return -1;
}
```

| Elemento | Papel |
|---|---|
| `dominio[i]` | Máscara dos valores ainda possíveis para a casa `i` |
| `detentor[v]` | A casa que detém o valor `v`, ou -1 se ele está livre |
| `vistas` | Os valores já tentados durante **esta** busca: um valor só é tentado uma vez, o que garante que a busca termina |
| `aumentar` | Função **recursiva** (ela chama a si mesma, veja [a inserção recursiva](/?c=langages&s=c&p=arbres-binaires#insercao-recursiva)): pede ao detentor que se afaste |
| `emparelhar` | Lança uma busca por casa; na primeira falha, devolve essa casa e os valores `vistas` |

O programa a seguir reproduz o exemplo da tabela anterior, casa por casa:

```c
#include <stdio.h>
#include "emparelhamento.h"

/* máscara dos valores dados (de 1 a 5); 0 significa «nenhum valor» */
static uint64_t M(int a, int b, int c, int d)
{
    uint64_t m = 0;
    int v[4] = { a, b, c, d };

    for (int k = 0; k < 4; k++)
        if (v[k] > 0)
            m |= 1ull << (v[k] - 1);
    return m;
}

static void mostrar_emparelhamento(const int *detentor)
{
    for (int v = 0; v < 5; v++)                 /* os valores vão de 1 a 5 */
        if (detentor[v] >= 0)
            printf(" %c=%d", 'A' + detentor[v], v + 1);
    printf("\n");
}

static void tentar(const char *titulo, int n, const uint64_t *dominio)
{
    int detentor[64];
    uint64_t vistas;

    for (int v = 0; v < 64; v++)
        detentor[v] = -1;
    printf("%s\n", titulo);
    for (int i = 0; i < n; i++) {
        vistas = 0;
        int ok = aumentar(i, dominio, detentor, &vistas);   /* uma casa por vez */

        printf("  casa %c: %-8s emparelhamento:", 'A' + i, ok ? "colocada" : "FALHA");
        mostrar_emparelhamento(detentor);
        if (!ok) {
            printf("  valores alcançados pela busca: ");
            for (uint64_t m = vistas; m; m &= m - 1)
                printf("%d ", __builtin_ctzll(m) + 1);
            printf("\n  casas que os detêm, mais a casa %c:", 'A' + i);
            for (uint64_t m = vistas; m; m &= m - 1)
                printf(" %c", 'A' + detentor[__builtin_ctzll(m)]);
            printf("\n");
            return;
        }
    }
}

int main(void)
{
    /* A: 1 ou 2   B: 1 ou 3   C: só 1   D: 3 ou 4 */
    uint64_t um[4] = { M(1, 2, 0, 0), M(1, 3, 0, 0), M(1, 0, 0, 0), M(3, 4, 0, 0) };
    /* A, B e C: só 2 ou 5   D: 1, 3 ou 4 */
    uint64_t dois[4] = { M(2, 5, 0, 0), M(2, 5, 0, 0), M(2, 5, 0, 0), M(1, 3, 4, 0) };

    tentar("Existe um emparelhamento:", 4, um);
    tentar("Nenhum emparelhamento:", 4, dois);
    return 0;
}
```

A primeira parte da saída reproduz as etapas da tabela (a segunda parte é explicada mais adiante):

```
Existe um emparelhamento:
  casa A: colocada emparelhamento: A=1
  casa B: colocada emparelhamento: B=1 A=2
  casa C: colocada emparelhamento: C=1 A=2 B=3
  casa D: colocada emparelhamento: C=1 A=2 B=3 D=4
Nenhum emparelhamento:
  casa A: colocada emparelhamento: A=2
  casa B: colocada emparelhamento: B=2 A=5
  casa C: FALHA    emparelhamento: B=2 A=5
  valores alcançados pela busca: 2 5 
  casas que os detêm, mais a casa C: B A
```

## Quando não existe nenhum emparelhamento: o conjunto de Hall

Na segunda tentativa do programa, as casas A, B e C só aceitam 2 ou 5; a casa D aceita 1, 3 ou 4. A assume 2, depois B assume 2 mandando A para 5; C quer 2, mas nem B nem A podem se afastar. O programa então mostra:

| Resultado | Leitura |
|---|---|
| Falha na casa C | Nenhum caminho aumentante parte de C |
| Valores alcançados: 2, 5 | Os únicos valores que a busca pôde tentar |
| Detentores: B, A, mais a casa C | Três casas para dois valores: um **conjunto de Hall** |

É exatamente o [teorema de Hall](/?c=fondamentaux&s=algorithmes&p=problemes-np-complets#o-teorema-de-hall-quando-as-casas-se-bloqueiam-entre-si), lido ao contrário: quando a busca falha, os valores que ela alcançou e as casas que os detêm formam um grupo de k casas cujos domínios reunidos somam k - 1 valores. Esse grupo **explica** por que não existe nenhum emparelhamento.

Em um solucionador, essa explicação serve de cláusula de conflito: uma casa do grupo precisa assumir um valor que falta fora do conjunto, ou um valor já colocado na linha precisa ser liberado (veja [o conflito e o aprendizado de cláusulas](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#o-conflito-e-o-aprendizado-de-clausulas-cdcl)). Essa cláusula só é usada para analisar o conflito; depois é descartada.

## Testar durante a busca: quando e em quais linhas

O solucionador lança o teste quando a [propagação unitária](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#a-propagacao-unitaria-os-niveis-e-o-rastro) não tem mais nada a deduzir (seu **ponto fixo**), e apenas nas linhas e colunas **modificadas desde o último teste** que **só têm mais algumas casas livres**. Três razões:

| Razão | Explicação |
|---|---|
| Uma linha quase cheia tem poucas casas livres | Um grupo de casas que se bloqueiam é fácil de detectar ali, e o teste continua curto |
| O custo cresce com o número de casas livres | A filtragem de Régin (mais adiante) lê o grafo completo da linha: um número de leituras proporcional ao quadrado do número de casas livres |
| As máscaras só cabem em 64 bits | No máximo 64 casas livres por linha |

O teste não recomeça do zero a cada vez: ele retoma o emparelhamento do último teste bem-sucedido e só procura um caminho aumentante para as casas cujo par não é mais válido (veja [evitar o recálculo redundante](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant)). Um conflito é sempre recalculado do zero para produzir uma explicação que não dependa do emparelhamento de partida.

O limite de casas livres se ajusta medindo. Em grades de 104 × 104 (100 grades, 4 cópias do solucionador em paralelo, veja [as caudas pesadas](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#as-caudas-pesadas-algumas-instancias-catastroficas)):

| Teste de Hall nas linhas... | Grades acima de 90 s |
|---|---|
| Nenhum teste | 9 |
| Com no máximo 16 casas livres | 3 |
| Com no máximo 32 casas livres | 0 (média de 51,5 s, pior grade 68,8 s) |

Mais acima, a busca se degrada: com 108 × 108, um limite de 48 casas livres não resolve nenhuma grade em 14 medições, e um limite de 64 resolve uma em 61 (orçamento de 1,5 bilhão de propagações por medição). A causa não foi isolada; só a medição vale.

## Ir além: a filtragem de Régin

O teste de Hall responde sim ou não: «existe um emparelhamento?». Mas um emparelhamento pode existir **e mesmo assim proibir valores**. No exemplo de partida, X1 e X2 dividem o 1 e o 2: X3 não pode assumi-los, ainda que o teste de Hall não veja nenhum problema. A **filtragem de Régin** ([Régin, 1994](https://cdn.aaai.org/AAAI/1994/AAAI94-055.pdf)) retira de cada domínio **todo valor que não pertence a nenhum emparelhamento perfeito**.

A ideia: partir de um emparelhamento perfeito (o teste de Hall encontrou um). Para que uma casa assuma um valor `k` diferente do seu, quem detém `k` precisa assumir outro, que por sua vez desloca alguém... até que alguém assuma o valor **antigo** da casa: um ciclo de deslocamentos.

Representa-se isso com um grafo orientado (**setas**, seguidas em um único sentido) sobre os valores: do valor `v` parte uma seta para cada valor do domínio da casa que detém `v`. No exemplo, o emparelhamento encontrado é X2=1, X1=2, X4=3, X3=4, X5=5:

```
valor 5  ──▶  3, 4           (X5 detém 5 e aceita 3, 4, 5)
valor 4  ──▶  1, 2, 3, 4     (X3 detém 4)
valor 3  ──▶  3, 4           (X4 detém 3)
valor 2  ──▶  1, 2           (X1 detém 2)
valor 1  ──▶  1, 2           (X2 detém 1)
```

Uma **componente fortemente conexa** é um grupo de pontos tais que, de cada um, é possível alcançar todos os outros seguindo as setas. Aqui: {1, 2}, {3, 4} e {5}. As setas descem de {5} para {3, 4} e depois para {1, 2}, mas nunca no sentido contrário. A regra de Régin:

> Um valor `k` do domínio da casa `i` (diferente do seu valor emparelhado `m`) é possível **se e somente se** `k` e `m` estão na mesma componente fortemente conexa: existe então um ciclo.

| Candidato | Casa (valor emparelhado) | Volta-se ao valor emparelhado? | Veredito |
|---|---|---|---|
| 1 ou 2 | X3 (4) | 1 e 2 só levam a {1, 2}: nunca a 4 | Retirado |
| 3 | X3 (4) | 3 leva a 4: X3 assume 3, X4 assume 4 | Mantido |
| 3 ou 4 | X5 (5) | 3 e 4 não levam a 5 | Retirado |
| 4 | X4 (3) | 4 leva a 3 | Mantido |

As componentes são calculadas em uma única travessia do grafo com o **algoritmo de [Tarjan (1972)](https://doi.org/10.1137/0201010)**, que empilha os pontos visitados e desempilha um grupo completo quando ele fecha o seu laço. Com máscaras de bits, as setas que saem de um valor cabem em um único `uint64_t`.

```c
/* Componentes fortemente conexas (Tarjan) do grafo de valores: a partir do valor v pode-se
   ir a todos os valores possíveis da casa que detém v. */
typedef struct {
    const uint64_t *succ;
    int indice[64], baixo[64], comp[64], pilha[64], sp, contagem;
    uint64_t na_pilha;
    int ncomp;
} tarjan;

static inline void visitar(tarjan *t, int v)
{
    t->indice[v] = t->baixo[v] = t->contagem++;
    t->pilha[t->sp++] = v;
    t->na_pilha |= 1ull << v;
    for (uint64_t m = t->succ[v]; m; m &= m - 1) {
        int w = __builtin_ctzll(m);

        if (t->indice[w] < 0) {
            visitar(t, w);
            if (t->baixo[w] < t->baixo[v])
                t->baixo[v] = t->baixo[w];
        } else if ((t->na_pilha >> w & 1) && t->indice[w] < t->baixo[v]) {
            t->baixo[v] = t->indice[w];
        }
    }
    if (t->baixo[v] != t->indice[v])
        return;
    int w;                                      /* v é a raiz de uma componente */
    do {
        w = t->pilha[--t->sp];
        t->na_pilha &= ~(1ull << w);
        t->comp[w] = t->ncomp;
    } while (w != v);
    t->ncomp++;
}

/* Filtragem de Régin: remove de cada domínio os valores que não pertencem a nenhum
   emparelhamento perfeito. Supõe um emparelhamento perfeito em detentor
   (n casas, n valores 0..n-1). Devolve o número de valores removidos. */
static inline int filtrar(int n, uint64_t *dominio, const int *detentor)
{
    uint64_t succ[64];
    int valor_de[64], removidos = 0;
    tarjan t = { .succ = succ };

    for (int v = 0; v < n; v++) {
        succ[v] = dominio[detentor[v]];         /* de v para os valores da sua casa */
        valor_de[detentor[v]] = v;              /* o valor emparelhado com cada casa */
        t.indice[v] = -1;
    }
    for (int v = 0; v < n; v++)
        if (t.indice[v] < 0)
            visitar(&t, v);
    for (int i = 0; i < n; i++)
        for (uint64_t m = dominio[i] & ~(1ull << valor_de[i]); m; m &= m - 1) {
            int v = __builtin_ctzll(m);

            if (t.comp[v] != t.comp[valor_de[i]]) {  /* v nunca volta ao valor de i */
                dominio[i] &= ~(1ull << v);
                removidos++;
            }
        }
    return removidos;
}
```

```c
#include <stdio.h>
#include "emparelhamento.h"

static uint64_t M(int a, int b, int c, int d)
{
    uint64_t m = 0;
    int v[4] = { a, b, c, d };

    for (int k = 0; k < 4; k++)
        if (v[k] > 0)
            m |= 1ull << (v[k] - 1);
    return m;
}

static void mostrar(const char *titulo, int n, const uint64_t *dominio)
{
    printf("%s\n", titulo);
    for (int i = 0; i < n; i++) {
        printf("  X%d :", i + 1);
        for (uint64_t m = dominio[i]; m; m &= m - 1)
            printf(" %d", __builtin_ctzll(m) + 1);
        printf("\n");
    }
}

int main(void)
{
    uint64_t dominio[5] = { M(1, 2, 0, 0), M(1, 2, 0, 0), M(1, 2, 3, 4),
                            M(3, 4, 0, 0), M(3, 4, 5, 0) };
    int detentor[64];
    uint64_t vistas;

    mostrar("Antes:", 5, dominio);
    if (emparelhar(5, dominio, detentor, &vistas) >= 0) {
        printf("sem emparelhamento\n");
        return 1;
    }
    printf("Existe um emparelhamento perfeito: o teste de Hall não vê nada a objetar.\n");
    printf("emparelhamento encontrado:");
    for (int v = 0; v < 5; v++)
        printf(" X%d=%d", detentor[v] + 1, v + 1);
    printf("\n");
    int removidos = filtrar(5, dominio, detentor);

    mostrar("Após a filtragem de Régin:", 5, dominio);
    printf("%d valores removidos\n", removidos);
    return 0;
}
```

```
Antes:
  X1 : 1 2
  X2 : 1 2
  X3 : 1 2 3 4
  X4 : 3 4
  X5 : 3 4 5
Existe um emparelhamento perfeito: o teste de Hall não vê nada a objetar.
emparelhamento encontrado: X2=1 X1=2 X4=3 X3=4 X5=5
Após a filtragem de Régin:
  X1 : 1 2
  X2 : 1 2
  X3 : 3 4
  X4 : 3 4
  X5 : 5
4 valores removidos
```

O teste de Hall não encontrou nada a objetar (existe um emparelhamento), e a filtragem retira 4 valores: 1 e 2 de X3 (divididos por X1 e X2), 3 e 4 de X5 (divididos por X3 e X4 depois que X3 é reduzida a {3, 4}). O raciocínio de Régin funciona, portanto, **em cascata**, sem que se peça.

## Justificar cada retirada: as explicações

Um solucionador SAT com aprendizado precisa poder **explicar** cada valor que retira: sem uma razão, a análise de um conflito não sabe remontar até a causa (veja [o conflito e o aprendizado de cláusulas](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#o-conflito-e-o-aprendizado-de-clausulas-cdcl)). A explicação de uma retirada pela filtragem de Régin é um conjunto de Hall: as casas que detêm os valores alcançáveis não têm outra escolha além desses valores, que nenhuma outra casa pode então assumir.

Primeira versão do solucionador: cada retirada era **aprendida como uma cláusula**. Resultado na grade de 64 × 64 n.º 4, resolvida em 98 milhões de propagações sem filtragem:

| | Sem filtragem | Primeira filtragem (cláusulas aprendidas) | Filtragem com explicações empilhadas |
|---|---|---|---|
| Propagações | 98,4 milhões | Não resolvida em 300 milhões | 102,5 milhões |
| Tempo | 7,4 s | | 7,8 s |
| Custo de uma propagação | 75 ns | 156 ns | |
| Retiradas, cláusulas aprendidas | | 226.000, 58.000 (memória ×19) | |

Cada explicação é longa (142 literais em média, medidos na versão corrigida): aprender dezenas de milhares faz a memória explodir e deixa cada propagação mais lenta. A correção: **empilhar** cada explicação em uma pilha à parte, desempilhada no retrocesso como o rastro das atribuições, sem nunca transformá-la em cláusula. O bloqueio vinha das cláusulas de explicação, não da filtragem em si.

## O que isso rendeu no solucionador

A filtragem só se aplica às linhas e colunas com no máximo 16 casas livres (o teste de Hall vai até 32). Em 40 grades de 64 × 64, um único processo, orçamento de 400 milhões de propagações:

| | Sem Régin | Com Régin (16 casas livres) |
|---|---|---|
| Grades resolvidas | 28 de 40 | 39 de 40 |
| Propagações médias | 187 milhões | 97 milhões |
| Custo de uma propagação | 107 ns | 91 ns |

(As médias contam uma falha como o orçamento inteiro.) 11 grades só são resolvidas com a filtragem, uma única apenas sem ela: uma diferença tão clara tem cerca de 3 chances em 1.000 de ocorrer por acaso. Com um limite de 24 casas livres, 17 grades de 20 são resolvidas (contra 20 de 20 com 16): filtrar mais linhas custa mais do que rende.

Com 108 × 108, nas 100 grades (4 cópias em paralelo):

| | Média | Grades acima de 90 s |
|---|---|---|
| Só o teste de Hall | 56,8 s | 4 |
| Com filtragem de Régin | 49,3 s (pior grade 64,1 s) | 0 |

Com 112 × 112, esse solucionador continua fora de alcance: 59,1 s de média simulada nas 20 primeiras grades, e já um estouro de tempo.

## Verificar o código: a força bruta

Um raciocínio tão sutil erra com facilidade: uma linha esquecida e um valor útil desaparece sem nenhuma mensagem. O programa a seguir compara o código com uma referência que tenta **todas** as maneiras de preencher as casas (de 2 a 8 casas, domínios aleatórios):

```c
#include <stdio.h>
#include <stdlib.h>
#include "emparelhamento.h"

/* Referência: tenta todas as permutações e anota para cada casa
   os valores que ela assume em pelo menos um emparelhamento perfeito. */
static void permutar(int n, int k, int *p, int *usado, const uint64_t *dom,
                     uint64_t *possiveis, long *nb)
{
    if (k == n) {
        (*nb)++;
        for (int i = 0; i < n; i++)
            possiveis[i] |= 1ull << p[i];
        return;
    }
    for (int v = 0; v < n; v++)
        if (!usado[v] && (dom[k] >> v & 1)) {
            usado[v] = 1;
            p[k] = v;
            permutar(n, k + 1, p, usado, dom, possiveis, nb);
            usado[v] = 0;
        }
}

int main(void)
{
    long com_emparelhamento = 0, filtrados = 0, hall_ok = 0, hall_total = 0, divergencias = 0;

    srand(42);
    for (int rodada = 0; rodada < 300000; rodada++) {
        int n = 2 + rand() % 7;                         /* de 2 a 8 casas */
        uint64_t dom[64], ref[64] = {0}, vistas;
        int p[64], usado[64] = {0}, detentor[64], falhou;
        long nb = 0;

        for (int i = 0; i < n; i++) {                   /* domínios aleatórios, esparsos */
            dom[i] = 0;
            for (int v = 0; v < n; v++)
                if (rand() % 100 < 35)
                    dom[i] |= 1ull << v;
        }
        permutar(n, 0, p, usado, dom, ref, &nb);
        falhou = emparelhar(n, dom, detentor, &vistas);
        if ((nb > 0) != (falhou < 0))
            divergencias++;                             /* divergência sobre a existência */
        if (falhou >= 0) {                              /* verificação do conjunto de Hall */
            uint64_t uniao_dos_dominios = dom[falhou];
            int ncasas = 1;

            for (uint64_t m = vistas; m; m &= m - 1) {
                uniao_dos_dominios |= dom[detentor[__builtin_ctzll(m)]];
                ncasas++;
            }
            hall_total++;
            if (uniao_dos_dominios == vistas && ncasas == __builtin_popcountll(vistas) + 1)
                hall_ok++;
            continue;
        }
        com_emparelhamento++;
        filtrados += filtrar(n, dom, detentor);
        for (int i = 0; i < n; i++)
            if (dom[i] != ref[i])                       /* remove exatamente o inútil? */
                divergencias++;
    }
    printf("300000 sorteios: %ld com emparelhamento perfeito, %ld sem ele\n",
           com_emparelhamento, hall_total);
    printf("valores removidos pelo filtro: %ld\n", filtrados);
    printf("conjuntos de Hall corretos: %ld de %ld\n", hall_ok, hall_total);
    printf("divergências com a força bruta: %ld\n", divergencias);
    return divergencias != 0;
}
```

```
300000 sorteios: 96500 com emparelhamento perfeito, 203500 sem ele
valores removidos pelo filtro: 391264
conjuntos de Hall corretos: 203500 de 203500
divergências com a força bruta: 0
```

| Verificação | Resultado |
|---|---|
| Existe um emparelhamento perfeito? | Mesma resposta que a força bruta, nos 300.000 sorteios |
| Quando não existe, o conjunto de Hall está correto? | 203.500 de 203.500: seus domínios reunidos são exatamente os valores alcançados, com uma casa a mais |
| Após a filtragem, o domínio de cada casa é exatamente o conjunto de valores que ela assume em pelo menos um emparelhamento perfeito? | Sim nos 96.500 sorteios com emparelhamento: a filtragem só retira o inútil e retira todo o inútil |

## As armadilhas

| Armadilha | O que acontece | Remédio |
|---|---|---|
| Filtrar sem emparelhamento perfeito | O resultado não faz sentido: o grafo de valores supõe que cada valor tem um detentor | Lançar primeiro a busca de emparelhamento e filtrar só se ela tiver sucesso |
| Número de casas diferente do número de valores | O grafo fica mal formado | Em uma linha, as casas livres recebem os valores que faltam: seus números são iguais ou o conflito já está lá |
| Setas no sentido errado | Retiram-se valores úteis: o resultado parece plausível, mas é falso | Verificar com a força bruta em casos pequenos, como acima |
| Mais de 64 casas livres ou 64 valores | Uma máscara `uint64_t` não basta mais | Limitar o teste às linhas quase preenchidas, ou passar a máscaras mais largas |
| Aprender cada retirada como uma cláusula | A memória explode, a busca trava (arena ×19 medida) | Empilhar as explicações à parte e desempilhá-las no retrocesso |
| Filtrar todas as linhas | O custo supera o ganho (24 casas livres: 17 grades de 20 resolvidas contra 20 de 20) | Ajustar o limite de casas livres medindo |

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Casas que devem assumir valores todos diferentes são modeladas por um grafo bipartido; um emparelhamento perfeito é uma maneira válida de preenchê-las. O algoritmo de Kuhn o procura por caminhos aumentantes; sua falha produz um conjunto de Hall que explica a impossibilidade. A filtragem de Régin vai além: a partir de um emparelhamento perfeito, retira todo valor que não pertence a nenhum emparelhamento perfeito, graças às componentes fortemente conexas do grafo de valores. |
| **Ferramentas utilizáveis** | As máscaras de bits (`uint64_t`, `__builtin_ctzll`) para domínios de menos de 64 valores, o algoritmo de Tarjan para as componentes, uma referência por força bruta para validar o código, o [artigo de Régin](https://cdn.aaai.org/AAAI/1994/AAAI94-055.pdf) para a prova. |
| **Armadilhas a evitar** | Filtrar sem emparelhamento perfeito, inverter o sentido das setas, ultrapassar 64 valores com uma única máscara, aprender cada retirada como uma cláusula, aplicar a filtragem a todas as linhas sem medir. |
| **Boas práticas** | Lançar o teste só nas linhas quase preenchidas; retomar o emparelhamento anterior em vez de recomeçar do zero; empilhar as explicações à parte; validar cada algoritmo em casos pequenos contra uma enumeração exaustiva; ajustar os limites medindo. |
