---
order: 2
---

# The Terminal: Entering Commands

The previous chapter explains that [code is a list of instructions](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers)—but how do you actually give a command to a computer without clicking on an icon? That’s the role of the terminal.

## Two Ways to Control a Computer

| | Graphical User Interface (GUI) | Command Line Interface (CLI) |
|---|---|---|
| How to issue a command | By clicking on icons, buttons, or menus | By typing a text command |
| Practical example | Drag a file to the trash | Type a command to delete that file |
| Main advantage | Immediately visual; nothing to memorize | Precise, repeatable, automatable (execute the same instruction 100 times in a single run) |

**GUI** (*Graphical User Interface*) and **CLI** (*Command-Line Interface*) are the two abbreviations you’ll see everywhere to refer to these two worlds. This site focuses primarily on the latter.

> **Pitfall:** assuming that deletion via the command line goes through a recycle bin, as it does in a GUI. Most delete commands are **permanent** and immediate, with no recovery option.
>
> **Best practice:** Before entering a command that modifies or deletes something, double-check exactly what it targets—there’s no “undo” button afterward.

## The terminal and the shell: two different things

Two words come up all the time and are often confused:

- The **terminal** is the program that displays a text window: it receives what you type and displays the response it receives. It doesn't understand anything on its own.
- The **shell** is the program that receives this text from the terminal, interprets it, and actually executes it.

```text
Vous tapez : ls
      │
      ▼
Terminal (la fenêtre)   →  transmet le texte tapé
      │
      ▼
Shell (l'interpréteur)  →  comprend "ls", demande au système la liste des fichiers
      │
      ▼
Résultat affiché dans le terminal
```

> **Analogy:** The terminal is the phone receiver; the shell is the person you’re talking to. The receiver doesn’t understand your request—it simply transmits your voice and sends the response back to you.

> **Learn more:** This site provides in-depth coverage of two widely used shells—[Bash](/?c=shells&s=bash&p=bash) (Linux/macOS) and [PowerShell](/?c=shells&s=powershell&p=powershell) (Windows)—each with its own set of commands.

> **Pitfall:** Trying to “fix” a command that isn’t working by switching terminal applications. The appearance (colors, font, tabs) depends on the terminal; the available commands depend solely on the shell—changing one never changes the other.
>
> **Best practice:** When a command fails, first ask yourself, “Which shell is interpreting it, and does it recognize it?” before questioning the terminal itself.

## Open a terminal

| System | How to open it |
|---|---|
| Windows | Start menu → type "Terminal" or "PowerShell" → Enter |
| macOS | Spotlight (`Cmd + Espace`) → type "Terminal" → Enter |
| Linux | Depending on the desktop environment: often `Ctrl + Alt + T`, or in the applications menu |

Once opened, the terminal displays a line ending with a symbol (`>`, `$`, `%`...) followed by a blinking cursor: this is the **prompt**. It waits for you to type something—nothing runs until you press `Input`.

> **Pitfall:** On Windows, confusing **the Command Prompt** (`cmd.exe`, the original Windows shell) with **PowerShell**—the two look similar, but their commands and syntax differ significantly.
>
> **Best practice:** On a recent computer, use PowerShell (more comprehensive; see [dedicated chapter](/?c=shells&s=powershell&p=powershell)) instead of Command Prompt, unless there is a specific reason to use the latter.

## Anatomy of a Command

A **command** is the name of an instruction that the shell can execute. It may be followed by **arguments** (the object on which the command acts) and options (which change its behavior, usually preceded by `-` or `--`):

```text
ls -l /home
│  │  │
│  │  └── argument : le dossier concerné
│  └───── option : affiche les détails (taille, date...)
└──────── commande : lister le contenu d'un dossier
```

The exact names of commands vary from one shell to another (`ls` in Bash becomes `Get-ChildItem` in PowerShell)—this is the subject of the chapters on [Bash](/?c=shells&s=bash&p=bash) and [PowerShell](/?c=shells&s=powershell&p=powershell) chapters, not this one: here, only the general structure (command, options, arguments) matters.

> **Pitfall:** An option that seems harmless can disable a safety feature—an option such as “force” or “no confirmation” (often `-f` / `--force`) actually removes the “Are you sure?” prompt that a command would otherwise display.
>
> **Best practice:** If you’re unsure about the exact effect of an option in a command you’ve copied online, look it up (`--help`, documentation) before executing it—never after.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | The **terminal** displays and transmits the text you type; the **shell** interprets and actually executes it. A **command** consists of a name, `-x`, and arguments. Nothing is executed un`Input` |
| **Available tools** | The terminal already installed on your system (see table above)—no additional installation is required to get started. |
| **Pitfalls to Avoid** | Confusing the terminal with the shell: Changing the terminal’s appearance never changes the available commands, which depend solely on the shell. Typing a copied command without knowing what it does, especially if it modifies or deletes files. |
| **Best Practices** | Read the output displayed after each command before entering another one. If you are unsure about the effect of a command you found online, look up what it does before executing it, rather than after. |
