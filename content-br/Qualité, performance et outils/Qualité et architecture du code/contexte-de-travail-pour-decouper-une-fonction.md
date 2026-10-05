---
order: 12
---

# Um contexto de trabalho para dividir uma função grande

Uma função que faz tudo (abrir um arquivo, ler cada linha, converter, alocar memória, guardar, limpar em caso de erro) acaba longa, e cada saída de erro repete a mesma limpeza. Este capítulo mostra como dividi-la sem que as subfunções fiquem com uma lista de seis parâmetros, reunindo o que elas compartilham em uma **estrutura** passada por ponteiro: um **contexto de trabalho**. Uma **estrutura** (`struct`) é um tipo que agrupa várias variáveis sob um mesmo nome; passa-se a ela o endereço (um [ponteiro](/?c=langages&s=c&p=pointeurs)) para que todas as funções vejam a mesma.

O capítulo [Responsabilidade única e baixo acoplamento](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) explica **quando** dividir; este mostra **como**, em um exemplo executado, usando a injeção de falhas de alocação do capítulo [Sanitizers e testes de alocação](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation) para provar que cada saída limpa tudo.

## O exemplo: carregar um arquivo de pessoas

O arquivo contém uma pessoa por linha, no formato `nome;idade;cidade` (`Ada;36;Londres`). A função `load_people` devolve um vetor de pessoas, ou `NULL` com uma mensagem que nomeia o arquivo, a linha e a causa. Um arquivo é aberto com [`fopen` e lido linha a linha com `fgets`](/?c=langages&s=c&p=lecture-de-fichiers); a idade é convertida com [`strtol` e suas verificações](/?c=langages&s=c&p=convertir-un-texte-en-nombre).

```c
#ifndef PEOPLE_H
# define PEOPLE_H
# include <stddef.h>

typedef struct s_person
{
	char	*name;
	char	*city;
	int		age;
}	t_person;

/* Lê um arquivo de linhas "nome;idade;cidade". Devolve NULL em caso de erro. */
t_person	*load_people(const char *path, size_t *count);
void		free_people(t_person *people, size_t count);

#endif
```

## A versão original: uma única função

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "people.h"

static char	*copy_n(const char *s, size_t n)
{
	char	*p = malloc(n + 1);

	if (p)
	{
		memcpy(p, s, n);
		p[n] = '\0';
	}
	return (p);
}

void	free_people(t_person *people, size_t count)
{
	for (size_t i = 0; i < count; i++)
	{
		free(people[i].name);
		free(people[i].city);
	}
	free(people);
}

t_person	*load_people(const char *path, size_t *count)
{
	FILE		*file = fopen(path, "r");
	t_person	*people = NULL, *grown;
	size_t		capacity = 0;
	char		line[256], *sep1, *sep2, *end, *name, *city;
	int			line_no = 0;
	long		age;

	*count = 0;
	if (!file)
	{
		fprintf(stderr, "%s: cannot open\n", path);
		return (NULL);
	}
	while (fgets(line, sizeof line, file))
	{
		line_no++;
		line[strcspn(line, "\n")] = '\0';
		sep1 = strchr(line, ';');
		sep2 = sep1 ? strchr(sep1 + 1, ';') : NULL;
		if (!sep2)
		{
			fprintf(stderr, "%s:%d: missing separator\n", path, line_no);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		if (sep1 == line)
		{
			fprintf(stderr, "%s:%d: empty name\n", path, line_no);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		age = strtol(sep1 + 1, &end, 10);
		if (end != sep2 || end == sep1 + 1 || age < 0 || age > 150)
		{
			fprintf(stderr, "%s:%d: invalid age\n", path, line_no);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		if (sep2[1] == '\0')
		{
			fprintf(stderr, "%s:%d: empty city\n", path, line_no);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		name = copy_n(line, sep1 - line);
		if (!name)
		{
			fprintf(stderr, "%s:%d: out of memory\n", path, line_no);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		city = copy_n(sep2 + 1, strlen(sep2 + 1));
		if (!city)
		{
			fprintf(stderr, "%s:%d: out of memory\n", path, line_no);
			free(name);
			free_people(people, *count);
			fclose(file);
			*count = 0;
			return (NULL);
		}
		if (*count == capacity)
		{
			capacity = capacity ? capacity * 2 : 2;
			grown = malloc(capacity * sizeof *grown);
			if (!grown)
			{
				fprintf(stderr, "%s:%d: out of memory\n", path, line_no);
				free_people(people, *count);
				fclose(file);
				*count = 0;
				return (NULL);
			}
			if (*count)
				memcpy(grown, people, *count * sizeof *grown);
			free(people);
			people = grown;
		}
		people[*count].name = name;
		people[*count].city = city;
		people[*count].age = (int)age;
		(*count)++;
	}
	fclose(file);
	return (people);
}
```

`load_people` tem 98 linhas. Cada `return (NULL)` é precedido de `free_people(people, *count); fclose(file); *count = 0;`: **sete** blocos de limpeza quase idênticos. Quando o código é copiado sete vezes, uma cópia acaba diferindo das outras: aqui, a da falha ao aumentar o vetor (embaixo) esquece de liberar `name` e `city`, que a cópia da falha sobre `city` liberava (`free(name)`).

## As duas falsas soluções

**Dividir sem contexto.** Cada etapa vira uma função, que recebe tudo de que precisa e devolve seus resultados por ponteiro:

```c
static int	parse_line(const char *line, const char *path, int line_no,
				char **name, int *age, char **city);
```

Seis parâmetros, três dos quais só servem para escrever a mensagem de erro; o chamador ainda deve liberar `name` e `city` se a etapa seguinte falhar: a limpeza continua dispersa, e cada dado novo alonga todas as assinaturas.

**Variáveis globais.** Elas evitam os parâmetros, mas dois carregamentos ao mesmo tempo (duas [threads](/?c=langages&s=c&p=threads), ou um carregamento lançado de dentro de outro) sobrescrevem os dados um do outro, e nada na assinatura diz que a função depende delas.

| Abordagem | Parâmetros de cada subfunção | Limpeza | Limite |
|---|---|---|---|
| Uma única função | nenhum (tudo em variáveis locais) | duplicada em cada saída (7 vezes aqui) | uma cópia esquecida = um vazamento |
| Subfunções sem contexto | 6 | dispersa em cada chamador | cada dado acrescentado muda todas as assinaturas |
| Variáveis globais | nenhum | um único lugar | não reentrante, dependência invisível |
| **Contexto passado por ponteiro** | **1** | **um único lugar** | exige uma regra de propriedade (veja abaixo) |

## O contexto de trabalho

Reúne-se em uma estrutura tudo o que vive durante o carregamento: o arquivo, seu caminho, a linha atual, os campos em leitura (ainda não guardados), o vetor e seu tamanho. Uma variável `t_job job` é criada uma vez em `load_people`; as subfunções recebem `&job`.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "people.h"

typedef struct s_job
{
	FILE		*file;
	const char	*path;
	int			line_no;
	char		line[256];
	char		*name;
	char		*city;
	int			age;
	t_person	*people;
	size_t		count;
	size_t		capacity;
}	t_job;

static char	*copy_n(const char *s, size_t n)
{
	char	*p = malloc(n + 1);

	if (p)
	{
		memcpy(p, s, n);
		p[n] = '\0';
	}
	return (p);
}

void	free_people(t_person *people, size_t count)
{
	for (size_t i = 0; i < count; i++)
	{
		free(people[i].name);
		free(people[i].city);
	}
	free(people);
}
```

O ponto central é **uma única função de saída de erro**, que libera tudo o que o contexto possui, em qualquer ponto em que se esteja:

```c
/* Sinaliza a causa, libera TUDO o que a tarefa possui, devolve -1. */
static int	fail_job(t_job *job, const char *cause)
{
	if (job->line_no)
		fprintf(stderr, "%s:%d: %s\n", job->path, job->line_no, cause);
	else
		fprintf(stderr, "%s: %s\n", job->path, cause);
	free(job->name);
	free(job->city);
	free_people(job->people, job->count);
	if (job->file)
		fclose(job->file);
	return (-1);
}
```

Essa função pode liberar tudo sem saber em que ponto se está, porque `free(NULL)` é permitido (não faz nada) e o contexto começa **inteiramente em zero** (`t_job job = {0}` mais abaixo): um campo ainda não preenchido vale `NULL`.

As etapas viram pequenas funções que recebem o contexto e devolvem 0 (sucesso) ou -1 (falha já sinalizada e limpa):

```c
/* Divide job->line em nome, idade e cidade (cópias em job->name e job->city). */
static int	split_line(t_job *job)
{
	char	*sep1, *sep2, *end;
	long	age;

	job->line[strcspn(job->line, "\n")] = '\0';
	sep1 = strchr(job->line, ';');
	sep2 = sep1 ? strchr(sep1 + 1, ';') : NULL;
	if (!sep2)
		return (fail_job(job, "missing separator"));
	if (sep1 == job->line)
		return (fail_job(job, "empty name"));
	age = strtol(sep1 + 1, &end, 10);
	if (end != sep2 || end == sep1 + 1 || age < 0 || age > 150)
		return (fail_job(job, "invalid age"));
	if (sep2[1] == '\0')
		return (fail_job(job, "empty city"));
	job->name = copy_n(job->line, sep1 - job->line);
	job->city = copy_n(sep2 + 1, strlen(sep2 + 1));
	job->age = (int)age;
	if (!job->name || !job->city)
		return (fail_job(job, "out of memory"));
	return (0);
}

/* Guarda a pessoa atual no vetor, aumentado por duplicação quando preciso. */
static int	store_person(t_job *job)
{
	t_person	*grown;

	if (job->count == job->capacity)
	{
		job->capacity = job->capacity ? job->capacity * 2 : 2;
		grown = malloc(job->capacity * sizeof *grown);
		if (!grown)
			return (fail_job(job, "out of memory"));
		if (job->count)
			memcpy(grown, job->people, job->count * sizeof *grown);
		free(job->people);
		job->people = grown;
	}
	job->people[job->count].name = job->name;
	job->people[job->count].city = job->city;
	job->people[job->count].age = job->age;
	job->count++;
	job->name = NULL;                               /* o vetor agora é o proprietário */
	job->city = NULL;
	return (0);
}

t_person	*load_people(const char *path, size_t *count)
{
	t_job	job = {0};

	*count = 0;
	job.path = path;
	job.file = fopen(path, "r");
	if (!job.file)
		return (fail_job(&job, "cannot open"), NULL);
	while (fgets(job.line, sizeof job.line, job.file))
	{
		job.line_no++;
		if (split_line(&job) || store_person(&job))
			return (NULL);
	}
	fclose(job.file);
	*count = job.count;
	return (job.people);
}
```

A regra de **propriedade** cabe em duas linhas de `store_person`: enquanto `name` e `city` estão no contexto, é ele que os libera; uma vez guardados no vetor, é o vetor, e o contexto os recoloca em `NULL` para não liberá-los duas vezes.

Medido nas duas versões (`gcc` 12.4):

| | Versão original | Com contexto |
|---|---|---|
| `load_people` | 98 linhas | 19 linhas |
| Outras funções | nenhuma | `split_line` 24, `store_person` 23, `fail_job` 13 |
| Blocos de limpeza duplicados | 7 | 1 (`fail_job`) |
| Parâmetros de cada etapa | | 1 (`t_job *job`) |

O teto de tamanho adotado para uma função é de 100 linhas: a original (98) passa por pouco, e o defeito não era o tamanho, mas as sete saídas a limpar. O teto é uma **salvaguarda** que obriga a se fazer a pergunta, não um objetivo.

## Provar que cada saída limpa tudo

O banco a seguir escreve quatro arquivos (um válido de 5 linhas, três inválidos), depois faz **a alocação de número k falhar** para k = 1, 2, 3... até que o carregamento do arquivo válido tenha sucesso (técnica `--wrap=malloc` do capítulo [Sanitizers e testes de alocação](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation#injetar-falhas-de-alocacao), arquivo `wrap.c` idêntico). Os três arquivos inválidos verificam que cada causa de recusa limpa.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "people.h"

void	set_fail_at(long k);

static void	write_file(const char *path, const char *text)
{
	FILE	*f = fopen(path, "w");

	fputs(text, f);
	fclose(f);
}

/* Faz a 1.ª, 2.ª, 3.ª... alocação falhar até o carregamento ter sucesso. */
static void	inject_failures(const char *path)
{
	size_t		count;
	t_person	*people;
	long		k = 1;

	for (;; k++)
	{
		set_fail_at(k);
		people = load_people(path, &count);
		if (people)
			break ;
		if (k > 50)
			return ((void)puts("falhas demais"));
	}
	set_fail_at(-1);
	printf("%s: %ld falhas injetadas, todas tratadas; a próxima tem sucesso (%zu pessoas)\n",
		path, k - 1, count);
	free_people(people, count);
}

static void	invalid_file(const char *path)
{
	size_t		count;
	t_person	*people;

	set_fail_at(-1);
	people = load_people(path, &count);
	printf("%s: %s (%zu pessoas)\n", path, people ? "carregado" : "recusado", count);
	free_people(people, count);
}

int	main(void)
{
	setvbuf(stdout, NULL, _IONBF, 0);               /* saída sem buffer: não é perdida pelo LeakSanitizer */
	write_file("ok.txt", "Ada;36;Londres\nAlan;41;Wilmslow\nGrace;85;Arlington\n"
		"Linus;55;Portland\nMargaret;87;Boston\n");
	write_file("sep.txt", "Ada;36;Londres\nAlan 41 Wilmslow\n");
	write_file("age.txt", "Ada;36;Londres\nAlan;abc;Wilmslow\n");
	write_file("name.txt", "Ada;36;Londres\n;41;Wilmslow\n");
	inject_failures("ok.txt");
	invalid_file("sep.txt");
	invalid_file("age.txt");
	invalid_file("name.txt");
	invalid_file("absent.txt");
	return (0);
}
```

```bash
# people_old.c: versão original; people_new.c: versão com contexto
gcc -g -fsanitize=address -Wl,--wrap=malloc test_people.c people_old.c wrap.c -o test_old
gcc -g -fsanitize=address -Wl,--wrap=malloc test_people.c people_new.c wrap.c -o test_new
./test_old 2> log_old.txt; echo "código de saída: $?"
./test_new 2> log_new.txt; echo "código de saída: $?"
```

`setvbuf(stdout, NULL, _IONBF, 0)` suprime o buffer de `stdout`: sem ele, um vazamento detectado pelo LeakSanitizer faria a [saída desaparecer](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation#os-sanitizers-o-que-eles-verificam) em um programa redirecionado para um arquivo. As mensagens de erro do programa e os relatórios do ASan vão ambos para `stderr`, ou seja, para `log_old.txt` e `log_new.txt`.

Saída padrão, idêntica nas duas versões:

```
ok.txt: 13 falhas injetadas, todas tratadas; a próxima tem sucesso (5 pessoas)
sep.txt: recusado (0 pessoas)
age.txt: recusado (0 pessoas)
name.txt: recusado (0 pessoas)
absent.txt: recusado (0 pessoas)
```

| | Versão original | Com contexto |
|---|---|---|
| Código de saída | 1 | 0 |
| No registro de erros | `Direct leak of 25 byte(s) in 3 object(s)`, `Direct leak of 19 byte(s) in 3 object(s)`, `SUMMARY: AddressSanitizer: 44 byte(s) leaked in 6 allocation(s)` | nenhum relatório |
| Mensagens de recusa | `sep.txt:2: missing separator`, `age.txt:2: invalid age`, `name.txt:2: empty name`, `absent.txt: cannot open` | as mesmas |

Os três carregamentos da versão original em que o aumento do vetor falha (na 1.ª, na 3.ª e na 5.ª pessoa) deixam vazar o nome e a cidade em andamento: 3 nomes (4 + 6 + 9 = 19 bytes) e 3 cidades (8 + 10 + 7 = 25 bytes), ou seja 6 blocos e 44 bytes. É exatamente a cópia da limpeza que difere das outras. Na versão com contexto, esse caminho passa por `fail_job`, que libera `job->name` e `job->city` sem se fazer a pergunta.

## As armadilhas

Dois erros de disciplina, medidos na versão com contexto:

| Erro | O que acontece (medido) |
|---|---|
| Esquecer de recolocar `job->name` e `job->city` em `NULL` depois de `store_person` | Uma falha na linha seguinte libera os dois campos uma primeira vez pelo vetor, uma segunda por `fail_job`: `ERROR: AddressSanitizer: attempting double-free` |
| Escrever `t_job job;` em vez de `t_job job = {0};` | Os campos contêm o que a pilha continha. Nesta execução, sob ASan e UBSan: **nenhum relatório**, tudo passa (a pilha valia zero por acaso). Sob valgrind: `Conditional jump or move depends on uninitialised value(s)`, depois `Use of uninitialised value of size 8` |

> **Armadilha:** um contexto não inicializado pode passar em todos os testes sob o ASan, enquanto `fail_job` chama `free` sobre um campo que contém um valor aleatório. Inicializar com zero na declaração, sem exceção.
>
> **Armadilha:** um contexto «gaveta de bagunça» onde se coloca o que se quer compartilhar entre tarefas diferentes (o arquivo de um carregamento, as configurações do aplicativo, um contador de tela): ele volta a ser um conjunto de variáveis globais. Um contexto por **tarefa**, criado no início e destruído no fim dessa tarefa.
>
> **Armadilha:** dividir para atingir um teto de linhas sem olhar a limpeza. Uma função curta com sete `return` que limpam cada um à sua maneira continua frágil.
>
> **Boa prática:** escrever a regra de propriedade como comentário ao lado da transferência (`/* o vetor agora é o proprietário */`), inicializar o contexto com zero, uma única função de saída de erro que libere tudo, e testá-la por injeção de falhas.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma função grande que limpa em cada saída de erro duplica sua limpeza (7 vezes no exemplo, 98 linhas); uma cópia acaba diferindo (aqui, 44 bytes vazam quando o aumento do vetor falha). Um contexto de trabalho (`struct`) passado por ponteiro reúne o que as etapas compartilham; uma única função `fail_job` libera tudo. Resultado: uma função de 19 linhas, três etapas de 13 a 24 linhas, nenhum vazamento em 13 falhas injetadas. |
| **Ferramentas utilizáveis** | Uma `struct` de contexto inicializada com `{0}`; `free(NULL)` permitido; uma função de saída única; `-fsanitize=address` com `-Wl,--wrap=malloc` para fazer a alocação de número k falhar; valgrind para os valores não inicializados. |
| **Armadilhas a evitar** | Seis parâmetros por subfunção; variáveis globais (não reentrantes); esquecer de recolocar um ponteiro em `NULL` depois de transferi-lo (liberação dupla); um contexto não inicializado (silencioso sob o ASan); um contexto gaveta de bagunça; dividir por um teto de linhas sem olhar as saídas. |
| **Boas práticas** | Um contexto por tarefa; uma regra de propriedade escrita onde a transferência acontece; uma única saída de erro que libere tudo; testar cada saída por injeção de falhas; o teto de tamanho (100 linhas) como salvaguarda, não como objetivo. |
