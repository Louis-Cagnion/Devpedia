---
order: 9
---

# Limiting a program's resources

A program that uses too much **main memory** (the **RAM**, where the computer keeps whatever the running programs need) doesn't just crash: it can freeze the whole machine. When the RAM is full, the system spills over onto **swap**, an area of the disk used as backup memory, hundreds of times slower: the mouse stutters, the terminal stops responding. If even the swap fills up, the **kernel** (the central program of the system, which shares memory, processor and disk among all the others) triggers its **OOM killer** (*Out Of Memory*): it kills a process to free some space, but not necessarily the one at fault, sometimes the user's whole graphical session.

This chapter shows how to set **safeguards**: limits set before launching a program, so that it is the program that stops when it exceeds them, never the machine.

## When do you need them

| Situation | Why it uses a lot of resources |
|---|---|
| Test program with a memory leak or a loop that allocates endlessly | Nothing stops it before the machine is saturated |
| Robustness test (*fuzzing*: feeding thousands of random or malformed inputs) | A pathological input can make memory or time explode |
| Program built with a memory-error detector ([ASan](https://clang.llvm.org/docs/AddressSanitizer.html), or [valgrind](https://valgrind.org/docs/manual/manual.html)) | These tools watch every access and multiply memory and time several times over |
| Processing a very large file | The size of the input is not under control |

> **Rule:** any program whose maximum consumption is unknown is launched under a limit, even "just to try".

## Which resources to limit

| Resource | What can go wrong | Tool |
|---|---|---|
| Processor priority | The program hogs the CPU, the rest of the machine lags | `nice` |
| Processor share | The program permanently occupies several cores | `CPUQuota` (cgroup) |
| Memory | The RAM then the swap fill up, the machine freezes | `ulimit -v`, `MemoryMax` and `MemorySwapMax` (cgroup) |
| Disk | The program's reads and writes delay everything else | `ionice` |
| Duration | The program loops forever | `timeout`, `RuntimeMaxSec` (cgroup) |

## `nice` and `ionice`: going after the others

Every [process](/?c=langages&s=bash&p=gestion-des-processus) (a running program) has a **priority**: when several want the processor at the same time, the system serves the highest priorities first.

```bash
# nice -n 19: lowest priority (the scale goes from -20, the highest, to 19)
# ionice -c3: "idle" class, uses the disk only if nobody else needs it
nice -n 19 ionice -c3 ./my_program
```

- `nice` **limits nothing**: the program can still use all the available processor, but it steps aside as soon as another program needs it.
- Only `root` (the administrator account) can lower the `nice` value below 0, that is, give more priority.
- `ionice -c3` only has an effect if the **disk scheduler** (the kernel component that decides in which order to serve disk access requests) supports it, which is the case of BFQ; otherwise the instruction is ignored without any message.

## `ulimit -v`: a limit per process

`ulimit` sets limits on the current [shell](/?c=langages&s=bash&p=bash) (the program that reads the commands typed in the terminal) and on everything it launches. The `-v` option caps the **virtual memory** (the address space the program can reserve, even without having filled it), in kilobytes.

```bash
# in parentheses: temporary copy of the shell, the limit doesn't touch the terminal itself
( ulimit -v 200000; ./my_program )   # cap of about 200 MB
```

Beyond it, the memory reservation fails: in C, [`malloc`](/?c=langages&s=c&p=memoire) returns `NULL`, and a well-written program stops with a message. The limits of this tool:

| Limit | Consequence |
|---|---|
| Caps the **reserved** space, not the memory actually used | A program can fail while having written almost nothing |
| Applies to **each** process separately | A program that launches ten children can use ten times the cap |
| Incompatible with ASan, which reserves a very large virtual space | The program fails as soon as it starts (see [Sanitizers and Allocation Tests](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sanitizers-et-tests-d-allocation)) |

## cgroups and `systemd-run`: one cap for the whole group

**cgroups** (*control groups*) are the kernel mechanism that limits the consumption of a **group** of processes, children included: this is the building block that makes [containers](/?c=infrastructure-devops&s=docker&p=concepts-de-base) work. You don't have to handle them by hand: **systemd**, the program that starts and supervises everything running on a modern Linux machine, provides `systemd-run`, which launches a command in a cgroup created for it.

```bash
# --user  : for the current account, without administrator rights
# --scope : runs the command in a group of processes, in the foreground, in this terminal
systemd-run --user --scope \
	-p MemoryMax=300M \
	-p MemorySwapMax=0 \
	-p CPUQuota=50% \
	-p RuntimeMaxSec=20 \
	nice -n 19 ionice -c3 \
	./my_program > log.txt 2>&1
```

| Option | Role |
|---|---|
| `MemoryMax=300M` | RAM cap for the whole group: when exceeded, the kernel kills the group |
| `MemorySwapMax=0` | Forbids any swap: **essential**, without it the program spills onto the disk instead of being killed, and it's the machine that lags |
| `CPUQuota=50%` | At most half a core (`200%`: two cores) |
| `RuntimeMaxSec=20` | Maximum duration in seconds, then stop |

The last line redirects the program's output to a file (`> log.txt`), errors included (`2>&1`, see [redirections](/?c=langages&s=bash&p=redirections-et-pipes)). This is not a detail: if the machine freezes or the session is forcibly closed, the terminal and its contents disappear, whereas the file lets you understand afterwards what happened.

### Checking that the cap applies

A cap you have never seen trigger is only a hypothesis. You test it with a program that consumes on purpose: it reserves 1 MB at a time (`malloc`) and **writes** it (`memset`), because the system only really hands out RAM on writing, a mere reservation does not consume it.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MO (1024 * 1024)                 // gives the name MO to the value of one megabyte, in bytes

int main(void)
{
	for (int total = 1; total <= 1000; total++)
	{
		char *bloc = malloc(MO);         // asks the system for 1 MB
		if (bloc == NULL)                // refused: we stop with code 2
			return 2;
		memset(bloc, 1, MO);             // writes into it: the RAM is really used
		printf("%d Mo\n", total);
		fflush(stdout);                  // prints right away, even if the program is killed
	}
	return 0;
}
```

Launched under `MemoryMax=300M` and `MemorySwapMax=0`, it is killed before 300 MB, and the machine does not slow down.

## Reading the exit code

A program that ends returns an **exit code** (0 = success), readable right after with `echo $?`. A code above 128 means "killed by a **signal**" (a message sent by the system to a process, see [the chapter on processes](/?c=langages&s=bash&p=gestion-des-processus)): the signal number is the code minus 128.

| Code | Meaning | Typical case |
|---|---|---|
| `0` | Success | The program ended normally |
| `2` | Chosen by the program | The example above, `malloc` was refused (`ulimit` cap) |
| `124` | Duration exceeded | `timeout 60 ./my_program` |
| `137` | 128 + 9: `SIGKILL` signal | Memory cap exceeded, or OOM killer |
| `143` | 128 + 15: `SIGTERM` signal | Stop requested, for example at the end of `RuntimeMaxSec` |

## Several tests in parallel

Caps **add up**: three tests launched at the same time under 3 GB each can use 9 GB together.

| Step | Example for a 16 GB machine |
|---|---|
| 1. Set aside what keeps the session alive (system, browser, editor) | 6 GB |
| 2. Global cap for everything launched | 10 GB |
| 3. Number of tests × memory peak of one test (the most it uses at any moment) ≤ global cap | 4 tests × 2.5 GB = 10 GB |

A test that **measures a time** (speed comparison, duration of an operation) always runs alone, on an idle machine: programs sharing the processor and the disk distort the stopwatch. Only tests that judge a result (counting, comparing outputs) are launched together.

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A machine that freezes or swaps is a failure: the cap is set before launching the program, so that the program is the one that gets killed. `systemd-run --user --scope -p MemoryMax=… -p MemorySwapMax=0` caps the whole group; `nice` and `ionice` limit nothing, they only lower the priority. |
| **Tools you can use** | `systemd-run`, `nice`, `ionice`, `ulimit -v`, `timeout`, redirection `> log.txt 2>&1`. |
| **Pitfalls to avoid** | `MemoryMax` without `MemorySwapMax=0` (swap makes the machine lag); `ulimit -v` alone (per-process limit, and incompatible with ASan); caps whose sum exceeds the available RAM; output shown in the terminal only. |
| **Best practices** | Test the cap on a program that consumes on purpose; read the exit code (137 = killed); keep several GB for the session; time things alone. |
