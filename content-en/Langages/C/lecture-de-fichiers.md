---
order: 22
---

# Reading a File Line by Line: `fopen`, `fgets`, `getline`

The chapter on [system calls](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) covers `open()`/`read()`/`close()`: raw calls, with no formatting, that require a round trip to the kernel for every read. The C standard library (*libc*) provides a layer on top of these, **streams** (type `FILE *`), which add an internal buffer: they read one large block at once, then hand out the data bit by bit, without making a new system call for every small read.

| | Raw system calls | Buffered streams (libc) |
|---|---|---|
| Functions | `open()`, `read()`, `close()` | `fopen()`, `fgets()`/`getline()`, `fclose()` |
| Type handled | An integer (file descriptor) | A `FILE *` (stream) |
| Splitting into lines | Up to the program | Done by `fgets()`/`getline()` |
| Manual page | Section 2 (`man 2 open`) | Section 3 (`man 3 fopen`) |

## Opening a Stream: `fopen()`

```c
FILE *fp = fopen("fichier.txt", "r");
if (!fp) {
    perror("fopen");
    return 1;
}
```

`fopen()` returns `NULL` on failure (missing file, insufficient permissions...): like any call that can fail, its return value must be checked before the stream is used.

## `fgets()`: A Fixed-Size Buffer Provided by the Caller

```c
char buf[256];

while (fgets(buf, sizeof(buf), fp) != NULL) {
    printf("line read: %s", buf);
}
fclose(fp);
```

Signature: `char *fgets(char *s, int size, FILE *stream)`.

| Parameter | Role |
|---|---|
| `s` | The destination buffer, already allocated by the caller |
| `size` | The size of this buffer (always `sizeof(buf)`, never a manually copied constant) |
| `stream` | The stream opened by `fopen()` |

`fgets()` returns `s` if a line was read, `NULL` at the end of the file or on error.

> **Pitfall:** if a line in the file exceeds `size - 1` characters, `fgets()` stops at the buffer limit **without reading the rest of the line**: the next call picks up where it left off. A "logical line" that is too long can therefore end up split across several calls if the buffer is too small.

## `getline()`: A Buffer That the Function Allocates Itself

```c
char *line = NULL;
size_t capacity = 0;
ssize_t len;

while ((len = getline(&line, &capacity, fp)) != -1) {
    printf("line read (%zd characters): %s", len, line);
}
free(line);
fclose(fp);
```

Signature (POSIX): `ssize_t getline(char **lineptr, size_t *n, FILE *stream)`.

| Parameter | Role |
|---|---|
| `lineptr` | Address of a `char *`, initialized to `NULL` before the first call: `getline()` allocates/reallocates it itself |
| `n` | Address of a `size_t`, initialized to `0`: `getline()` tracks the currently allocated capacity in it |
| `stream` | The stream opened by `fopen()` |

`getline()` returns the number of characters read (excluding the final `'\0'`) if a line was read, `-1` at the end of the file or on error. Unlike `fgets()`, it **reallocates** until the line has been read in full: no truncation is possible, no matter how long the line is.

> **Note:** in both cases, the trailing `'\n'` character is **kept** in the buffer (except possibly on the very last line of the file, if it has no final newline). This must be taken into account before comparing the content read to an expected value.

> **Best practice:** the buffer allocated by `getline()` must be freed by the caller with `free()`, even if it was reallocated several times internally over the course of the calls.

## Closing the Stream: `fclose()`

```c
fclose(fp);
```

Every successful `fopen()` must be matched by exactly one `fclose()`, following the same principle as `malloc()`/`free()` (see [Memory Management](/?c=langages-de-programmation&s=c&p=memoire)) or `open()`/`close()`.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `fopen`/`fgets`/`getline`/`fclose` are libc functions that add a buffering layer (`FILE *`) on top of raw system calls (`open`/`read`/`close`). `fgets` uses a fixed-size buffer provided by the caller (risk of truncation); `getline` allocates and reallocates its own buffer (never truncates). |
| **Tools you can use** | `fopen`, `fgets`, `getline`, `fclose`, `perror` to diagnose a failed open. |
| **Pitfalls to avoid** | Not checking the return value of `fopen()` (`NULL`) before use. A line longer than `fgets()`'s buffer gets split across several calls. Forgetting to `free()` the buffer allocated by `getline()`. Forgetting that `'\n'` remains in the line read. |
| **Best practices** | Always check `fopen()` before use. Prefer `getline()` over `fgets()` as soon as line length isn't guaranteed to be bounded. One `fclose()` for every successful `fopen()`. |
