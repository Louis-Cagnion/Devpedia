---
order: 7
---

# Expansion and wildcards (globbing)

Before executing a command, Bash replaces certain patterns within it with their actual values—variables (`$name`; see the dedicated chapter), as well as file patterns (*globbing*) and curly brace expansions. Understanding this step—which is invisible but always occurs—explains why certain commands behave differently depending on the type of quotes used.

## Globbing: `*`, `?`, `[]`

```bash
ls *.txt        # all files ending in .txt
ls file?.txt  # file1.txt, fileA.txt... ('?' = exactly 1 character, any character)
ls file[123].txt  # file1.txt, file2.txt, or file3.txt only
ls file[a-z].txt  # a single lowercase letter in that position
```

| Pattern | Meaning |
|---|---|
| `*` | Any sequence of characters (including an empty string) |
| `?` | Exactly one character, any character |
| `[abc]` | Any one of the following`a`, `b`, or `c` |
| `[a-z]` | Only one character in this range |
| `[^abc]` | A single character that is neither `a`, `b`, nor `c` |

> **Note:** This is not a regex (see the chapter on regular expressions)—globbing is simpler and specific to how the shell itself interprets filenames, even before the command is executed.

## Note: What happens if no files match?

```bash
echo *.xyz
# If no .xyz files exist, Bash displays "*.xyz" verbatim (the pattern is not expanded)
```

This is a common source of bugs: a script that assumes `*.xyz` always refers to a list of actual files may receive the plain text `*.xyz` as the only "filename" if the directory does not contain any such files.

## Brace Expansion

Generates multiple strings from a single pattern **before** searching for actual files on the disk:

```bash
echo file{1,2,3}.txt
# file1.txt file2.txt file3.txt

mkdir -p projet/{src,tests,docs}
# creates the three folders with a single command

echo {1..5}
# 1 2 3 4 5

echo {a..e}
# a b c d e
```

> **Note:** Unlike globbing, brace expansion does not depend on any existing files—`file{1,2,3}.txt` always generates these three strings, regardless of whether the corresponding files exist.

## The Tilde Expansion (`~`)

```bash
cd ~          # equivalent to `cd $HOME`
cd ~/projets   # equivalent to cd $HOME/projects
```

## Preventing Expansion: Quotation Marks

```bash
echo *.txt      # replaced with the actual list of .txt files
echo "*.txt"     # literally displays *.txt -> double quotes disable globbing
echo '*.txt'     # same result; single quotes are even stricter (they also disable $variable)
```

See also the chapter on variables for the distinction between single and double quotes as it relates to the interpretation of `$variable`.
