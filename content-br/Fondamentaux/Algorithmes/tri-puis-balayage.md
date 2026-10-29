---
order: 13
---

# Ordenar e varrer (sweep and prune): comparar apenas os vizinhos plausíveis

Um **segmento** é a porção de reta compreendida entre dois pontos do plano, chamados as suas **extremidades** (ou as suas pontas). Um **plano** é uma superfície plana em que cada ponto se localiza por dois números, as suas **coordenadas**: `x` (a posição horizontal) e `y` (a posição vertical). Dois segmentos **se cruzam** quando têm pelo menos um ponto em comum. Saber quais se cruzam é uma necessidade comum: os lados de um polígono (uma figura fechada formada por segmentos colocados em sequência, cujos segmentos também se chamam **arestas**) não devem se atravessar, duas trajetórias de veículos não devem se cortar, duas estradas de um mapa podem se encontrar em um entroncamento.

O método evidente compara todos os segmentos dois a dois, e se torna inutilizável assim que o número deles cresce. A técnica da **ordenação e varredura** (em inglês *sweep and prune*, « varrer e podar ») evita a imensa maioria dessas comparações: ela ordena os segmentos e depois compara apenas aqueles cujas **caixas delimitadoras** (retângulos que os envolvem, definidos mais abaixo) se sobrepõem. Este capítulo constrói a técnica passo a passo, a demonstra, a mede e mostra em que caso ela não serve para nada.

Ele pressupõe conhecidos [a complexidade e a notação Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o), [a ordenação por comparação](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison), [os vetores](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) (uma lista de números tratada como uma única entidade, por exemplo as duas coordenadas de um ponto), e, para os programas em C, [as variáveis](/?c=langages&s=c&p=variables), [as estruturas](/?c=langages&s=c&p=variables#as-estruturas-struct), [os ponteiros](/?c=langages&s=c&p=pointeurs) e [o gerenciamento de memória](/?c=langages&s=c&p=memoire). Todos os programas foram compilados com `gcc` (o compilador do projeto GNU, veja [o processo de compilação](/?c=langages&s=c&p=compilation)) e executados; as saídas exibidas são as saídas reais.

## O problema: testar todos os pares

Para `n` segmentos, a versão ingênua testa cada **par** (dois segmentos distintos, a ordem não contando: o par A-B é o mesmo que B-A). Cada um dos `n` segmentos tem `n - 1` parceiros, mas cada par seria então contado duas vezes, daí `n × (n - 1) / 2` pares. O custo é portanto de ordem `O(n²)` (« n ao quadrado »: multiplicar `n` por 10 multiplica o trabalho por 100, veja [a complexidade](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)).

| Número de segmentos `n` | Número de pares `n(n-1)/2` | Em relação à linha anterior |
|---|---|---|
| 100 | 4 950 | : |
| 1 000 | 499 500 | cerca de 100 vezes mais |
| 10 000 | 49 995 000 | cerca de 100 vezes mais |
| 100 000 | 4 999 950 000 | cerca de 100 vezes mais |

Cinco bilhões de testes para 100 000 segmentos: e, se poucos segmentos se cruzam de fato, quase todo esse trabalho é desperdiçado. A ideia da técnica é descartar, a baixo custo, os pares que evidentemente não podem se cruzar, e pagar o teste exato apenas pelos outros.

## O teste exato: dois segmentos se cruzam?

Antes de evitá-lo, é preciso conhecê-lo: é o « teste caro » cujo número de chamadas a técnica procura reduzir. Ele se apoia em uma operação simples, o produto vetorial em duas dimensões.

Um **vetor** vai de um ponto a outro: o de `o` até `p` tem componentes `(p.x - o.x, p.y - o.y)`. O **produto vetorial** (*cross product*) de dois vetores `u = (ux, uy)` e `v = (vx, vy)` do plano é o número `ux × vy - uy × vx`. Seu sinal diz de que lado `v` gira em relação a `u`. Para três pontos `o`, `p`, `q`, chamamos isso de **orientação** da tripla: é o produto vetorial do vetor de `o` até `p` e do vetor de `o` até `q`.

| Sinal do produto vetorial | Posição de `q` ao ir de `o` até `p` | Exemplo com `o = (0, 0)`, `p = (4, 0)` |
|---|---|---|
| Positivo | À esquerda (curva à esquerda) | `q = (2, 3)`: `4 × 3 - 0 × 2 = 12` |
| Negativo | À direita (curva à direita) | `q = (2, -3)`: `4 × (-3) - 0 × 2 = -12` |
| Nulo | Sobre a mesma reta que `o` e `p` (os três pontos são **alinhados**, também se diz **colineares**) | `q = (8, 0)`: `4 × 0 - 0 × 8 = 0` |

> **Nota:** « esquerda » e « direita » supõem um eixo `y` que sobe. Na tela, `y` desce e os lados se trocam, o que não tem consequência aqui: o teste apenas compara sinais entre si.

O raciocínio do teste: o segmento `s` (de `s.a` até `s.b`) e o segmento `t` (de `t.a` até `t.b`) se cruzam francamente quando as duas extremidades de `t` estão de lados opostos da reta de `s` (orientações de sinais opostos) **e** as duas extremidades de `s` estão de lados opostos da reta de `t`.

```text
            t.a      orientation(s.a, s.b, t.a) = +1  (à esquerda de s)
              \
  s.a ---------\---------> s.b
                \
                 t.b     orientation(s.a, s.b, t.b) = -1  (à direita de s)
```

Isso não basta quando uma orientação vale 0 (uma extremidade apoiada exatamente sobre a reta do outro segmento): é preciso decidir o que se chama de « cruzamento ». **Decisão deste capítulo: dois segmentos se cruzam se têm pelo menos um ponto em comum**, o que inclui o cruzamento franco, o contato por uma extremidade e a sobreposição de dois segmentos alinhados. Uma extremidade alinhada com o outro segmento só conta se estiver de fato **entre** as suas extremidades.

| Situação | Orientações | Veredito |
|---|---|---|
| Cruzamento franco (em cruz) | Sinais opostos dos dois lados | Se cruzam |
| Uma extremidade de `t` apoiada no meio de `s` | Uma orientação em 0, extremidade entre `s.a` e `s.b` | Se cruzam |
| Duas extremidades que se tocam | Uma orientação em 0, extremidade entre as extremidades | Se cruzam |
| Alinhados, que se sobrepõem | Todas em 0, uma extremidade dentro do outro segmento | Se cruzam |
| Alinhados, separados | Todas em 0, nenhuma extremidade dentro do outro segmento | Disjuntos (sem ponto em comum) |
| Paralelos | Mesmos sinais | Disjuntos |
| Retas secantes, segmentos curtos demais | As extremidades de `t` envolvem `s`, mas não o inverso | Disjuntos |
| Segmento reduzido a um ponto | Orientações sempre em 0 | Se cruzam se o ponto estiver sobre o outro segmento |

O código correspondente. Os elementos da linguagem C utilizados:

| Elemento | Papel |
|---|---|
| `typedef struct { ... } Point;` | Cria um tipo `Point` que reúne vários campos sob um só nome (veja [as estruturas](/?c=langages&s=c&p=variables#as-estruturas-struct)) |
| `long long` | Inteiro com sinal de pelo menos 64 bits: os produtos de coordenadas não estouram (veja [os inteiros, os bits e os overflows](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements)) |
| `static` | A função só é visível neste arquivo |
| `const Segmento *s` | Ponteiro para um segmento que se promete não modificar; `s->a` lê o seu campo `a` (veja [os ponteiros](/?c=langages&s=c&p=pointeurs)) |
| `(produto > 0) - (produto < 0)` | Uma comparação vale 1 se for verdadeira e 0 caso contrário: a diferença dá 1, -1 ou 0, o sinal do número |
| `condição ? a : b` | Vale `a` se a condição for verdadeira, `b` caso contrário |

```c
#include <stdio.h>

typedef struct {
    long long x, y;                         // as duas coordenadas de um ponto
} Point;

typedef struct {
    Point a, b;                             // as duas extremidades do segmento
} Segmento;

static long long minimum(long long u, long long v)
{
    return u < v ? u : v;                   // o menor dos dois
}

static long long maximum(long long u, long long v)
{
    return u > v ? u : v;                   // o maior dos dois
}

// Sinal do produto vetorial de (o até p) e (o até q): 1, -1 ou 0.
static int orientation(Point o, Point p, Point q)
{
    long long para_p_x = p.x - o.x;         // componente x do vetor de o até p
    long long para_p_y = p.y - o.y;         // componente y do vetor de o até p
    long long para_q_x = q.x - o.x;         // componente x do vetor de o até q
    long long para_q_y = q.y - o.y;         // componente y do vetor de o até q
    long long produto = para_p_x * para_q_y - para_p_y * para_q_x;   // o produto vetorial

    return (produto > 0) - (produto < 0);   // 1 se positivo, -1 se negativo, 0 se nulo
}

// Verdadeiro se p, já conhecido como alinhado com a e b, está entre eles.
static int entre(Point a, Point b, Point p)
{
    return minimum(a.x, b.x) <= p.x && p.x <= maximum(a.x, b.x)   // no intervalo em x
        && minimum(a.y, b.y) <= p.y && p.y <= maximum(a.y, b.y);   // e no intervalo em y
}

// Verdadeiro se os dois segmentos têm pelo menos um ponto em comum.
static int segmentos_se_cruzam(const Segmento *s, const Segmento *t)
{
    int o1 = orientation(s->a, s->b, t->a);   // de que lado de (s) está a extremidade a de t
    int o2 = orientation(s->a, s->b, t->b);   // de que lado de (s) está a extremidade b de t
    int o3 = orientation(t->a, t->b, s->a);   // de que lado de (t) está a extremidade a de s
    int o4 = orientation(t->a, t->b, s->b);   // de que lado de (t) está a extremidade b de s

    if (o1 != o2 && o3 != o4)               // cada segmento separa as extremidades do outro
        return 1;                           // cruzamento franco, ou contato por uma ponta
    if (o1 == 0 && entre(s->a, s->b, t->a)) // a extremidade a de t está apoiada sobre s
        return 1;
    if (o2 == 0 && entre(s->a, s->b, t->b)) // a extremidade b de t está apoiada sobre s
        return 1;
    if (o3 == 0 && entre(t->a, t->b, s->a)) // a extremidade a de s está apoiada sobre t
        return 1;
    if (o4 == 0 && entre(t->a, t->b, s->b)) // a extremidade b de s está apoiada sobre t
        return 1;
    return 0;                               // nenhum ponto em comum
}
```

Um `main` de teste (a ser colocado em seguida) percorre as situações da tabela:

```c
typedef struct {
    const char *nome;                       // descrição do caso, para a exibição
    Segmento primeiro, segundo;             // os dois segmentos a comparar
} Caso;

int main(void)
{
    Caso casos[] = {                        // um caso por situação a distinguir
        {"em cruz", {{0, 0}, {4, 4}}, {{0, 4}, {4, 0}}},
        {"ponta apoiada na outra", {{0, 0}, {4, 0}}, {{2, 0}, {2, 3}}},
        {"duas pontas que se tocam", {{0, 0}, {2, 2}}, {{2, 2}, {5, 0}}},
        {"alinhados que se sobrepõem", {{0, 0}, {4, 0}}, {{3, 0}, {7, 0}}},
        {"alinhados mas separados", {{0, 0}, {2, 0}}, {{3, 0}, {7, 0}}},
        {"paralelos", {{0, 0}, {4, 0}}, {{0, 1}, {4, 1}}},
        {"retas secantes, segmentos não", {{0, 0}, {2, 0}}, {{3, -1}, {3, 5}}},
        {"um ponto sobre um segmento", {{1, 1}, {1, 1}}, {{0, 0}, {2, 2}}},
        {"um ponto fora do segmento", {{1, 2}, {1, 2}}, {{0, 0}, {2, 2}}},
    };

    for (size_t i = 0; i < sizeof casos / sizeof casos[0]; i++) {   // percorre os casos
        int cruza = segmentos_se_cruzam(&casos[i].primeiro, &casos[i].segundo);
        printf("%-12s %s\n", cruza ? "se cruzam" : "disjuntos", casos[i].nome);  // 12 colunas
    }
    return 0;
}
```

```text
se cruzam    em cruz
se cruzam    ponta apoiada na outra
se cruzam    duas pontas que se tocam
se cruzam    alinhados que se sobrepõem
disjuntos    alinhados mas separados
disjuntos    paralelos
disjuntos    retas secantes, segmentos não
se cruzam    um ponto sobre um segmento
disjuntos    um ponto fora do segmento
```

Os nove casos dão o veredito anunciado pela tabela. Esse teste tem um custo nada desprezível: quatro cálculos de orientação (sete operações aritméticas cada um), depois comparações. É isso que se quer chamar o menor número de vezes possível.

## A caixa delimitadora: um teste barato

Uma **caixa delimitadora alinhada aos eixos** (em inglês *axis-aligned bounding box*, abreviada **AABB**) é o menor retângulo, com lados paralelos aos eixos `x` e `y`, que contém inteiramente uma forma. Para um segmento, quatro números bastam: `xmin` e `xmax` (o menor e o maior `x` de suas duas extremidades), `ymin` e `ymax` (o mesmo para `y`). Cada um dos dois intervalos `[xmin, xmax]` e `[ymin, ymax]` é a **projeção** do segmento sobre um eixo, isto é, a sua sombra sobre esse eixo.

```text
  y
  ^
  |  ymax  +-------------B
  |        |         .   |
  |        |      .      |
  |        |   .         |
  |  ymin  A-------------+
  |        |             |
  +--------+-------------+----------> x
         xmin          xmax
```

Se dois segmentos têm um ponto em comum, esse ponto pertence às duas caixas: **as duas caixas se sobrepõem**. Dito de outro modo: se duas caixas são **disjuntas** (sem ponto em comum), os segmentos não podem se cruzar, e é inútil aplicar o teste exato. O inverso é falso: duas caixas podem se sobrepor sem que os segmentos se toquem, caso em que o teste exato decidirá.

```text
 Sobreposição só em x                 Sobreposição em x e em y
 (nenhum cruzamento possível)         (o teste exato decide)

      +--------+                       +--------+
      |   S    |                       |   S    |
      |        |                       |     +--+-----+
      +--------+                       +-----+--+     |
   +--------+                                |   T    |
   |   T    |                                +--------+
   +--------+
```

Duas caixas se sobrepõem se e somente se seus intervalos se sobrepõem **em cada eixo**. Dois intervalos fechados (extremidades incluídas) `[min1, max1]` e `[min2, max2]` têm um ponto em comum exatamente quando cada um começa antes que o outro termine: `min1 <= max2` e `min2 <= max1`.

| Intervalo 1 | Intervalo 2 | `min1 <= max2` | `min2 <= max1` | Sobreposição |
|---|---|---|---|---|
| `[1, 4]` | `[3, 6]` | sim (1 <= 6) | sim (3 <= 4) | Sim |
| `[1, 4]` | `[4, 7]` | sim (1 <= 7) | sim (4 <= 4) | Sim: eles se tocam em 4 |
| `[1, 4]` | `[5, 7]` | sim (1 <= 7) | não (5 <= 4 é falso) | Não |

O teste de caixa custa no máximo quatro comparações (duas por eixo), contra umas trinta operações para o teste exato. As caixas são calculadas uma única vez por segmento.

```c
#include <stdlib.h>
#include <string.h>

typedef struct {
    long long xmin, xmax;                   // limites da caixa no eixo x
    long long ymin, ymax;                   // limites da caixa no eixo y
} Caixa;

// Calcula a caixa delimitadora alinhada aos eixos de um segmento.
static Caixa caixa_de(const Segmento *s)
{
    Caixa b;                                // a caixa a preencher

    b.xmin = minimum(s->a.x, s->b.x);       // o x mais à esquerda das duas extremidades
    b.xmax = maximum(s->a.x, s->b.x);       // o x mais à direita
    b.ymin = minimum(s->a.y, s->b.y);       // o y mais baixo
    b.ymax = maximum(s->a.y, s->b.y);       // o y mais alto
    return b;
}

// Verdadeiro se os intervalos fechados [min1, max1] e [min2, max2] têm um ponto em comum.
static int se_sobrepoem(long long min1, long long max1, long long min2, long long max2)
{
    return min1 <= max2 && min2 <= max1;    // cada um começa antes que o outro termine
}

// Um segmento, seu número de origem e sua caixa (calculada uma única vez).
typedef struct {
    int ident;                              // posição no array de partida
    Segmento segm;                          // o próprio segmento
    Caixa caixa;                            // sua caixa delimitadora
} Elemento;
```

Os segmentos verticais (`xmin == xmax`), horizontais ou reduzidos a um ponto não têm nada de particular: a caixa deles é um retângulo achatado, ou mesmo um ponto, e o teste de intervalos fechados funciona tal como está.

Mas testar a caixa de cada par continua sendo um trabalho em `O(n²)`: cinco bilhões de comparações de caixas para 100 000 segmentos. A ordenação até evita isso.

## A ordenação e depois a varredura

A ideia: se os segmentos estão arrumados por `xmin` crescente, os candidatos de um segmento são seus vizinhos imediatos nessa arrumação, e paramos assim que o seguinte começa longe demais à direita.

| Etapa | Ação | Por quê |
|---|---|---|
| 1 | Copiar os segmentos com a caixa e o número | Manter o array original intacto |
| 2 | Ordenar a cópia por `xmin` crescente | Os candidatos de um segmento ficam contíguos |
| 3 | Para cada segmento `i`, percorrer os seguintes `j = i + 1, i + 2...` **enquanto** `xmin[j] <= xmax[i]` | Além disso, nenhuma sobreposição em `x` é possível: paramos |
| 4 | Para cada `j` visitado, testar a sobreposição em `y` | Teste barato |
| 5 | Somente se os `y` se sobrepõem, chamar o teste exato | Só pagamos o teste caro pelos pares plausíveis |

A **varredura** (*sweep*) é o nome da etapa 3: imaginamos uma linha vertical que avança da esquerda para a direita sobre o eixo `x`, e a cada segmento encontrado olhamos para aqueles que ela ainda cruza. A **ordenação** vem da etapa 2: sem ela, seria preciso percorrer todo o array para saber quais segmentos estão ao alcance.

Os blocos de código deste capítulo se acrescentam uns aos outros em um mesmo arquivo (retirar o `main` de teste da seção anterior antes de continuar). O primeiro organiza os resultados: um cruzamento `(i, j)` vira uma **chave**, um único inteiro de 64 bits (`i` na metade alta dos 64 bits, `j` na metade baixa), e um array que cresce quando preciso ([`realloc`](/?c=langages&s=c&p=memoire#redimensionar-um-bloco-realloc)) as guarda. O tipo `Contadores` mede o trabalho: `visitados` conta os pares que o laço examina, `testes_exatos` as chamadas ao teste caro.

| Elemento | Papel |
|---|---|
| `size_t` | Inteiro sem sinal (sem valor negativo) feito para tamanhos e números de elementos |
| `realloc(antigo, tamanho)` | Aumenta um bloco de memória, ou devolve um novo que contém os mesmos dados |
| `perror("texto")` | Exibe o texto seguido da descrição do último erro do sistema |
| `exit(1)` | Encerra o programa com o código 1, que sinaliza uma falha (veja [`exit()` e os códigos de retorno](/?c=langages&s=c&p=exit-et-codes-de-retour)) |
| `<<` e `\|` | Deslocamento de bits para a esquerda e OU binário, para guardar dois números em um só inteiro (veja [os operadores binários](/?c=langages&s=c&p=operateurs-binaires)) |
| `for (; j < n && ...; j++)` | Laço `for` cuja primeira parte está vazia: `j` já existe |
| `continue` | Passa diretamente para a próxima volta do laço |
| `%c` | Código do `printf` para exibir um caractere; `'A' + 2` vale o caractere `C` |

```c
typedef struct {
    long long visitados;                    // pares examinados pelo laço interno
    long long testes_exatos;                // chamadas a segmentos_se_cruzam
} Contadores;

typedef struct {
    unsigned long long *chaves;             // uma chave por cruzamento encontrado
    size_t qtd, capacidade;                 // número de chaves guardadas, lugares disponíveis
} Resultados;

// Guarda o cruzamento (i, j) na forma de um só número, o número pequeno à frente.
static void registrar(Resultados *r, int i, int j)
{
    int menor = i < j ? i : j;              // o menor dos dois números
    int maior = i < j ? j : i;              // o maior

    if (r->qtd == r->capacidade) {          // array cheio: aumentamos
        size_t nova = r->capacidade ? 2 * r->capacidade : 1024;   // dobramos
        unsigned long long *p = realloc(r->chaves, nova * sizeof *p);

        if (p == NULL) {                    // sem memória: desistimos
            perror("realloc");
            exit(1);
        }
        r->chaves = p;
        r->capacidade = nova;
    }
    r->chaves[r->qtd++] = ((unsigned long long)menor << 32) | (unsigned)maior;  // menor:maior
}
```

O segundo bloco é o coração da técnica. Ele usa `qsort`, a função de ordenação da biblioteca padrão do C (veja [`qsort` e a estabilidade](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible#o-qsort-nao-promete-nada); referência: [`qsort`](https://en.cppreference.com/w/c/algorithm/qsort)): ela recebe o array, o número de elementos, o tamanho de um elemento e uma **função de comparação** (um [ponteiro de função](/?c=langages&s=c&p=pointeurs)) que devolve um número negativo, nulo ou positivo. As funções `malloc` (reservar memória), `memcpy` (copiar bytes) e `free` (devolvê-la) são explicadas em [o gerenciamento de memória](/?c=langages&s=c&p=memoire). O parâmetro `verboso` serve para exibir as etapas no exemplo que segue; ele valerá 0 nas medições.

```c
// Compara dois elementos por xmin crescente (sem subtração, que poderia transbordar).
static int comparar_xmin(const void *p, const void *q)
{
    const Elemento *e = p;                  // o primeiro elemento comparado
    const Elemento *f = q;                  // o segundo

    return (e->caixa.xmin > f->caixa.xmin) - (e->caixa.xmin < f->caixa.xmin);
}

// A varredura: supõe o array já ordenado por xmin crescente.
static void varrer(const Elemento *lista, int n, Contadores *c, Resultados *res, int verboso)
{
    for (int i = 0; i < n; i++) {           // cada segmento, da esquerda para a direita
        const Elemento *e = &lista[i];      // o segmento cujos vizinhos procuramos
        int j = i + 1;                      // primeiro candidato: o seguinte na ordem

        for (; j < n && lista[j].caixa.xmin <= e->caixa.xmax; j++) {   // ainda ao alcance
            const Elemento *f = &lista[j];  // o candidato
            c->visitados++;                 // um par a mais examinado
            if (!se_sobrepoem(e->caixa.ymin, e->caixa.ymax, f->caixa.ymin, f->caixa.ymax)) {
                if (verboso)
                    printf("  %c-%c: y disjuntos, descartado\n",
                           'A' + e->ident, 'A' + f->ident);
                continue;                   // sem sobreposição em y: par eliminado
            }
            c->testes_exatos++;             // único caso em que pagamos o teste exato
            int sim = segmentos_se_cruzam(&e->segm, &f->segm);   // o veredito exato
            if (sim)
                registrar(res, e->ident, f->ident);
            if (verboso)
                printf("  %c-%c: teste exato, %s\n", 'A' + e->ident, 'A' + f->ident,
                       sim ? "cruzamento" : "sem cruzamento");
        }
        if (verboso && j < n)               // paramos antes do fim do array
            printf("  %c-%c: xmin %lld > xmax %lld, paramos\n", 'A' + e->ident,
                   'A' + lista[j].ident, lista[j].caixa.xmin, e->caixa.xmax);
    }
}

// Versão ordenada: ordena uma cópia (o original mantém a sua ordem) e depois varre.
static void ordenado(const Elemento *e, int n, Contadores *c, Resultados *res, int verboso)
{
    Elemento *copia = malloc((size_t)n * sizeof *copia);   // a cópia que vamos ordenar

    if (copia == NULL) {                    // sem memória: desistimos
        perror("malloc");
        exit(1);
    }
    memcpy(copia, e, (size_t)n * sizeof *copia);   // recopia os elementos
    qsort(copia, (size_t)n, sizeof *copia, comparar_xmin);   // ordenação por xmin crescente
    varrer(copia, n, c, res, verboso);      // depois a varredura
    free(copia);                            // a cópia não serve mais
}
```

### Passo a passo com seis segmentos

Seis segmentos `A` a `F`, de coordenadas inteiras. Suas caixas delimitadoras:

| Segmento | Extremidades | `[xmin, xmax]` | `[ymin, ymax]` |
|---|---|---|---|
| A | (1, 1) e (4, 4) | [1, 4] | [1, 4] |
| B | (2, 4) e (5, 1) | [2, 5] | [1, 4] |
| C | (3, 4) e (6, 7) | [3, 6] | [4, 7] |
| D | (6, 7) e (9, 4) | [6, 9] | [4, 7] |
| E | (7, 3) e (9, 7) | [7, 9] | [3, 7] |
| F | (8, 0) e (11, 1) | [8, 11] | [0, 1] |

Os pontos do desenho são os nós da grade atravessados por cada segmento; `X` marca um ponto comum a dois segmentos (`A` e `B` em (3, 3), `C` e `D` em (6, 7), `D` e `E` em (8, 5)).

```text
   y
   8 .  .  .  .  .  .  .  .  .  .  .  .
   7 .  .  .  .  .  .  X  .  .  E  .  .
   6 .  .  .  .  .  C  .  D  .  .  .  .
   5 .  .  .  .  C  .  .  .  X  .  .  .
   4 .  .  B  C  A  .  .  .  .  D  .  .
   3 .  .  .  X  .  .  .  E  .  .  .  .
   2 .  .  A  .  B  .  .  .  .  .  .  .
   1 .  A  .  .  .  B  .  .  .  .  .  F
   0 .  .  .  .  .  .  .  .  F  .  .  .
     0  1  2  3  4  5  6  7  8  9  10 11  x
```

Depois da ordenação, a ordem é já `A, B, C, D, E, F` (por `xmin`: 1, 2, 3, 6, 7, 8). Os intervalos em `x` mostram o que significa « ao alcance »: o segmento `A` só tem como candidatos aqueles cujo intervalo começa antes que o seu termine.

```text
      0  1  2  3  4  5  6  7  8  9  10 11  x
   A     [========]
   B        [========]
   C           [========]
   D                    [========]
   E                       [=====]
   F                          [========]
```

Para `A` (`xmax = 4`): `B` começa em 2, `C` em 3, mas `D` em 6: 6 é maior que 4, paramos, e `E` e `F` nem são olhados (o array estando ordenado, eles começam ainda mais longe). Eis o programa que refaz a varredura, com os segmentos dados em desordem para que a ordenação sirva para alguma coisa:

```c
int main(void)
{
    Segmento seg[6] = {                     // os seis segmentos, A a F, em desordem
        {{6, 7}, {9, 4}},                   // D
        {{1, 1}, {4, 4}},                   // A
        {{8, 0}, {11, 1}},                  // F
        {{3, 4}, {6, 7}},                   // C
        {{2, 4}, {5, 1}},                   // B
        {{7, 3}, {9, 7}},                   // E
    };
    int nomes[6] = {3, 0, 5, 2, 1, 4};      // número da letra de cada segmento (A = 0)
    Elemento e[6];                          // os elementos a varrer
    Contadores c = {0, 0};                  // contadores zerados
    Resultados res = {NULL, 0, 0};          // nenhum cruzamento encontrado por enquanto

    for (int i = 0; i < 6; i++) {           // prepara cada elemento
        e[i].ident = nomes[i];              // seu número de letra
        e[i].segm = seg[i];                 // seu segmento
        e[i].caixa = caixa_de(&seg[i]);     // sua caixa delimitadora
    }
    ordenado(e, 6, &c, &res, 1);            // varredura detalhada
    printf("pares visitados: %lld, testes exatos: %lld, cruzamentos: %zu\n",
           c.visitados, c.testes_exatos, res.qtd);
    free(res.chaves);                       // libera os resultados
    return 0;
}
```

```text
  A-B: teste exato, cruzamento
  A-C: teste exato, sem cruzamento
  A-D: xmin 6 > xmax 4, paramos
  B-C: teste exato, sem cruzamento
  B-D: xmin 6 > xmax 5, paramos
  C-D: teste exato, cruzamento
  C-E: xmin 7 > xmax 6, paramos
  D-E: teste exato, cruzamento
  D-F: y disjuntos, descartado
  E-F: y disjuntos, descartado
pares visitados: 7, testes exatos: 5, cruzamentos: 3
```

| Segmento varrido | Candidatos visitados | Parada | Testes exatos | Observação |
|---|---|---|---|---|
| A (`xmax = 4`) | B, C | `D` começa em 6 | 2 | `A`-`C`: caixas em contato em `y = 4`, o teste exato diz não |
| B (`xmax = 5`) | C | `D` começa em 6 | 1 | Mesmo caso: caixas sobrepostas, segmentos disjuntos |
| C (`xmax = 6`) | D | `E` começa em 7 | 1 | `D` começa **exatamente** em 6: retido graças ao `<=`, e eles se tocam em (6, 7) |
| D (`xmax = 9`) | E, F | fim do array | 1 | `F` descartado pelos `y` ([0, 1] contra [4, 7]) |
| E (`xmax = 9`) | F | fim do array | 0 | `F` descartado pelos `y` |
| F | nenhum | fim do array | 0 | : |

Balanço: 15 pares possíveis, 7 examinados, 5 testes exatos, 3 cruzamentos encontrados. O caso de `C` e `D` mostra por que o teste é `<=` e não `<`: com `<`, o par `C`-`D` nunca é examinado e o programa só encontra 2 (6 pares visitados, 4 testes exatos, medido trocando apenas esse caractere).

### Por que nenhum cruzamento é perdido

Uma técnica que elimina pares precisa provar que nunca elimina um par que se cruza. Sejam dois segmentos `s` e `t` que se cruzam, `s` colocado antes de `t` no array ordenado (índices `i < j`).

1. Eles têm um ponto em comum, que pertence às suas duas caixas: seus intervalos se sobrepõem em `x` **e** em `y`. O teste em `y` portanto não os descarta.
2. A ordenação dá `xmin[i] <= xmin[j]`. A sobreposição em `x` exige `xmin[j] <= xmax[i]` (« cada um começa antes que o outro termine »), exatamente a condição de continuação do laço.
3. O laço de `i` avança `j` a partir de `i + 1` e só para no primeiro `j` que viola a condição. Para todo `k` mais adiante, `xmin[k] >= xmin[j] > xmax[i]` (array ordenado): nenhum segmento depois da parada pode sobrepor `i` em `x`. Nada plausível é pulado.
4. O par `(i, j)` é portanto visitado, passa no teste em `y`, e o teste exato o declara cruzado.

Por construção, `j` começa em `i + 1`: um par só é examinado uma vez, e nunca um segmento com ele mesmo.

## O custo

| Etapa | Custo | Explicação |
|---|---|---|
| Cópia e cálculo das caixas | `O(n)` | Uma passagem |
| Ordenação por `xmin` | `O(n log n)` | Ordenação por comparação, veja [a ordenação por comparação](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison) |
| Varredura | `O(n + p)` | `n` voltas do laço externo, mais uma visita por par cujos intervalos em `x` se sobrepõem (seu número é `p`), mais um teste de parada por segmento |
| Testes exatos | no máximo `p` | Só passam os pares cujas caixas também se sobrepõem em `y` |

No total: `O(n log n + p)`. Tudo depende de `p`. A medição abaixo compara, para 1 000, 10 000 e 100 000 pequenos segmentos aleatórios, o número de testes exatos da versão ingênua e da versão ordenada. Os dados vêm de um **gerador pseudoaleatório** (uma fórmula que produz uma sequência de números de aparência aleatória, mas inteiramente determinada por um número de partida, a **semente**; veja [a aleatoriedade e os geradores](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs#um-prng-e-uma-sequencia-deterministica)): com a mesma semente, cada execução produz os mesmos segmentos. É o **xorshift64** do capítulo [a estabilidade de uma ordenação e o ruído reproduzível](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible#um-ruido-reproduzivel-xorshift), cuja fórmula é retomada (`<<` e `>>` deslocam os bits, `^=` é um « ou exclusivo »: veja [os operadores binários](/?c=langages&s=c&p=operateurs-binaires)). Cada segmento parte de um ponto sorteado em um quadrado de lado 100 000, e a sua segunda extremidade é deslocada de -1 000 a +1 000 em cada eixo.

| Elemento | Papel |
|---|---|
| `enum { MUNDO = 100000, ALCANCE = 1000 };` | Dá um nome a constantes inteiras |
| `unsigned long long` e `0x9E3779B97F4A7C15ull` | Inteiro sem sinal de 64 bits; constante escrita em hexadecimal (na base 16, daí o prefixo `0x`), o sufixo `ull` indicando seu tipo. Multiplicar a semente por essa constante evita uma semente « simples demais » |
| `x % limite` | Resto da divisão: traz um número grande para entre 0 e `limite - 1` (o leve viés deste método é explicado em [o viés do módulo](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs#o-vies-do-modulo), sem efeito aqui) |
| `memcmp(a, b, tamanho)` | Compara duas zonas de memória byte a byte; devolve 0 se forem idênticas |
| `%zu`, `%lld` | Códigos do `printf` para um `size_t` (inteiro sem sinal feito para tamanhos e números de elementos) e um `long long` |

O primeiro bloco contém a versão ingênua, a transposição dos eixos (explicada mais abaixo, em « O pior caso »), o gerador e a fabricação dos segmentos.

```c
// Versão ingênua: testa os n(n-1)/2 pares com o teste exato.
static void metodo_ingenuo(const Elemento *e, int n, Contadores *c, Resultados *res)
{
    for (int i = 0; i < n; i++) {           // primeiro segmento do par
        for (int j = i + 1; j < n; j++) {   // segundo segmento, sempre depois do primeiro
            c->visitados++;                 // um par a mais examinado
            c->testes_exatos++;             // e um teste exato a mais
            if (segmentos_se_cruzam(&e[i].segm, &e[j].segm))
                registrar(res, e[i].ident, e[j].ident);
        }
    }
}

static void trocar(long long *u, long long *v)
{
    long long reserva = *u;                 // guarda u de lado
    *u = *v;                                // u recebe o valor de v
    *v = reserva;                           // v recebe o antigo valor de u
}

// Troca x e y em toda parte: varrer depois « em x » equivale a varrer em y o original.
static void transpor(Elemento *e, int n)
{
    for (int i = 0; i < n; i++) {           // cada segmento
        trocar(&e[i].segm.a.x, &e[i].segm.a.y);   // transpõe a primeira extremidade
        trocar(&e[i].segm.b.x, &e[i].segm.b.y);   // transpõe a segunda extremidade
        e[i].caixa = caixa_de(&e[i].segm);  // recalcula a caixa com os eixos trocados
    }
}

enum { MUNDO = 100000, ALCANCE = 1000 };    // lado do mundo, deslocamento máximo

// Um passo do xorshift64, o gerador do capítulo sobre a estabilidade da ordenação.
static unsigned long long xorshift64(unsigned long long *estado)
{
    unsigned long long x = *estado;         // o estado atual do gerador

    x ^= x << 13;                           // mistura os bits por um deslocamento e um XOR
    x ^= x >> 7;                            // segunda mistura
    x ^= x << 17;                           // terceira mistura
    return *estado = x;                     // guarda o novo estado e o devolve
}

// Sorteia um inteiro de 0 incluído até limite excluído (viés do módulo desprezível aqui).
static long long sortear(unsigned long long *estado, long long limite)
{
    return (long long)(xorshift64(estado) % (unsigned long long)limite);
}

// Preenche e com n pequenos segmentos aleatórios, em um quadrado de lado MUNDO.
static void segmentos_aleatorios(Elemento *e, int n, unsigned long long *estado)
{
    for (int i = 0; i < n; i++) {           // um segmento por volta
        long long x = sortear(estado, MUNDO);   // abscissa da primeira extremidade
        long long y = sortear(estado, MUNDO);   // ordenada da primeira extremidade
        long long dx = sortear(estado, 2 * ALCANCE + 1) - ALCANCE;   // deslocamento em x
        long long dy = sortear(estado, 2 * ALCANCE + 1) - ALCANCE;   // deslocamento em y

        e[i].ident = i;                     // seu número de origem
        e[i].segm = (Segmento){{x, y}, {x + dx, y + dy}};   // segunda extremidade próxima
        e[i].caixa = caixa_de(&e[i].segm);  // sua caixa delimitadora
    }
}
```

O segundo bloco verifica que os dois métodos encontram **o mesmo conjunto** de cruzamentos (ordenamos as chaves das duas listas, depois as comparamos byte a byte), e lança a medição. Para 100 000 segmentos, a versão ingênua faria 4 999 950 000 testes: ela não terminava em 20 segundos no teste, mesmo sem os controles da compilação. O programa portanto não executa o ingênuo nesse tamanho: o número de testes ingênuos exibido é a fórmula `n(n-1)/2` (o laço ingênuo faz exatamente essa quantidade), e o resultado é verificado contra uma segunda varredura, feita sobre o eixo `y` trocando os dois eixos com `transpor`.

```c
// Compara duas chaves para a ordenação crescente.
static int comparar_chaves(const void *p, const void *q)
{
    unsigned long long u = *(const unsigned long long *)p;   // primeira chave
    unsigned long long v = *(const unsigned long long *)q;   // segunda chave

    return (u > v) - (u < v);
}

// Verdadeiro se as duas listas de cruzamentos contêm exatamente os mesmos pares.
static int mesmos_cruzamentos(Resultados *r1, Resultados *r2)
{
    if (r1->qtd != r2->qtd)                 // não tem o mesmo número: certamente diferentes
        return 0;
    qsort(r1->chaves, r1->qtd, sizeof *r1->chaves, comparar_chaves);   // ordena a primeira
    qsort(r2->chaves, r2->qtd, sizeof *r2->chaves, comparar_chaves);   // e a segunda
    return memcmp(r1->chaves, r2->chaves, r1->qtd * sizeof *r1->chaves) == 0;   // byte a byte
}

int main(void)
{
    int tamanhos[3] = {1000, 10000, 100000};   // os três tamanhos a comparar

    printf("%7s %14s %14s %12s %12s  %s\n", "n", "ingênuo: testes", "ordenado: pares",
           "ordenado: testes", "cruzamentos", "verificado contra");
    for (int k = 0; k < 3; k++) {           // uma linha de resultados por tamanho
        int n = tamanhos[k];                // número de segmentos desta linha
        unsigned long long semente = 0x9E3779B97F4A7C15ull * 42;   // semente fixa
        Elemento *e = malloc((size_t)n * sizeof *e);   // os segmentos de partida
        Elemento *outro = malloc((size_t)n * sizeof *outro);   // cópia para o outro método
        Contadores cn = {0, 0}, ct = {0, 0}, ca = {0, 0};   // ingênuo, ordenado, verificação
        Resultados rt = {NULL, 0, 0}, rv = {NULL, 0, 0};    // resultados: ordenado, controle
        const char *contra = n <= 10000 ? "ingênuo" : "varredura em y";   // a referência

        if (e == NULL || outro == NULL)
            return 1;
        segmentos_aleatorios(e, n, &semente);   // gera os segmentos
        ordenado(e, n, &ct, &rt, 0);            // ordenação e varredura em x
        if (n <= 10000) {                   // pequeno o bastante para testar tudo
            metodo_ingenuo(e, n, &cn, &rv); // todos os pares
        } else {                            // longo demais para executar aqui
            memcpy(outro, e, (size_t)n * sizeof *outro);   // copia os segmentos
            transpor(outro, n);             // troca os eixos
            ordenado(outro, n, &ca, &rv, 0);   // varredura segundo y
            cn.testes_exatos = (long long)n * (n - 1) / 2;   // o que faria o ingênuo
        }
        int iguais = mesmos_cruzamentos(&rt, &rv);   // os dois métodos concordam?

        printf("%7d %14lld %14lld %12lld %12zu  %s%s\n", n, cn.testes_exatos, ct.visitados,
               ct.testes_exatos, rt.qtd, iguais ? "" : "DIFERENTE ", contra);
        free(rt.chaves);                    // libera o resultado da ordenada
        free(rv.chaves);                    // libera o da verificação
        free(outro);                        // libera a cópia
        free(e);                            // libera os segmentos
    }
    return 0;
}
```

```text
      n ingênuo: testes ordenado: pares ordenado: testes  cruzamentos  verificado contra
   1000         499500           5002           45           16  ingênuo
  10000       49995000         494868         4984         1800  ingênuo
 100000     4999950000       49743253       499117       184665  varredura em y
```

| `n` | Testes exatos do ingênuo | Pares visitados (ordenação + varredura) | Testes exatos (ordenação + varredura) | Redução dos testes exatos |
|---|---|---|---|---|
| 1 000 | 499 500 | 5 002 | 45 | cerca de 11 000 vezes menos |
| 10 000 | 49 995 000 | 494 868 | 4 984 | cerca de 10 000 vezes menos |
| 100 000 | 4 999 950 000 | 49 743 253 | 499 117 | cerca de 10 000 vezes menos |

Duas lições. Primeiro, o ganho é enorme: com 100 000 segmentos, de cinco bilhões de testes exatos passa-se para menos de meio milhão, e os cruzamentos encontrados são os mesmos. Depois, e este é o ponto que não se deve perder: o número de pares visitados **continua crescendo como `n²`** (ele é multiplicado por 99 e depois por 100 quando `n` é multiplicado por 10 duas vezes). A técnica não muda a forma da curva aqui, ela divide a altura por cerca de 100, porque nesse mundo de lado 100 000 um segmento se sobrepõe em `x` a apenas 1 % dos outros. O ganho depende portanto da **distribuição** dos segmentos: `p` vale aqui cerca de 1 % de `n(n-1)/2`.

### O pior caso: tudo se sobrepõe em x

Se todos os segmentos são longos e sobrepostos em `x`, cada segmento sobrepõe em `x` todos os outros: `p = n(n-1)/2`, e a varredura volta a `O(n²)`. A medição abaixo fabrica `n` segmentos longos quase horizontais (de `x` perto de 0 até `x` perto de 100 000), empilhados de 4 em 4 em `y`, portanto sem nenhum cruzamento. Ela conta os pares visitados por uma varredura segundo `x`, depois por uma varredura segundo `y` após `transpor` (os blocos anteriores permanecem no arquivo, só o `main` da medição é substituído por este; o compilador assinala então funções `static` não usadas, sem consequência).

```c
// n segmentos longos quase horizontais, todos sobrepostos em x, empilhados de 4 em 4 em y.
static void segmentos_em_faixas(Elemento *e, int n, unsigned long long *estado)
{
    for (int i = 0; i < n; i++) {           // um segmento por faixa
        long long esquerda = sortear(estado, 100);   // partida perto da borda (0 a 99)
        long long direita = MUNDO - sortear(estado, 100);   // chegada perto da borda direita
        long long faixa = 4 * (long long)i; // altura da faixa, 4 a mais
        long long inclinacao = sortear(estado, 3);   // subida de 0 a 2: fica na sua faixa

        e[i].ident = i;                     // seu número de origem
        e[i].segm = (Segmento){{esquerda, faixa}, {direita, faixa + inclinacao}};   // longo
        e[i].caixa = caixa_de(&e[i].segm);  // sua caixa delimitadora
    }
}

int main(void)
{
    int tamanhos[4] = {1000, 2000, 4000, 8000};   // dobramos n a cada linha

    printf("%6s %16s %14s %14s\n", "n", "varredura em x", "varredura em y", "n(n-1)/2");
    for (int k = 0; k < 4; k++) {           // uma linha por tamanho
        int n = tamanhos[k];                // número de segmentos desta linha
        unsigned long long semente = 0x9E3779B97F4A7C15ull * 42;   // semente fixa
        Elemento *e = malloc((size_t)n * sizeof *e);   // os segmentos de partida
        Contadores cx = {0, 0}, cy = {0, 0}; // contadores das duas varreduras
        Resultados rx = {NULL, 0, 0}, ry = {NULL, 0, 0};   // resultados das duas varreduras

        if (e == NULL)
            return 1;
        segmentos_em_faixas(e, n, &semente);   // gera as faixas
        ordenado(e, n, &cx, &rx, 0);          // varredura em x: todos se sobrepõem
        transpor(e, n);                     // troca os eixos
        ordenado(e, n, &cy, &ry, 0);          // varredura em y: as faixas estão separadas
        printf("%6d %16lld %14lld %14lld\n", n, cx.visitados, cy.visitados,
               (long long)n * (n - 1) / 2);
        free(rx.chaves);                    // libera os resultados (vazios aqui)
        free(ry.chaves);
        free(e);                            // libera os segmentos
    }
    return 0;
}
```

```text
     n   varredura em x varredura em y       n(n-1)/2
  1000           499500              0         499500
  2000          1999000              0        1999000
  4000          7998000              0        7998000
  8000         31996000              0       31996000
```

A varredura segundo `x` visita **exatamente** `n(n-1)/2` pares, como a versão ingênua: dobrar `n` multiplica o trabalho por 4, é o `O(n²)`. A varredura segundo `y` não visita nenhum, porque as faixas estão separadas nesse eixo. A escolha do eixo conta, portanto, tanto quanto a própria técnica. Resta um caso sem saída: se todos os segmentos realmente se cruzam (por exemplo, todos passam por um mesmo ponto), a resposta em si contém `n(n-1)/2` pares, e nenhum algoritmo pode produzi-la mais depressa do que escrevendo-a.

## Outros usos, e estruturas mais finas

| Uso | Como a técnica se aplica |
|---|---|
| Colisões em um jogo | Cada objeto tem uma caixa; a **fase larga** (*broad phase*) elimina os pares distantes com esta varredura, a **fase estreita** (*narrow phase*) faz o teste preciso nos pares restantes. É exatamente o papel do teste exato acima |
| Contorno de polígono antes da triangulação | Verificar que duas arestas não se cruzam antes da [triangulação por *ear clipping*](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#faces-com-numero-variavel-de-vertices), que [recusa as faces que se recortam](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#tornar-o-ear-clipping-robusto). Esta técnica não aparece ali: ela se acrescenta antes |
| Outras formas | Um círculo, um triângulo, um retângulo também têm uma caixa delimitadora: só o teste exato muda |
| Trajetórias, estradas, fiação | Qualquer conjunto de segmentos cujas interseções se procuram |

Quando a distribuição dos segmentos é desfavorável nos dois eixos, estruturas mais elaboradas assumem: uma **grade uniforme** (o mundo dividido em células, cada segmento guardado nas células que ele toca, muitas vezes com uma [tabela hash](/?c=langages&s=c&p=tables-de-hachage) para encontrar uma célula) ou uma **árvore** de caixas (veja [as árvores binárias](/?c=langages&s=c&p=arbres-binaires)). Elas ultrapassam o escopo deste capítulo.

## As armadilhas

| Armadilha | Por quê | Como evitar |
|---|---|---|
| `<` em vez de `<=` na condição da varredura | Duas caixas que se tocam (`xmin[j] == xmax[i]`) se sobrepõem; com `<`, o par `C`-`D` do exemplo se perde (2 cruzamentos encontrados em vez de 3) | Intervalos fechados, `<=` em toda parte |
| `xmin` iguais entre vários segmentos | A ordenação não precisa ser estável: se `xmin[i] == xmin[j]`, a condição `xmin[j] <= xmax[i]` é verdadeira nas duas ordens, o par é visitado uma vez qualquer que seja a ordem escolhida por `qsort` (veja [a estabilidade de uma ordenação](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible)) | Nenhum desempate é necessário para a correção; acrescentar um (pelo número) só para tornar reprodutível a ordem dos resultados |
| Números de ponto flutuante | `0.1 + 0.2` não é exatamente `0.3` (veja [os números de ponto flutuante](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)): três pontos que deveriam estar alinhados dão um produto vetorial próximo de 0 mas não nulo, veja o ensaio logo depois | Coordenadas inteiras quando possível; senão uma tolerância, e **ampliar as caixas** dessa tolerância para que o filtro nunca rejeite um par que o teste aceitaria |
| Estouro dos inteiros | Com `int` de 32 bits, um produto de duas diferenças de coordenadas ultrapassa 2 bilhões rapidamente | `long long`, e diferenças de coordenadas inferiores a 2 bilhões (seu produto então cabe em 64 bits) |
| Segmento vertical, horizontal ou reduzido a um ponto | Nenhum problema: a caixa fica achatada ou reduzida a um ponto, os intervalos fechados continuam corretos | Não escrever caso particular |
| Par testado duas vezes, ou segmento comparado com ele mesmo | Laço interno começado em `0` em vez de `i + 1`: cada cruzamento é contado duas vezes, e um segmento « se cruza » sempre consigo mesmo | Começar `j` em `i + 1` |
| Arestas vizinhas de um polígono | Duas arestas consecutivas compartilham uma extremidade: o teste as declara cruzadas, com razão no sentido do capítulo | Ignorar os pares `(i, i+1)` e `(última, primeira)` antes do teste exato, mantendo o número de origem de cada segmento |
| Ordenar o array original | Seus números de posição se perdem, os resultados não fazem mais sentido | Ordenar uma cópia que guarda um `ident` (este capítulo), ou ordenar um array de índices (as posições dos segmentos): menos bytes deslocados, mas um acesso indireto a cada comparação; medir com os próprios dados |
| Eixo errado | Medido acima: `n(n-1)/2` pares visitados em `x`, zero em `y` | Varrer o eixo onde os intervalos se sobrepõem menos (regra empírica depois da tabela) |
| Acreditar que a ordenação sempre torna o cálculo `O(n log n)` | A varredura custa `O(n + p)`, podendo `p` valer `n(n-1)/2` | Medir `p` (o contador `visitados`) sobre dados reais |
| Comparador de `qsort` por subtração | `a - b` pode transbordar para inteiros grandes e devolver um sinal falso | `(a > b) - (a < b)` |

O ensaio sobre os números de ponto flutuante: três pontos que deveriam estar alinhados sobre a reta `y = x`, cujo terceiro é calculado como `0.1 + 0.2` em vez de ser escrito `0.3`.

```c
#include <stdio.h>

int main(void)
{
    double ax = 0.1, ay = 0.1;              // primeiro ponto, sobre a reta y = x
    double bx = 0.3, by = 0.3;              // segundo ponto, sobre a mesma reta
    double cx = 0.1 + 0.2, cy = 0.3;        // terceiro ponto: 0.1 + 0.2 deveria valer 0.3
    double produto = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);   // produto vetorial

    printf("%g\n", produto);                // 0 esperado
    return 0;
}
```

```text
-1.38778e-17
```

O resultado não é 0: o teste declararia esses três pontos não alinhados. Para escolher o eixo, uma regra empírica (tirada da experiência, não demonstrada aqui) consiste em calcular, para cada eixo, a soma dos comprimentos dos intervalos (`xmax - xmin`, depois `ymax - ymin`) e varrer sobre o eixo onde essa soma é a menor: é ali que os intervalos se sobrepõem menos. Outra consiste em medir `p` em cada eixo com uma amostra.

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Manter o teste exato tal como está e só lhe acrescentar um filtro antes | A correção do resultado depende apenas do teste exato e da prova do filtro |
| Calcular a caixa uma única vez por segmento | Ela é relida a cada comparação |
| Usar intervalos fechados e `<=` | Os contatos nunca se perdem |
| Preferir coordenadas inteiras e um tipo suficientemente largo | O teste exato se torna exato, sem tolerância |
| Contar os pares visitados e os testes exatos | `p` diz se a técnica traz algum resultado nos seus dados |
| Verificar o resultado contra a versão ingênua em entradas pequenas | Um erro do filtro aparece como um cruzamento faltando |
| Decidir de uma vez por todas o que « se cruzar » quer dizer (contato, sobreposição) | Os casos limites mudam de veredito conforme a definição |
| Gerar os dados de teste com uma semente fixa | As medições são reproduzíveis e comparáveis |

## O que reter

| | |
|---|---|
| **Para lembrar** | Testar todos os pares de `n` segmentos custa `n(n-1)/2` testes exatos, ou seja `O(n²)`. A ordenação e varredura ordena os segmentos por `xmin`, depois, para cada segmento `i`, percorre os seguintes `j` enquanto `xmin[j] <= xmax[i]`, testa a sobreposição em `y`, e só dispara o teste exato (orientação por produto vetorial, contatos e sobreposições incluídos) nos pares restantes. Nenhum par que se cruza é perdido: ele se sobrepõe em `x` e em `y`, e a ordenação garante que não se para antes. O custo é `O(n log n + p)`, onde `p` é o número de pares cujos intervalos em `x` se sobrepõem. Medido: 5 bilhões de testes para 100 000 pequenos segmentos contra menos de 500 000, mas `p` cresce sempre como `n²` com distribuição constante, e vale `n(n-1)/2` se tudo se sobrepõe em `x`. |
| **Armadilhas a evitar** | `<` em vez de `<=`; esquecer que caixas sobrepostas não garantem um cruzamento (o teste exato continua necessário); flutuantes não alinhados por arredondamento; estouro de inteiros de 32 bits; laço interno começado antes de `i + 1`; arestas vizinhas de um polígono contadas como cruzamentos; ordenar o array original e perder os números; varrer o eixo errado; acreditar em um `O(n log n)` garantido. |
| **Boas práticas** | Intervalos fechados e `<=`; caixa calculada uma vez; coordenadas inteiras em `long long`; contadores de pares visitados e de testes exatos; verificação contra a versão ingênua em entradas pequenas; definição de « cruzamento » escrita e testada nos casos limites; semente fixa para as medições; escolha do eixo medida, com uma grade ou uma árvore como reserva quando nenhum eixo convém. |
