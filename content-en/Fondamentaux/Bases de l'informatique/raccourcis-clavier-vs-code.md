---
order: 4
---

# Being efficient with code through keyboard shortcuts

Once [VS Code](/?c=bases-de-l-informatique&p=editeur-de-code-et-ide) is installed, the mouse still works for everything, but every trip back to it costs time a keyboard shortcut would save. This chapter covers the VS Code shortcuts most useful day to day; on macOS, `Ctrl` becomes `Cmd` for most of them.

## Navigating the project tree

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+E` | Open/close the file explorer (the project tree, on the side) |
| `Ctrl+P` | Open a file by its name, without navigating the tree with the mouse |
| Up/Down arrows in the explorer | Move to the next/previous file or folder |
| Right/Left arrow on a folder | Expand/collapse that folder |

`Ctrl+P` saves the most time day to day: typing a few letters of a file's name opens it directly, without ever expanding the tree by hand to find it.

## Moving around quickly within a file

| Shortcut | Action |
|---|---|
| `Ctrl+G` | Jump directly to a line number |
| `Ctrl+Shift+O` | Jump to a symbol in the file (a function, a class...) by its name |
| `Ctrl+Left/Right Arrow` | Jump one word forward/backward, instead of one character at a time |
| `Ctrl+Up/Down` (or `Alt+Arrow` depending on the layout) | Jump to the next/previous code block |

`Ctrl+Shift+O` relies on the same code analysis as an [IDE's error detection](/?c=bases-de-l-informatique&p=editeur-de-code-et-ide): VS Code already knows where each function or class in the file starts, this shortcut just jumps there directly instead of scrolling through the file by eye.

## Multiple selection and multi-cursor

Multi-cursor places several active insertion points at once: a keystroke then applies to every cursor at the same time, instead of just one.

```text
Before (1 cursor)              After Alt+Click x3 (3 cursors)

name = "Alice"                  name = "Alice"
name2 = "Bob"                   name2 = "Bob"
name3 = "Eve"                   name3 = "Eve"
                                 ^ each | represents an active cursor
```

| Shortcut | Action |
|---|---|
| `Alt+Click` | Add a cursor at the clicked location |
| `Ctrl+D` | Select the next occurrence of the already-selected word (repeat to select several at once) |
| `Ctrl+Shift+L` | Select **all** occurrences of the already-selected word in the file |
| `Ctrl+Alt+Up/Down` | Add a cursor directly above/below the current cursor |

> **Pitfall:** using repeated `Ctrl+D` presses to rename a variable everywhere it appears in the file. This is a blind **textual** rename: it also touches a variable name that happens to share the same text inside a comment or a string.
>
> **Best practice:** to rename a variable everywhere it's actually used in the code (without touching comments or textual coincidences), use the IDE's symbol rename (`F2` in VS Code) rather than multi-cursor.

## Managing open file tabs

| Shortcut | Action |
|---|---|
| `Ctrl+W` | Close the active tab |
| `Ctrl+Shift+T` | Reopen the last closed tab |
| `Ctrl+Tab` | Switch to the next tab |
| `Ctrl+K` then `Ctrl+W` | Close all open tabs |

## Markdown preview

For a `.md` file (like this one), `Ctrl+Shift+V` opens a preview showing the final rendered output (headings, tables, links) alongside the source text, without leaving the editor to check the formatting.

## The command palette: beyond fixed shortcuts

`Ctrl+Shift+P` opens the **command palette**: a text search that gives access to any VS Code action, including ones without a dedicated keyboard shortcut.

> **Best practice:** for a repeated action whose shortcut isn't known by heart, open the command palette and type a few words describing what you're trying to do, rather than hunting through menus with the mouse. The palette also shows the shortcut tied to each matching command, which helps memorize it over time.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | `Ctrl+P` opens a file by its name, `Ctrl+Shift+O` jumps to a symbol in the file, `Alt+Click`/`Ctrl+D` place multiple cursors to edit several spots at once, `Ctrl+Shift+P` opens the command palette that gives access to any editor action. |
| **Usable tools** | The command palette (`Ctrl+Shift+P`) to find an action without knowing its shortcut. |
| **Pitfalls to avoid** | Renaming a variable with multi-cursor (repeated `Ctrl+D`) instead of symbol rename (`F2`): it also touches textual coincidences inside comments and strings. |
| **Best practices** | Use `F2` for a reliable variable rename. Check the command palette to discover and progressively memorize shortcuts. |
