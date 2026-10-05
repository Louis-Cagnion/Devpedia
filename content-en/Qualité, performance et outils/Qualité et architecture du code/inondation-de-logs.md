---
order: 10
---

# Log Flooding: Report Each Cause Only Once

A **log** is the trace a program writes to say what it is doing and what is going wrong. In C, error messages go to **`stderr`**, the standard error stream (file descriptor number 2, see [system calls and file descriptors](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs)), which is shown in the terminal or redirected to a file. **Log flooding** happens when the same message is written thousands of times: the useful information drowns, and the program slows down from writing. This chapter shows how it happens in a loop that runs continuously, and how to avoid it with a bounded list of causes already reported.

## Why a Loop Repeats Its Message

A **render loop** is the loop of a graphical program: on each turn, it draws one image on the screen (see [the render loop](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)). An error message placed in this loop is therefore written **on every frame**.

```c
/* Runs on every frame: one error message per loop turn. */
GLint loc = glGetUniformLocation(program, "light_dir");
if (loc == -1)
	fprintf(stderr, "uniform light_dir missing\n");
```

Here, a **`uniform`** is a value the C program sets for the **shader** (the small program run by the graphics card), and `glGetUniformLocation` returns `-1` when the name does not exist: see [shaders](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#shaders-the-graphics-card-s-programs). Two causes are possible: a typo in the name, or a variable the compiler removed because it is useless in the shader.

| Loop rate | Lines written per second | Lines in 1 hour |
|---|---|---|
| 60 frames/s (60 Hz screen, [vertical synchronization](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#vertical-synchronization-vsync) on) | 60 | 216,000 |
| About 150 frames/s (no synchronization) | 150 | 540,000 |

The consequences pile up:

- the message **hides** the others, because the first useful error scrolls off the screen within seconds;
- writing to a terminal is **slow**: it can cost more than the drawing itself;
- redirected to a file, it makes the file **grow endlessly** until the disk is full.

> **Pitfall:** believing an error message is always harmless. In a loop, it is the frequency that does the damage, not the content of the message.

## Once per Cause: the Bounded List

The error message is useful **once**. The solution is to remember the causes already reported and stop writing for them. A **cause** here is a short text that identifies the problem (`"uniform:light_dir"`): two different causes are each reported once, one same cause never twice.

```c
#include <stdio.h>
#include <string.h>

#define MAX_CAUSES 16                      /* maximum number of causes remembered */
#define CAUSE_SIZE 64                      /* maximum length of a cause, '\0' included */

/* Returns 1 the first time a cause is seen, 0 afterwards (or if the list is full). */
static int	first_report(const char *cause)
{
	static char	seen[MAX_CAUSES][CAUSE_SIZE];   /* static: kept from one call to the next */
	static int	count;                          /* static: starts at 0, never reset */

	for (int i = 0; i < count; i++)
		if (strcmp(seen[i], cause) == 0)
			return (0);                     /* already reported: stay quiet */
	if (count == MAX_CAUSES)
		return (0);                         /* list full: memory stays bounded */
	snprintf(seen[count++], CAUSE_SIZE, "%s", cause);
	return (1);
}

/* In the render loop: */
if (loc == -1 && first_report("uniform:light_dir"))
	fprintf(stderr, "uniform light_dir missing\n");
```

The **`static`** keyword in front of a local variable makes it live for the whole program instead of disappearing when the function ends (see [memory in C](/?c=langages-de-programmation&s=c&p=memoire)): this is what lets the list remember from one call to the next. The `strcmp` function compares two strings and returns 0 if they are identical; `snprintf` copies while stopping at the given size.

Measured over 1,000 frames with two missing uniforms (`light_dir` and `shininess`):

| | Lines on `stderr` |
|---|---|
| Message on every frame | 2,000 |
| Once per cause | 2 |

The measurement is done by simply counting lines: `./program 2>&1 | wc -l` redirects `stderr` to standard output (`2>&1`) then counts the lines (`wc -l`).

## Limits of This Solution

| Choice | Effect | When to use it |
|---|---|---|
| List of causes already reported (above) | Each cause appears once, bounded memory | Errors that are finite in number and known in advance |
| At most one message per second | The message comes back regularly, useful for a problem that goes away then returns | Long-running program, where "still broken" matters |
| Counter shown at the end | "uniform light_dir missing (repeated 3,400 times)" in one line at shutdown | When the frequency is itself information |

> **Pitfall:** a full list no longer reports anything. With 16 slots, the seventeenth different cause is silent. Plan a ceiling well above the number of expected causes, and consider writing a last line "too many different causes, later messages suppressed" when the list fills up.
>
> **Pitfall:** a cause that is too long is truncated to `CAUSE_SIZE - 1` characters by `snprintf`: two causes that differ only after that limit are confused. Keep cause identifiers short (`"uniform:light_dir"`), not the full text of the message.
>
> **Best practice:** never write without limit to `stderr` from a loop that runs on every frame, every request or every line read. While writing the message, ask: "how many times can this line run during the lifetime of the program?"

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | An error message placed in a loop is written on every turn: 60 to 150 lines per second in a render loop. It hides the other messages, slows the program down and can fill the disk. It is reported only once per cause. |
| **Tools you can use** | A bounded list of causes already reported (`static` array and `strcmp`); the `2>&1` redirection and `wc -l` to count the lines produced. |
| **Pitfalls to avoid** | Writing to `stderr` on every frame; a full list that goes quiet without warning; long causes truncated and confused. |
| **Best practices** | One log line per cause, never per occurrence; bound the list's memory; measure the number of lines produced on a real run. |
