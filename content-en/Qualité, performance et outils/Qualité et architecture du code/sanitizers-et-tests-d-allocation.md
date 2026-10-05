---
order: 11
---

# Sanitizers and Allocation Tests

A memory bug in C almost never crashes the program where the mistake is made: it corrupts a neighboring cell, and the damage only shows up later, or never. This chapter presents the tools that make these bugs visible (**sanitizers** and [**valgrind**](https://valgrind.org)), the technique that **makes `malloc` fail on purpose** to test paths you never meet in normal runs, and then the precautions that keep **the testing tool itself** from being wrong: a test that accuses correct code (a **false positive**) wastes as much time as a bug.

The memory bugs themselves (overflow, use after `free`, leak) are described in [the four classic memory bugs](/?c=langages&s=c&p=memoire#the-four-classic-memory-bugs); the chapter [Fuzzing Tools](/?c=securite&s=securite-offensive&p=outils-de-fuzzing) shows their use on the security side.

## Sanitizers: what they check

A **sanitizer** is a compile option that adds checks to the program, run while it executes, and stops it with a precise report as soon as an error is found. Three are useful day to day with [`gcc` and `clang`](/?c=langages&s=c&p=compilation):

| Sanitizer | Option | What it detects |
|---|---|---|
| **ASan** ([AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html)) | `-fsanitize=address` | Read or write outside an allocated block, use of a block after `free` |
| **LSan** ([LeakSanitizer](https://clang.llvm.org/docs/LeakSanitizer.html)) | included in ASan on Linux | Leak: a block never freed by the end of the program |
| **UBSan** ([UndefinedBehaviorSanitizer](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html)) | `-fsanitize=undefined` | Undefined behavior: an operation the language does not define, such as a signed integer overflow (an `int` going past its maximum value, 2,147,483,647) |

A demo program with four defects, chosen by an argument (`./bugs 1` to `./bugs 4`):

```c
#include <stdio.h>
#include <stdlib.h>
#include <limits.h>

int main(int argc, char **argv)
{
	int mode = argc > 1 ? atoi(argv[1]) : 0;      /* number of the defect to trigger */
	int *tab = malloc(4 * sizeof *tab);           /* block of 4 integers: 16 bytes */

	if (!tab)
		return (1);
	if (mode == 1)
		tab[4] = 7;                       /* writes one cell past the end */
	if (mode == 2)
	{
		free(tab);
		printf("%d\n", tab[0]);           /* reads after free */
		return (0);
	}
	if (mode == 3)
		return (0);                       /* forgets free(tab) */
	if (mode == 4)
	{
		int big = INT_MAX;

		printf("%d\n", big + argc);       /* signed integer overflow */
	}
	free(tab);
	return (0);
}
```

```bash
# -g: line numbers in the report; -fno-omit-frame-pointer: readable call stack
gcc -g -O0 -fno-omit-frame-pointer -fsanitize=address,undefined bugs.c -o bugs_san
gcc -g -O0 bugs.c -o bugs_plain               # same program, no sanitizer
```

Measured with `gcc` 12.4 (Ubuntu 24.04):

| Defect | Normal program | Program with sanitizers |
|---|---|---|
| `./bugs 1`: write past the end | ends without a word (exit code 0) | `ERROR: AddressSanitizer: heap-buffer-overflow`, line 13, exit code 1 |
| `./bugs 2`: read after `free` | prints a random value (`256822755`) | `ERROR: AddressSanitizer: heap-use-after-free`, line 17, exit code 1 |
| `./bugs 3`: leak | ends without a word (exit code 0) | `ERROR: LeakSanitizer: detected memory leaks`, `16 byte(s) leaked in 1 allocation(s)`, exit code 1 |
| `./bugs 4`: integer overflow | prints `-2147483647` | `runtime error: signed integer overflow: 2147483647 + 2 cannot be represented in type 'int'` |

The compiler also sees the obvious cases: with `-Wall -Wextra`, `gcc` 12.4 warns at compile time that `tab` is used after `free` (`-Wuse-after-free`, line 17). ASan covers what the compiler's analysis cannot follow, for example a pointer freed in another function.

The start of ASan's report for `./bugs 1` (shortened) names the fault, the place of the write, then the place of the allocation:

```
==10298==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x502000000020 ...
WRITE of size 4 at 0x502000000020 thread T0
    #0 0x586fed0cc470 in main bugs.c:13
0x502000000020 is located 0 bytes after 16-byte region [0x502000000010,0x502000000020)
allocated by thread T0 here:
    #0 0x718c5acfd9c7 in malloc ...
    #1 0x586fed0cc3ca in main bugs.c:8
```

Each `#0`, `#1`... line is a level of the **call stack** (the list of functions being executed, from the most recent to the oldest). The report says here: "4 bytes written right after a 16-byte block, allocated on line 8".

**The exit code** (the value the program returns to whoever launched it, 0 meaning "all is well": see [exit and return codes](/?c=langages&s=c&p=exit-et-codes-de-retour)) is not the same for all of them: ASan stops the program with code 1, but UBSan **prints its message and lets the program carry on**, with code 0. Measured: `UBSAN_OPTIONS=halt_on_error=1` gives code 1 for `./bugs 4`.

> **Pitfall:** an automated test that only looks at the exit code lets every UBSan error through. Either enable `halt_on_error=1`, or search for `runtime error` in the error output (`stderr`, see [system calls and file descriptors](/?c=langages&s=c&p=appels-systeme-et-descripteurs)).
>
> **Pitfall (the program's output disappears):** when LeakSanitizer finds a leak, it ends the process without flushing the `stdout` [buffer](/?c=langages&s=bash&p=redirections-et-pipes). Measured: a program that writes 4 lines with `printf` and then leaks produces **0 bytes** in a file (`./program > output.txt`), whereas the 4 lines show up in a terminal. A test that compares the output with an expected result then sees an empty output and blames the wrong culprit: read LeakSanitizer's report on `stderr` first.

## What it costs, and what it does not see

**valgrind** is the other big family: it runs the program in a virtual machine that watches every memory access, **without recompiling** (`valgrind --leak-check=full ./bugs_plain 1`). On the first three defects it gives the same verdict as ASan (invalid write line 13, invalid read line 17, `16 bytes in 1 blocks are definitely lost`).

A test program that fills a 32 MB array then walks through it 100 times, measured on an AMD Ryzen 7 6800H, three identical measurements:

| Run | Duration | Peak memory | Duration factor |
|---|---|---|---|
| No tool | 0.23 s | 34 MB | × 1 |
| ASan | 0.67 s | 42 MB | × 2.9 |
| ASan + UBSan | 0.78 s | 44 MB | × 3.4 |
| valgrind | 3.25 s | 87 MB | × 14 |

The factors depend on the program: this one does almost nothing but memory accesses, exactly what these tools watch, so the overhead is marked. Each tool also has blind spots:

| | ASan + UBSan (`gcc`) | valgrind | MSan (`clang -fsanitize=memory`) |
|---|---|---|---|
| Recompilation needed | yes | no | yes |
| Out-of-bounds write, read after `free`, leak | detected | detected | out of scope |
| Signed integer overflow | detected (message, the program carries on) | **not detected** (measured: prints `-2147483647`, code 0) | out of scope |
| Read of an **uninitialized** value | **not detected** (measured: code 0, no message) | detected (`Conditional jump or move depends on uninitialised value(s)`) | detected (`use-of-uninitialized-value`) |

> **Pitfall:** believing a program that is "clean under ASan" has no memory bug. A value read before being written (`malloc` zeroes nothing) goes through ASan. Also run under valgrind, or under [MSan](https://clang.llvm.org/docs/MemorySanitizer.html) with `clang` (which cannot be combined with ASan: `clang: error: invalid argument '-fsanitize=address' not allowed with '-fsanitize=memory'`).
>
> **Best practice:** sanitizers during development and in [continuous integration](/?c=infrastructure-devops&s=ci-cd&p=pipeline-cicd) (fast), valgrind before a release or for a program you cannot recompile.

## Limiting the memory of a test under ASan

A test that allocates a lot must have a memory ceiling, so that a mistake does not make the whole machine crawl (see [resource safeguards](/?c=infrastructure-devops&s=administration-systeme&p=garde-fous-de-ressources)). ASan calls for two precautions.

**`ulimit -v` must not be used with ASan.** This command caps the process's virtual address space; but ASan reserves a very large range (about 14 TiB) for its tracking table. Measured with `ulimit -v 1000000` (about 1 GB):

```
==10351==ERROR: AddressSanitizer failed to allocate 0xdfff0001000 (15392894357504) bytes ... (errno: 12)
==10351==ReserveShadowMemoryRange failed while trying to map 0xdfff0001000 bytes. Perhaps you're using ulimit -v
```

The program did not even start: this is not a bug in the program.

**`ASAN_OPTIONS=hard_rss_limit_mb=N`** stops the program when the memory it actually occupies (*RSS*, the physical memory in use) exceeds `N` MB. Measured on a program that allocates and fills 10 MB per turn:

| Limit requested | Message | Memory when it stopped |
|---|---|---|
| 200 MB | `AddressSanitizer: hard rss limit exhausted (200Mb vs 249Mb)` | 249 MB |
| 300 MB | `AddressSanitizer: hard rss limit exhausted (300Mb vs 505Mb)` | 505 MB |

The check is **periodic**: the program keeps allocating between two checks, so the limit is not a strict ceiling (here 505 MB for 300 requested). For a ceiling that is never exceeded, use a kernel control group (`systemd-run --user --scope -p MemoryMax=2G -p MemorySwapMax=0`), described in the safeguards chapter; `hard_rss_limit_mb` remains useful to get a **clear message** rather than a silent death of the process.

## Injecting allocation failures

`malloc` returns `NULL` when memory runs out, and a correct program must then free everything and report the error. But `malloc` almost always succeeds: these failure paths **never** run during tests, and a bug can sit in them for years. The technique is to make the **k-th** allocation fail, for k = 1, 2, 3... until everything succeeds.

The option `--wrap=malloc` (passed to the **linker**, the program that assembles the compiled files into a single executable, with `-Wl,` on the gcc side) redirects every call to `malloc` in the program to a `__wrap_malloc` function you write yourself, which can call the real `malloc` under the name `__real_malloc` ([`ld` documentation](https://sourceware.org/binutils/docs/ld/Options.html)).

```c
#include <stdlib.h>

void	*__real_malloc(size_t size);            /* the real malloc, provided by the linker */

static long	g_calls;                            /* number of calls to malloc since the start */
static long	g_fail_at = -1;                     /* number of the call to make fail (-1: none) */

void	set_fail_at(long k)
{
	g_calls = 0;
	g_fail_at = k;
}

void	*__wrap_malloc(size_t size)             /* called instead of malloc */
{
	g_calls++;
	if (g_calls == g_fail_at)
		return (NULL);                          /* allocation number k "fails" */
	return (__real_malloc(size));
}
```

The program under test copies two strings into a structure. The `FIXED` version frees what was already allocated when an allocation fails; the old version forgets to:

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

/* Copies two strings. Returns NULL if an allocation fails. */
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
		free(pair->first);                      /* free(NULL) is allowed */
		free(pair->second);
#endif
		free(pair);
		return (NULL);
	}
	return (pair);
}

int	main(void)
{
	for (long k = 1; k <= 4; k++)               /* at most 3 mallocs succeed: we test k = 1..4 */
	{
		t_pair	*p;

		set_fail_at(k);
		p = pair_new("hello", "everyone");
		printf("k=%ld: %s\n", k, p ? "success" : "failure handled");
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

| Version | Measured result |
|---|---|
| Old (no freeing) | `ERROR: LeakSanitizer`, `Direct leak of 9 byte(s)` and `Direct leak of 6 byte(s)`, `15 byte(s) leaked in 2 allocation(s)`, exit code 1 |
| Fixed | `k=1: failure handled`, `k=2: failure handled`, `k=3: failure handled`, `k=4: success`, exit code 0 |

The two leaks match the two cases where one copy succeeds and the other fails: `k=2` (the copy of `"hello"` fails, the one of `"everyone"`, 9 bytes with the `\0`, leaks) and `k=3` (the one of `"everyone"` fails, the one of `"hello"`, 6 bytes, leaks). Without this injection, these two paths never run, and ASan can say nothing about code that is not executed.

The wrapper only sees the calls to `malloc` **written in the code you link yourself**. Measured: after a `strdup("hello")` (which calls `malloc` inside the C library), the wrapper's counter is 0; after the program's own `malloc(8)`, it is 1. The internal allocations of `printf` or `strdup` are therefore neither counted nor tested: to test the failure of a `strdup`, write your own `copy` with `malloc`, as above.

| Technique | What it affects | Limit |
|---|---|---|
| `-Wl,--wrap=malloc` | Only the program's own calls to `malloc` | Must be recompiled and linked with the wrapper |
| `LD_PRELOAD=./libfail.so` (a library that replaces `malloc` for the whole process) | **Every** `malloc`, C library included, without recompiling | Also affects the tools launched with the variable |

> **Pitfall (`LD_PRELOAD`):** the environment variable is inherited by every process launched afterwards. Measured with a library that makes the process's second allocation fail: `LD_PRELOAD=./libfail.so valgrind -q true` stops with `sh: 0: Out of space` and exit code 2, just like `LD_PRELOAD=./libfail.so sh -c 'echo ok'`: the shell and the tool you launch suffer the failure instead of the program under test. Put the variable only in front of the command of the program under test, never exported, and prefer `--wrap` when you can recompile.

## Validating the test tool on the old faulty code

A test that has never failed proves nothing: you do not know whether it can detect the defect. Before trusting it, run it on **the known faulty old code**: it must condemn it. This is the principle of [mutation testing](/?c=tests&p=tests-de-mutation), applied here by hand.

The example tests a function that reads a positive integer of 1 to 9 digits. The old code accepts the empty string and does not limit the length; the new code fixes both. The harness compares each version with an **independent reference** (written differently, with [`strtol`](https://man7.org/linux/man-pages/man3/strtol.3.html)) on the same inputs, following the [differential test](/?c=tests&p=property-based-testing#a-neighboring-case-differential-testing):

```c
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef int	(*t_parse)(const char *s, int *out);

/* Old code: accepts the empty string (no digit read, value 0). */
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

/* New code: at least one digit, at most 9 digits, nothing else. */
static int	parse_new(const char *s, int *out)
{
	size_t	len = strspn(s, "0123456789");

	if (len == 0 || len > 9 || s[len] != '\0')
		return (-1);
	*out = atoi(s);
	return (0);
}

/* Independent reference: strtol, with every check. */
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

/* Returns 1 if the implementation and the reference diverge on this input. */
static int	differs(t_parse impl, const char *s)
{
	int	a = -1, b = -1;
	int	ra = impl(s, &a), rb = reference(s, &b);

	return (ra != rb || (ra == 0 && a != b));
}
```

The harness does three things: an **exhaustive sweep** (every string of 0 to 4 characters taken from `05- a`, that is 781 inputs), a **fuzz** (100,000 random strings of 0 to 12 characters, see [fuzzing tools](/?c=securite&s=securite-offensive&p=outils-de-fuzzing)) and the **replay of the cases that already failed**, kept in files `regress/1.txt`, `regress/2.txt`... The random generator is an [xorshift](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible) with a fixed seed: the same inputs come back on every run, so a failure can be reproduced.

```c
static unsigned	g_state = 2463534242u;           /* state of the xorshift32 generator */

static unsigned	next_random(void)
{
	g_state ^= g_state << 13;
	g_state ^= g_state >> 17;
	g_state ^= g_state << 5;
	return (g_state);
}

/* Writes the faulty input to regress/<n>.txt, unless an identical one is already kept. */
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

/* Replays the kept inputs (regress/1.txt, 2.txt...): returns the number of divergences. */
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
	printf("%s: %d kept inputs replayed, %d divergences\n", name, files, bad);
	return (bad);
}

/* Exhaustive sweep: every string of 0 to 4 characters of the alphabet. */
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
				printf("%s: first divergence on \"%s\"\n", name, buf);
		}
	}
	printf("%s: sweep of %d inputs, %d divergences\n", name, tested, bad);
	return (bad);
}

/* Fuzz: random strings of 0 to 12 characters, divergences kept in regress/. */
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
	printf("%s: fuzz of %d draws, %d divergences\n", name, rounds, bad);
	return (bad);
}

int	main(void)
{
	int	bad_old = sweep(parse_old, "old") + fuzz(parse_old, "old", 100000);
	int	bad_new;

	replay(parse_old, "old");
	bad_new = replay(parse_new, "new") + sweep(parse_new, "new")
		+ fuzz(parse_new, "new", 100000);

	printf("tool validated on the old code: %s\n", bad_old ? "yes (it condemns it)" : "NO");
	return (bad_new != 0);
}
```

Measured output (the `regress/` directory must exist before the run; `mkdir regress`):

```
old: first divergence on ""
old: sweep of 781 inputs, 1 divergences
old: fuzz of 100000 draws, 8873 divergences
old: 3 kept inputs replayed, 3 divergences
new: 3 kept inputs replayed, 0 divergences
new: sweep of 781 inputs, 0 divergences
new: fuzz of 100000 draws, 0 divergences
tool validated on the old code: yes (it condemns it)
```

Three lessons:

- **The harness condemns the old code** (1 divergence in the sweep, 8,873 in the fuzz) and acquits the new one (0 everywhere): we know both verdicts mean something.
- **The exhaustive sweep only saw one of the two defects.** It stops at 4 characters, so the empty string (`""`) is found, but never the defect of numbers that are too long. The fuzz, which goes up to 12 characters, finds the strings of 10 digits and more (`regress/2.txt` holds `3582159301`): the old code reads them into a `long` then truncates them into an `int`, and the reference rejects them. An exhaustive sweep only covers what its alphabet and its maximum length allow.
- **Every failure found by the fuzz becomes a permanent test.** The `regress/*.txt` files are replayed first on every run: the defect cannot come back without the harness flagging it.

> **Pitfall:** a reference that shares the reasoning of the code under test (same `strspn`, same bug) always agrees with the code. Write the reference differently, or take it from a standard library function.
>
> **Pitfall:** comparing the new code only with the old one, without a reference: if both are wrong in the same way, no divergence appears.

## False positives of the test tool

A **false positive** is an alert that accuses correct code: the defect is in the test tool, not in the program. Before fixing anything, **confirm the alert on the old code**: rerun the same test on the previous version ([`git stash`](/?c=qualite-performance-et-outils&s=git&p=stash), or [`git worktree add ../before <commit>`](/?c=qualite-performance-et-outils&s=git&p=worktree)). If the alert also appears on the old code, it does not come from the change, and it is often the tool that is wrong. In a real review of a graphics program, 7 alerts out of 7 came from the test tool, none from the program.

| Cause of the false positive | Symptom | Remedy |
|---|---|---|
| The checker compares **numbers** (vertex numbers, identifiers) | Two identical objects are declared different as soon as they are renumbered | Compare the content (coordinates, values), in a canonical order |
| The test reads a value **before** the call that changes it | Expected value missing | Read after the call |
| The tool is **recompiled while a series is running** | A series mixes the results of two versions | Never rerun the build during a series; build in another folder then replace |
| A **mouse cursor** appears in a screenshot | The image's bounding box is wrong | `ffmpeg -draw_mouse 0` (see [measuring what the application displays](/?c=infrastructure-devops&s=administration-systeme&p=touche-coincee-clavier-virtuel-xtest)) |
| An effect **pulses** (varying brightness) | Two captures of the same scene differ | Normalize the brightness of each image before comparing |

**Comparing numbers.** Two identical meshes (a square made of two triangles), the second with its vertices renumbered:

```python
# Two identical meshes: the second is renumbered (the vertices are in another order).
vertices_a = [(0, 0), (1, 0), (0, 1), (1, 1)]            # vertex number 0, 1, 2, 3
triangles_a = [(0, 1, 2), (1, 3, 2)]                     # each triangle cites numbers

order = [2, 0, 3, 1]                                     # order[j]: old vertex placed at position j
vertices_b = [vertices_a[i] for i in order]
new_number = {old: new for new, old in enumerate(order)}
triangles_b = [tuple(new_number[i] for i in t) for t in triangles_a]

# Fragile checker: compares vertex numbers.
print("by numbers      :", "identical" if triangles_a == triangles_b else "DIFFERENT (false positive)")

# Robust checker: compares coordinates, in a canonical order.
def shape(vertices, triangles):
    return sorted(tuple(sorted(vertices[i] for i in t)) for t in triangles)

print("by coordinates  :", "identical" if shape(vertices_a, triangles_a) == shape(vertices_b, triangles_b) else "DIFFERENT")
```

```
by numbers      : DIFFERENT (false positive)
by coordinates  : identical
```

**Reading before the call.** The fragile test keeps the value from before; the correct test reads it after:

```c
#include <stdio.h>

static int	g_count;                            /* counter changed by the function under test */

static void	register_item(void)
{
	g_count++;
}

int	main(void)
{
	int	before = g_count;                       /* read BEFORE the call: it is 0 */

	register_item();
	printf("fragile test: g_count is %d, expected 1: %s\n", before, before == 1 ? "ok" : "FAIL (false positive)");
	printf("correct test: g_count is %d, expected 1: %s\n", g_count, g_count == 1 ? "ok" : "FAIL");
	return (0);
}
```

```
fragile test: g_count is 0, expected 1: FAIL (false positive)
correct test: g_count is 1, expected 1: ok
```

**Recompiling during a series.** A series of 6 launches spaced 0.3 s apart; the tool is rebuilt (version 2) then replaced with `mv` after 0.7 s:

```bash
gcc -DVERSION='"tool v1"' tool.c -o tool                  # first version of the tool
( for i in 1 2 3 4 5 6; do ./tool; sleep 0.3; done ) > series.txt &   # series started in the background
sleep 0.7
gcc -DVERSION='"tool v2"' tool.c -o tool.new && mv tool.new tool      # rebuild during the series
wait; cat series.txt
```

```
tool v1
tool v1
tool v1
tool v2
tool v2
tool v2
```

No error, no warning: the linker or `mv` replace the file even while it is in use. The series contains the results of two different tools, and the gap observed between the first 3 and the last 3 launches says nothing about the program under test.

**Normalizing brightness.** A program whose rendering pulses (brightness going up and down) produces two different captures of the same scene. Simulation on a 16-pixel image, once at full brightness, once at 0.6; normalization divides each pixel by the image's mean:

```python
def image(brightness):
    """4 x 4 image: a fixed pattern multiplied by the brightness of the moment."""
    pattern = [[(x + 2 * y) % 5 + 1 for x in range(4)] for y in range(4)]
    return [[round(v * brightness * 40) for v in row] for row in pattern]

def flatten(img):
    return [v for row in img for v in row]

def max_gap(a, b):
    return max(abs(p - q) for p, q in zip(flatten(a), flatten(b)))

def normalize(img):
    mean = sum(flatten(img)) / 16
    return [[v / mean for v in row] for row in img]

def max_gap_normalized(a, b):
    return max(abs(p - q) for p, q in zip(flatten(normalize(a)), flatten(normalize(b))))

bright = image(1.0)                                 # scene at full brightness
dark = image(0.6)                                   # same scene, 0.6 times darker
print("raw maximum gap        :", max_gap(bright, dark), "levels out of 255")
print("normalized maximum gap :", round(max_gap_normalized(bright, dark), 4))
```

```
raw maximum gap        : 80 levels out of 255
normalized maximum gap : 0.0
```

The raw gap (80 levels out of 255) would fail a comparison test although the scene is identical; after normalization it drops to 0. On real captures, the gap does not drop to exactly 0 (compression noise, rounding): set a tolerance threshold measured on two captures of the same scene.

> **Pitfall:** fixing the program before confirming the alert on the old code. You "repair" a defect that does not exist, and may introduce a real one.
>
> **Pitfall:** validating the tool only on correct code. It must also condemn a known faulty code (previous section): otherwise it may stay silent by default and detect nothing.
>
> **Best practice:** for any unexpected alert, three questions in order: has the tool changed? does the alert exist on the old code? what does a comparison made differently say (content rather than numbers, after normalization)?

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A memory bug in C often goes unnoticed: `-fsanitize=address,undefined` (ASan: out-of-bounds accesses and use after `free`; LeakSanitizer: leaks; UBSan: undefined behavior) makes them visible for a cost of about ×3 in duration and ×1.2 in memory, against ×14 and ×2.6 for valgrind. Making the k-th `malloc` fail (`-Wl,--wrap=malloc`) runs the failure paths that no normal test reaches. A test tool is validated by running it on known faulty code, and an alert is confirmed on the old code before blaming the new one. |
| **Tools you can use** | `gcc`/`clang` with `-fsanitize=address,undefined -g -fno-omit-frame-pointer`; `UBSAN_OPTIONS=halt_on_error=1`; `valgrind --leak-check=full`; MSan (`clang -fsanitize=memory`) for uninitialized values; `ASAN_OPTIONS=hard_rss_limit_mb=N`; `systemd-run ... -p MemoryMax=...`; `-Wl,--wrap=malloc`; a harness with exhaustive sweep + fixed-seed fuzz + inputs kept in `regress/`. |
| **Pitfalls to avoid** | `ulimit -v` with ASan (the program does not start); looking only at the exit code (UBSan carries on, code 0); believing a program "clean under ASan" has no uninitialized value (ASan does not see it); `stdout` lost when LeakSanitizer ends the process; an exported `LD_PRELOAD` that breaks the tools launched afterwards; a reference that shares the code's bug; comparing numbers rather than content; rebuilding the tool during a series; reading a value before the call that changes it; validating a test only on correct code. |
| **Best practices** | Sanitizers in development and continuous integration, valgrind before release; inject the failure of each allocation (k = 1, 2, 3...) and check leak and message; run the test tool on known faulty old code before trusting it; keep every fuzz failure as a permanent test; confirm any unexpected alert on the old code; compare content and normalize what varies (brightness) before comparing two renderings. |
