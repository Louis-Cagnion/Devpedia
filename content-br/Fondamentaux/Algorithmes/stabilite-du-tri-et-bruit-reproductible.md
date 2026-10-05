---
order: 2.5
---

# A estabilidade de uma ordenação, os empates e o ruído reproduzível (xorshift)

Ordenar é arrumar elementos em uma ordem. Mas o que acontece quando **vários elementos são iguais** para o critério escolhido? A ordem entre eles pode mudar de uma máquina para outra, de uma biblioteca para outra, até de uma execução para outra: o resultado deixa de se reproduzir. Este capítulo mostra como constatar isso, como impedi-lo e como fabricar um pequeno **ruído aleatório reproduzível**, que cria justamente muitos empates a desempatar.

| Noção | Pergunta à qual responde |
|---|---|
| Empate em uma ordenação | Em que ordem saem dois elementos que o critério não distingue? |
| Estabilidade | A ordenação garante que eles mantenham a ordem de chegada? |
| Desempate pelo índice | Como obter o mesmo resultado com **qualquer** ordenação? |
| Gerador xorshift | Como produzir números «ao acaso» que podem ser reproduzidos de forma idêntica? |

## Empates: o que acontece com a ordem?

Oito alunos são ordenados por nota. Vários têm a mesma nota: o critério (a nota) não diz nada sobre a ordem de **Alice**, **Chloé** e **Emma**, que têm todas 12.

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct { const char *nome; int nota; } aluno;

/* Compara dois alunos só pela nota: duas notas iguais são "iguais" para a ordenação. */
static int por_nota(const void *a, const void *b)
{
    const aluno *x = a, *y = b;
    return (x->nota > y->nota) - (x->nota < y->nota);
}

int main(void)
{
    aluno turma[] = {
        {"Alice", 12}, {"Bruno", 15}, {"Chloé", 12}, {"David", 15},
        {"Emma", 12}, {"Farid", 9}, {"Gaëlle", 15}, {"Hugo", 9},
    };
    int n = sizeof turma / sizeof turma[0];

    qsort(turma, n, sizeof turma[0], por_nota);
    for (int i = 0; i < n; i++)
        printf("%2d  %s\n", turma[i].nota, turma[i].nome);
    return 0;
}
```

Saída:

```
 9  Farid
 9  Hugo
12  Alice
12  Chloé
12  Emma
15  Bruno
15  David
15  Gaëlle
```

Aqui, os alunos empatados ficaram na ordem original (Alice antes de Chloé antes de Emma). Uma ordenação que garante isso é dita **estável** (veja [a ordenação por comparação](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison) para a definição e os algoritmos estáveis). A pergunta importante é: **isso é uma garantia ou um golpe de sorte?**

| Uma ordenação... | O que se tem o direito de esperar para dois elementos iguais |
|---|---|
| **estável** | Eles saem na ordem original, sempre |
| **não estável** | Eles podem sair em qualquer ordem, e essa ordem pode mudar com o tamanho dos dados ou a implementação |

## O `qsort` não promete nada

O `qsort` é a função de ordenação da biblioteca padrão da linguagem [C](/?c=langages-de-programmation&s=c&p=c) (`#include <stdlib.h>`). Ele recebe o array, o número de elementos, o tamanho de um elemento e uma **função de comparação** (um [ponteiro de função](/?c=langages-de-programmation&s=c&p=pointeurs)) que responde «menor», «igual» ou «maior».

| Argumento do `qsort` | Papel |
|---|---|
| `base` | Início do array a ordenar |
| `nmemb` | Número de elementos |
| `size` | Tamanho de um elemento em bytes (`sizeof turma[0]`) |
| `compar` | A função de comparação: negativo se `a` vem antes de `b`, 0 se iguais, positivo caso contrário |

A norma da linguagem C é explícita: se dois elementos são iguais para o `compar`, **a ordem deles no resultado não é especificada** (veja a página de manual [`qsort(3)`](https://man7.org/linux/man-pages/man3/qsort.3.html)). Nada obriga a implementação a ser estável.

O programa a seguir ordena 1.200.000 **índices** (0, 1, 2, ...) a partir de uma chave que tem apenas 1.000 valores possíveis: há empates por toda parte. Em seguida, ele conta, entre os vizinhos de mesma chave, quantos estão fora de ordem (o índice recua). Calcula também uma **impressão digital** ([FNV-1a](https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function)), um número calculado a partir de todo o resultado: duas ordens diferentes quase certamente dão duas impressões digitais diferentes. Compilado com `gcc -Wall -Wextra -O2` (veja [a compilação](/?c=langages-de-programmation&s=c&p=compilation)).

```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/resource.h>

static const int *g_chave;    /* a chave de cada elemento: g_chave[i] */
static int g_desempate;       /* 1: desempatar os iguais pelo índice */

/* Compara dois ÍNDICES i e j pela chave deles; em caso de igualdade, o índice decide, se pedido. */
static int por_chave(const void *a, const void *b)
{
    int i = *(const int *)a, j = *(const int *)b;

    if (g_chave[i] != g_chave[j])
        return g_chave[i] < g_chave[j] ? -1 : 1;
    if (g_desempate)
        return (i > j) - (i < j);
    return 0;
}

/* Tamanho do espaço de memória do processo, em bytes (1º campo de /proc/self/statm, em páginas). */
static size_t tamanho_memoria(void)
{
    unsigned long paginas = 0;
    FILE *f = fopen("/proc/self/statm", "r");

    if (f) {
        if (fscanf(f, "%lu", &paginas) != 1)
            paginas = 0;
        fclose(f);
    }
    return paginas * 4096;
}

int main(int argc, char **argv)
{
    if (argc < 3) {
        fprintf(stderr, "uso: %s n desempate [margem]\n", argv[0]);
        return 1;
    }
    int n = atoi(argv[1]);
    g_desempate = atoi(argv[2]);
    size_t margem = argc > 3 ? strtoull(argv[3], NULL, 10) : 0;
    int *chave = malloc(sizeof(int) * n), *ord = malloc(sizeof(int) * n);
    uint64_t x = 88172645463325252ull;    /* estado de um gerador pseudoaleatório (veja mais adiante) */

    for (int i = 0; i < n; i++) {
        x ^= x << 13; x ^= x >> 7; x ^= x << 17;
        chave[i] = x % 1000;              /* muitos elementos, só 1000 chaves: empates por toda parte */
        ord[i] = i;                       /* ord = os índices 0, 1, 2... que vamos ordenar pela chave */
    }
    g_chave = chave;
    if (margem) {                         /* limita a memória: só autoriza `margem` bytes a mais */
        struct rlimit rl = { tamanho_memoria() + margem, tamanho_memoria() + margem };
        setrlimit(RLIMIT_AS, &rl);
    }
    qsort(ord, n, sizeof(int), por_chave);

    long desordem = 0;
    uint64_t impressao = 1469598103934665603ull;
    for (int i = 0; i + 1 < n; i++)       /* dois vizinhos de mesma chave cujo índice recua: desordem */
        if (chave[ord[i]] == chave[ord[i + 1]] && ord[i] > ord[i + 1])
            desordem++;
    for (int i = 0; i < n; i++) {         /* impressão digital (FNV-1a) da ordem obtida, para comparar duas execuções */
        impressao ^= (uint64_t)ord[i];
        impressao *= 1099511628211ull;
    }
    printf("desempate=%d margem=%-8zu : %7ld iguais fora de ordem, impressão digital %016llx\n",
           g_desempate, margem, desordem, (unsigned long long)impressao);
    return 0;
}
```

O terceiro argumento recorre a `setrlimit(RLIMIT_AS, ...)` ([página de manual](https://man7.org/linux/man-pages/man2/setrlimit.2.html)): ele limita a memória que o programa ainda pode pedir. As execuções, no Ubuntu 24.04 com a glibc 2.39:

```
$ ./estabilidade 200 0
$ ./estabilidade 1200000 0
$ ./estabilidade 1200000 0 5000000
$ ./estabilidade 1200000 0 4000000
$ ./estabilidade 1200000 1
$ ./estabilidade 1200000 1 4000000
```

```
desempate=0 margem=0        :       0 iguais fora de ordem, impressão digital a3b5c48d1a634d39
desempate=0 margem=0        :       0 iguais fora de ordem, impressão digital 361e06153f2ad04f
desempate=0 margem=5000000  :       0 iguais fora de ordem, impressão digital 361e06153f2ad04f
desempate=0 margem=4000000  :  712247 iguais fora de ordem, impressão digital dd7fa0798a809adf
desempate=1 margem=0        :       0 iguais fora de ordem, impressão digital 361e06153f2ad04f
desempate=1 margem=4000000  :       0 iguais fora de ordem, impressão digital 361e06153f2ad04f
```

| Execução | Resultado | O que isso mostra |
|---|---|---|
| 200 elementos, sem desempate | 0 desordem | Em uma entrada pequena, o `qsort` parece estável |
| 1.200.000 elementos, memória livre | 0 desordem | Em uma entrada grande também: a glibc 2.39 ordena aqui por mesclagem |
| memória limitada a 5 MB a mais | 0 desordem, mesma impressão digital | Resta espaço suficiente para o buffer |
| memória limitada a 4 MB a mais | **712.247 iguais fora de ordem**, impressão digital diferente | O **mesmo programa**, os mesmos dados: outra ordem |
| com desempate (último argumento `1`) | 0 desordem, **mesma impressão digital** nos dois casos | A ordem não depende mais da memória |

Por quê? Observado com o `strace` (que lista as chamadas ao sistema operacional): durante a ordenação, o `qsort` reserva um buffer de **4.800.512 bytes**, o tamanho do array (1.200.000 inteiros de 4 bytes), que ele libera logo depois. Uma ordenação por mesclagem precisa desse espaço de trabalho. Quando a memória disponível é menor que o array, o pedido falha e o `qsort` recorre a outra ordenação, sem buffer, que **não é estável** (é o que mede a linha com 712.247 desordens). O resultado depende, portanto, da memória da máquina, e não apenas dos seus dados.

## Desempatar pelo índice original

O remédio não depende de nenhuma implementação: **tornar os elementos todos diferentes**. Ordenam-se índices (ou elementos que carregam o seu número de origem) e, quando duas chaves são iguais, o comparador decide com o índice:

```c
static int por_chave(const void *a, const void *b)
{
    int i = *(const int *)a, j = *(const int *)b;     /* os dois índices comparados */

    if (g_chave[i] != g_chave[j])                     /* chaves diferentes: a chave decide */
        return g_chave[i] < g_chave[j] ? -1 : 1;
    return (i > j) - (i < j);                         /* chaves iguais: o índice original decide */
}
```

| Elemento do código | Papel |
|---|---|
| `const void *a` | O `qsort` não conhece o tipo dos elementos: o comparador recebe endereços sem tipo e precisa convertê-los (`(const int *)a`) |
| `(i > j) - (i < j)` | Devolve -1, 0 ou 1 sem subtração: escrever `i - j` poderia estourar para números grandes |
| `g_chave` | O comparador do `qsort` não tem parâmetro extra: a chave é lida em um array global (com várias [threads](/?c=langages-de-programmation&s=c&p=threads), é preciso uma variável própria de cada thread) |

Depois dessa mudança, dois elementos **nunca são iguais** para o comparador: não há mais caso em que a implementação escolha. O resultado é o mesmo para todas as ordenações, estáveis ou não, e para todas as execuções (como mostram as duas últimas linhas da tabela acima). Isso quase não custa nada: um teste a mais quando as chaves são iguais.

| | Estável porque a implementação o é | Estável porque o construímos |
|---|---|---|
| Garantia | Nenhuma pela norma C | Sim, por construção |
| Depende de | A biblioteca, sua versão, a memória livre | De nada |
| Condição | Nenhuma | Ter um número de origem para comparar (um índice, um contador de chegada) |

## Um caso real: a fila de partida de um solucionador

Um [solucionador SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) que resolve uma grade de 108 × 108 manipula cerca de **1,2 milhão de variáveis**. Na partida, ele as classifica em uma fila ([VMTF](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl): ele tenta as variáveis na ordem dessa fila). Para que cada cópia do solucionador explore de modo diferente, acrescenta-se a cada variável um pequeno **ruído**: um número aleatório minúsculo que perturba a classificação. Esse ruído tem apenas 1.000 valores possíveis para 1,2 milhão de variáveis: cerca de **1.200 variáveis compartilham cada valor**, de modo que cada valor é um empate de 1.200 elementos.

Sem desempate, a ordem desses empates é a que o `qsort` quiser produzir: a fila de partida, e portanto toda a busca que se segue, pode mudar se a máquina ou a memória mudar. Com um desempate por índice crescente, a mesma semente dá **sempre** a mesma fila, e duas versões do programa podem comparar seus contadores linha a linha. O protótipo de pesquisa compara apenas as pontuações e se beneficia da estabilidade da glibc da máquina; uma reescrita deve acrescentar o desempate por índice em vez de confiar nela.

## Um ruído reproduzível: xorshift

Um **gerador pseudoaleatório** é uma fórmula que, a partir de um número de partida (a **semente**), produz uma sequência de números que *parecem* aleatórios mas que é **inteiramente determinada**: a mesma semente devolve exatamente a mesma sequência. É exatamente o que se precisa para um ruído que se quer poder **reproduzir** (reencontrar um resultado, comparar duas versões). O **estado** do gerador é o número que ele guarda na memória entre dois sorteios.

O **xorshift64** ([Marsaglia, 2003](https://www.jstatsoft.org/article/view/v008i14)) é uma versão bem curta: três deslocamentos de bits e três «ou exclusivo» ([operadores binários](/?c=langages-de-programmation&s=c&p=operateurs-binaires)).

```c
#include <stdint.h>
#include <stdio.h>

/* Um passo do xorshift64: mistura os 64 bits do estado por três deslocamentos e três XOR,
   guarda o resultado como novo estado e o devolve. */
static uint64_t xorshift64(uint64_t *estado)
{
    uint64_t x = *estado;

    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    return *estado = x;
}

int main(void)
{
    uint64_t a = 42, b = 42, zero = 0, um = 1, dois = 2;

    printf("mesma semente (42), dois geradores:\n");
    for (int i = 0; i < 3; i++)
        printf("  %20llu  %20llu\n", (unsigned long long)xorshift64(&a), (unsigned long long)xorshift64(&b));

    printf("semente 0:\n");
    for (int i = 0; i < 3; i++)
        printf("  %20llu\n", (unsigned long long)xorshift64(&zero));

    printf("sementes vizinhas 1 e 2, primeiro sorteio:\n");
    printf("  %20llu  %20llu\n", (unsigned long long)xorshift64(&um), (unsigned long long)xorshift64(&dois));

    um = 0x9E3779B97F4A7C15ull * 1;       /* a semente é antes multiplicada por uma constante grande */
    dois = 0x9E3779B97F4A7C15ull * 2;
    printf("as mesmas sementes multiplicadas por 0x9E3779B97F4A7C15:\n");
    printf("  %20llu  %20llu\n", (unsigned long long)xorshift64(&um), (unsigned long long)xorshift64(&dois));
    return 0;
}
```

Saída:

```
mesma semente (42), dois geradores:
           45454805674           45454805674
  11532217803599905471  11532217803599905471
  10021416941527320954  10021416941527320954
semente 0:
                     0
                     0
                     0
sementes vizinhas 1 e 2, primeiro sorteio:
            1082269761            2164539522
as mesmas sementes multiplicadas por 0x9E3779B97F4A7C15:
  15860402102123842989  13274060130538134362
```

| Elemento do código | Papel |
|---|---|
| `uint64_t` | Inteiro sem sinal de 64 bits: o estado tem 2^64 valores possíveis |
| `x ^= x << 13` | Desloca os bits de `x` em 13 posições para a esquerda e depois mistura com o antigo `x` por OU exclusivo (`^`) |
| `return *estado = x` | O novo estado **é** o valor devolvido |
| `0x9E3779B97F4A7C15` | Constante grande (a parte inteira de 2^64 dividido pelo número de ouro) que afasta as sementes vizinhas |

O que a saída mostra:

| Observação | Consequência |
|---|---|
| Dois geradores de mesma semente dão a mesma sequência | O ruído é **reproduzível**: uma semente por processo, e cada execução pode ser reproduzida |
| A semente 0 dá 0, 0, 0... | Zero é um estado **travado**: os deslocamentos de zero são zero. Nunca partir de 0 |
| As sementes 1 e 2 dão 1.082.269.761 e depois 2.164.539.522 | O primeiro sorteio da semente 2 é **exatamente o dobro** do da semente 1: duas sementes vizinhas dão inícios ligados, não independentes |
| Após a multiplicação pela constante | Os primeiros sorteios não têm mais nenhuma relação visível entre si |

Daí a linha da versão do solucionador: `x = 0x9E3779B97F4A7C15 * semente`, depois sorteios. A multiplicação transforma 1, 2, 3... em estados afastados uns dos outros.

### Do número de 64 bits ao ruído de 0 a 999

O programa a seguir sorteia 1.200.000 ruídos `x % 1000` (o **resto** da divisão por 1.000, um número de 0 a 999) e verifica que os 1.000 valores saem aproximadamente com a mesma frequência, com o **teste do χ²** descrito em [Comparar dois ajustes](/?c=qualite-performance-et-outils&s=performance&p=comparer-deux-reglages): para 1.000 valores, um resultado honesto vale cerca de 999, com uma margem de ± 45.

```c
#include <stdint.h>
#include <stdio.h>
#include <string.h>

static uint64_t xorshift64(uint64_t *estado)
{
    uint64_t x = *estado;

    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    return *estado = x;
}

int main(void)
{
    enum { N = 1200000, VALORES = 1000 };
    static int contagem[VALORES];         /* contagem[v]: quantas variáveis receberam o ruído v */

    for (uint64_t semente = 1; semente <= 3; semente++) {
        uint64_t estado = 0x9E3779B97F4A7C15ull * semente;
        double esperado = (double)N / VALORES, chi2 = 0;
        int distintos = 0, maior = 0;

        memset(contagem, 0, sizeof contagem);
        for (int i = 0; i < N; i++)
            contagem[xorshift64(&estado) % VALORES]++;     /* o ruído: um número de 0 a 999 */
        for (int v = 0; v < VALORES; v++) {
            distintos += contagem[v] > 0;
            if (contagem[v] > maior)
                maior = contagem[v];
            chi2 += (contagem[v] - esperado) * (contagem[v] - esperado) / esperado;
        }
        printf("semente %llu : %d valores distintos, maior grupo %d, chi2 = %.1f\n",
               (unsigned long long)semente, distintos, maior, chi2);
    }
    printf("2^64 mod 1000 = %llu\n", (unsigned long long)((UINT64_MAX % VALORES + 1) % VALORES));
    return 0;
}
```

Saída:

```
semente 1 : 1000 valores distintos, maior grupo 1304, chi2 = 942.1
semente 2 : 1000 valores distintos, maior grupo 1323, chi2 = 1044.4
semente 3 : 1000 valores distintos, maior grupo 1319, chi2 = 1052.4
2^64 mod 1000 = 616
```

| Medida | Valor | Leitura |
|---|---|---|
| Valores distintos | 1.000 de 1.000 | Todos os valores saem |
| Maior grupo | 1.304 a 1.323, para uma média de 1.200 | É de fato a ordem de grandeza de **1.200 empates por valor** |
| χ² | 942 a 1.052 (esperado 999 ± 45) | Os desvios são os do acaso: o resto da divisão por 1.000 é uniforme na prática |
| 2^64 mod 1000 | 616 | Esses 616 valores saem uma vez a mais que os outros em cerca de 1,8 × 10^16 sorteios possíveis: um viés da ordem de 10^-16, sem efeito |

> **Limite:** o xorshift **não** é feito para segurança (o valor devolvido é o próprio estado: um único sorteio conhecido permite prever todos os seguintes) nem para simulações estatísticas exigentes. Para um ruído que perturba uma classificação ou diversifica cópias de um programa, ele basta de sobra. O `rand()` da biblioteca C também faria um ruído, mas a norma não fixa o seu algoritmo: a sequência para uma dada semente pode mudar de uma biblioteca para outra.

## As armadilhas

| Armadilha | O que acontece | Remédio |
|---|---|---|
| Contar com a estabilidade do `qsort` | Funciona enquanto a memória basta (glibc 2.39), e depois a ordem dos iguais muda sem erro nem mensagem | Desempatar pelo índice original no comparador |
| Testar a estabilidade em uma entrada pequena | 200 elementos parecem estáveis: o teste não diz nada sobre o caso de 1,2 milhão | Testar no tamanho real, e com a memória limitada |
| Comparador `return a - b` | Estoura para números grandes: ordem errada sem mensagem | `(a > b) - (a < b)` |
| Semente 0 com xorshift | A sequência continua em 0 para sempre | Multiplicar a semente por uma constante ímpar e recusar 0 |
| Sementes vizinhas não misturadas | Inícios de sequência ligados (o dobro um do outro) | Multiplicar a semente por `0x9E3779B97F4A7C15` |
| Usar xorshift para um segredo | Um sorteio conhecido dá todos os seguintes | Um gerador criptográfico ([`getrandom`](https://man7.org/linux/man-pages/man2/getrandom.2.html)) |
| Concluir sobre o ruído sem testá-lo | Um gerador ou um `% n` mal escolhido pode desequilibrar os valores | Verificar a uniformidade por um teste do χ² |

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Uma ordenação é **estável** se mantém a ordem de chegada dos elementos iguais. O `qsort` não o garante (norma C): a glibc 2.39 ordena por mesclagem enquanto um buffer do tamanho do array estiver disponível e depois passa para uma ordenação não estável (712.247 iguais fora de ordem em 1,2 milhão de elementos com a memória limitada). Um comparador que desempata pelo índice original dá o mesmo resultado com todas as ordenações. O xorshift64 (três deslocamentos, três XOR) produz um ruído reproduzível por semente. |
| **Ferramentas utilizáveis** | O `qsort` com um comparador de desempate por índice, uma impressão digital (FNV-1a) para comparar duas ordens, `setrlimit(RLIMIT_AS)` para testar com memória limitada, o `strace` para observar o buffer do `qsort`, o xorshift64 com semente multiplicada por `0x9E3779B97F4A7C15`, o teste do χ² para verificar a uniformidade. |
| **Armadilhas a evitar** | Confiar na estabilidade observada de um `qsort`, testá-la em uma entrada pequena, um comparador por subtração, a semente 0, sementes vizinhas não misturadas, o xorshift para um segredo. |
| **Boas práticas** | Nunca deixar o resultado depender da maneira como uma ordenação trata os empates: desempatar explicitamente. Uma semente por execução, exibida ou fixada, para poder reproduzir. Verificar no tamanho real. |
