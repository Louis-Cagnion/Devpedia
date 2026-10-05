---
order: 13
---

# One Error Message per Cause

An error message is read at a precise moment: when a program has just failed and its reader does not know why. It must then tell them **what to fix**, without making them reread the code. This chapter shows, on a program that reads a port number from a file, three ways of writing these messages (one text shared by every cause, a text "fixed" by assuming the cause, one text per cause) and what each one costs the person who receives the error. It also shows that an error path that forgets to close a file ends up producing... an error with a misleading message.

The rules kept: **one message per cause** (never the same text for two causes, never an empty message nor an exit with an error and no message); it **names the faulty element** (file, line, field, value received); it gives the **real cause** read from the system (`strerror(errno)`), never an assumed one; it contains no line break.

## The example: reading `port=NNNN` from a file

The program reads the first line of a configuration file, which must be `port=` followed by a number from 1 to 65535. It exists in three versions, chosen by an argument (`./cfg 1 file`, `./cfg 2 file`, `./cfg 3 file`). Errors go to [`stderr`](/?c=langages&s=c&p=appels-systeme-et-descripteurs), the standard error stream; the **exit code** (0 if all is well, 1 on failure) is the one described in [exit and return codes](/?c=langages&s=c&p=exit-et-codes-de-retour).

**Version 1** writes the same message whatever the cause, converts with `atoi` (which returns 0 for any text and silently stops at the first letter) and forgets to close the file on two paths:

```c
#include <errno.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

/* Version 1: one message shared by every cause, a file never closed on one path. */
static int	load_v1(const char *path, int *port)
{
	FILE	*f = fopen(path, "r");
	char	line[64];

	if (!f || !fgets(line, sizeof line, f))
	{
		fprintf(stderr, "error: cannot load config\n");
		return (-1);
	}
	*port = atoi(line + 5);                         /* 0 for anything, 80 for "80x" */
	if (*port <= 0 || *port > 65535)
	{
		fprintf(stderr, "error: cannot load config\n");
		return (-1);                                /* fclose forgotten on this path */
	}
	fclose(f);
	return (0);
}
```

**Version 2** is the "fix" of someone who only tested the case of a missing file: every open failure becomes "file not found":

```c
/* Version 2: "fixed" by assuming the cause: every open failure becomes "not found". */
static int	load_v2(const char *path, int *port)
{
	FILE	*f = fopen(path, "r");
	char	line[64];

	if (!f)
	{
		fprintf(stderr, "error: %s: file not found\n", path);
		return (-1);
	}
	if (!fgets(line, sizeof line, f))
	{
		fprintf(stderr, "error: cannot load config\n");
		fclose(f);
		return (-1);
	}
	*port = atoi(line + 5);
	fclose(f);
	if (*port <= 0 || *port > 65535)
	{
		fprintf(stderr, "error: cannot load config\n");
		return (-1);
	}
	return (0);
}
```

**Version 3** gives one message per cause, with the file, the line and the value received, checks that the path is a regular file with [`stat`](https://man7.org/linux/man-pages/man2/stat.2.html), converts with [`strtol` and its checks](/?c=langages&s=c&p=convertir-un-texte-en-nombre), and closes the file in **a single place**:

```c
static int	report(const char *path, int line_no, const char *fmt, ...)
{
	va_list	args;

	if (line_no)
		fprintf(stderr, "%s:%d: ", path, line_no);
	else
		fprintf(stderr, "%s: ", path);
	va_start(args, fmt);
	vfprintf(stderr, fmt, args);
	va_end(args);
	fputc('\n', stderr);
	return (-1);
}

/* Reads "port=NNNN": one message per cause, with the file, the line and the value received. */
static int	parse_port(const char *path, const char *line, int *port)
{
	char	*end;
	long	value;

	if (strncmp(line, "port=", 5) != 0)
		return (report(path, 1, "expected \"port=\", got \"%.20s\"", line));
	errno = 0;
	value = strtol(line + 5, &end, 10);
	if (end == line + 5 || *end)
		return (report(path, 1, "port \"%.20s\" is not a number", line + 5));
	if (errno == ERANGE || value < 1 || value > 65535)
		return (report(path, 1, "port %ld is out of range (1 to 65535)", value));
	*port = (int)value;
	return (0);
}

/* Version 3: each cause has its message; the file is closed in a single place. */
static int	load_v3(const char *path, int *port)
{
	struct stat	st;
	FILE		*f;
	char		line[64];
	int			rc;

	if (stat(path, &st) != 0)
		return (report(path, 0, "%s", strerror(errno)));
	if (!S_ISREG(st.st_mode))
		return (report(path, 0, "not a regular file"));
	f = fopen(path, "r");
	if (!f)
		return (report(path, 0, "%s", strerror(errno)));
	if (!fgets(line, sizeof line, f))
		rc = report(path, 0, ferror(f) ? "%s" : "empty file", strerror(errno));
	else
	{
		line[strcspn(line, "\n")] = '\0';           /* the message must not contain a line break */
		rc = parse_port(path, line, port);
	}
	fclose(f);
	return (rc);
}
```

```c
int	main(int argc, char **argv)
{
	int	failed = 0;

	if (argc < 3)
		return (fprintf(stderr, "usage: %s 1|2|3 file...\n", argv[0]), 2);
	for (int i = 2; i < argc; i++)
	{
		int	port = 0, rc;

		if (strcmp(argv[1], "1") == 0)
			rc = load_v1(argv[i], &port);
		else if (strcmp(argv[1], "2") == 0)
			rc = load_v2(argv[i], &port);
		else
			rc = load_v3(argv[i], &port);
		if (rc == 0)
			printf("port=%d\n", port);
		failed |= rc != 0;
	}
	return (failed);
}
```

The test files, one per cause (the file `absent.cfg` is not created: it does not exist), and the build:

```bash
printf 'port=8080\n' > ok.cfg                 # valid
: > empty.cfg                                 # empty
printf 'listen=80\n' > noprefix.cfg           # no "port="
printf 'port=abc\n' > abc.cfg                 # not a number
printf 'port=\n' > novalue.cfg                # missing value
printf 'port=99999\n' > big.cfg               # outside 1 to 65535
printf 'port=80x\n' > trail.cfg               # number followed by a character
mkdir dir.cfg                                 # a directory
printf 'port=8080\n' > noperm.cfg; chmod 000 noperm.cfg   # file without read permission
gcc -Wall -Wextra -g -fsanitize=address,undefined cfg.c -o cfg
```

## What the person reading the error receives

Message displayed by each version (`./cfg 1 file`, `./cfg 2 file`, `./cfg 3 file`), measured; the exit code is 1 on every failure:

| File | Real cause | Version 1 | Version 2 | Version 3 |
|---|---|---|---|---|
| `absent.cfg` | the file does not exist | `error: cannot load config` | `error: absent.cfg: file not found` | `absent.cfg: No such file or directory` |
| `noperm.cfg` | read permission denied | `error: cannot load config` | `error: noperm.cfg: file not found` (**wrong**) | `noperm.cfg: Permission denied` |
| `dir.cfg` | it is a directory | `error: cannot load config` | `error: cannot load config` | `dir.cfg: not a regular file` |
| `empty.cfg` | empty file | `error: cannot load config` | `error: cannot load config` | `empty.cfg: empty file` |
| `noprefix.cfg` | no `port=` | `error: cannot load config` | `error: cannot load config` | `noprefix.cfg:1: expected "port=", got "listen=80"` |
| `abc.cfg` | not a number | `error: cannot load config` | `error: cannot load config` | `abc.cfg:1: port "abc" is not a number` |
| `novalue.cfg` | missing value | `error: cannot load config` | `error: cannot load config` | `novalue.cfg:1: port "" is not a number` |
| `big.cfg` | outside 1 to 65535 | `error: cannot load config` | `error: cannot load config` | `big.cfg:1: port 99999 is out of range (1 to 65535)` |
| `trail.cfg` | `80x`: not a number | **accepted: `port=80`**, code 0 | **accepted: `port=80`**, code 0 | `trail.cfg:1: port "80x" is not a number` |
| `ok.cfg` | valid | `port=8080` | `port=8080` | `port=8080` |

Three defects can be read in this table.

- **One text for eight causes** (version 1): the user does not know whether to create the file, change its permissions, fix the value or put it in another range.
- **A value wrongly accepted**: `atoi("80x")` is 80, so `80x` silently passes for port 80 (the strict conversion with `strtol`, which checks where the reading ended, refuses it); `atoi("abc")` is 0, and this 0 falls into the range test instead of being refused as "not a number".
- **An assumed cause** (version 2): `noperm.cfg` exists, but the message claims "file not found". This message is **worse than the vague one**: it sends you looking for a file that is there, instead of looking at its permissions. Version 3 reads the real cause in `errno` with `strerror`.

## The error path that forgets to close

In version 1, two error paths forget `fclose`: the one where `fgets` fails (empty file) and the one where the port is out of range. Every call that fails leaves a **file descriptor** open (the number the system gives to an open file, see [system calls and file descriptors](/?c=langages&s=c&p=appels-systeme-et-descripteurs)), and a process only has a limited number of them. Here, 60 reads of the file `big.cfg` (refused) then one of the valid file `ok.cfg`, with at most 50 descriptors (`ulimit -n 50`):

```bash
for v in 1 2 3; do
  echo "--- version $v"
  ( ulimit -n 50; ASAN_OPTIONS=detect_leaks=0 ./cfg $v $(yes big.cfg | head -60) ok.cfg 2>&1 | sort | uniq -c | sort -rn )
done
```

```
--- version 1
     61 error: cannot load config
--- version 2
     60 error: cannot load config
      1 port=8080
--- version 3
     60 big.cfg:1: port 99999 is out of range (1 to 65535)
      1 port=8080
```

With version 1, all 61 reads fail with **the same message**, including the one of the valid file: the descriptors are exhausted, `fopen` fails, and the program answers "cannot load config". Nothing in the message lets you link this failure to a leak. Version 2 closes the file before the range test and version 3 closes it in a single place: the valid file is read.

On a valid file, but with no descriptor available (`ulimit -n 3`: only standard input, output and error are open), version 3 gives **the real cause** where version 1 keeps its shared text. The executable is statically linked (`-static`) because the library loader of a normal executable itself needs a descriptor:

```bash
gcc -static -Wall -Wextra -g cfg.c -o cfg_static
sh -c 'ulimit -n 3; exec ./cfg_static 1 ok.cfg'      # version 1
sh -c 'ulimit -n 3; exec ./cfg_static 3 ok.cfg'      # version 3
```

```
error: cannot load config
ok.cfg: Too many open files
```

> **Pitfall:** a descriptor leak is not a memory leak: LeakSanitizer does not see it (measured: no report for version 1, the C library keeps track of open files). It is found by lowering the descriptor limit (`ulimit -n`) during a test.

## Writing one message per cause

| Rule | Why |
|---|---|
| One message **per cause**, never the same text for two causes | The reader knows what to fix without rereading the code |
| Never an empty message, nor an `exit(1)` without a message | A failure without text cannot be diagnosed |
| Name the **faulty element**: file, line, field, **value received** (`port "abc" is not a number`) | The reader finds the place to fix |
| Give the **real cause** read from the system (`strerror(errno)`), never an assumed one | A wrong message sends you looking in the wrong place |
| No line break nor control character in the message | A message split over two lines reads badly and filters badly; here, the line read kept its `\n` before being cleaned |
| With several inputs, say **which one** is at fault | `big.cfg:1:` rather than "invalid port" |
| Close and free **in a single place**, on every path | An error path no longer leaks when it goes through the same cleanup as the normal path (see [A Work Context to Split a Big Function](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=contexte-de-travail-pour-decouper-une-fonction)) |
| Write to `stderr`, not to `stdout` | The program's result stays usable, errors go elsewhere |

## Never announce "fixed" without a real test

Version 2 gives the impression of a fix: on `absent.cfg`, the message changed and it is right. Yet it was validated on **a single case**, the only one its author imagined, and it is wrong on `noperm.cfg`. What allows saying a message is fixed:

| Step | Example here |
|---|---|
| Produce **every** cause for real (not only the most frequent one) | The nine test files, including a directory and a file without permission |
| Run and **read** the message of each case | The table above, cell by cell |
| Check that the valid case still passes | `ok.cfg` gives `port=8080` in the three versions |
| Push to the system's limits | `ulimit -n 50` revealed the descriptor leak |
| Compare with the previous behavior on the same inputs | The table puts the three versions side by side |

> **Pitfall:** deducing the cause of a failure from the sole place where it happens ("`fopen` failed so the file does not exist"). `fopen` also fails for a refused permission, a directory or too many open files: you have to read `errno`.
>
> **Pitfall:** checking a fix on the case that motivated the change and on that case alone. You must replay **all** the causes, and the valid case.
>
> **Best practice:** for each cause of failure, a test file or input that produces it, replayed after every change to the messages.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | An error message must say what to fix: one message per cause, naming the file, the line and the value received, with the real cause read from `errno` (`strerror`). A text shared by every cause cannot be diagnosed; a text that assumes the cause ("file not found" for a refused permission) is worse. In the example, version 1 accepted `80x` as port 80 and exhausted its descriptors on two error paths, until it refused a valid file with the same message. |
| **Tools you can use** | `strerror(errno)`; `stat` and `S_ISREG` to refuse a directory; `strtol` with a check of the end of reading, of `errno` and of the range; a `report` function that prefixes file and line; `ulimit -n` to check that no descriptor leaks; `ASAN_OPTIONS=exitcode=...` to tell ASan's failure from the program's. |
| **Pitfalls to avoid** | The same message for several causes; an empty message or `exit(1)` without text; an assumed cause; `atoi` (accepts `80x`, returns 0 for `abc`); a line break in the message; forgetting to close a file on an error path; believing a fix is right after a single test. |
| **Best practices** | One message per cause with file, line and value received; the real cause read from the system; a single cleanup for every path; a test input per cause, replayed after every change; the valid case and the system's limits (`ulimit -n`) tested before saying "fixed". |
