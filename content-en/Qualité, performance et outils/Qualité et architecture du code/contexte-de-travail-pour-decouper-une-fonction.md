---
order: 12
---

# A Work Context to Split a Big Function

A function that does everything (open a file, read each line, convert, allocate, store, clean up on error) ends up long, and every error exit repeats the same cleanup. This chapter shows how to split it without the sub-functions ending up with a list of six parameters, by gathering what they share in a **structure** passed by pointer: a **work context**. A **structure** (`struct`) is a type that groups several variables under one name; we pass its address (a [pointer](/?c=langages&s=c&p=pointeurs)) so that every function sees the same one.

The chapter [Single Responsibility and Low Coupling](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) explains **when** to split; this one shows **how**, on an executed example, using the allocation-failure injection of the chapter [Sanitizers and Allocation Tests](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation) to prove that every exit cleans up everything.

## The example: loading a file of people

The file holds one person per line, in the format `name;age;city` (`Ada;36;London`). The function `load_people` returns an array of people, or `NULL` with a message that names the file, the line and the cause. A file is opened with [`fopen` and read line by line with `fgets`](/?c=langages&s=c&p=lecture-de-fichiers); the age is converted with [`strtol` and its checks](/?c=langages&s=c&p=convertir-un-texte-en-nombre).

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

/* Reads a file of "name;age;city" lines. Returns NULL on error. */
t_person	*load_people(const char *path, size_t *count);
void		free_people(t_person *people, size_t count);

#endif
```

## The original version: one single function

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

`load_people` is 98 lines long. Every `return (NULL)` is preceded by `free_people(people, *count); fclose(file); *count = 0;`: **seven** nearly identical cleanup blocks. When code is copied seven times, one copy ends up differing from the others: here, the copy for the array growth failure (at the bottom) forgets to free `name` and `city`, which the copy for the `city` failure did free (`free(name)`).

## The two false solutions

**Splitting without a context.** Each step becomes a function, which receives everything it needs and returns its results through pointers:

```c
static int	parse_line(const char *line, const char *path, int line_no,
				char **name, int *age, char **city);
```

Six parameters, three of which only serve to write the error message; the caller must still free `name` and `city` if the next step fails: the cleanup stays scattered, and every new piece of data lengthens all the signatures.

**Global variables.** They avoid the parameters, but two loads at the same time (two [threads](/?c=langages&s=c&p=threads), or a load started from within a load) overwrite each other's data, and nothing in the signature says the function depends on them.

| Approach | Parameters of each sub-function | Cleanup | Limit |
|---|---|---|---|
| One single function | none (everything in local variables) | duplicated at each exit (7 times here) | one forgotten copy = one leak |
| Sub-functions without a context | 6 | scattered across each caller | every added piece of data changes all the signatures |
| Global variables | none | a single place | not reentrant, invisible dependency |
| **Context passed by pointer** | **1** | **a single place** | requires an ownership rule (see below) |

## The work context

We gather in a structure everything that lives during the load: the file, its path, the current line, the fields being read (not yet stored), the array and its size. A variable `t_job job` is created once in `load_people`; the sub-functions receive `&job`.

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

The central point is **one single error exit function**, which frees everything the context owns, wherever we are:

```c
/* Reports the cause, frees EVERYTHING the job owns, returns -1. */
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

This function can free everything without knowing where we are, because `free(NULL)` is allowed (it does nothing) and the context starts **entirely at zero** (`t_job job = {0}` below): a field not yet filled is `NULL`.

The steps become small functions that take the context and return 0 (succeeded) or -1 (failure already reported and cleaned up):

```c
/* Splits job->line into name, age and city (copies in job->name and job->city). */
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

/* Stores the current person in the array, grown by doubling when needed. */
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
	job->name = NULL;                               /* the array owns them now */
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

The **ownership** rule fits in two lines of `store_person`: as long as `name` and `city` are in the context, it frees them; once stored in the array, the array does, and the context sets them back to `NULL` so they are not freed twice.

Measured on both versions (`gcc` 12.4):

| | Original version | With a context |
|---|---|---|
| `load_people` | 98 lines | 19 lines |
| Other functions | none | `split_line` 24, `store_person` 23, `fail_job` 13 |
| Duplicated cleanup blocks | 7 | 1 (`fail_job`) |
| Parameters of each step | | 1 (`t_job *job`) |

The length ceiling chosen for a function is 100 lines: the original one (98) just fits, and length was not the defect, the seven exits to clean up were. The ceiling is a **safeguard** that forces you to ask the question, not a goal.

## Proving that every exit cleans up everything

The following harness writes four files (one valid with 5 lines, three invalid), then makes **the k-th allocation fail** for k = 1, 2, 3... until the load of the valid file succeeds (the `--wrap=malloc` technique of the chapter [Sanitizers and Allocation Tests](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation#injecting-allocation-failures), identical `wrap.c` file). The three invalid files check that every cause of refusal cleans up.

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

/* Makes the 1st, 2nd, 3rd... allocation fail until the load succeeds. */
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
			return ((void)puts("too many failures"));
	}
	set_fail_at(-1);
	printf("%s: %ld failures injected, all handled; the next one succeeds (%zu people)\n",
		path, k - 1, count);
	free_people(people, count);
}

static void	invalid_file(const char *path)
{
	size_t		count;
	t_person	*people;

	set_fail_at(-1);
	people = load_people(path, &count);
	printf("%s: %s (%zu people)\n", path, people ? "loaded" : "refused", count);
	free_people(people, count);
}

int	main(void)
{
	setvbuf(stdout, NULL, _IONBF, 0);               /* unbuffered output: not lost by LeakSanitizer */
	write_file("ok.txt", "Ada;36;London\nAlan;41;Wilmslow\nGrace;85;Arlington\n"
		"Linus;55;Portland\nMargaret;87;Boston\n");
	write_file("sep.txt", "Ada;36;London\nAlan 41 Wilmslow\n");
	write_file("age.txt", "Ada;36;London\nAlan;abc;Wilmslow\n");
	write_file("name.txt", "Ada;36;London\n;41;Wilmslow\n");
	inject_failures("ok.txt");
	invalid_file("sep.txt");
	invalid_file("age.txt");
	invalid_file("name.txt");
	invalid_file("absent.txt");
	return (0);
}
```

```bash
# people_old.c: original version; people_new.c: version with a context
gcc -g -fsanitize=address -Wl,--wrap=malloc test_people.c people_old.c wrap.c -o test_old
gcc -g -fsanitize=address -Wl,--wrap=malloc test_people.c people_new.c wrap.c -o test_new
./test_old 2> log_old.txt; echo "exit code: $?"
./test_new 2> log_new.txt; echo "exit code: $?"
```

`setvbuf(stdout, NULL, _IONBF, 0)` removes the `stdout` buffer: without it, a leak detected by LeakSanitizer would make a program's [output disappear](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation#sanitizers-what-they-check) when redirected to a file. The program's error messages and ASan's reports both go to `stderr`, so into `log_old.txt` and `log_new.txt`.

Standard output, identical for both versions:

```
ok.txt: 13 failures injected, all handled; the next one succeeds (5 people)
sep.txt: refused (0 people)
age.txt: refused (0 people)
name.txt: refused (0 people)
absent.txt: refused (0 people)
```

| | Original version | With a context |
|---|---|---|
| Exit code | 1 | 0 |
| In the error log | `Direct leak of 24 byte(s) in 3 object(s)`, `Direct leak of 19 byte(s) in 3 object(s)`, `SUMMARY: AddressSanitizer: 43 byte(s) leaked in 6 allocation(s)` | no report |
| Refusal messages | `sep.txt:2: missing separator`, `age.txt:2: invalid age`, `name.txt:2: empty name`, `absent.txt: cannot open` | the same |

The three loads of the original version where the array growth fails (at the 1st, 3rd and 5th person) leak the name and city being processed: 3 names (4 + 6 + 9 = 19 bytes) and 3 cities (7 + 10 + 7 = 24 bytes), so 6 blocks and 43 bytes. It is exactly the cleanup copy that differs from the others. In the version with a context, this path goes through `fail_job`, which frees `job->name` and `job->city` without asking itself the question.

## The pitfalls

Two discipline mistakes, measured on the version with a context:

| Mistake | What happens (measured) |
|---|---|
| Forgetting to set `job->name` and `job->city` back to `NULL` after `store_person` | A failure on the next line frees both fields a first time through the array, a second time through `fail_job`: `ERROR: AddressSanitizer: attempting double-free` |
| Writing `t_job job;` instead of `t_job job = {0};` | The fields contain whatever the stack contained. This run, under ASan and UBSan: **no report**, everything passes (the stack happened to be zero). Under valgrind: `Conditional jump or move depends on uninitialised value(s)`, then `Use of uninitialised value of size 8` |

> **Pitfall:** an uninitialized context can pass every test under ASan, while `fail_job` calls `free` on a field that holds a random value. Initialize to zero at the declaration, no exception.
>
> **Pitfall:** a "catch-all" context where you put whatever you want to share between different tasks (a load's file, the application's settings, a display counter): it becomes a set of global variables again. One context per **task**, created at the start and destroyed at the end of that task.
>
> **Pitfall:** splitting to reach a line ceiling without looking at the cleanup. A short function with seven `return` statements that each clean up in their own way remains fragile.
>
> **Best practice:** write the ownership rule as a comment next to the transfer (`/* the array owns them now */`), initialize the context to zero, one single error exit function that frees everything, and test it by failure injection.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A big function that cleans up at every error exit duplicates its cleanup (7 times in the example, 98 lines); one copy ends up differing (here, 43 bytes leak when the array growth fails). A work context (`struct`) passed by pointer gathers what the steps share; one single `fail_job` function frees everything. Result: a 19-line function, three steps of 13 to 24 lines, no leak over 13 injected failures. |
| **Tools you can use** | A context `struct` initialized with `{0}`; `free(NULL)` allowed; a single exit function; `-fsanitize=address` with `-Wl,--wrap=malloc` to make the k-th allocation fail; valgrind for uninitialized values. |
| **Pitfalls to avoid** | Six parameters per sub-function; global variables (not reentrant); forgetting to set a pointer back to `NULL` after transferring it (double free); an uninitialized context (silent under ASan); a catch-all context; splitting for a line ceiling without looking at the exits. |
| **Best practices** | One context per task; an ownership rule written where the transfer happens; one single error exit that frees everything; test every exit by failure injection; the length ceiling (100 lines) as a safeguard, not a goal. |
