---
order: 9
---

# O gerenciamento de memória

Ao contrário de linguagens como [PHP](/?c=langages-de-programmation&s=php&p=php) ou [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), que gerenciam automaticamente a memória via um coletor de lixo (*garbage collector*), o C deixa ao desenvolvedor a responsabilidade completa de alocar e liberar a memória de que seu programa precisa. É isso que permite performances elevadas e um controle fino dos recursos, ao preço de uma vigilância constante.

## Stack (pilha) e Heap (monte)

Um programa C dispõe de duas zonas de memória principais para seus dados:

| | Stack | Heap |
|---|---|---|
| Gerenciamento | Automático (variáveis locais) | Manual (`malloc`/`free`) |
| Tempo de vida | O tempo do bloco/da função atual | Até o `free()` explícito |
| Tamanho | Limitado, fixado no início do programa | Limitado pela RAM/swap disponível |
| Velocidade | Muito rápida (simples deslocamento de um ponteiro) | Mais lenta (busca por um espaço livre) |

```c
void exemplo(void)
{
    int x = 5;                     // na stack, liberado automaticamente ao fim da função
    int *p = malloc(sizeof(int));  // no heap, permanece alocado até free(p)
    *p = 5;
    free(p);
}
```

## Arrays de tamanho variável (VLA)

Um VLA (*Variable-Length Array*, array de tamanho variável, [C99](https://en.wikipedia.org/wiki/C99)) é um array declarado como uma variável local comum (`int tab[n];`), mas cujo tamanho `n` é uma expressão conhecida somente em tempo de execução, não uma constante fixada na compilação. Diferente de `malloc()` (veja mais abaixo), ele fica na stack: sem `free()` necessário, sua memória é liberada automaticamente ao final do bloco que o contém.

```c
void exemplo(int n)
{
    int tab[n]; // tamanho decidido no momento da chamada, não na compilação

    for (int i = 0; i < n; i++)
        tab[i] = i;
} // tab desaparece aqui, como qualquer variável local -- nenhum free() necessário
```

### Armadilha 1: a ordem dos parâmetros

Quando um VLA é um parâmetro de função, seu tamanho (`n`) deve ser declarado **antes** dele na lista de parâmetros:

```c
void construir(int n, int tab[n]); // correto: n já existe quando tab é declarado
void construir(int tab[n], int n); // erro de compilação: n desconhecido neste ponto
```

O compilador lê os parâmetros da esquerda para a direita: no momento em que precisa calcular o tamanho de `tab`, `n` já deve ter sido visto.

### Armadilha 2: `T (*)[n]` não é `T **`

Um VLA de duas dimensões passado como parâmetro, como `uint16_t mask[n][n]`, **não** se converte em um simples ponteiro para ponteiro (`uint16_t **`). Ele se converte em um ponteiro para um array de `n` elementos: `uint16_t (*)[n]`.

| | `T (*)[n]` (VLA como parâmetro) | `T **` (array de ponteiros) |
|---|---|---|
| Memória | Um único bloco contíguo de `n * n` elementos | `n` blocos separados, cada um alocado independentemente |
| Declaração | `void f(int n, T tab[n][n])` | `void f(T **tab)` |
| Acesso `tab[i][j]` | Cálculo de deslocamento dentro do bloco único | Desreferenciar `tab[i]`, depois acessar dentro do seu próprio bloco |

Confundir os dois tipos gera um erro de compilação explícito (`conflicting types`, ou `makes pointer from integer without a cast`): o compilador recusa passar um `T **` onde um `T (*)[n]` é esperado, e vice-versa.

### Outros limites a conhecer

| Limite | Detalhe |
|---|---|
| Sem verificação de falha | Diferente de `malloc()` (veja mais abaixo), um VLA grande demais não retorna `NULL`: causa um estouro de pilha, comportamento indefinido, sem aviso |
| Tamanho fixo após a declaração | Diferente de `realloc()` (veja mais abaixo), um VLA não pode ser redimensionado depois de declarado |
| Disponibilidade | Tornada opcional pelo [C11](https://en.wikipedia.org/wiki/C11_(C_standard_revision)): um compilador estritamente conforme pode se recusar a suportá-los (verificar a macro `__STDC_NO_VLA__`) |

Veja também [Os ponteiros](/?c=langages-de-programmation&s=c&p=pointeurs), cuja compreensão é pré-requisito para este capítulo.

## Alocar memória dinamicamente

`malloc()` reserva um bloco de memória bruto no heap, cujo tamanho é expresso em bytes:

```c
int *array = malloc(5 * sizeof(int)); // reserva o espaço para 5 inteiros

if (array == NULL) {
    // malloc falhou (memória insuficiente) -> array vale NULL, sempre verificar
    return;
}

for (int i = 0; i < 5; i++) {
    array[i] = i * 10;
}
```

> **Nota:** `malloc()` não **reinicializa** a memória alocada: ela pode conter qualquer valor residual ("garbage"). `calloc(numero, tamanho)` faz a mesma coisa que `malloc(numero * tamanho)`, mas além disso coloca todos os bytes em zero.

```c
int *array = calloc(5, sizeof(int)); // 5 inteiros, todos inicializados em 0
```

## Redimensionar um bloco: `realloc()`

```c
int *array = malloc(3 * sizeof(int));
// ... precisa-se de mais espaço ...
int *novoArray = realloc(array, 6 * sizeof(int));

if (novoArray == NULL) {
    // realloc falhou: o bloco antigo "array" ainda é válido, não perde-lo
    free(array);
    return;
}
array = novoArray; // o bloco pode ter sido deslocado para outro lugar na memória
```

`realloc()` preserva o conteúdo existente (truncado se o novo tamanho for menor), mas pode deslocar o bloco na memória se necessário: é por isso que nunca se reatribui `array` diretamente antes de verificar que `realloc()` não retornou `NULL`.

## Liberar a memória: `free()`

Cada `malloc()`/`calloc()`/`realloc()` bem-sucedido deve corresponder a exatamente um `free()`, quando o bloco não é mais útil:

```c
int *p = malloc(sizeof(int));
*p = 42;
free(p);
// p ainda contém o endereço antigo ("dangling pointer"): não deve mais ser usado
p = NULL; // boa prática: impede um uso acidental após a liberação
```

## Muitos objetos pequenos: a alocação em arena

Chamar `malloc()` para cada um de milhões de objetos pequenos custa caro: cada chamada leva tempo, e os objetos acabam espalhados na memória. Uma **arena** guarda todos esses objetos **em sequência em um único array grande**, que cresce dobrando com `realloc()`, e cada objeto é designado pela sua **posição** nesse array.

```c
#include <stdlib.h>
#include <string.h>

typedef struct {
    int    *dados;                           // um único array grande para tudo
    size_t  tamanho;                         // casas usadas
    size_t  capacidade;                      // casas reservadas
} t_arena;

// Guarda n inteiros em sequência na arena; devolve a posição deles, ou (size_t)-1 se falhar
size_t arena_adicionar(t_arena *a, const int *valores, size_t n)
{
    size_t capacidade = a->capacidade ? a->capacidade : 1024;
    while (a->tamanho + n > capacidade)
        capacidade *= 2;                     // dobrar: poucos realloc no total
    if (capacidade != a->capacidade) {
        int *novo = realloc(a->dados, capacidade * sizeof(int));
        if (!novo)
            return (size_t)-1;               // falha: a arena fica intacta
        a->dados = novo;
        a->capacidade = capacidade;
    }
    memcpy(a->dados + a->tamanho, valores, n * sizeof(int));
    a->tamanho += n;
    return a->tamanho - n;                   // uma posição, não um ponteiro
}
```

| | Um `malloc()` por objeto | Arena |
|---|---|---|
| Número de alocações | Uma por objeto | Um punhado (o array dobra de tamanho) |
| Localização na memória | Espalhada | Contígua: o processador lê os objetos vizinhos de uma vez |
| Liberação | Um `free()` por objeto | Um único `free()` para tudo |
| Remover um objeto | `free()` | Deixa um buraco: é preciso **compactar** por conta própria (deslocar tudo) |

> **Armadilha:** guarda-se uma **posição** e não um ponteiro, porque `realloc()` pode mover o array inteiro para outro lugar da memória: um ponteiro para o local antigo ficaria inválido (ver [Redimensionar um bloco](#redimensionar-um-bloco-realloc)), enquanto uma posição continua certa.

## Os quatro bugs de memória clássicos

| Bug | Causa | Consequência |
|---|---|---|
| **Vazamento de memória** (*memory leak*) | Um bloco `malloc`ado nunca é `free()`ado | A memória usada pelo programa aumenta sem nunca diminuir |
| **Use-after-free** | O programa desreferencia um ponteiro após seu `free()` | Comportamento indefinido: dado corrompido, crash, ou pior, silenciosamente "funciona" |
| **Double free** | `free()` chamado duas vezes no mesmo ponteiro | Corrupção do gerenciador de memória, crash frequentemente adiado e difícil de rastrear |
| **Estouro de buffer** (*buffer overflow*) | Escrita além do tamanho realmente alocado de um buffer | Corrupção de memória adjacente, e uma porta aberta para a execução de código arbitrário (veja abaixo) |

```c
int *p = malloc(sizeof(int));
free(p);
free(p); // double free: comportamento indefinido
```

> **Nota:** esses bugs nem sempre provocam um crash imediato e visível: é isso que os torna difíceis de detectar. Uma ferramenta como o [**Valgrind**](https://valgrind.org) (`valgrind ./meu_programa`) executa o programa e relata precisamente os vazamentos de memória e os acessos inválidos, com a linha de código responsável.

## O estouro de buffer (*buffer overflow*), um bug com consequências de segurança

Ao contrário dos três bugs anteriores (que corrompem a memória do próprio programa, sem intenção externa), um estouro de buffer é frequentemente **o resultado de uma entrada controlada por um atacante**: o que faz dele historicamente uma das falhas de segurança mais exploradas em C/[C++](/?c=langages-de-programmation&s=cpp&p=cpp).

```c
char buffer[16];
strcpy(buffer, entrada_usuario); // NENHUMA verificação do tamanho de entrada_usuário
```

Se `entrada_usuario` ultrapassar 16 bytes, `strcpy()` continua escrevendo além dos limites de `buffer`, na memória que segue imediatamente na pilha, que pode conter outras variáveis locais, ou o **endereço de retorno** da função atual (o local onde o programa deve retomar sua execução após o `return`). Um atacante que controla precisamente o conteúdo escrito pode, no pior caso, substituir esse endereço de retorno pelo endereço de sua escolha, desviando o fluxo de execução do programa para um código sob seu controle (*stack smashing*).

> **Nota:** é o mesmo princípio de uma [injeção SQL](/?c=langages-de-programmation&s=php&p=securite) ou de uma [injeção de comando Bash](/?c=shells&s=bash&p=variables): uma entrada não controlada que modifica a **estrutura** do que vai ser executado, em vez de permanecer um dado passivo.

### Se proteger disso

```c
strcpy(buffer, entrada);                       // perigoso: nenhum limite
strncpy(buffer, entrada, sizeof(buffer) - 1);  // limitado ao tamanho real do buffer
// strncpy não garante a terminação se a origem for muito longa
buffer[sizeof(buffer) - 1] = '\0';

// leitura limitada já na captura, em vez de corrigir depois
fgets(buffer, sizeof(buffer), stdin);
```

| Função arriscada | Alternativa limitada |
|---|---|
| `strcpy()` | `strncpy()` (atenção à terminação, cf. acima) |
| `strcat()` | `strncat()` |
| `sprintf()` | `snprintf()` (trunca em vez de estourar) |
| `gets()` | `fgets()` (`gets()` aliás foi removido do padrão C desde o [C11](https://en.wikipedia.org/wiki/C11_(C_standard_revision)), precisamente por esse motivo) |

> **Nota:** limitar o tamanho só resolve metade do problema: também é preciso verificar que o dado truncado permanece coerente para o resto do programa (um nome de arquivo cortado no meio por `strncpy` continua sendo um nome de arquivo sintaticamente válido, apenas incorreto). O reflexo correto continua sendo sempre conhecer, a cada escrita, o tamanho real do buffer de destino; nunca supor que uma entrada respeitará um tamanho esperado sem verificá-lo.

### A família BSD `strlcpy`/`strlcat`

De origem BSD (nao e padrao C, mas disponivel em macOS/\*BSD, e facil de reimplementar, como faz a biblioteca `libft` com `ft_strlcpy`/`ft_strlcat`), essas funções corrigem o ponto fraco de `strncpy`/`strcat`: detectar um truncamento.

```c
// SEMPRE termina com '\0', ao contrário de strncpy
size_t necessario = strlcpy(buffer, entrada, sizeof(buffer));

if (necessario >= sizeof(buffer))
{
    // entrada foi truncada: necessário é o tamanho que a cópia completa teria
}
```

`strlcpy()`/`strlcat()` sempre retornam o tamanho que a string de origem (ou concatenada) teria se o buffer fosse grande o suficiente, nunca o número de bytes realmente escritos: comparar esse valor com `sizeof(buffer)` detecta um truncamento, algo que `strncpy()`/`strcat()` não permitem fazer diretamente.

## `sizeof`

`sizeof` não é uma função, mas um operador avaliado na compilação: ele retorna o tamanho em bytes de um tipo ou de uma variável, indispensável para calcular corretamente o tamanho a alocar:

```c
sizeof(int);       // geralmente 4
sizeof(char);      // sempre 1, por definição do padrão C
sizeof(int) * 10;  // tamanho necessário para 10 inteiros -> a passar para malloc()
```

Veja também [Os ponteiros](/?c=langages-de-programmation&s=c&p=pointeurs), cuja compreensão é um pré-requisito para este capítulo.

## Copiar e preencher bytes: `memcpy()` e `memset()`

Essas duas funções de `<string.h>` trabalham com **bytes brutos**, sem conhecer o tipo dos dados:

```c
#include <stdint.h>
#include <stdio.h>
#include <string.h>

int main(void)
{
    int tab[5];
    memset(tab, 0, sizeof tab);              // põe os 20 bytes em 0: 5 inteiros em 0
    int copia[5];
    memcpy(copia, tab, sizeof tab);          // copia os 20 bytes de tab para copia
    memset(tab, 1, sizeof tab);              // armadilha: cada BYTE vale 1
    printf("%d\n", tab[0]);                  // 16843009 (0x01010101), não 1

    float f = 1.0f;
    uint32_t bits;
    memcpy(&bits, &f, sizeof bits);          // lê os 4 bytes do float como estão
    printf("%08X\n", bits);                  // 3F800000: a codificação de 1.0 na memória
    return 0;
}
```

| Função | Papel | Armadilha |
|---|---|---|
| `memset(p, v, n)` | Põe cada um dos n bytes no valor `v` | `v` preenche **bytes**, não inteiros: só 0 (e -1) dão o mesmo valor em um `int` |
| `memcpy(dst, src, n)` | Copia n bytes de `src` para `dst` | Áreas que se sobrepõem: comportamento indefinido, usar `memmove()` |

O último uso, ler os bits de um `float` como um inteiro (*type punning*), tem uma versão tentadora mas **proibida**: `*(uint32_t *)&f`. Acessar um objeto por um ponteiro de outro tipo viola a regra de **aliasing estrito** do C (comportamento indefinido, que o otimizador pode explorar). `memcpy()` é a forma segura, e o compilador a substitui por um simples movimento de 4 bytes.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O C deixa ao desenvolvedor a responsabilidade completa da memória dinâmica (heap): `malloc`/`calloc`/`realloc` para alocar, `free` para liberar; a stack (variáveis locais, VLA incluídos) é gerenciada automaticamente. |
| **Ferramentas utilizáveis** | `malloc`/`calloc`/`realloc`/`free`, `sizeof`, VLA (`int tab[n]`) para um array de tamanho dinâmico sem `free()`, Valgrind para detectar vazamentos e acessos inválidos; `memcpy`/`memset` para copiar ou preencher bytes; uma arena para muitíssimos objetos pequenos. |
| **Armadilhas a evitar** | Vazamento de memória (nunca um `free`), use-after-free, double free, estouro de buffer, estouro de pilha em um VLA grande demais (sem detecção possível, diferente de `malloc`), confundir `T (*)[n]` (VLA como parâmetro) com `T **`. |
| **Boas práticas** | Sempre verificar se um `malloc`/`realloc` não retornou `NULL`; colocar um ponteiro em `NULL` logo após seu `free()`; preferir `fgets`/`strncpy`/`snprintf` às funções sem limite (`gets`/`strcpy`/`sprintf`); `strlcpy`/`strlcat` para detectar um truncamento pelo valor de retorno. |
