---
order: 16
---

# Advanced aliases in Bash

An **alias** is a shortcut: a short name that you type in place of a longer command. This chapter assumes that you know how to open a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (the window where you type instructions on the keyboard) and run a simple command such as `ls` (see [basic commands](/?c=langages&s=bash&p=commandes-de-base)). The **shell** is the program that reads what you type in the terminal and runs it; the one used in this chapter is [Bash](/?c=langages&s=bash&p=bash). A **command** is an instruction typed in the terminal (`ls`), an **argument** is everything written after its name (`/tmp` in `ls /tmp`), and an **option** is an argument that starts with a dash (`-l`).

The simple alias (`alias ll='ls -la'`) is presented in [environment variables](/?c=langages&s=bash&p=variables-denvironnement). This chapter goes further, **in five levels**, each one building on the previous one:

| Level | Need | Tool | Section |
|---|---|---|---|
| 1 | Another name for a command | `alias`, `unalias`, `~/.bashrc` | [Level 1](#level-1-the-simple-alias) |
| 2 | A command that receives arguments in the middle | A **function** (a group of commands stored under a name: `$1`, `"$@"`, `"$#"`) | [Level 2](#level-2-alias-or-function-with-arguments) |
| 3 | Using a shortcut in a script | `shopt -s expand_aliases`, or better, a function | [Level 3](#level-3-aliases-in-a-script) |
| 4 | Making aliases, functions and programs coexist | `\name`, `command`, `type -a`, `unalias` | [Level 4](#level-4-workarounds-and-coexistence) |
| 5 | Organizing your shortcuts and setting them aside to diagnose a problem | `~/.bash_aliases`, `bash --norc` | [Level 5](#level-5-organizing-your-shortcuts) |

The same subject exists for another shell: [aliases and shortcuts in PowerShell](/?c=langages&s=powershell&p=alias-et-raccourcis-de-commandes), where the alias is much more limited.

## What an alias is in Bash

An alias is a **replacement text**. The closest image is the autocorrect of a phone that replaces "pls" with "please" before the message is sent: nobody reads the message before the substitution. In the same way, Bash replaces the typed word with the text of the alias **before parsing the line**, that is, before splitting it into words and processing the variables and [wildcards](/?c=langages&s=bash&p=expansion-et-jokers) (see [the order of expansions](/?c=langages&s=bash&p=architecture-dun-shell#the-precise-order-of-expansions)).

```
   You type:    ll /tmp
                 |
   1. Bash reads the first word of the line: ll
   2. It finds an alias ll, whose text is: ls -la
   3. It replaces the word ll with this text; the rest of the line does not move
                 |
                 v
   4. It parses the resulting line: ls -la /tmp
   5. It runs it
```

Step 3 is called the **expansion** of the alias (in English, *alias expansion*): the replacement of an alias by its text. The whole chapter follows from this sentence: **the alias is a text, substituted for the typed word, before the line is parsed** (see [the Bash manual, section "Aliases"](https://www.gnu.org/software/bash/manual/html_node/Aliases.html)).

## Level 1: the simple alias

```bash
# alias name='text': creates the alias ll; the text between single quotes is kept as it is
alias ll='ls -la'
# ll is replaced by "ls -la": detailed list of the folder, hidden files included
ll
# what is typed after the alias is added to the end of the text: runs "ls -la /tmp"
ll /tmp
# alias without argument: lists all the aliases of the current session
alias
# alias followed by a name: shows the definition of this alias only
alias ll
# unalias removes the alias ll for the current session
unalias ll
# ll is no longer known: Bash answers "command not found"
ll
```

In a fresh session, these commands print (after the list of the folder, which depends on where you are):

```text
alias ll='ls -la'
alias ll='ls -la'
bash: ll: command not found
```

The first line is the output of `alias`, the second that of `alias ll`, and the third the error of the last `ll`. The text of error messages depends on the language of the system (on a French system, this message reads « commande introuvable »). The option `-la` combines `-l` (one detailed line per file) and `-a` (also show hidden items): see [the `ls` command](/?c=langages&s=bash&p=commandes-de-base#listing-a-folder-ls).

| Command | Effect |
|---|---|
| `alias name='text'` | Creates or replaces the alias `name` |
| `alias` | Lists all the aliases of the session |
| `alias name` | Shows the definition of the alias `name` |
| `unalias name` | Removes the alias `name` |
| `unalias -a` | Removes all the aliases of the session |

### Single or double quotes: when are variables read?

A **variable** is a labeled box that holds a value (see [the variable](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable)). In `"echo $n"`, the double quotes make Bash read the variable `n` **right away**, when the alias is created; with single quotes, the text `$n` is kept and read at each **use** (see [single and double quotes](/?c=langages&s=bash&p=variables#single-vs-double-quotes)).

```bash
# n is a variable that contains 1
n=1
# double quotes: $n is replaced by 1 right now, the alias remembers "echo 1"
alias value_double="echo $n"
# single quotes: the alias remembers the text "echo $n", which is read later
alias value_single='echo $n'
# we change the value of n
n=2
# prints 1: the value was frozen when the alias was created
value_double
# prints 2: the variable is read at the time of use
value_single
```

The observed output is `1` then `2`. Practical rule: **always use single quotes** around the text of an alias, unless you want to freeze a value.

### Making an alias permanent

An alias typed in the terminal is kept **in memory**, for the session: close the window and it disappears. To find it again at each opening, it is written in the file `~/.bashrc`, which Bash reads when each terminal starts (see [configuration files](/?c=langages&s=bash&p=variables-denvironnement#shell-configuration-files)). The sign `~` stands for your home folder (see [tilde expansion](/?c=langages&s=bash&p=expansion-et-jokers#tilde-expansion)).

```bash
# echo prints the text; >> (redirection) appends it to the end of the file ~/.bashrc
echo "alias ll='ls -la'" >> ~/.bashrc
# source reads the file and runs its lines in the current session
# (no need to reopen the terminal)
source ~/.bashrc
```

The outer double quotes protect the inner single quotes here: the file receives exactly `alias ll='ls -la'`. The `>>` redirection is explained in [redirections and pipes](/?c=langages&s=bash&p=redirections-et-pipes), and `source` in [environment variables](/?c=langages&s=bash&p=variables-denvironnement#source-reloading-a-configuration-file).

## Level 2: alias or function with arguments

An alias can **only** paste its text in place of the word; the arguments typed after it arrive **at the end**. It therefore cannot place them anywhere else. Let us prepare a trial folder:

```bash
# mkdir creates a folder; trial is our working folder
mkdir trial
# cd moves into it
cd trial
# creates a subfolder named sub
mkdir sub
# > writes the text into a file (the file is created if it does not exist)
echo "hello" > a.txt
# a file name with a space: we will use it below
echo "hello world" > "my file.txt"
# a file in the subfolder
echo "goodbye" > sub/b.txt
```

### The alias that does not work

Here is a shortcut that searches for a word in all the files. `grep` is the command that searches text (see [`grep`](/?c=langages&s=bash&p=traitement-de-texte#grep-searching-text)); `-r` makes it go down into the subfolders, and the dot `.` stands for the current folder. The text `$1` stands for the first argument **of a script or of a function** (see [a script's arguments](/?c=langages&s=bash&p=scripts-et-shebang#a-script-s-arguments)).

```bash
# the search alias must run: grep -r "word" .  (with the typed word in place of $1)
alias search='grep -r "$1" .'
# runs the alias with the word hello
search hello
# prints the content of $1 between brackets
echo "[$1]"
```

```text
./a.txt:hello
./my file.txt:hello world
./sub/b.txt:goodbye
grep: hello: No such file or directory
[]
```

The order of the files may vary from one system to another. The result is wrong, and the explanation lies in the two steps of the substitution:

| Step | What happens |
|---|---|
| 1. Expansion of the alias | `search hello` becomes `grep -r "$1" . hello`: the typed word is pasted **at the end** |
| 2. Parsing of the resulting line | `$1` is read as a variable of the **terminal**, where it does not exist: it is empty, hence `[]` |
| 3. Execution | `grep -r "" . hello`: the empty pattern (the pattern is the text being searched for) matches **all** the lines, and `hello` is taken as a file name, which does not exist |

An alias has **no `$1`**: it has no parameters of its own. A function is needed.

### The function: `$1`, `"$@"` and `"$#"`

A **function** groups commands under a name; it receives its arguments in `$1` (the first), `$2` (the second), and so on (see [Bash functions](/?c=langages&s=bash&p=fonctions)). Typed in the terminal, it is entered over several lines: Bash shows `>` as long as the braces are not closed.

```bash
# first remove the alias with the same name (see the explanation below this block)
unalias search
# search() declares the function; the braces { } enclose its commands
search() {
    # $1 is here the first argument of the function: the word being searched for
    grep -r "$1" .
}
# runs the function with the word hello
search hello
```

```text
./a.txt:hello
./my file.txt:hello world
```

This time, the line `grep -r "hello" .` is run as expected. The `unalias` at the start is not decorative: as long as the alias `search` exists, Bash expands it too in the line `search() {` (it is a word in first position), and the declaration of the function fails with `syntax error near unexpected token`. **Always remove an alias before declaring a function of the same name.** Two other forms pass everything on:

| Form | Meaning |
|---|---|
| `$1`, `$2`... | The first, the second... argument received |
| `"$@"` | **All** the arguments, each one kept as a separate word, even if it contains spaces |
| `"$#"` | The **number** of arguments received |

The difference made by the quotes around `$@` shows with a file name containing a space. `printf` prints a text according to a template: here `[%s]` is repeated for each argument, and `\n` moves to a new line.

```bash
# summarize() prints the number of arguments, then each one between brackets
summarize() {
    # "$#": number of arguments received
    echo "$# arguments"
    # "$@": each argument stays one whole word
    printf '[%s]\n' "$@"
}
# wrong() does the same, but $@ has NO quotes
wrong() {
    # without quotes, Bash cuts the content at each space
    printf '[%s]\n' $@
}
# three arguments, including "my file.txt" which contains a space
summarize a "my file.txt" c
# same arguments with the version without quotes
wrong a "my file.txt" c
```

```text
3 arguments
[a]
[my file.txt]
[c]
[a]
[my]
[file.txt]
[c]
```

Without quotes, "my file.txt" is cut into **two** words, and the command that receives them will look for two files that do not exist. This is why one almost always writes `"$@"`, never a bare `$@` (see [special variables](/?c=langages&s=bash&p=scripts-et-shebang#a-script-s-arguments) and [the order of expansions](/?c=langages&s=bash&p=architecture-dun-shell#the-precise-order-of-expansions)).

Finally, `"$#"` makes it possible to refuse an incomplete call. `if` tests a condition (see [conditions](/?c=langages&s=bash&p=conditions)), `-lt` means "less than", `return 1` ends the function with the code 1 (a non-zero code signals a failure), and `${2:-.}` is the second argument if it is given, otherwise the dot.

```bash
# search2(): searches for a word in a given folder or, failing that, in the current folder
search2() {
    # if the number of arguments is less than 1, the command is incomplete
    if [ "$#" -lt 1 ]; then
        # prints the usage message, then leaves the function with the failure code 1
        echo "usage: search2 PATTERN [FOLDER]"
        return 1
    fi
    # -n adds the line number; "${2:-.}": the folder given, otherwise the dot
    grep -rn "$1" "${2:-.}"
}
# call without argument: the usage message is displayed
search2
# call with a word: searches in the current folder
search2 goodbye
# call with a word and a folder: searches only in sub
search2 hello sub
```

```text
usage: search2 PATTERN [FOLDER]
./sub/b.txt:1:goodbye
```

The last call prints nothing: `hello` does not appear in `sub`, and `grep` then ends with the exit code 1, that of a failure (see [exit codes](/?c=langages&s=bash&p=scripts-et-shebang#exit-codes-exit)).

| | Alias | Function |
|---|---|---|
| Give another name to a command | Yes | Yes |
| Arguments added **at the end** | Yes, automatically | Yes, with `"$@"` |
| Place an argument **in the middle** (`$1`) | **No** | Yes |
| Count the arguments, test them with `if` | No | Yes (`"$#"`, `if`) |
| Several commands in a row | Possible, but unreadable | Yes, one per line |
| Removed with | `unalias name` | `unset -f name` (`unset` undoes a name, `-f` designates a function) |
| Found again with | `alias` | `type name` (shows what `name` is, see [level 4](#level-4-workarounds-and-coexistence)) |

A function typed in the terminal also lives only in the session: to keep it, place it in `~/.bashrc` or in a file loaded by it (see [level 5](#level-5-organizing-your-shortcuts)).

## Level 3: aliases in a script

A **script** is a text file that contains commands, run one after the other (see [writing and running a script](/?c=langages&s=bash&p=scripts-et-shebang)). Here it is run with `bash name.sh`, which starts a **new** Bash that reads the file. As this Bash is started directly, the special first line of the file, the [shebang](/?c=langages&s=bash&p=scripts-et-shebang#the-shebang), is not needed in our examples.

### By default, a script ignores aliases

An **interactive shell** is a shell that waits for your commands typed on the keyboard in a terminal; a **non-interactive** shell is a shell that reads a script. Aliases are expanded, by default, only in the first one. Two consequences:

```bash
# --- contents of without-option.sh ---
# alias: creates the alias greet, which replaces this word with "echo hello"
alias greet='echo hello'
# we use the alias on the next line
greet world
# this line proves that the script goes on despite the error
echo "end of script"
```

```bash
# runs the script in a new non-interactive Bash
bash without-option.sh
```

```text
without-option.sh: line 4: greet: command not found
end of script
```

Even when the alias is defined **in the script**, it is not expanded: Bash looks for a command named `greet`. And an alias created in your terminal does not exist in the script, which is another **process** (a program being run, see [process management](/?c=langages&s=bash&p=gestion-des-processus)):

```bash
# --- contents of uses-alias.sh ---
# this script did not create the alias greet: it tries to use the one of the terminal
greet you
```

```bash
# in the terminal: the alias exists for the terminal
alias greet='echo hello'
# the terminal expands it
greet world
# the script, for its part, is another Bash: the alias is not there
bash uses-alias.sh
```

```text
hello world
uses-alias.sh: line 2: greet: command not found
```

### Enabling aliases: `shopt -s expand_aliases`

`shopt` (from the English *shell option*) turns a Bash option on or off ([documentation of `shopt`](https://www.gnu.org/software/bash/manual/html_node/The-Shopt-Builtin.html)): `-s` turns it on (*set*), `-u` turns it off (*unset*), and its name alone shows its state. The option `expand_aliases` is "off" in a script ("on" in a terminal).

```bash
# --- contents of with-option.sh ---
# shopt -s: turns on (set) the option expand_aliases, which allows aliases in a script
shopt -s expand_aliases
# creates the alias greet
alias greet='echo hello'
# uses the alias on the next line
greet world
# prints an end message
echo "end of script"
```

```bash
# runs the script
bash with-option.sh
# shows the state of the option in a non-interactive Bash (-c: runs this text)
bash --norc -c 'shopt expand_aliases'
```

```text
hello world
end of script
expand_aliases      	off
```

### The trap of the next line

Bash reads a **complete command**: at least one whole line, and all the lines of a block (`{ }`, `if`, loop, function body) before running the first of them. Yet the expansion of an alias takes place **when the line is read**, not when it is run. Consequence: an alias exists only from the **next line** read. In a terminal, each line is read when you press Enter, so the problem cannot be seen; in a script, it shows up.

```bash
# --- contents of same-line.sh ---
# allows aliases in this script
shopt -s expand_aliases
# definition AND use on the same line: separated by a semicolon
alias greet='echo hello'; greet world
# prints an end message
echo "end of script"
```

```bash
# --- contents of block.sh ---
# allows aliases in this script
shopt -s expand_aliases
# the braces { } form a block: Bash reads the whole block before running one line of it
{
    # definition of the alias, inside the block
    alias greet='echo hello'
    # use in the same block: the alias is unknown here
    greet world
}
# use after the block: the block has been run, so the alias exists
greet again
```

```bash
# --- contents of function-before.sh ---
# allows aliases in this script
shopt -s expand_aliases
# the function say is READ here, before the alias exists: greet stays an ordinary word
say() { greet you; }
# the alias is created after the function has been read
alias greet='echo hello'
# calling the function: it looks for a command greet, and finds nothing
say
```

```bash
# --- contents of function-after.sh ---
# allows aliases in this script
shopt -s expand_aliases
# the alias is created first
alias greet='echo hello'
# the function say is read now: greet is replaced by "echo hello"
say() { greet you; }
# calling the function: it displays hello you
say
```

```bash
# runs each of the four scripts
bash same-line.sh
bash block.sh
bash function-before.sh
bash function-after.sh
```

```text
same-line.sh: line 4: greet: command not found
end of script
block.sh: line 8: greet: command not found
hello again
function-before.sh: line 4: greet: command not found
hello you
```

| Situation | Result |
|---|---|
| Definition and use on **two** consecutive lines | Works (with `expand_aliases` in a script) |
| Definition and use on the **same line** (`;`) | Fails: the alias does not exist yet when the line is read |
| Definition and use **in the same block** `{ }` | Fails; the use **after** the block works |
| Function read **before** the alias | Fails when called, even if the alias exists at that moment |
| Function read **after** the alias | Works |

Note line 4 of the message from `function-before.sh`: it is the line where the **body of the function** was read, not the line of the call.

A shortcut file loaded by `source` is an exception, because it is read only when `source` runs, therefore after `shopt`:

```bash
# --- contents of shortcuts.sh ---
# shortcut file: it contains only the definition of an alias
alias greet='echo hello'
```

```bash
# --- contents of loads-with.sh ---
# allows aliases in this script
shopt -s expand_aliases
# source reads the file shortcuts.sh and runs its lines in this script
source ./shortcuts.sh
# the alias created by the file can be used from here on
greet world
```

```bash
# runs the script: prints "hello world"
bash loads-with.sh
```

### The recommended solution: a function

A function depends on no option and no reading order: it works the same way in a terminal and in a script.

```bash
# --- contents of function.sh ---
# a function needs no option: it works in a script as well as in the terminal
greet() {
    # echo prints its text; "$@" passes all the arguments received by greet
    echo hello "$@"
}
# calling the function with two arguments
greet world
```

```bash
# runs the script: prints "hello world"
bash function.sh
```

In a script, you **do not use aliases**: you write the complete command, or a function.

## Level 4: workarounds and coexistence

### Who answers when a name is typed?

The same name can designate an alias, a function, a **builtin** command (a command built into Bash itself, like `cd`) and a program (an executable file, like `/usr/bin/date`, found thanks to [`$PATH`](/?c=langages&s=bash&p=variables-denvironnement#path-how-the-shell-finds-a-command)). Bash chooses according to a fixed order:

| Priority | What answers | Example |
|---|---|---|
| 1 (the strongest) | An **alias** | `alias ll='ls -la'` |
| 2 | A **function** | `search() { ... }` |
| 3 | A **builtin** command | `cd`, `echo`, `type` |
| 4 (the weakest) | A **program** | `/usr/bin/date` |

The command `type -a name` (*type*, "what kind of name is this?"; with `command` and `builtin`, it is described in [the Bash builtin commands](https://www.gnu.org/software/bash/manual/html_node/Bash-Builtins.html)) lists **all** the possible answers, in order. Let us see it with `date`, which is a program, to which we add a function and then an alias of the same name:

```bash
# the name date is, for now, only a program
type -a date
# a function named date
date() { echo "date (function)"; }
# an alias named date
alias date='echo "date (alias)"'
# the three answers, from the highest priority to the lowest
type -a date
# who answers when the name is typed?
date
```

```text
date is /usr/bin/date
date is aliased to `echo "date (alias)"'
date is a function
date ()
{
    echo "date (function)"
}
date is /usr/bin/date
date (alias)
```

The first `type -a` finds only the program; the second one shows the alias, then the function (with its body), then the program; and it is the **alias** that answers. These words (`is`, `aliased to`, `a function`) are those of a system configured in English. For the name of a builtin command, `type -a echo` first prints `echo is a shell builtin`, then the path of the `echo` program. Another useful form: `type -t name` (*type*, option `-t`) prints only one word among `alias`, `function`, `builtin` or `file`, and nothing if the name is unknown (exit code 1).

### Bypassing an alias or a function

```bash
# the name date always designates the alias and the function created above
# \date: the backslash prevents the alias from being expanded, so the function answers
\date
# command date: ignores the alias AND the function, runs the builtin or the program
command date +%Y
# unalias date: removes the alias; the function answers again
unalias date
date
# unset -f date: removes the function; the program answers again
unset -f date
command date +%Y
```

```text
date (function)
2026
date (function)
2026
```

The number `2026` is the current year at the time of the test. `+%Y` is the argument that asks `date` to show the year alone.

| I want to | Form | What is ignored |
|---|---|---|
| Bypass the alias | `\name`, `"name"` or `'name'` | The alias only: a **function** of the same name still answers |
| Bypass the alias **and** the function | `command name` | Aliases and functions: the builtin or the program answers |
| Force a builtin command | `builtin name` | Aliases, functions and programs |
| Remove the alias from the session | `unalias name` | Nothing: the alias disappears until the next session |
| Remove the function from the session | `unset -f name` | Nothing: the function disappears until the next session |

Why does `\name` work? Bash looks for an alias only for a word written **without any protected part**: as soon as the word contains a backslash or quotes, it is no longer looked at as an alias.

### An alias that calls itself: no loop

An alias may contain the name it replaces, which is very common: `alias ls='ls --color=auto'` (`--color=auto` colors the names only if the result is displayed in a terminal). One might fear an infinite loop: `ls` becomes `ls --color=auto`, whose first word `ls` becomes `ls --color=auto` again, and so on. No loop happens: **a word identical to the alias being expanded is not expanded a second time**. The second `ls` therefore designates the real command.

```bash
# the alias ls adds --color=auto to the real ls command
alias ls='ls --color=auto'
# shows the definition: the text contains the word ls
type ls
# two aliases that point to each other: a to b, b to a
alias a='b'
alias b='a'
# a becomes b, b becomes a, and a is not expanded a second time
a
```

```text
ls is aliased to `ls --color=auto'
bash: a: command not found
```

The second case is not a loop either: Bash stops and looks for a real command named `a`, which does not exist. The useless alias `alias a='b'` serves only as an illustration: never do that.

### The chained alias: the trailing space

By default, only the **first word** of the line is looked at as an alias. If the text of an alias **ends with a space**, the word that follows is looked at as well. Here is a harmless example:

```bash
# two aliases: write stands for echo (without trailing space), world is a replacement text
alias write='echo'
alias world='everyone'
# the word world is not a first word: it is not expanded, it is printed as it is
write world
# we redefine write with a space AT THE END of the text
alias write='echo '
# the word after write is now looked at as an alias: world is expanded
write world
```

```text
world
everyone
```

The most frequent use is `alias sudo='sudo '`. `sudo` is a command that runs another command with administrator rights ([official documentation of `sudo`](https://www.sudo.ws/docs/man/sudo.man/)). Without the trailing space, `sudo ll` fails (`ll`: command not found), because the word `ll`, which follows `sudo`, is not a first word; with the space, `ll` is expanded to `ls -la` before the command runs.

### Where aliases are useless

An alias exists only in the interactive shell that created it. Programs that run other commands without going through this shell do not see them. Example with `xargs`, a program that reads words and adds them as arguments to a command:

```bash
# the alias greet exists for the terminal
alias greet='echo hello'
# xargs looks for a PROGRAM named greet: it does not know Bash's aliases
echo you | xargs greet
```

```text
xargs: greet: No such file or directory
```

A **function** has the same flaw with `xargs`: it is not a program either. `xargs` runs only real programs.

## Level 5: organizing your shortcuts

### A `~/.bash_aliases` file

When you have a few shortcuts, `~/.bashrc` becomes unreadable. They are stored in a separate file, `~/.bash_aliases`, which `~/.bashrc` loads. Its name is a **convention**: Bash does not read it on its own; it is the `~/.bashrc` file that must contain the lines below. Some systems already ship them in their default `~/.bashrc`: look with `grep bash_aliases ~/.bashrc` before adding anything (see [`grep`](/?c=langages&s=bash&p=traitement-de-texte#grep-searching-text)).

```bash
# --- to add to ~/.bashrc ---
# [ -f file ] is true if this file exists and is an ordinary file
if [ -f ~/.bash_aliases ]; then
    # the dot reads the file in the current shell, like source
    . ~/.bash_aliases
# fi ends the if
fi
```

The test `[ -f ... ]` avoids an error if the file does not exist yet. See [conditions](/?c=langages&s=bash&p=conditions) for `if` and `[ ]`.

```bash
# --- contents of ~/.bash_aliases ---
# simple shortcuts: a short name for a command
alias ll='ls -la'
# ls -lt: detail of each file, from the most recent to the oldest
alias lt='ls -lt'
# --color=auto: colors the names only if the output is displayed in a terminal
alias ls='ls --color=auto'
# the trailing space makes it possible to expand the alias of the next word (see level 4)
alias sudo='sudo '
# searches for the pattern given as first argument in the current folder
search() {
    grep -rn "$1" .
}
```

The aliases share the file with the functions (level 2): the file is only a series of commands, read by `source`. To apply a change without reopening the terminal: `source ~/.bash_aliases`.

| File | Content | Why |
|---|---|---|
| `~/.bashrc` | The loading block above, and the environment settings (see [environment variables](/?c=langages&s=bash&p=variables-denvironnement)) | It stays short and readable |
| `~/.bash_aliases` | All the personal aliases and functions | A single place to reread, back up, and copy to another machine |
| A shared script | No personal shortcut | It must work without your configuration |

With a `~/.bash_aliases` that contains these aliases, one observes:

| Observed case | Result |
|---|---|
| The file exists and `~/.bashrc` contains the `if` block | The aliases are present in each new terminal (`alias` lists them) |
| The file does not exist, with the test `[ -f ... ]` | The terminal starts without any message |
| The file does not exist, with only `. ~/.bash_aliases` | A `No such file or directory` message is displayed at each startup |
| A line added to the file after startup | Unknown until `source ~/.bash_aliases` is run |

### Diagnosing: `bash --norc`

When a command behaves strangely, the cause is sometimes one of your aliases or functions. `bash --norc` starts a new **interactive** Bash that does **not read** `~/.bashrc`: none of your shortcuts exist there (see [the Bash manual, section "Invoking Bash"](https://www.gnu.org/software/bash/manual/html_node/Invoking-Bash.html)).

```bash
# starts a Bash without reading ~/.bashrc; the prompt, the text that precedes what you type,
# may change appearance
bash --norc
# the list is empty: no alias has been loaded
alias
# the alias ll of ~/.bash_aliases does not exist here
ll
# exit closes this Bash and brings you back to the previous session, with your shortcuts
exit
```

```text
bash: ll: command not found
```

If the behavior becomes normal again in `bash --norc`, the culprit is among your shortcuts: remove them one by one to find which one.

## Summary of the levels

| Level | Need | Tool | Limit |
|---|---|---|---|
| 1 | Another name for a command | `alias ll='ls -la'`, `unalias`, `~/.bashrc` | A text pasted in front of the arguments; no `$1`; lost when the terminal closes without `~/.bashrc` |
| 2 | An argument placed in the middle, a test on the number of arguments | Function with `"$1"`, `"$@"`, `"$#"` | Longer to write; specific to the session without a loading file |
| 3 | A shortcut in a script | `shopt -s expand_aliases`, or better, a function | An alias exists only from the next line; a terminal alias is absent from the script |
| 4 | Coexisting without surprises | `type -a`, `\name`, `command name`, `unalias`, trailing space | `\name` lets a function through; `xargs` and scripts ignore aliases |
| 5 | Organizing and diagnosing | `~/.bash_aliases` loaded by `~/.bashrc`, `bash --norc` | A personal shortcut does not exist on the other machines |

## Pitfalls

| Pitfall | Why it is a problem | What to do |
|---|---|---|
| `alias search='grep -r "$1" .'` | `$1` does not exist in an alias: it is empty, and the typed word is pasted at the end | A function with `"$1"` |
| `$@` without quotes | A name with a space is cut into several words | `"$@"` |
| Alias in a script without `shopt` | Aliases are ignored in a non-interactive shell | A function |
| Alias defined and used on the same line or in the same `{ }` block | The alias exists only from the line read next | Define it on one line and use it further on, or use a function |
| Declaring a function with the same name as an existing alias | The alias is expanded in the declaration: syntax error | `unalias name` before the function |
| Function read before the alias it uses | The word stays ordinary: expansion takes place when the body is read | Prefer the complete command in a function |
| Double quotes around the text of an alias | The variables are read at creation, the value is frozen | Single quotes |
| Believing that `\name` bypasses everything | It bypasses only the alias: a function of the same name still answers | `command name` |
| `alias sudo='sudo '` forgotten | `sudo ll` fails: `ll` is not a first word | The trailing space in the text of the alias |
| Redefining a dangerous command (`rm`, `cp`, `mv`) by adding options | You get used to a confirmation that does not exist on other machines | Choose a new name (`delete`) |
| An alias (or a function) behind `xargs` | `xargs` runs programs, not Bash aliases | A script, or the program itself |
| Alias typed in the terminal | Lost when the window is closed | Write it in `~/.bash_aliases`, loaded by `~/.bashrc` |
| Modifying `~/.bash_aliases` without reloading | The current session keeps the old state | `source ~/.bash_aliases` |
| `. ~/.bash_aliases` without the `[ -f ... ]` test | An error at each startup if the file is missing | `if [ -f ~/.bash_aliases ]; then ... fi` |
| An alias name identical to a program (`date`) | The program is hidden without any warning | `type -a name` before choosing |

## Best practices

| Best practice | Why |
|---|---|
| An alias to rename or with fixed options, a function as soon as an argument is placed anywhere other than at the end | Each tool stays in its own domain |
| Single quotes around the text of an alias | The variables are read at use |
| `"$@"` with quotes to pass everything on, `"$#"` to count | Names with spaces are not cut |
| Write the complete command or a function in a script | The script works on every machine, with or without your aliases |
| `type -a name` before creating a shortcut | No unintended mask |
| `command name` to reach the real command | Bypasses aliases and functions |
| Store all the shortcuts in `~/.bash_aliases`, loaded by `~/.bashrc` with a `[ -f ... ]` test | A short `~/.bashrc`, and shortcuts that are easy to back up |
| `bash --norc` when a behavior seems strange | Rules out your shortcuts as the cause |
| Keep your shortcuts few and clearly named | You remember them, and you avoid hiding a useful command |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | An **alias** is a **text** substituted for the first typed word, **before** the line is parsed: `alias ll='ls -la'` creates, `alias` lists, `unalias ll` removes, and `~/.bashrc` makes it permanent. The typed arguments arrive **at the end**: an alias has no `$1`, so `alias search='grep -r "$1" .'` fails. A **function** receives `$1`, `"$@"` (all the arguments, one word each) and `"$#"` (their number). A script has no aliases by default; `shopt -s expand_aliases` enables them, but the alias exists only from the next line, outside the block or function that defines it: prefer a function. Order of answer: alias, then function, then builtin command, then program; `type -a name` lists them. `\name` bypasses the alias only, `command name` bypasses the alias and the function. An alias that calls itself does not loop, because the identical word is not expanded twice. A trailing space (`alias sudo='sudo '`) makes the next word expand. Store your shortcuts in `~/.bash_aliases`, loaded by `~/.bashrc` with `[ -f ... ]`, and `bash --norc` sets them aside to diagnose. |
| **Pitfalls to avoid** | `$1` in an alias; `$@` without quotes; alias in a script without `shopt`; alias defined and used on the same line or in the same block; function declared without removing the alias of the same name; function read before its alias; double quotes around an alias; believing that `\name` bypasses a function; forgetting the trailing space of `sudo`; redefining `rm`, `cp` or `mv`; alias behind `xargs`; alias lost when the terminal closes; shortcut file modified but not reloaded; `. file` without an existence test; alias name that hides a program. |
| **Best practices** | Alias to rename, function as soon as an argument is placed anywhere other than at the end; single quotes; `"$@"` and `"$#"`; complete command or function in a script; `type -a name` before naming; `command name` to reach the real command; shortcuts in `~/.bash_aliases`; `bash --norc` to set aside your shortcuts during a diagnosis. |
