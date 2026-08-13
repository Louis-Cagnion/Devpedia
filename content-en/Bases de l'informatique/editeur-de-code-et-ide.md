---
order: 3
---

# The code editor and the IDE

A [code file](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) is a text file: technically, you could write it using [Notepad](https://learn.microsoft.com/en-us/windows/win32/menurc/notepad) or [TextEdit](https://support.apple.com/guide/textedit/welcome/mac). In practice, no one does that: a dedicated tool makes writing code much more convenient.

## Simple text editor vs. code editor

| | Simple text editor (Notepad, TextEdit) | Code editor |
|---|---|---|
| What it does | Displays and edits plain text | Displays and edits text, recognizing that it is code |
| Syntax highlighting | No: all text is the same color | Yes: keywords, text strings, comments... each has its own color |
| Writing assistance | None | Auto-completion, error detection, code navigation |

**Syntax highlighting** involves displaying each type of code element in a different color, so that its structure is visible at a glance, without even having to read every word. You can see a concrete example right here on this page: every code block on Devpedia is highlighted in this way.

```python
# This is a comment       -> a color
name = "Jean"                    # "Jean" is a text string -> a different color
```

> **Pitfall:** Using a word processor (Word, WordPad) to write code. Beyond the lack of syntax highlighting, these programs silently replace certain characters with their “typographical” equivalents (curly quotes `“ ”` instead of `" "`, long dashes...), changes that are invisible to the eye but render the code syntactically invalid.
>
> **Best practice:** Always write code in a **plain-text** editor (either a basic text editor or a code editor), never in a word processor, even “just to troubleshoot.”

## The IDE: a code editor plus integrated tools

**IDE** stands for *Integrated Development Environment*: in addition to editing code, it combines tools that would otherwise be used separately into a single application.

| Integrated Tool | Role |
|---|---|
| Built-in terminal | A [terminal](/?c=bases-de-l-informatique&p=le-terminal) right in the window, without having to open another one alongside it |
| "Run" button | Runs the program without having to type the command manually: behind the scenes, it does exactly the same thing as if you had typed it into a terminal |
| Error Detection | Flags a potential error before the code is even executed (e.g., a parenthesis that was never closed) |
| Debugger | Allows you to execute the code step by step to observe the state of the data at each step |

> **Note:** The line between a “simple code editor” and a “full-featured IDE” is not strictly defined: an editor like VS Code starts out lightweight, but becomes similar to an IDE once extensions are installed for a given language.

> **Pitfall:** In a project with multiple files, assuming that the "Run" button always reruns the file currently displayed on the screen: many IDEs remember a separate **launch configuration**, which may target a file other than the one you're viewing, without clearly indicating this.
>
> **Best practice:** If the result doesn't change despite a modification, check which file is actually being executed before looking for a bug elsewhere.

| Tool | Category | Target languages |
|---|---|---|
| VS Code | Extensible code editor | General-purpose: supports almost everything via extensions |
| PyCharm | Full-featured IDE | Python |
| Visual Studio (not to be confused with VS Code) | Full-featured IDE | C, C++, C#, .NET |

## Where to Start

To get started, a free, general-purpose editor like **VS Code** (available on Windows, macOS, and Linux) will more than cover your needs for the first few chapters of this site, regardless of which language you end up learning; there’s no need for an IDE dedicated to a specific language until you really need one.

> **Pitfall:** Installing many extensions all at once “just in case”: not only does this slow down the editor, but overlapping extensions (e.g., two syntax highlighting extensions for the same language) can conflict with each other, making it difficult to determine which one is responsible for unexpected behavior.
>
> **Best practice:** Install one extension at a time, only when a specific need arises, not in anticipation of future needs.

---

## 📋 Summary

| | |
|---|---|
| **Key Takeaways** | A code editor provides syntax highlighting and coding assistance that a simple text editor lacks. An IDE goes a step further: an integrated terminal, a "Run" button, error detection, and a debugger, all bundled into a single application. |
| **Tools to Use** | A general-purpose editor like VS Code to get started; a dedicated IDE (PyCharm, Visual Studio, etc.) only once a specific language has been chosen. |
| **Pitfalls to Avoid** | Writing code in a plain text editor (Notepad, TextEdit) without syntax highlighting or error detection, there’s nothing technically stopping you from doing this, but every error becomes much harder to spot. |
| **Best Practices** | The "Run" button in an IDE doesn't do anything magical: it runs the same command that a terminal would execute; understanding this command is still useful even if you never type it out by hand. |
