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

## Ler uma quantidade de dados desconhecida: o buffer com duplicação

Um **buffer** (*tampão*) é uma área de memória que recebe dados enquanto eles são processados. Para ler um arquivo cujo tamanho se ignora, é preciso aumentá-lo conforme a leitura avança. Duas estratégias se opõem, e a diferença de tempo é enorme (veja o capítulo sobre [a complexidade e a notação Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o) para a notação `O(n)`, `O(n²)` usada abaixo):

| | Aumentar a cada linha lida | Duplicar quando o buffer está cheio |
|---|---|---|
| Princípio | `realloc()` de uma linha a mais a cada volta | `realloc()` do **dobro** da capacidade, só quando ela é atingida |
| Bytes copiados no total (n = tamanho do arquivo) | 1 + 2 + 3 + … + n, ou seja, cerca de n²/2: **quadrático**, `O(n²)` | 1 + 2 + 4 + … + n, ou seja, menos de 2n: **linear**, `O(n)` |
| Medido em um arquivo de 2,8 MB | 51 s | 0,06 s |

Diz-se que a duplicação é **O(n) amortizado**: um aumento isolado é caro, mas é raro, e seu custo repartido entre todos os bytes lidos permanece constante por byte.

```c
#include <stdint.h>                          // SIZE_MAX: o maior valor de um size_t
#include <stdio.h>
#include <stdlib.h>

// Lê todo o fluxo f; devolve um texto terminado em '\0' (a liberar com free), NULL se falhar
char *ler_tudo(FILE *f)
{
    size_t capacidade = 4096;                // bytes reservados
    size_t tamanho = 0;                      // bytes já lidos
    char *buffer = malloc(capacidade);
    if (!buffer)
        return NULL;
    for (;;) {
        if (tamanho + 1 == capacidade) {     // cheio (1 byte guardado para o '\0'): duplicar
            if (capacidade > SIZE_MAX / 2) { // capacidade * 2 estouraria um size_t
                free(buffer);
                return NULL;
            }
            char *novo = realloc(buffer, capacidade * 2);
            if (!novo) {                     // falha: o bloco antigo continua válido, libera-se
                free(buffer);
                return NULL;
            }
            buffer = novo;
            capacidade *= 2;
        }
        // fread lê até N bytes do fluxo e devolve quantos leu de fato
        size_t lidos = fread(buffer + tamanho, 1, capacidade - tamanho - 1, f);
        if (lidos == 0)
            break;                           // fim do arquivo ou erro de leitura
        tamanho += lidos;
    }
    if (ferror(f)) {                         // ferror: verdadeiro se a leitura falhou
        free(buffer);
        return NULL;
    }
    buffer[tamanho] = '\0';
    return buffer;
}
```

Para ler linha por linha em vez de por blocos, veja a [leitura de arquivos](/?c=langages-de-programmation&s=c&p=lecture-de-fichiers).

### Três armadilhas de desempenho e de leitura de memória

| Armadilha | Por quê | Correção |
|---|---|---|
| `realloc()` não zera a área nova | Os bytes acrescentados contêm restos do uso anterior dessa memória, não zeros (como `malloc()`) | `memset(novo + tamanho_antigo, 0, acrescimo)` logo após um `realloc()` bem-sucedido, ou nunca ler esses bytes antes de escrevê-los |
| `strlen()` na condição de um laço | `strlen()` conta os caracteres percorrendo o texto até o `'\0'`: chamada a cada volta, faz n voltas de n comparações, um `O(n²)` escondido | Calcular o comprimento **uma só vez** antes do laço |
| Copiar «no máximo n caracteres» percorrendo todo o texto | Um `strndup` que começa por `strlen(s)` lê 2 MB para copiar só 10; repetido a cada linha, volta a ser quadrático | `strnlen(s, n)` (POSIX, a norma dos sistemas tipo Unix) para após `n` bytes |

```c
// Armadilha: strlen() relê todo o texto a cada volta
for (size_t i = 0; i < strlen(s); i++)
    processar(s[i]);

// Correto: comprimento calculado uma só vez
size_t comprimento = strlen(s);
for (size_t i = 0; i < comprimento; i++)
    processar(s[i]);

// Cópia de no máximo n caracteres, sem ler o resto do texto
char *dup_limitada(const char *s, size_t n)
{
    size_t len = strnlen(s, n);              // para após n bytes, mesmo sem '\0'
    char *copia = malloc(len + 1);
    if (!copia)
        return NULL;
    memcpy(copia, s, len);
    copia[len] = '\0';
    return copia;
}
```

> **Medir em vez de adivinhar:** para saber se um código é quadrático, dobre o tamanho da entrada. Se o tempo é multiplicado por 2, ele é linear; se é multiplicado por 4, é quadrático. Faça essa medição com a versão compilada normalmente com as otimizações do compilador (a opção `-O2`), nunca com um executável instrumentado por uma ferramenta de detecção de erros de memória, que altera os tempos.

## Liberar a memória: `free()`

Cada `malloc()`/`calloc()`/`realloc()` bem-sucedido deve corresponder a exatamente um `free()`, quando o bloco não é mais útil:

```c
int *p = malloc(sizeof(int));
*p = 42;
free(p);
// p ainda contém o endereço antigo ("dangling pointer"): não deve mais ser usado
p = NULL; // boa prática: impede um uso acidental após a liberação
```

## Um vetor de strings: terminá-lo antes de preenchê-lo

Um vetor de strings (`char **`) é um vetor de ponteiros, cada um apontando para uma string alocada com `malloc`. Por convenção, ele termina com um ponteiro `NULL`, como o vetor `argv` de [`main`](/?c=langages&s=c&p=argc-et-argv): uma função `free_array` o libera percorrendo as células **até o primeiro `NULL`**. O exemplo a seguir divide um texto em palavras (como a função `split` de um exercício clássico):

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void	set_fail_at(long k);

/* Libera um vetor de strings terminado em NULL: cada string, depois o vetor. */
static void	free_array(char **tab)
{
	if (!tab)
		return ;
	for (size_t i = 0; tab[i]; i++)
		free(tab[i]);
	free(tab);
}

/* Número de palavras (sequências de caracteres diferentes de espaço) de s. */
static size_t	count_words(const char *s)
{
	size_t	n = 0;

	while (*s)
	{
		while (*s == ' ')
			s++;
		if (*s)
			n++;
		while (*s && *s != ' ')
			s++;
	}
	return (n);
}

/* Copia a próxima palavra de *s em um bloco novo e avança *s depois dela. */
static char	*copy_word(const char **s)
{
	size_t	len;
	char	*word;

	while (**s == ' ')
		(*s)++;
	len = strcspn(*s, " ");
	word = malloc(len + 1);
	if (!word)
		return (NULL);
	memcpy(word, *s, len);
	word[len] = '\0';
	*s += len;
	return (word);
}

char	**split_words(const char *s)
{
	size_t	n = count_words(s);
#ifdef FIXED
	char	**tab = calloc(n + 1, sizeof *tab);     /* todas as células em NULL */
#else
	char	**tab = malloc((n + 1) * sizeof *tab);  /* células não inicializadas */
#endif

	if (!tab)
		return (NULL);
	for (size_t i = 0; i < n; i++)
	{
		char	*word = copy_word(&s);

		if (!word)
		{
			free_array(tab);                        /* percorre até o primeiro NULL */
			return (NULL);
		}
		tab[i] = word;                              /* a célula i só é escrita aqui */
	}
#ifndef FIXED
	tab[n] = NULL;                                  /* terminador colocado só no fim */
#endif
	return (tab);
}

int	main(void)
{
	char	**tab;
	long	k;

	setvbuf(stdout, NULL, _IONBF, 0);
	for (k = 1; k <= 10; k++)
	{
		set_fail_at(k);
		tab = split_words("um dois três");
		if (tab)
			break ;
		printf("k=%ld: falha tratada\n", k);
	}
	set_fail_at(-1);
	printf("k=%ld: %s %s %s\n", k, tab[0], tab[1], tab[2]);
	free_array(tab);
	return (0);
}
```

O defeito está em `split_words`. O `malloc` não zera nada: as células do vetor contêm o que a memória continha antes. Quando a cópia de uma palavra falha, a célula `tab[i]` ainda não foi escrita (`tab[i] = word` vem depois do teste), e `free_array`, que para no primeiro `NULL`, **lê essa célula não inicializada**: se ela não valer `NULL` por acaso, `free` recebe um endereço aleatório.

Para executar esse caminho de falha, faz-se a alocação de número k falhar com `--wrap` (veja [Sanitizers e testes de alocação](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation#injetar-falhas-de-alocacao)). Aqui o `calloc` também é redirecionado, porque a correção o usa:

```c
#include <stdlib.h>

void	*__real_malloc(size_t size);
void	*__real_calloc(size_t n, size_t size);

static long	g_calls;                            /* chamadas a malloc ou calloc desde o início */
static long	g_fail_at = -1;                     /* número da chamada a fazer falhar (-1: nenhuma) */

void	set_fail_at(long k)
{
	g_calls = 0;
	g_fail_at = k;
}

void	*__wrap_malloc(size_t size)
{
	if (++g_calls == g_fail_at)
		return (NULL);
	return (__real_malloc(size));
}

void	*__wrap_calloc(size_t n, size_t size)
{
	if (++g_calls == g_fail_at)
		return (NULL);
	return (__real_calloc(n, size));
}
```

```bash
gcc -g -fsanitize=address -Wl,--wrap=malloc -Wl,--wrap=calloc split.c wrap.c -o split_asan        # versão com defeito
gcc -g -Wl,--wrap=malloc -Wl,--wrap=calloc split.c wrap.c -o split_plain
gcc -g -fsanitize=address -Wl,--wrap=malloc -Wl,--wrap=calloc -DFIXED split.c wrap.c -o fixed_asan # versão corrigida
valgrind -q ./split_plain
```

Medido (`gcc` 12.4):

| Execução | Versão com defeito | Versão corrigida (`-DFIXED`) |
|---|---|---|
| Sem ferramenta | **nenhum sintoma**: de `k=1` a `k=4: falha tratada`, depois `k=5: um dois três`, código 0 | idêntico |
| ASan | `k=1: falha tratada`, depois `ERROR: AddressSanitizer: SEGV on unknown address`: `free_array` (linha 13), chamada por `split_words` (linha 69), lê um endereço alto | de `k=1` a `k=4: falha tratada`, `k=5: um dois três`, código 0 |
| valgrind | `Conditional jump or move depends on uninitialised value(s)` em `free_array` (linha 12) | nenhum relatório |

Sem ferramenta, a versão com defeito parece correta: o heap é novo, portanto zerado aqui, e a leitura não inicializada cai em `NULL` por sorte. Em um heap em que a memória já foi usada, a célula contém um endereço antigo. O ASan preenche a memória nova com um padrão diferente de zero, o que transforma a sorte em uma falha reproduzível.

Duas correções, nenhuma relacionada à quantidade de memória:

| Correção | Princípio | Medido |
|---|---|---|
| `calloc((n + 1), sizeof *tab)` no lugar de `malloc` | Todas as células valem `NULL` no início: `free_array` para na primeira célula não preenchida | Código 0 sob ASan, nenhum relatório sob valgrind |
| Escrever a célula antes de testá-la: `tab[i] = copy_word(&s); if (!tab[i]) ...` | A célula da falha vale `NULL` (o resultado de `malloc`), as anteriores são strings válidas | Mesmo banco: nenhum relatório sob ASan, valgrind e sem ferramenta |

O princípio geral: **a todo momento, toda célula que a limpeza possa ler deve ser ou uma string válida ou `NULL`**. Outra forma de obtê-lo é não usar sentinela e passar à limpeza o número de células já preenchidas (`free_n(tab, i)`), ao preço de um parâmetro a mais.

> **Armadilha:** colocar o terminador `tab[n] = NULL` somente **depois** do laço de preenchimento: ele protege a varredura de um vetor completo, não a de um vetor interrompido.
>
> **Armadilha:** esquecer o `+ 1` da célula do `NULL` final (`malloc(n * sizeof *tab)`): o terminador é escrito uma célula depois do fim do bloco, um [estouro de buffer](/?c=langages&s=c&p=memoire#os-quatro-bugs-de-memoria-classicos).
>
> **Boa prática:** alocar um vetor de ponteiros com `calloc`, para que um vetor interrompido possa ser liberado sem caso particular.

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

A função [`memcpy()`](#copiar-e-preencher-bytes-memcpy-e-memset) copia os `n` inteiros de uma só vez na arena.

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

> **Nota:** esses bugs nem sempre provocam um crash imediato e visível: é isso que os torna difíceis de detectar. Uma ferramenta como o [**Valgrind**](https://valgrind.org) (`valgrind ./meu_programa`) executa o programa e relata precisamente os vazamentos de memória e os acessos inválidos, com a linha de código responsável. Os sanitizers de compilação (`-fsanitize=address`) fazem o mesmo: veja [Sanitizers e testes de alocação](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation).

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
| **Armadilhas a evitar** | Vazamento de memória (nunca um `free`), use-after-free, double free, estouro de buffer, estouro de pilha em um VLA grande demais (sem detecção possível, diferente de `malloc`), confundir `T (*)[n]` (VLA como parâmetro) com `T **`, aumentar um buffer um elemento por vez (quadrático), `strlen()` na condição de um laço, ler bytes de `realloc()` nunca escritos, limpar um vetor de strings interrompido cujas células não foram inicializadas. |
| **Boas práticas** | Sempre verificar se um `malloc`/`realloc` não retornou `NULL`; colocar um ponteiro em `NULL` logo após seu `free()`; preferir `fgets`/`strncpy`/`snprintf` às funções sem limite (`gets`/`strcpy`/`sprintf`); `strlcpy`/`strlcat` para detectar um truncamento pelo valor de retorno; alocar um vetor de ponteiros com `calloc`. |
