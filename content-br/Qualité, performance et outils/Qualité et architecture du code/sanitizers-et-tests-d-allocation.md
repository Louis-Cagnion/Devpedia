---
order: 11
---

# Sanitizers e testes de alocação

Um bug de memória em C quase nunca derruba o programa no lugar do erro: ele corrompe uma célula vizinha, e o estrago só aparece mais tarde, ou nunca. Este capítulo apresenta as ferramentas que tornam esses bugs visíveis (os **sanitizers** e o [**valgrind**](https://valgrind.org)), a técnica que **faz o `malloc` falhar de propósito** para testar caminhos que nunca são percorridos, e depois os cuidados para que **a própria ferramenta de teste** não se engane: um teste que acusa um código correto (um **falso positivo**) faz perder tanto tempo quanto um bug.

Os bugs de memória em si (estouro, uso após `free`, vazamento) são descritos em [os quatro bugs de memória clássicos](/?c=langages&s=c&p=memoire#os-quatro-bugs-de-memoria-classicos); o capítulo [As ferramentas de fuzzing](/?c=securite&s=securite-offensive&p=outils-de-fuzzing) mostra seu uso na segurança.

## Os sanitizers: o que eles verificam

Um **sanitizer** (*higienizador*) é uma opção de compilação que acrescenta ao programa verificações executadas enquanto ele roda, e que o interrompe com um relatório preciso assim que um erro é constatado. Três são úteis no dia a dia com [`gcc` e `clang`](/?c=langages&s=c&p=compilation):

| Sanitizer | Opção | O que detecta |
|---|---|---|
| **ASan** ([AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html)) | `-fsanitize=address` | Leitura ou escrita fora de um bloco alocado, uso de um bloco após `free` |
| **LSan** ([LeakSanitizer](https://clang.llvm.org/docs/LeakSanitizer.html)) | incluído no ASan no Linux | Vazamento: bloco nunca liberado ao fim do programa |
| **UBSan** ([UndefinedBehaviorSanitizer](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html)) | `-fsanitize=undefined` | Comportamento indefinido: uma operação que a linguagem não define, como um estouro de inteiro com sinal (um `int` que ultrapassa seu valor máximo, 2 147 483 647) |

Um programa de demonstração com quatro defeitos, escolhidos por um argumento (`./bugs 1` a `./bugs 4`):

```c
#include <stdio.h>
#include <stdlib.h>
#include <limits.h>

int main(int argc, char **argv)
{
	int mode = argc > 1 ? atoi(argv[1]) : 0;      /* número do defeito a provocar */
	int *tab = malloc(4 * sizeof *tab);           /* bloco de 4 inteiros: 16 bytes */

	if (!tab)
		return (1);
	if (mode == 1)
		tab[4] = 7;                       /* escreve uma célula depois do fim */
	if (mode == 2)
	{
		free(tab);
		printf("%d\n", tab[0]);           /* lê depois do free */
		return (0);
	}
	if (mode == 3)
		return (0);                       /* esquece o free(tab) */
	if (mode == 4)
	{
		int big = INT_MAX;

		printf("%d\n", big + argc);       /* estouro de inteiro com sinal */
	}
	free(tab);
	return (0);
}
```

```bash
# -g: números de linha no relatório; -fno-omit-frame-pointer: pilha de chamadas legível
gcc -g -O0 -fno-omit-frame-pointer -fsanitize=address,undefined bugs.c -o bugs_san
gcc -g -O0 bugs.c -o bugs_plain               # mesmo programa, sem sanitizer
```

Medido com `gcc` 12.4 (Ubuntu 24.04):

| Defeito | Programa normal | Programa com sanitizers |
|---|---|---|
| `./bugs 1`: escrita depois do fim | termina sem dizer nada (código 0) | `ERROR: AddressSanitizer: heap-buffer-overflow`, linha 13, código 1 |
| `./bugs 2`: leitura após `free` | mostra um valor aleatório (`256822755`) | `ERROR: AddressSanitizer: heap-use-after-free`, linha 17, código 1 |
| `./bugs 3`: vazamento | termina sem dizer nada (código 0) | `ERROR: LeakSanitizer: detected memory leaks`, `16 byte(s) leaked in 1 allocation(s)`, código 1 |
| `./bugs 4`: estouro de inteiro | mostra `-2147483647` | `runtime error: signed integer overflow: 2147483647 + 2 cannot be represented in type 'int'` |

O compilador também vê os casos óbvios: com `-Wall -Wextra`, o `gcc` 12.4 avisa já na compilação que `tab` é usado após `free` (`-Wuse-after-free`, linha 17). O ASan cobre o que a análise do compilador não consegue seguir, por exemplo um ponteiro liberado em outra função.

O início do relatório do ASan para `./bugs 1` (abreviado) nomeia a falha, o lugar da escrita e depois o lugar da alocação:

```
==10298==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x502000000020 ...
WRITE of size 4 at 0x502000000020 thread T0
    #0 0x586fed0cc470 in main bugs.c:13
0x502000000020 is located 0 bytes after 16-byte region [0x502000000010,0x502000000020)
allocated by thread T0 here:
    #0 0x718c5acfd9c7 in malloc ...
    #1 0x586fed0cc3ca in main bugs.c:8
```

Cada linha `#0`, `#1`... é um nível da **pilha de chamadas** (a lista das funções em execução, da mais recente à mais antiga). O relatório diz aqui: «4 bytes escritos logo depois de um bloco de 16 bytes, alocado na linha 8».

**O código de saída** (o valor que o programa devolve a quem o lançou, 0 para «tudo certo»: veja [exit e os códigos de retorno](/?c=langages&s=c&p=exit-et-codes-de-retour)) não é o mesmo para todos: o ASan interrompe o programa com o código 1, mas o UBSan **mostra sua mensagem e deixa o programa continuar**, com o código 0. Medido: `UBSAN_OPTIONS=halt_on_error=1` dá o código 1 para `./bugs 4`.

> **Armadilha:** um teste automático que só olha o código de saída deixa passar todos os erros do UBSan. Ou se ativa `halt_on_error=1`, ou se procura `runtime error` na saída de erro (`stderr`, veja [as chamadas de sistema e os descritores](/?c=langages&s=c&p=appels-systeme-et-descripteurs)).
>
> **Armadilha (a saída do programa desaparece):** quando o LeakSanitizer constata um vazamento, ele encerra o processo sem esvaziar o [buffer](/?c=langages&s=bash&p=redirections-et-pipes) de `stdout`. Medido: um programa que escreve 4 linhas com `printf` e depois vaza produz **0 byte** em um arquivo (`./programa > saida.txt`), enquanto as 4 linhas aparecem em um terminal. Um teste que compara a saída com um resultado esperado vê então uma saída vazia e acusa o culpado errado: ler primeiro o relatório do LeakSanitizer em `stderr`.

## O que isso custa e o que não enxerga

O **valgrind** é a outra grande família: ele executa o programa em uma máquina virtual que vigia cada acesso à memória, **sem recompilar** (`valgrind --leak-check=full ./bugs_plain 1`). Nos três primeiros defeitos dá o mesmo veredito que o ASan (escrita inválida linha 13, leitura inválida linha 17, `16 bytes in 1 blocks are definitely lost`).

Um programa de teste que preenche um vetor de 32 MiB e depois o percorre 100 vezes, medido em um AMD Ryzen 7 6800H, três medições idênticas:

| Execução | Duração | Memória máxima | Fator de duração |
|---|---|---|---|
| Sem ferramenta | 0,23 s | 34 MiB | × 1 |
| ASan | 0,67 s | 42 MiB | × 2,9 |
| ASan + UBSan | 0,78 s | 44 MiB | × 3,4 |
| valgrind | 3,25 s | 87 MiB | × 14 |

Os fatores dependem do programa: este quase só faz acessos à memória, justamente o que essas ferramentas vigiam, então o custo adicional é marcante. Cada ferramenta também tem pontos cegos:

| | ASan + UBSan (`gcc`) | valgrind | MSan (`clang -fsanitize=memory`) |
|---|---|---|---|
| Recompilação necessária | sim | não | sim |
| Escrita fora dos limites, leitura após `free`, vazamento | detectado | detectado | fora do escopo |
| Estouro de inteiro com sinal | detectado (mensagem, o programa continua) | **não detectado** (medido: mostra `-2147483647`, código 0) | fora do escopo |
| Leitura de um valor **não inicializado** | **não detectado** (medido: código 0, nenhuma mensagem) | detectado (`Conditional jump or move depends on uninitialised value(s)`) | detectado (`use-of-uninitialized-value`) |

> **Armadilha:** achar que um programa «limpo sob o ASan» não tem bug de memória. Um valor lido antes de ser escrito (`malloc` não zera nada) passa pelo ASan. Passar também pelo valgrind, ou pelo [MSan](https://clang.llvm.org/docs/MemorySanitizer.html) com `clang` (que não se combina com o ASan: `clang: error: invalid argument '-fsanitize=address' not allowed with '-fsanitize=memory'`).
>
> **Boa prática:** sanitizers durante o desenvolvimento e na [integração contínua](/?c=infrastructure-devops&s=ci-cd&p=pipeline-cicd) (rápidos), valgrind antes de uma entrega ou para um programa que não se pode recompilar.

## Limitar a memória de um teste sob o ASan

Um teste que aloca muita memória deve ter um teto, para que um erro não faça a máquina inteira engasgar (veja [as salvaguardas de recursos](/?c=infrastructure-devops&s=administration-systeme&p=garde-fous-de-ressources)). O ASan exige dois cuidados.

**`ulimit -v` não se usa com o ASan.** Esse comando limita o espaço de endereços virtual do processo; ora, o ASan reserva uma faixa enorme (cerca de 14 TiB) para sua tabela de acompanhamento. Medido com `ulimit -v 1000000` (cerca de 1 GB):

```
==10351==ERROR: AddressSanitizer failed to allocate 0xdfff0001000 (15392894357504) bytes ... (errno: 12)
==10351==ReserveShadowMemoryRange failed while trying to map 0xdfff0001000 bytes. Perhaps you're using ulimit -v
```

O programa nem chegou a iniciar: não é um bug do programa.

**`ASAN_OPTIONS=hard_rss_limit_mb=N`** interrompe o programa quando a memória que ele realmente ocupa (*RSS*, a memória física em uso) ultrapassa `N` MiB. Medido em um programa que aloca e preenche 10 MiB por volta:

| Limite pedido | Mensagem | Memória no momento da parada |
|---|---|---|
| 200 MiB | `AddressSanitizer: hard rss limit exhausted (200Mb vs 249Mb)` | 249 MiB |
| 300 MiB | `AddressSanitizer: hard rss limit exhausted (300Mb vs 505Mb)` | 505 MiB |

A verificação é **periódica**: o programa continua alocando entre duas verificações, então o limite não é um teto estrito (aqui 505 MiB para 300 pedidos). Para um teto que nunca é ultrapassado, usar um grupo de controle do kernel (`systemd-run --user --scope -p MemoryMax=2G -p MemorySwapMax=0`), descrito no capítulo das salvaguardas; `hard_rss_limit_mb` continua útil para obter uma **mensagem clara** em vez de uma morte silenciosa do processo.

## Injetar falhas de alocação

O `malloc` devolve `NULL` quando falta memória, e um programa correto deve então liberar tudo e sinalizar o erro. Mas o `malloc` quase sempre funciona: esses caminhos de falha **nunca** são executados durante os testes, e um bug pode ficar ali por anos. A técnica consiste em fazer a alocação de **número k** falhar, para k = 1, 2, 3... até que tudo funcione.

A opção `--wrap=malloc` (passada ao **linker**, o programa que reúne os arquivos compilados em um único executável, com `-Wl,` no gcc) redireciona todas as chamadas a `malloc` do programa para uma função `__wrap_malloc` escrita por você, que pode chamar o `malloc` real com o nome `__real_malloc` ([documentação do `ld`](https://sourceware.org/binutils/docs/ld/Options.html)).

```c
#include <stdlib.h>

void	*__real_malloc(size_t size);            /* o malloc real, fornecido pelo linker */

static long	g_calls;                            /* número de chamadas a malloc desde o início */
static long	g_fail_at = -1;                     /* número da chamada a fazer falhar (-1: nenhuma) */

void	set_fail_at(long k)
{
	g_calls = 0;
	g_fail_at = k;
}

void	*__wrap_malloc(size_t size)             /* chamado no lugar de malloc */
{
	g_calls++;
	if (g_calls == g_fail_at)
		return (NULL);                          /* a alocação número k «falha» */
	return (__real_malloc(size));
}
```

O programa testado copia duas strings em uma estrutura. A versão `FIXED` libera o que já foi alocado quando uma alocação falha; a versão antiga esquece de fazê-lo:

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void	set_fail_at(long k);

typedef struct s_pair
{
	char	*first;
	char	*second;
}	t_pair;

static char	*copy(const char *s)
{
	char	*p = malloc(strlen(s) + 1);

	if (p)
		strcpy(p, s);
	return (p);
}

/* Copia duas strings. Devolve NULL se uma alocação falhar. */
t_pair	*pair_new(const char *a, const char *b)
{
	t_pair	*pair = malloc(sizeof *pair);

	if (!pair)
		return (NULL);
	pair->first = copy(a);
	pair->second = copy(b);
	if (!pair->first || !pair->second)
	{
#ifdef FIXED
		free(pair->first);                      /* free(NULL) é permitido */
		free(pair->second);
#endif
		free(pair);
		return (NULL);
	}
	return (pair);
}

int	main(void)
{
	for (long k = 1; k <= 4; k++)               /* no máximo 3 mallocs funcionam: testa-se k = 1..4 */
	{
		t_pair	*p;

		set_fail_at(k);
		p = pair_new("olá", "mundo");
		printf("k=%ld: %s\n", k, p ? "sucesso" : "falha tratada");
		if (p)
		{
			free(p->first);
			free(p->second);
			free(p);
		}
	}
	return (0);
}
```

```bash
gcc -g -fsanitize=address -Wl,--wrap=malloc pair.c wrap.c -o pair_bug
gcc -g -fsanitize=address -Wl,--wrap=malloc -DFIXED pair.c wrap.c -o pair_ok
```

| Versão | Resultado medido |
|---|---|
| Antiga (sem liberação) | `ERROR: LeakSanitizer`, `Direct leak of 6 byte(s)` e `Direct leak of 5 byte(s)`, `11 byte(s) leaked in 2 allocation(s)`, código 1 |
| Corrigida | `k=1: falha tratada`, `k=2: falha tratada`, `k=3: falha tratada`, `k=4: sucesso`, código 0 |

Os dois vazamentos correspondem aos dois casos em que uma cópia funciona e a outra falha: `k=2` (a cópia de `"olá"` falha, a de `"mundo"`, 6 bytes com o `\0`, vaza) e `k=3` (a de `"mundo"` falha, a de `"olá"`, 5 bytes porque o `á` ocupa 2 bytes em [UTF-8](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes), vaza). Sem essa injeção, esses dois caminhos nunca são executados, e o ASan não pode dizer nada sobre um código que não é rodado.

O wrapper só vê as chamadas a `malloc` **escritas no código que você mesmo linka**. Medido: depois de um `strdup("olá")` (que chama `malloc` dentro da biblioteca C), o contador do wrapper vale 0; depois do `malloc(8)` do programa, vale 1. As alocações internas de `printf` ou de `strdup` não são, portanto, contadas, e também não são testadas: para testar a falha de um `strdup`, escrever sua própria `copy` com `malloc`, como acima.

| Técnica | O que afeta | Limite |
|---|---|---|
| `-Wl,--wrap=malloc` | Só as chamadas a `malloc` do programa linkado | Precisa recompilar e linkar com o wrapper |
| `LD_PRELOAD=./libfail.so` (uma biblioteca que substitui `malloc` em todo o processo) | **Todos** os `malloc`, biblioteca C incluída, sem recompilar | Afeta também as ferramentas lançadas com a variável |

> **Armadilha (`LD_PRELOAD`):** a variável de ambiente é herdada por todo processo lançado depois. Medido com uma biblioteca que faz a segunda alocação do processo falhar: `LD_PRELOAD=./libfail.so valgrind -q true` para com `sh: 0: Out of space` e o código 2, assim como `LD_PRELOAD=./libfail.so sh -c 'echo ok'`: o shell e a ferramenta lançados sofrem a falha no lugar do programa testado. Colocar a variável só na frente do comando do programa testado, nunca exportada, e preferir `--wrap` quando se pode recompilar.

## Validar a ferramenta de teste com o código antigo defeituoso

Um teste que nunca falhou não prova nada: não se sabe se ele é capaz de detectar o defeito. Antes de confiar nele, lança-se sobre **o código antigo defeituoso conhecido**: ele deve condená-lo. É o princípio dos [testes de mutação](/?c=tests&p=tests-de-mutation), aplicado aqui à mão.

O exemplo testa uma função que lê um inteiro positivo de 1 a 9 dígitos. O código antigo aceita a string vazia e não limita o tamanho; o novo corrige os dois. O banco compara cada versão com uma **referência independente** (escrita de outra forma, com [`strtol`](https://man7.org/linux/man-pages/man3/strtol.3.html)) sobre as mesmas entradas, seguindo o [teste diferencial](/?c=tests&p=property-based-testing#um-caso-vizinho-o-teste-diferencial):

```c
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef int	(*t_parse)(const char *s, int *out);

/* Código antigo: aceita a string vazia (nenhum dígito lido, valor 0). */
static int	parse_old(const char *s, int *out)
{
	long	v = 0;

	for (; *s >= '0' && *s <= '9'; s++)
		v = v * 10 + (*s - '0');
	if (*s)
		return (-1);
	*out = (int)v;
	return (0);
}

/* Código novo: pelo menos um dígito, no máximo 9, nada além disso. */
static int	parse_new(const char *s, int *out)
{
	size_t	len = strspn(s, "0123456789");

	if (len == 0 || len > 9 || s[len] != '\0')
		return (-1);
	*out = atoi(s);
	return (0);
}

/* Referência independente: strtol, com todas as verificações. */
static int	reference(const char *s, int *out)
{
	char	*end;
	long	v;

	if (s[0] < '0' || s[0] > '9' || strlen(s) > 9)
		return (-1);
	errno = 0;
	v = strtol(s, &end, 10);
	if (errno || *end)
		return (-1);
	*out = (int)v;
	return (0);
}

/* Devolve 1 se a implementação e a referência divergem nesta entrada. */
static int	differs(t_parse impl, const char *s)
{
	int	a = -1, b = -1;
	int	ra = impl(s, &a), rb = reference(s, &b);

	return (ra != rb || (ra == 0 && a != b));
}
```

O banco faz três coisas: uma **varredura exaustiva** (todas as strings de 0 a 4 caracteres tomados de `05- a`, ou seja 781 entradas), um **fuzz** (100 000 strings aleatórias de 0 a 12 caracteres, veja [as ferramentas de fuzzing](/?c=securite&s=securite-offensive&p=outils-de-fuzzing)) e a **repetição dos casos que já falharam**, guardados em arquivos `regress/1.txt`, `regress/2.txt`... O gerador aleatório é um [xorshift](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible) com semente fixa: as mesmas entradas voltam a cada execução, então uma falha se reproduz.

```c
static unsigned	g_state = 2463534242u;           /* estado do gerador xorshift32 */

static unsigned	next_random(void)
{
	g_state ^= g_state << 13;
	g_state ^= g_state >> 17;
	g_state ^= g_state << 5;
	return (g_state);
}

/* Escreve a entrada defeituosa em regress/<n>.txt, a menos que uma idêntica já esteja guardada. */
static void	save_regression(const char *s, int *saved, char kept[][13])
{
	char	path[64];
	FILE	*f;

	for (int i = 0; i < *saved; i++)
		if (strcmp(kept[i], s) == 0)
			return ;
	if (*saved == 3)
		return ;
	strcpy(kept[*saved], s);
	snprintf(path, sizeof path, "regress/%d.txt", ++*saved);
	f = fopen(path, "w");
	if (!f)
		return ;
	fputs(s, f);
	fclose(f);
}

/* Repete as entradas guardadas (regress/1.txt, 2.txt...): devolve o número de divergências. */
static int	replay(t_parse impl, const char *name)
{
	char	path[64], buf[13];
	int		files = 0, bad = 0;

	for (int n = 1; n <= 3; n++)
	{
		snprintf(path, sizeof path, "regress/%d.txt", n);
		FILE	*f = fopen(path, "r");

		if (!f)
			break ;
		size_t	len = fread(buf, 1, sizeof buf - 1, f);

		buf[len] = '\0';
		fclose(f);
		files++;
		bad += differs(impl, buf);
	}
	printf("%s: %d entradas guardadas repetidas, %d divergências\n", name, files, bad);
	return (bad);
}

/* Varredura exaustiva: todas as strings de 0 a 4 caracteres do alfabeto. */
static int	sweep(t_parse impl, const char *name)
{
	static const char	alphabet[] = "05- a";
	char				buf[5];
	int					tested = 0, bad = 0;

	for (int len = 0; len <= 4; len++)
	{
		int	total = 1;

		for (int i = 0; i < len; i++)
			total *= 5;
		for (int n = 0; n < total; n++)
		{
			for (int i = 0, m = n; i < len; i++, m /= 5)
				buf[i] = alphabet[m % 5];
			buf[len] = '\0';
			tested++;
			if (differs(impl, buf) && bad++ == 0)
				printf("%s: primeira divergência em \"%s\"\n", name, buf);
		}
	}
	printf("%s: varredura de %d entradas, %d divergências\n", name, tested, bad);
	return (bad);
}

/* Fuzz: strings aleatórias de 0 a 12 caracteres, divergências guardadas em regress/. */
static int	fuzz(t_parse impl, const char *name, int rounds)
{
	static const char	alphabet[] = "0123456789- a";
	char				buf[13], kept[3][13];
	int					bad = 0, saved = 0;

	for (int r = 0; r < rounds; r++)
	{
		int	len = next_random() % 13;

		for (int i = 0; i < len; i++)
			buf[i] = alphabet[next_random() % (sizeof alphabet - 1)];
		buf[len] = '\0';
		if (differs(impl, buf))
		{
			bad++;
			save_regression(buf, &saved, kept);
		}
	}
	printf("%s: fuzz de %d sorteios, %d divergências\n", name, rounds, bad);
	return (bad);
}

int	main(void)
{
	int	bad_old = sweep(parse_old, "antigo") + fuzz(parse_old, "antigo", 100000);
	int	bad_new;

	replay(parse_old, "antigo");
	bad_new = replay(parse_new, "novo") + sweep(parse_new, "novo")
		+ fuzz(parse_new, "novo", 100000);

	printf("ferramenta validada com o código antigo: %s\n", bad_old ? "sim (ela o condena)" : "NÃO");
	return (bad_new != 0);
}
```

Saída medida (o diretório `regress/` deve existir antes de rodar; `mkdir regress`):

```
antigo: primeira divergência em ""
antigo: varredura de 781 entradas, 1 divergências
antigo: fuzz de 100000 sorteios, 8873 divergências
antigo: 3 entradas guardadas repetidas, 3 divergências
novo: 3 entradas guardadas repetidas, 0 divergências
novo: varredura de 781 entradas, 0 divergências
novo: fuzz de 100000 sorteios, 0 divergências
ferramenta validada com o código antigo: sim (ela o condena)
```

Três lições:

- **O banco condena o código antigo** (1 divergência na varredura, 8 873 no fuzz) e absolve o novo (0 em tudo): sabe-se que os dois veredictos significam algo.
- **A varredura exaustiva só viu um dos dois defeitos.** Ela para em 4 caracteres, então encontra a string vazia (`""`), mas nunca o defeito dos números longos demais. O fuzz, que chega a 12 caracteres, encontra as strings de 10 dígitos ou mais (`regress/2.txt` contém `3582159301`): o código antigo as lê em um `long` e depois as trunca em um `int`, e a referência as rejeita. Uma varredura exaustiva só cobre o que permitem seu alfabeto e seu tamanho máximo.
- **Cada falha encontrada pelo fuzz vira um teste permanente.** Os arquivos `regress/*.txt` são repetidos primeiro a cada execução: o defeito não pode voltar sem que o banco o sinalize.

> **Armadilha:** uma referência que compartilha o raciocínio do código testado (o mesmo `strspn`, o mesmo bug) sempre dá razão ao código. Escrever a referência de outra forma, ou tirá-la de uma função da biblioteca padrão.
>
> **Armadilha:** comparar o código novo só com o antigo, sem referência: se os dois erram do mesmo jeito, nenhuma divergência aparece.

## Os falsos positivos da ferramenta de teste

Um **falso positivo** é um alerta que acusa um código correto: o defeito está na ferramenta de teste, não no programa. Antes de corrigir qualquer coisa, **confirmar o alerta no código antigo**: rodar de novo o mesmo teste na versão anterior ([`git stash`](/?c=qualite-performance-et-outils&s=git&p=stash), ou [`git worktree add ../antes <commit>`](/?c=qualite-performance-et-outils&s=git&p=worktree)). Se o alerta aparece também no código antigo, ele não vem da mudança, e muitas vezes é a ferramenta que se engana. Em uma revisão real de um programa gráfico, 7 alertas de 7 vinham da ferramenta de teste, nenhum do programa.

| Causa do falso positivo | Sintoma | Remédio |
|---|---|---|
| O verificador compara **números** (de vértices, de identificadores) | Dois objetos idênticos são declarados diferentes assim que são renumerados | Comparar o conteúdo (coordenadas, valores), em uma ordem canônica |
| O teste lê um valor **antes** da chamada que o modifica | Valor esperado ausente | Ler depois da chamada |
| A ferramenta é **recompilada enquanto uma série roda** | Uma série mistura os resultados de duas versões | Nunca recompilar durante uma série; compilar em outra pasta e depois substituir |
| Um **cursor do mouse** aparece em uma captura de tela | A caixa delimitadora da imagem fica errada | `ffmpeg -draw_mouse 0` (veja [medir o que o aplicativo exibe](/?c=infrastructure-devops&s=administration-systeme&p=touche-coincee-clavier-virtuel-xtest)) |
| Um efeito **pulsa** (brilho que varia) | Duas capturas da mesma cena diferem | Normalizar o brilho de cada imagem antes de comparar |

**Comparar números.** Duas malhas idênticas (um quadrado feito de dois triângulos), a segunda com os vértices renumerados:

```python
# Duas malhas idênticas: a segunda está renumerada (os vértices estão em outra ordem).
vertices_a = [(0, 0), (1, 0), (0, 1), (1, 1)]            # vértice número 0, 1, 2, 3
triangulos_a = [(0, 1, 2), (1, 3, 2)]                    # cada triângulo cita números

ordem = [2, 0, 3, 1]                                     # ordem[j]: antigo vértice colocado na posição j
vertices_b = [vertices_a[i] for i in ordem]
novo_numero = {antigo: novo for novo, antigo in enumerate(ordem)}
triangulos_b = [tuple(novo_numero[i] for i in t) for t in triangulos_a]

# Verificador frágil: compara os números de vértice.
print("por números     :", "idênticas" if triangulos_a == triangulos_b else "DIFERENTES (falso positivo)")

# Verificador robusto: compara as coordenadas, em uma ordem canônica.
def forma(vertices, triangulos):
    return sorted(tuple(sorted(vertices[i] for i in t)) for t in triangulos)

print("por coordenadas :", "idênticas" if forma(vertices_a, triangulos_a) == forma(vertices_b, triangulos_b) else "DIFERENTES")
```

```
por números     : DIFERENTES (falso positivo)
por coordenadas : idênticas
```

**Ler antes da chamada.** O teste frágil guarda o valor de antes; o teste correto o lê depois:

```c
#include <stdio.h>

static int	g_count;                            /* contador modificado pela função testada */

static void	register_item(void)
{
	g_count++;
}

int	main(void)
{
	int	antes = g_count;                        /* lido ANTES da chamada: vale 0 */

	register_item();
	printf("teste frágil: g_count vale %d, esperado 1: %s\n", antes, antes == 1 ? "ok" : "FALHA (falso positivo)");
	printf("teste correto: g_count vale %d, esperado 1: %s\n", g_count, g_count == 1 ? "ok" : "FALHA");
	return (0);
}
```

```
teste frágil: g_count vale 0, esperado 1: FALHA (falso positivo)
teste correto: g_count vale 1, esperado 1: ok
```

**Recompilar durante uma série.** Uma série de 6 execuções espaçadas de 0,3 s; a ferramenta é recompilada (versão 2) e substituída com `mv` após 0,7 s:

```bash
gcc -DVERSION='"ferramenta v1"' tool.c -o tool                  # primeira versão da ferramenta
( for i in 1 2 3 4 5 6; do ./tool; sleep 0.3; done ) > serie.txt &   # série lançada em segundo plano
sleep 0.7
gcc -DVERSION='"ferramenta v2"' tool.c -o tool.new && mv tool.new tool    # recompilação durante a série
wait; cat serie.txt
```

```
ferramenta v1
ferramenta v1
ferramenta v1
ferramenta v2
ferramenta v2
ferramenta v2
```

Nenhum erro, nenhum aviso: o linker ou o `mv` substituem o arquivo mesmo que esteja em uso. A série contém os resultados de duas ferramentas diferentes, e a diferença observada entre as 3 primeiras e as 3 últimas execuções não diz nada sobre o programa testado.

**Normalizar o brilho.** Um programa cuja renderização pulsa (brilho que sobe e desce) produz duas capturas diferentes da mesma cena. Simulação em uma imagem de 16 pixels, uma vez com brilho total, outra a 0,6; a normalização divide cada pixel pela média da imagem:

```python
def imagem(brilho):
    """Imagem 4 x 4: um padrão fixo multiplicado pelo brilho do momento."""
    padrao = [[(x + 2 * y) % 5 + 1 for x in range(4)] for y in range(4)]
    return [[round(v * brilho * 40) for v in linha] for linha in padrao]

def achatar(img):
    return [v for linha in img for v in linha]

def diferenca_max(a, b):
    return max(abs(p - q) for p, q in zip(achatar(a), achatar(b)))

def normalizar(img):
    media = sum(achatar(img)) / 16
    return [[v / media for v in linha] for linha in img]

def diferenca_max_normalizada(a, b):
    return max(abs(p - q) for p, q in zip(achatar(normalizar(a)), achatar(normalizar(b))))

claro = imagem(1.0)                                 # cena com brilho total
escuro = imagem(0.6)                                # mesma cena, 0,6 vez mais escura
print("diferença máxima bruta        :", diferenca_max(claro, escuro), "níveis em 255")
print("diferença máxima normalizada  :", round(diferenca_max_normalizada(claro, escuro), 4))
```

```
diferença máxima bruta        : 80 níveis em 255
diferença máxima normalizada  : 0.0
```

A diferença bruta (80 níveis em 255) faria falhar um teste de comparação mesmo com a cena idêntica; após a normalização ela cai para 0. Em capturas reais, a diferença não cai exatamente a 0 (ruído de compressão, arredondamentos): fixar um limiar de tolerância medido em duas capturas da mesma cena.

> **Armadilha:** corrigir o programa antes de ter confirmado o alerta no código antigo. Você «conserta» um defeito que não existe, e pode introduzir um real.
>
> **Armadilha:** validar a ferramenta só com código correto. Ela deve também condenar um código defeituoso conhecido (seção anterior): senão pode se calar por padrão e não detectar nada.
>
> **Boa prática:** diante de qualquer alerta inesperado, três perguntas na ordem: a ferramenta mudou? o alerta existe no código antigo? o que diz uma comparação feita de outra forma (conteúdo em vez de números, após normalizar)?

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um bug de memória em C costuma passar despercebido: `-fsanitize=address,undefined` (ASan: acessos fora dos limites e uso após `free`; LeakSanitizer: vazamentos; UBSan: comportamento indefinido) os torna visíveis a um custo de cerca de ×3 em duração e ×1,2 em memória, contra ×14 e ×2,6 do valgrind. Fazer o `malloc` de número k falhar (`-Wl,--wrap=malloc`) executa os caminhos de falha que nenhum teste normal alcança. Uma ferramenta de teste se valida lançando-a sobre código defeituoso conhecido, e um alerta se confirma no código antigo antes de acusar o novo. |
| **Ferramentas utilizáveis** | `gcc`/`clang` com `-fsanitize=address,undefined -g -fno-omit-frame-pointer`; `UBSAN_OPTIONS=halt_on_error=1`; `valgrind --leak-check=full`; MSan (`clang -fsanitize=memory`) para os valores não inicializados; `ASAN_OPTIONS=hard_rss_limit_mb=N`; `systemd-run ... -p MemoryMax=...`; `-Wl,--wrap=malloc`; um banco com varredura exaustiva + fuzz de semente fixa + entradas guardadas em `regress/`. |
| **Armadilhas a evitar** | `ulimit -v` com o ASan (o programa não inicia); olhar só o código de saída (o UBSan continua, código 0); achar que um programa «limpo sob o ASan» não tem valor não inicializado (o ASan não o vê); a saída de `stdout` perdida quando o LeakSanitizer encerra o processo; um `LD_PRELOAD` exportado que quebra as ferramentas lançadas depois; uma referência que compartilha o bug do código; comparar números em vez do conteúdo; recompilar a ferramenta durante uma série; ler um valor antes da chamada que o modifica; validar um teste só com código correto. |
| **Boas práticas** | Sanitizers no desenvolvimento e na integração contínua, valgrind antes da entrega; injetar a falha de cada alocação (k = 1, 2, 3...) e verificar vazamento e mensagem; rodar a ferramenta de teste no código antigo defeituoso antes de confiar nela; guardar cada falha do fuzz como teste permanente; confirmar todo alerta inesperado no código antigo; comparar o conteúdo e normalizar o que varia (brilho) antes de comparar duas renderizações. |
