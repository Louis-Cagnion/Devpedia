---
order: 8
---

# Expansion and Wildcards (Globbing)

Before running a command, Bash replaces certain patterns it contains with their actual value: [variables](/?c=shells&s=bash&p=variables) (`$name`), but also file patterns (*globbing*) and brace expansions. Understanding this step (invisible but systematic) explains why some commands behave differently depending on the quotes used.

## Globbing: `*`, `?`, `[]`

```bash
ls *.txt        # every file ending in .txt
ls file?.txt     # file1.txt, fileA.txt... ('?' = exactly 1 character, any one)
ls file[123].txt  # file1.txt, file2.txt, or file3.txt only
ls file[a-z].txt  # a single lowercase letter at this position
```

| Pattern | Means |
|---|---|
| `*` | Any sequence of characters (including empty) |
| `?` | Exactly one character, any one |
| `[abc]` | A single character among `a`, `b`, or `c` |
| `[a-z]` | A single character within this range |
| `[^abc]` | A single character that's neither `a`, `b`, nor `c` |

> **Note:** this is **not** a [regex](/?c=domain-specific-languages-dsl&p=regex): globbing is simpler, specific to how the shell itself interprets file names, even before the command is launched.

## Watch out: what happens if no file matches?

```bash
echo *.xyz
# if no .xyz file exists, Bash literally displays "*.xyz" (the pattern isn't replaced)
```

This is a classic source of bugs: a script that assumes `*.xyz` always refers to a list of actual files can receive the raw text `*.xyz` as its only "file name" if the folder contains nothing of the sort.

## Brace expansion

Generates several strings from a single pattern, **before** any search for actual files on disk:

```bash
echo file{1,2,3}.txt
# file1.txt file2.txt file3.txt

mkdir -p project/{src,tests,docs}
# creates all three folders in a single command

echo {1..5}
# 1 2 3 4 5

echo {a..e}
# a b c d e
```

> **Note:** unlike globbing, brace expansion doesn't depend on any existing file: `file{1,2,3}.txt` always generates these three strings, whether the matching files exist or not.

## Tilde expansion (`~`)

```bash
cd ~          # equivalent to cd $HOME
cd ~/projects  # equivalent to cd $HOME/projects
```

## Preventing expansion: quotes

```bash
echo *.txt      # replaced with the actual list of .txt files
echo "*.txt"     # literally displays *.txt -> double quotes disable globbing
echo '*.txt'     # same result, single quotes are even stricter (also disable $variable)
```

See also [Variables](/?c=shells&s=bash&p=variables) for the single/double quote distinction regarding `$variable` interpretation.

## The Backslash `\`: an Escape Character

Outside quotes, the backslash `\` removes the special meaning of the character that follows it: `\*` means a real star, `\ ` a real space in a file name. Bash then consumes the backslash itself, which disappears from the command ([Escape Character](https://www.gnu.org/software/bash/manual/html_node/Escape-Character.html)).

This is a common trap with **Git Bash**, the Bash installed on Windows with [Git for Windows](https://gitforwindows.org/): Windows paths precisely use `\` as the folder separator.

```bash
# opens a nonexistent folder in VS Code: Bash received C:Usersjohnproject
code C:\Users\john\project
# double quotes: backslashes in front of a letter are kept
code "C:\Users\john\project"
# single quotes: everything is kept as is
code 'C:\Users\john\project'
# forward slashes: accepted by most Windows programs
code C:/Users/john/project
```

The `code` command opens the VS Code editor from the terminal (see [the code editor](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide)).

| Written as | What the program receives |
|---|---|
| `C:\Users\john\project` (no quotes) | `C:Usersjohnproject` |
| `"C:\Users\john\project"` | `C:\Users\john\project` |
| `'C:\Users\john\project'` | `C:\Users\john\project` |
| `"\\server\share"` (network share) | `\server\share`: one backslash lost |
| `'\\server\share'` | `\\server\share` |

Inside double quotes, the backslash keeps a special meaning in front of `\`, `$`, `` ` `` and `"` ([Double Quotes](https://www.gnu.org/software/bash/manual/html_node/Double-Quotes.html)): this is why the double backslash of a Windows network share (`\\server`) loses one of its two characters there.

> **Pitfall:** pasting a path copied from Windows Explorer into Git Bash without quotes: the error does not mention the missing backslashes, only a folder that cannot be found or, worse, a different folder than intended.
>
> **Best practice:** wrap a Windows path in single quotes, or replace its `\` with `/`.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Before running a command, Bash replaces variables, file patterns (globbing), and brace expansions, an invisible but systematic step. Globbing depends on the files actually present; brace expansion never does. |
| **Tools you can use** | `*`/`?`/`[abc]` (globbing), `{1,2,3}`/`{1..5}` (braces), `~` (tilde). |
| **Pitfalls to avoid** | A globbing pattern that matches no file is passed to the command literally, with no error or warning. A Windows path without quotes loses all its `\`. |
| **Best practices** | Wrap in double quotes any variable that might contain a space or special character, to disable unwanted word splitting and globbing. Wrap a Windows path in single quotes, or use `/`. |
