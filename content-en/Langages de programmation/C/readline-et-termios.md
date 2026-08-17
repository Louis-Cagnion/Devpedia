---
order: 19
---

# `readline` and `termios`: Controlling the Command Line

A program that simply reads standard input with `read()` receives the text exactly as the terminal delivers it: nothing before the user presses Enter, no handling of arrow keys, no history of previous commands. This default behavior is called **canonical mode** (*cooked mode*): the terminal itself handles line editing (backspace, cursor movement) before passing the final text to the program. Two tools make it possible to go beyond this default mode: the `readline` library, and the `termios` API for controlling the terminal's mode itself.

## `readline`: An Editable Input Line, with History

The [`readline`](https://tiswww.case.edu/php/chet/readline/rltop.html) library provides a complete input line: editing with arrow keys, navigation through the history of previous commands (up/down arrow), without the program having to reimplement this mechanism itself:

```c
#include <readline/readline.h>
#include <readline/history.h>

int main(void)
{
    char *ligne;

    while ((ligne = readline("my_shell$ ")) != NULL) {
        if (*ligne) {
            add_history(ligne);   // adds this line to history (up arrow retrieves it)
        }

        printf("You typed: %s\n", ligne);
        free(ligne);   // readline() allocates the line: must be freed manually
    }

    return 0;
}
```

`readline()` displays the prompt given as an argument, handles line editing while the user types, and returns the final line once Enter is pressed (`NULL` if the user closes input with Ctrl-D). `add_history()` makes this line accessible via the up arrow on subsequent inputs.

> **Note:** `readline()` allocates the returned string with `malloc()`: it is up to the caller to free it with `free()`, exactly like any other dynamically allocated pointer (see [Memory management](/?c=langages-de-programmation&s=c&p=memoire)).

## `termios`: Changing the Terminal Mode Itself

`readline` handles the editing of a classic input line, but some programs need **every key press immediately**, without waiting for Enter, and without the terminal automatically displaying what is typed (a text-mode game, a password entry). This is the role of the POSIX `termios` API: it directly controls the terminal's mode.

```c
#include <termios.h>
#include <unistd.h>

struct termios ancien, nouveau;

tcgetattr(STDIN_FILENO, &ancien);   // saves the terminal's current configuration
nouveau = ancien;
nouveau.c_lflag &= ~(ICANON | ECHO);   // disables canonical mode AND automatic echo
tcsetattr(STDIN_FILENO, TCSANOW, &nouveau);   // applies the new mode

// ... reads key by key, without waiting for Enter, without automatic echo ...

tcsetattr(STDIN_FILENO, TCSANOW, &ancien);   // restores the original mode before exiting
```

| Flag (`c_lflag`) | Role | Disabled for... |
|---|---|---|
| `ICANON` | Canonical mode: the terminal only transmits a line after Enter | Receiving each key immediately (raw mode) |
| `ECHO` | The terminal automatically displays what is typed | Controlling what is displayed yourself (masked password, custom interface) |

> **Pitfall:** modifying the terminal with `tcsetattr()` without ever restoring its original configuration before the program exits. The user's terminal is then left in raw mode after the program closes: no more echo of typed keys, no more normal line editing in the shell that regains control, a terminal that appears "broken" until the user manually resets it (`reset` or `stty sane`).
>
> **Best practice:** always save the original configuration (`tcgetattr()`) before modifying it, and explicitly restore it (`tcsetattr()`) on every possible exit path of the program, including on an interrupt signal (see [UNIX Signals](/?c=langages-de-programmation&s=c&p=signaux-unix)) or an error, not just on the normal exit path.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Canonical mode (the default) leaves the terminal in charge of line editing; `readline` provides an editable input line with history without reimplementing this mechanism; `termios` allows disabling this mode to receive each key immediately (raw mode). |
| **Tools you can use** | `readline()`/`add_history()` for an input line with history. `tcgetattr()`/`tcsetattr()` and the `ICANON`/`ECHO` flags to control the terminal's mode. |
| **Pitfalls to avoid** | Modifying the terminal with `tcsetattr()` without ever restoring its original configuration, leaving the user's terminal in raw mode after the program closes. |
| **Best practices** | Save the original configuration before modification, and restore it on every possible exit path of the program (normal, error, signal). |
