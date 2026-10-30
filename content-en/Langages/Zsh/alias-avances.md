---
order: 8
---

# Advanced aliases in Zsh

An **alias** is a shortcut: a short name that you type in place of a longer command. This chapter assumes that you know how to open a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (the window where you type instructions on the keyboard) and run a simple command such as `ls` (see [basic commands](/?c=langages&s=bash&p=commandes-de-base)). The **shell** is the program that reads what you type in the terminal and runs it; the one used in this chapter is [Zsh](/?c=langages&s=zsh&p=zsh). A **command** is an instruction typed in the terminal (`ls`), an **argument** is everything written after its name (`/tmp` in `ls /tmp`), and an **option** is an argument that starts with a dash (`-l`). The **session** is the period from opening the terminal window to closing it.

The mechanics of aliases are the same in [Bash](/?c=langages&s=bash&p=bash) and in Zsh. Everything that is identical is therefore summed up here in one sentence and referred to the chapter [Advanced aliases in Bash](/?c=langages&s=bash&p=alias-avances); this chapter details **what differs or is added in Zsh**, **in five levels**, each one building on the previous one:

| Level | Need | Tool | Section |
|---|---|---|---|
| 1 | Another name for a command | `alias`, `unalias`, `~/.zshrc` | [Level 1](#level-1-the-simple-alias) |
| 2 | A command that receives arguments in the middle | A **function** (a group of commands stored under a name: `$1`, `"$@"`, `"$#"`) | [Level 2](#level-2-alias-or-function-with-arguments) |
| 3 | Using a shortcut in a script | The `aliases` option (on by default), or better, a function | [Level 3](#level-3-aliases-in-a-script) |
| 4 | A shortcut that acts anywhere in the line, or according to a file's extension | `alias -g` (global aliases), `alias -s` (suffix aliases) | [Level 4](#level-4-global-aliases-and-suffix-aliases) |
| 5 | Making them coexist, organizing and diagnosing | `\name`, `command`, `whence -a`, `~/.zsh_aliases`, `zsh -f` | [Level 5](#level-5-workarounds-coexistence-and-organization) |

The same subject exists for another shell: [aliases and shortcuts in PowerShell](/?c=langages&s=powershell&p=alias-et-raccourcis-de-commandes), where the alias is much more limited.

## What an alias is in Zsh, and what does not change

Like in Bash, an alias is a **replacement text**: Zsh replaces the typed word with the text of the alias **before parsing the line**, that is, before splitting it into words and processing the [variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) (labeled boxes that hold a value) and the [wildcards](/?c=langages&s=bash&p=expansion-et-jokers) (patterns such as `*.txt`, which the shell replaces with the matching file names) (see [what an alias is in Bash](/?c=langages&s=bash&p=alias-avances#what-an-alias-is-in-bash)). This replacement is called the **expansion** of the alias (*alias expansion*). The Zsh manual describes it in [its section "Aliasing"](https://zsh.sourceforge.io/Doc/Release/Shell-Grammar.html#Aliasing).

The following table summarizes, for each point, what is true in the same way in both shells (checked by experiment) and what differs. The differences are detailed in the levels indicated.

| Point | Bash | Zsh | Level |
|---|---|---|---|
| The alias is a text substituted before the line is parsed | Yes | Yes, identical | This level |
| `$1` in the text of an alias | Absent: it is empty | Absent, identical | [2](#level-2-alias-or-function-with-arguments) |
| Function with the same name as an alias, written `name() { ... }` | Syntax error | Error, with a more explicit message | [2](#level-2-alias-or-function-with-arguments) |
| `$@` without quotes | Cut at each space, and the wildcards are expanded | **Not cut**, wildcards not expanded | [2](#level-2-alias-or-function-with-arguments) |
| Alias defined in a script, then used | Ignored, unless `shopt -s expand_aliases` | **Expanded**: the `aliases` option is on everywhere | [3](#level-3-aliases-in-a-script) |
| Alias defined and used on the same line or in the same block | Does not exist yet | Identical | [3](#level-3-aliases-in-a-script) |
| Alias that acts somewhere other than the first word | Only with the trailing space | Global aliases (`alias -g`) | [4](#level-4-global-aliases-and-suffix-aliases) |
| Launching a file according to its extension | Does not exist | Suffix aliases (`alias -s`) | [4](#level-4-global-aliases-and-suffix-aliases) |
| Showing what answers to a name | `type -a name` | `type -a name` or `whence -a name` | [5](#level-5-workarounds-coexistence-and-organization) |
| Personal shortcuts file | `~/.bashrc`, `~/.bash_aliases` | `~/.zshrc`, `~/.zsh_aliases` | [5](#level-5-workarounds-coexistence-and-organization) |

## Level 1: the simple alias

The syntax is that of Bash: `alias name='text'` creates an alias, `alias` alone lists them, `unalias name` removes one. The single quotes around the text also leave the variables intact until the alias is used: the experiment from the Bash chapter (see [single or double quotes](/?c=langages&s=bash&p=alias-avances#single-or-double-quotes-when-are-variables-read)) gives, under Zsh, `1` with double quotes and `2` with single quotes. What changes is the **display** of the lists.

One precaution before copying the blocks of this chapter into a terminal: they carry **comments**, that is, texts that start with `#` and that the shell ignores. A Zsh that reads a script ignores them, but an **interactive** Zsh recognizes them only if the `interactive_comments` option is on (see [the shell options](/?c=langages&s=zsh&p=options-du-shell)); otherwise it tries to run a command named `#` and answers `zsh: command not found: #`.

```zsh
# setopt turns on a shell option: here, comments become accepted
setopt interactive_comments
```

The first line of this block is itself a comment: it causes the error one last time, so it suffices to type the second one. To keep the option active in every session, add it to `~/.zshrc` (see [the end of this level](#making-an-alias-permanent-zshrc)). The following blocks assume that the option is enabled.

```zsh
# alias name='text': creates the alias ll; the text between single quotes is kept as it is
alias ll='ls -la'
# alias without argument: lists all the aliases of the session, in the form name='text'
alias
# alias followed by a name: shows the definition of this alias only
alias ll
# alias -L: lists in the form of complete commands, which can be copied into a file
alias -L
# unalias removes the alias ll for the current session
unalias ll
# ll is no longer known: Zsh answers "command not found: ll"
ll
```

In a blank session (started with `zsh -f`, see [level 5](#diagnosing-zsh-f)), these commands display:

```text
ll='ls -la'
run-help=man
which-command=whence
ll='ls -la'
alias ll='ls -la'
alias run-help=man
alias which-command=whence
zsh: command not found: ll
```

The option `-la` combines `-l` (one detailed line per file) and `-a` (also show hidden items): see [the `ls` command](/?c=langages&s=bash&p=commandes-de-base#listing-a-folder-ls). Three differences from Bash appear:

| Observation | Bash | Zsh |
|---|---|---|
| Form of a line of `alias` | `alias ll='ls -la'` | `ll='ls -la'` (without the word `alias`) |
| Form reusable as it is | The output of `alias` | The output of **`alias -L`**: `alias ll='ls -la'` |
| Aliases present in a blank session | None | Two, defined by Zsh itself: `run-help` (which designates `man`, the command that displays the manual of a command, see [`man`](/?c=langages&s=bash&p=commandes-de-base#getting-help-man-and-help)) and `which-command` (which designates `whence`, see [level 5](#level-5-workarounds-coexistence-and-organization)) |

The two starting aliases vary according to the configuration of the system: some configuration files remove one of them. The error message depends on the language of the system. For the rest, the management commands are those of Bash:

| Command | Effect |
|---|---|
| `alias name='text'` | Creates or replaces the alias `name` |
| `alias` | Lists all the aliases (the rest of this chapter adds `-r`, `-g`, `-s`, `-L`, `-m`) |
| `alias name` | Shows the definition of `name`; shows nothing and ends with a failure if `name` is not an alias |
| `unalias name` | Removes the alias `name`; shows `no such hash table element: name` if the alias does not exist |
| `unalias -a` | Removes all the aliases of the session, Zsh's own included |

### Making an alias permanent: `~/.zshrc`

An alias typed in the terminal lives **in memory**, in the session. To find it again at each opening, it is written in the file `~/.zshrc`, which Zsh reads when each interactive terminal starts (see [the startup files](/?c=langages&s=zsh&p=fichiers-de-demarrage)). The sign `~` stands for your home folder.

```zsh
# echo displays the text; >> (redirection) appends it to the end of the file ~/.zshrc
echo "alias ll='ls -la'" >> ~/.zshrc
# source reads the file and runs its lines in the current session
# (no need to reopen the terminal)
source ~/.zshrc
```

The redirection `>>` is explained in [redirections and pipes](/?c=langages&s=bash&p=redirections-et-pipes). If you installed [Oh My Zsh](/?c=langages&s=zsh&p=oh-my-zsh), the `~/.zshrc` already exists and contains other lines: you add yours **at the end** (see [level 5](#the-aliases-of-oh-my-zsh)).

## Level 2: alias or function with arguments

The limit is the same as in Bash: an alias can only paste its text in front of the typed arguments; it has no `$1` (see [level 2 of the Bash chapter](/?c=langages&s=bash&p=alias-avances#level-2-alias-or-function-with-arguments)). Let us prepare the same trial folder:

```zsh
# mkdir creates a folder; trial is our working folder
mkdir trial
# cd moves into it
cd trial
# creates a subfolder named sub
mkdir sub
# echo displays its text; > writes it into the file a.txt (created if it does not exist)
echo "hello" > a.txt
# a file name with a space: we will use it below
echo "hello world" > "my file.txt"
# a file in the subfolder
echo "goodbye" > sub/b.txt
```

Here is the alias that does not work. `grep` searches for text (see [`grep`](/?c=langages&s=bash&p=traitement-de-texte#grep-searching-text)), `-r` makes it go down into the subfolders, and the dot `.` stands for the current folder.

```zsh
# the alias must run: grep -r "word" .  (with the typed word in place of $1)
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

The order of the files may vary from one system to another. The result is wrong, and the explanation is the same as in Bash (see [the alias that does not work](/?c=langages&s=bash&p=alias-avances#the-alias-that-does-not-work)): the line becomes `grep -r "$1" . hello`, `$1` is read as a variable of the **terminal**, where it does not exist, and `hello` is taken as a file name. A **function** is needed.

### Declaring the function: two spellings, and a naming trap

A function groups commands under a name; it receives its arguments in `$1`, `$2`... (see [functions](/?c=langages&s=bash&p=fonctions)). Zsh accepts the spellings of Bash and adds one:

| Spelling | Result in Zsh |
|---|---|
| `name() { ... }` | Declares the function (the Bash spelling) |
| `function name { ... }` | Declares the function (the word `function`, without parentheses) |
| `function name() { ... }` | Declares the function (both together) |

The three spellings give an identical function. Here is the first one, typed in the terminal over several lines (Zsh shows a continuation prompt, that is, a short text at the start of each new line, as long as the closing brace is missing):

```zsh
# the word search is still an alias: we remove it before declaring the function
unalias search
# search() declares the function; the braces { } enclose its commands
search() {
    # $1 is here the first argument of the function: the word searched for
    grep -r "$1" .
}
# runs the function with the word hello
search hello
```

```text
./a.txt:hello
./my file.txt:hello world
```

What happens if the `unalias` is forgotten? As in Bash, the word `search` is a first word: Zsh also expands it in the declaration. The difference is the **message**, more explicit than the "syntax error" of Bash. We recreate the alias to see it, then test the other spelling:

```zsh
# we recreate the alias removed above
alias search='grep -r "$1" .'
# declaration of a function with the same name, on one line (; separates two commands)
search() { grep -r "$1" . ; }
# the other spelling: the name is not in first position, the alias is not expanded
function search { grep -r "$1" . ; }
# type -a lists all the possible answers to the name, from the highest priority to the lowest
type -a search
```

```text
zsh: defining function based on alias `search'
zsh: parse error near `()'
search is an alias for grep -r "$1" .
search is a shell function
```

The declaration `search() { ... }` fails with two messages. The spelling `function search { ... }` **succeeds silently**, but it is a trap: the alias keeps priority (it is listed first by `type -a`), so typing `search` always runs the alias, never the function. **So we always remove the alias before declaring a function of the same name**, whatever the spelling. We then tidy up the terminal:

```zsh
# removes the alias and the function search, to start again from a clean terminal
unalias search
# unfunction removes a function (the table below gives the equivalent unset -f)
unfunction search
```

### `$@` without quotes: the Bash trap does not exist

In Bash, `$@` without quotes cuts a file name containing a space into two words (see [the function: `$1`, `"$@"` and `"$#"`](/?c=langages&s=bash&p=alias-avances#the-function-1-and)). Zsh behaves differently. `printf` displays a text according to a template: here `[%s]` is repeated for each argument, and `\n` moves to a new line.

```zsh
# summarize() displays the number of arguments, then each one between brackets
summarize() {
    # "$#": number of arguments received
    echo "$# arguments"
    # "$@": each argument remains one whole word
    printf '[%s]\n' "$@"
}
# wrong() does the same, but $@ has NO quotes
wrong() {
    # Bash would cut here at each space; Zsh does not
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
[my file.txt]
[c]
```

Both versions give **three** words: Zsh does not split the content of a variable on spaces (see [word splitting in Zsh](/?c=langages&s=zsh&p=zsh#word-splitting-on-an-unquoted-variable)). The two functions are nevertheless not equivalent. With the arguments `"*.txt"` (a wildcard: the shell would replace it with the matching file names) and `""` (an empty argument), in the `trial` folder:

| | Bash | Zsh |
|---|---|---|
| `printf '[%s]\n' "$@"` | `[*.txt]` then `[]` | `[*.txt]` then `[]` |
| `printf '[%s]\n' $@` | `[a.txt]` then `[my file.txt]`: the wildcard is expanded, the empty argument disappears | `[*.txt]` only: the wildcard is not expanded, but the empty argument disappears |

Zsh is safer than Bash on this point, but **the empty argument still disappears** without quotes. A script written for Zsh can also be run by Bash: so we always write `"$@"`, with the quotes.

`"$#"` (the number of arguments) works as in Bash. Zsh adds `$argv`, a synonym of `$@`: `$argv[1]` is `$1` and `$#argv` is `$#`. The last example refuses a call without argument. `if` tests a condition (see [conditions](/?c=langages&s=bash&p=conditions)), `-lt` means "less than", `return 1` ends the function with the failure code 1, and `${2:-.}` is the second argument if it is given, otherwise the dot.

```zsh
# search2(): searches for a word in a given folder or, failing that, in the current folder
search2() {
    # if the number of arguments is less than 1, the command is incomplete
    if [ "$#" -lt 1 ]; then
        # displays the usage message, then leaves the function with the failure code 1
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

The last call displays nothing: `hello` does not appear in `sub`, and `grep` ends with the code 1 (failure). Here is how to manage the functions themselves in Zsh:

| I want to | Spelling | Remark |
|---|---|---|
| Know whether `name` is a function | `type name` | Shows `name is a shell function` |
| Read the code of the function | `whence -f name`, `which name` or `functions name` | All three display the body of the function |
| Remove the function | `unfunction name` or `unset -f name` (`unset` undoes a name, `-f` designates a function) | Disappears until the next session |
| Keep it forever | Place it in `~/.zshrc` or in a file loaded by it | See [level 5](#organizing-your-shortcuts) |

## Level 3: aliases in a script

A **script** is a text file that contains commands, executed one after the other (see [writing and running a script](/?c=langages&s=bash&p=scripts-et-shebang)). It is run here with `zsh name.zsh`, which starts a **new** Zsh that reads the file. An **interactive shell** is a shell that waits for your commands typed on the keyboard in a terminal; a **non-interactive** shell is a shell that reads a script.

### By default, a script expands aliases

This is the big difference from Bash, where aliases are expanded only in an interactive shell. An **option** of the shell is a setting that changes its behavior (see [the shell options](/?c=langages&s=zsh&p=options-du-shell)). The option that controls aliases is called `aliases` and it is **on in every Zsh**, interactive or not.

```zsh
# --- contents of direct.zsh ---
# alias: creates the alias greet, which replaces this word with "echo hello"
alias greet='echo hello'
# we use the alias on the next line
greet world
# this line displays an end message
echo "end of script"
```

```zsh
# runs the script in a new non-interactive Zsh
zsh direct.zsh
```

```text
hello world
end of script
```

No setting is needed (Bash requires `shopt -s expand_aliases`, see [aliases in a script with Bash](/?c=langages&s=bash&p=alias-avances#level-3-aliases-in-a-script)). To query the state of an option, `[[ -o name ]]` is true if the option is on (the double brackets `[[ ]]` test a condition). `unsetopt` turns an option off, `setopt` turns it on (see [the shell options](/?c=langages&s=zsh&p=options-du-shell)), and `setopt no_aliases` is another spelling of `unsetopt aliases`: the prefix `no_` reverses the meaning of an option.

```zsh
# --- contents of without-alias.zsh ---
# turns off the aliases option: no more aliases are expanded from here on
setopt no_aliases
# the alias command still works: the alias is created...
alias greet='echo hello'
# ... but the word greet is no longer replaced: Zsh looks for a command of that name
greet world
# this line proves that the script goes on despite the error
echo "end of script"
```

```zsh
# --- contents of state.zsh ---
# [[ -o aliases ]] is true if the aliases option is on
if [[ -o aliases ]]; then echo "aliases: on"; else echo "aliases: off"; fi
```

```zsh
# runs the two scripts
zsh without-alias.zsh
zsh state.zsh
```

```text
without-alias.zsh:6: command not found: greet
end of script
aliases: on
```

The first message names the file and the line number (`:6`, comment lines count). A script run directly (with a first line `#!/usr/bin/env zsh`, the [shebang](/?c=langages&s=bash&p=scripts-et-shebang#the-shebang)) behaves in the same way.

### The terminal's alias is absent from the script

Even when the `aliases` option is on, an alias created in your terminal does not exist in the script, which is another **process** (a program being run, see [process management](/?c=langages&s=bash&p=gestion-des-processus)):

```zsh
# --- contents of uses-alias.zsh ---
# this script did not create the alias greet: it tries to use the one of the terminal
greet you
```

```zsh
# in the terminal: the alias exists for the terminal
alias greet='echo hello'
# the terminal expands it
greet world
# the script, for its part, is another Zsh: the alias is not there
zsh uses-alias.zsh
```

```text
hello world
uses-alias.zsh:2: command not found: greet
```

The `:2` is the line number in the file, the comment line counting as one.

### And the aliases of `~/.zshrc`?

An alias written in `~/.zshrc` is "an alias of the terminal": `~/.zshrc` is read only by an interactive shell, a script does not read it. The chapter on PowerShell states this in [its comparison table](/?c=langages&s=powershell&p=alias-et-raccourcis-de-commandes#and-in-bash-and-zsh); experiment confirms it, with a **nuance**: `~/.zshenv`, for its part, is read by **every** Zsh, scripts included (see [the four startup files](/?c=langages&s=zsh&p=fichiers-de-demarrage)). So as not to touch your real `~/.zshrc`, we build a trial configuration folder. The variable `ZDOTDIR` tells Zsh the folder where to look for its startup files, instead of your home folder; written in front of a command (`ZDOTDIR=... command`), it applies only to that command. `$PWD` is the variable that contains the current folder, and the option `-d` asks Zsh not to read the system startup files (see [diagnosing](#diagnosing-zsh-f)).

```zsh
# creates the trial configuration folder
mkdir config
# an alias in the .zshrc of this configuration
echo "alias fromzshrc='echo alias from zshrc'" > config/.zshrc
# an alias in the .zshenv of this configuration
echo "alias fromzshenv='echo alias from zshenv'" > config/.zshenv
# a script that uses the two aliases (printf writes one word per line)
printf '%s\n' fromzshrc fromzshenv > uses.zsh
# script run normally (non-interactive), with this configuration
ZDOTDIR=$PWD/config zsh uses.zsh
# same script read by an interactive Zsh (-i), without the system files (-d)
ZDOTDIR=$PWD/config zsh -d -i uses.zsh
```

```text
uses.zsh:1: command not found: fromzshrc
alias from zshenv
alias from zshrc
alias from zshenv
```

| Startup file | Read by `zsh script.zsh` | Read by an interactive Zsh |
|---|---|---|
| `~/.zshenv` | Yes: its aliases are visible from the script | Yes |
| `~/.zshrc` | **No**: its aliases are absent from the script | Yes |

The sentence from the PowerShell chapter is therefore exact for `~/.zshrc`. It does not say that, unlike Bash, a Zsh script expands its **own** aliases. A practical consequence: **never put aliases in `~/.zshenv`**, which would silently change the behavior of all the scripts.

### The next-line trap also exists

Alias expansion takes place **when the line is read**, not when it is run (see [the trap of the next line](/?c=langages&s=bash&p=alias-avances#the-trap-of-the-next-line)): Zsh reads a complete command, or a whole block, before running any of it. The four scripts of Bash gave the same results under Zsh:

```zsh
# --- contents of same-line.zsh ---
# definition AND use on the same line: separated by a semicolon
alias greet='echo hello'; greet world
# displays an end message
echo "end of script"
```

```zsh
# --- contents of block.zsh ---
# the braces { } form a block: Zsh reads the whole block before running one line of it
{
    # definition of the alias, inside the block
    alias greet='echo hello'
    # use in the same block: the alias is unknown here
    greet world
}
# use after the block: the block has been run, the alias exists
greet again
```

```zsh
# --- contents of function-before.zsh ---
# the function say is READ here, before the alias exists: greet stays an ordinary word
say() { greet you; }
# the alias is created after the function has been read
alias greet='echo hello'
# calling the function: it looks for a command greet, and finds nothing
say
```

```zsh
# --- contents of function-after.zsh ---
# the alias is created first
alias greet='echo hello'
# the function say is read now: greet is replaced by "echo hello"
say() { greet you; }
# calling the function: it displays hello you
say
```

```zsh
# runs each of the four scripts
zsh same-line.zsh
zsh block.zsh
zsh function-before.zsh
zsh function-after.zsh
```

```text
same-line.zsh:2: command not found: greet
end of script
block.zsh:6: command not found: greet
hello again
say: command not found: greet
hello you
```

Zsh names here the **function** in the message (`say:`) instead of the file and the line. The summary is that of Bash, without the `shopt` setting:

| Situation | Result |
|---|---|
| Definition and use on **two** consecutive lines | Works, without any setting |
| Definition and use on the **same line** (`;`) | Fails: the alias does not exist yet when the line is read |
| Definition and use **in the same block** `{ }` | Fails; the use **after** the block works |
| Function read **before** the alias | Fails when called, even if the alias exists at that moment |
| Function read **after** the alias | Works |

A shortcut file loaded by `source` is read when `source` runs, so its aliases exist afterwards:

```zsh
# --- contents of shortcuts.zsh ---
# shortcut file: it contains only the definition of an alias
alias greet='echo hello'
```

```zsh
# --- contents of loads-with.zsh ---
# source reads the file shortcuts.zsh and runs its lines in this script
source ./shortcuts.zsh
# the alias created by the file can be used from here on
greet world
```

```zsh
# runs the script: displays "hello world"
zsh loads-with.zsh
```

Whether the `aliases` option is on does not therefore change Bash's advice: in a shared script, you **do not use aliases**: you write the complete command or a function. An alias exists on your machine, in your configuration; the script must work everywhere.

## Level 4: global aliases and suffix aliases

Bash knows only one kind of alias: that of the **first word** of the line. Zsh adds two, which do not exist in Bash. We prepare one more file in the trial folder (the `trial` folder of level 2):

```zsh
# a notes file (md extension), for the example of the suffix aliases below
echo "# title" > notes.md
```

### The global alias: `alias -g`

A **global** alias is expanded **anywhere in the line**, not only as the first word. It is created with the option `-g` (for *global*). The examples have something in common: they replace a piece of line that one often retypes. A **pipe** (the character `|`) sends what a command displays to the input of the next one, `less` displays a text page by page (you quit with the `q` key), and `2>/dev/null` throws away the error messages: `2` designates the error output, `>` redirects it, and `/dev/null` is a special file that destroys everything written to it (see [redirections and pipes](/?c=langages&s=bash&p=redirections-et-pipes)).

```zsh
# -g: global alias; the word L will be replaced by "| less" wherever it is in the line
alias -g L='| less'
# NE ("no errors"): the error messages of the command are thrown away
alias -g NE='2>/dev/null'
# G: sends the result to grep, the command that searches for a word (see above)
alias -g G='| grep'
# alias -g without a name: lists only the global aliases
alias -g
# ls sub lists the content of the folder sub; L sends the result to less
ls sub L
# ls G txt becomes "ls | grep txt": only the names that contain txt are displayed
ls G txt
# three parts: "ls | grep txt | less"
ls G txt L
# ls fails (the folder does not exist), NE throws away the error message
ls /nonexistent NE
# $? contains the exit code of the last command: 0 for a success, otherwise a failure
echo "code=$?"
```

```text
G='| grep'
L='| less'
NE='2>/dev/null'
b.txt
a.txt
my file.txt
a.txt
my file.txt
code=2
```

(In a real terminal, `ls sub L` opens `less`; it appears here as plain text because the output is not a screen. Exit codes are explained in [the chapter on scripts](/?c=langages&s=bash&p=scripts-et-shebang#exit-codes-exit).) The following diagram shows what Zsh does with the line `ls G txt L`:

```
   You type:      ls G txt L
                   |
   1. Zsh examines EACH word, not only the first one
   2. G is a global alias: it is replaced by  | grep
   3. L is a global alias: it is replaced by  | less
   4. ls and txt are not aliases: they stay as they are
                   |
                   v
   Zsh parses and runs:   ls | grep txt | less
```

### The traps of the global alias

A global alias is powerful, and therefore dangerous: it is replaced **everywhere**, including where the word `G` was plain text.

```zsh
# G is expanded even here: the line becomes "echo | grep" (grep with no text to search)
echo G
# between quotes, the word stays an ordinary text
echo "G"
# preceded by a backslash, it also stays an ordinary text
echo \G
# between single quotes: nothing is expanded
echo 'a G b'
# a global alias as the first word gives a line that starts with a pipe
G
# without quotes, G would be expanded before unalias reads it
unalias G
# with quotes, the name is read as it is: the alias is removed
unalias 'G'
```

```text
Usage: grep [OPTION]... PATTERNS [FILE]...
Try 'grep --help' for more information.
G
G
a G b
zsh: parse error near `|'
unalias: not enough arguments
Usage: grep [OPTION]... PATTERNS [FILE]...
Try 'grep --help' for more information.
```

The last `unalias 'G'` succeeds without displaying anything. The three commands that name an alias (`alias`, `unalias`, `unhash`) follow the same rule: a global alias must be written there **between quotes** (`unalias 'G'`) or preceded by a backslash (`unalias \G`).

| Trap | Why it is a problem | What to do |
|---|---|---|
| A global alias whose name is a word that one sometimes writes as text (`echo G`, `echo 3 L 4`) | The text is replaced by a pipe: the line changes meaning | Short, upper-case names with no common meaning (`NE`, `G`); quotes or a backslash for the text |
| A global alias as the first word | The line starts with a pipe: parse error | Never use it alone |
| `unalias G`, `alias G`, `unhash -a G` without quotes | The name is expanded before being read | `unalias 'G'` |
| Global aliases in other people's commands (scripts, documentation) | `ls G txt L` is unreadable for anyone who does not know your aliases | A global alias only for typing by hand, never in a shared script |
| A global alias that hides a redirection (`NE`) | One forgets that errors are thrown away, so a command fails silently | Keep `NE` for the commands whose messages you know to be useless |

### The suffix alias: `alias -s`

A **suffix** alias (*suffix alias*) is tied to the **extension** of a file, that is, to the letters after the last dot of its name (`txt` in `a.txt`). It is created with `-s`: `alias -s txt=cat` means "a word that ends with `.txt` and that is typed **first** is preceded by `cat`". `cat` displays the content of a file (see [`cat`](/?c=langages&s=bash&p=commandes-de-base#reading-a-file-s-content-cat)), `head` displays its first lines (ten by default).

```zsh
# -s: suffix alias; a.txt typed alone launches "cat a.txt"
alias -s txt=cat
# same for the md extension, with the head command
alias -s md=head
# alias -s without a name: lists the suffix aliases
alias -s
# the name of the file is the first word: Zsh launches "cat a.txt"
a.txt
# a path with a folder works as well
sub/b.txt
# the file notes.md is read by head
notes.md
# the file does not exist: the alias is applied anyway, cat complains
nonexistent.txt
# spaces must be protected by a backslash
my\ file.txt
# between quotes, the word is no longer a file name for Zsh: the alias is ignored
"my file.txt"
```

```text
md=head
txt=cat
hello
goodbye
# title
cat: nonexistent.txt: No such file or directory
hello world
zsh: command not found: my file.txt
```

What is observed, contrary to what one often assumes:

| Case | Result |
|---|---|
| `a.txt` (the file exists) | `cat a.txt` is launched |
| `nonexistent.txt` (the file does not exist) | `cat nonexistent.txt` is launched anyway: the alias depends on the **name**, not on the file |
| `./a.txt`, `sub/b.txt`, `~/notes.txt` | The alias applies: the path counts only for its end |
| `a.TXT` | No alias: the extension is **case-sensitive** (upper and lower case are different) |
| `"my file.txt"` or `'my file.txt'` | No alias: a word between quotes is not recognized; write `my\ file.txt` |
| `echo a.txt` | No alias: only the **first word** of the line is looked at |
| `a.txt other` | `cat a.txt other`: the rest of the line follows the file name |
| A folder named `doc.txt` | `cat: doc.txt: Is a directory`: `cat` does not read a folder |
| An executable program named `prog.txt`, run by `./prog.txt` | The alias comes **first**: `cat` displays the script instead of running it |

The text of a suffix alias may contain options (`alias -s txt='cat -n'` numbers the lines). `alias` without an option does **not** list the suffix aliases: you need `alias -s` (or `alias -sL` for the copyable form: `alias -s txt=cat`). To remove one: `unalias -s txt`.

### Listing aliases: all the options

| Command | What it lists |
|---|---|
| `alias` | The regular aliases **and** the global aliases (without distinguishing them), not the suffix aliases |
| `alias -r` | The **regular** aliases only (*regular*), those of the first word |
| `alias -g` | The global aliases only |
| `alias -s` | The suffix aliases only |
| `alias -L` | The regular and global aliases, in the form of complete commands (`alias -g G='...'`) that can be copied into a file |
| `alias -gL`, `alias -sL` | Same form, limited to the global or suffix aliases |
| `alias -m 'pattern'` | The aliases whose **name** matches the pattern (see below) |

A **pattern** is a text model with wildcards: `N*` designates all the names that start with `N`. It must be protected by single quotes, otherwise Zsh replaces it with file names before `alias` sees it, and answers `zsh: no matches found: N*` if no file matches. With the aliases created above:

```zsh
# aliases whose name starts with N: NE
alias -m 'N*'
# aliases whose name ends with E: NE too (case matters)
alias -m '*E'
# aliases whose name starts with which: which-command
alias -m 'which*'
# unalias also accepts -m: removes all the aliases whose name starts with k
alias k1=echo k2=echo
unalias -m 'k*'
# k1 and k2 no longer exist: alias displays nothing
alias k1
```

```text
NE='2>/dev/null'
NE='2>/dev/null'
which-command=whence
```

## Level 5: workarounds, coexistence and organization

### Who answers when a name is typed?

The same name can designate an alias, a function, a builtin command (*builtin*: a command built into Zsh itself, like `cd`) and a program (an executable file, like `/usr/bin/date`). The order of priority is that of Bash (see [who answers when a name is typed](/?c=langages&s=bash&p=alias-avances#who-answers-when-a-name-is-typed)): **alias, then function, then builtin command, then program**. The reserved words (`if`, `for`...) form a separate category: `whence -w if` answers `if: reserved`.

Zsh offers **three commands** to display the answers, in addition to Bash's `type -a`: `whence` (from the English word meaning "from where?"), `which` and `where`. With `date`, a program to which we add a function and then an alias of the same name:

```zsh
# the name date is, for now, only a program
type -a date
# a function named date
date() { echo "date (function)"; }
# an alias named date
alias date='echo "date (alias)"'
# type -a: all the answers, from the highest priority to the lowest
type -a date
# whence -a: the same answers, in short form
whence -a date
# where: the same answers, with the full code of the function
where date
# which: only the first answer, the one that runs
which date
# whence -w: a single word, the nature of the first answer
whence -w date
# who answers when the name is typed?
date
```

```text
date is /usr/bin/date
date is /bin/date
date is an alias for echo "date (alias)"
date is a shell function
date is /usr/bin/date
date is /bin/date
echo "date (alias)"
date
/usr/bin/date
/bin/date
date: aliased to echo "date (alias)"
date () {
	echo "date (function)"
}
/usr/bin/date
/bin/date
date: aliased to echo "date (alias)"
date: alias
date (alias)
```

The program appears twice (`/usr/bin/date` and `/bin/date`) because, on this system, `/bin` is a **link** (a folder entry that designates another one) to `/usr/bin`: it is the same file, found through two entries of `$PATH` (the list of folders where the shell looks for programs, see [`$PATH`](/?c=langages&s=bash&p=variables-denvironnement#path-how-the-shell-finds-a-command)). What each command writes:

| Command | Alias | Function | Program |
|---|---|---|---|
| `type -a name` | `name is an alias for text` | `name is a shell function` | `name is /path` |
| `whence -a name` | The text of the alias | The name alone | The path |
| `where name` | `name: aliased to text` | The full code of the function | The path |
| `which name` | `name: aliased to text` | The full code of the function | The path |
| `whence -w name` | `name: alias` | `name: function` | `name: command` |

`which` shows only the **first** answer (the only one that runs), `where` and `whence -a` show all of them. `whence -w` gives one word per name: `alias`, `function`, `builtin`, `command`, `reserved`, or `none` if the name is unknown (with the exit code 1). It is the equivalent of Bash's `type -t`.

### Bypassing an alias or a function

```zsh
# the name date always designates the alias and the function created above
# \date: the backslash prevents the alias from being expanded, so the function answers
\date
# "date": the quotes have the same effect as the backslash
"date"
# command date: ignores the alias AND the function, runs the builtin command or the program
command date +%Y
# builtin date: looks for a builtin command only; date is not one
builtin date
# builtin echo: echo exists as a builtin command, it answers
builtin echo hi
# unalias date: removes the alias; the function answers again
unalias date
date
# unfunction date: removes the function; the program answers again
unfunction date
date +%Y
```

```text
date (function)
date (function)
2026
zsh: no such builtin: date
hi
date (function)
2026
```

The number `2026` is the current year at the time of the trial. `+%Y` is the argument that asks `date` to display the year alone.

| I want to | Spelling | What is ignored |
|---|---|---|
| Bypass the alias | `\name`, `"name"` or `'name'` | The alias only: a **function** of the same name still answers |
| Bypass the alias **and** the function | `command name` | Aliases and functions: the builtin command or the program answers |
| Force a builtin command | `builtin name` | Aliases, functions and programs (`no such builtin` if `name` is not one) |
| Remove the alias | `unalias name` | Nothing: it disappears until the next session |
| Remove the function | `unfunction name` or `unset -f name` | Nothing: it disappears until the next session |
| Remove by the hash table | `unhash -a name` (alias), `unhash -f name` (function), `unhash -s ext` (suffix alias) | Nothing: same effects as the commands above |

`unhash` removes a name from one of Zsh's internal lookup tables (the "hash tables", where it stores its aliases, its functions and its suffix aliases); without an option, it forgets the remembered path of a program. With `-a`, `-f` or `-s`, it therefore duplicates `unalias`, `unfunction` and `unalias -s`.

### What does not change: the self-calling alias, the trailing space, `xargs`

Three behaviors of Bash are identical under Zsh. An alias can contain the name it replaces without an infinite loop; if the text of an alias ends with a space, the following word is also looked at as an alias; `xargs` (a program that reads words and adds them as arguments of a command) does not know the aliases of the shell. The explanations are in [level 4 of the Bash chapter](/?c=langages&s=bash&p=alias-avances#level-4-workarounds-and-coexistence); here are the results observed in Zsh.

```zsh
# the alias ls adds --color=auto (colors if the output is a terminal) to the real command
alias ls='ls --color=auto'
# type displays what ls is: the word ls of the text is not expanded a second time
type ls
# two aliases that point to each other: a to b, b to a
alias a='b'
alias b='a'
# a becomes b, b becomes a, and a is not expanded a second time: no loop
a
# write designates echo (without trailing space), world is a replacement text
alias write='echo'
alias world='everyone'
# the word world is not a first word: it is displayed as it is
write world
# we redefine write with a space AT THE END of the text
alias write='echo '
# the word after write is now looked at as an alias: world is expanded
write world
# the alias greet exists for the terminal
alias greet='echo hello'
# xargs looks for a PROGRAM named greet: it does not know Zsh's aliases
echo you | xargs greet
# we remove the aliases of the example
unalias ls a b write world greet
```

```text
ls is an alias for ls --color=auto
zsh: command not found: a
world
everyone
xargs: greet: No such file or directory
```

### The Zsh options related to aliases

Three Zsh options concern aliases (see [the shell options](/?c=langages&s=zsh&p=options-du-shell) for `setopt` and `unsetopt`, and [the official list of options](https://zsh.sourceforge.io/Doc/Release/Options.html) for their full description):

| Option | Default value | Effect |
|---|---|---|
| `aliases` | On | If it is turned off (`unsetopt aliases`), no alias is expanded; the `alias` command keeps creating them. See [level 3](#level-3-aliases-in-a-script) |
| `alias_func_def` | Off | If it is on, a declaration `name() { ... }` is allowed even when `name` is an alias, **with a surprising effect** (see below) |
| `complete_aliases` | Off | If it is on, completion (the suggestion of the end of a word when you press the Tab key, see [advanced completion](/?c=langages&s=zsh&p=completion-avancee)) treats the alias as a full command, instead of first replacing it with its text |

The `alias_func_def` option deserves a try, because its result runs against intuition: instead of defining a function `ll`, it defines a function named like the **text** of the alias.

```zsh
# ll is an alias of the program ls
alias ll=ls
# turns on the permission to declare a function on an alias name
setopt alias_func_def
# the declaration is accepted... but ll is first replaced by ls
ll() { echo "I am ll"; }
# ll is still an alias
type -a ll
# it is the name ls that has become a function!
type -a ls
# the call to ll runs the alias, so the function ls
ll
# we put everything back in order: option off, function and alias removed
unsetopt alias_func_def
unfunction ls
unalias ll
```

```text
ll is an alias for ls
ls is a shell function
ls is /usr/bin/ls
ls is /bin/ls
I am ll
```

With an alias of several words such as `grep -r "$1" .`, the declaration defines several functions at once (test: `grep` and `.`). **So do not turn on `alias_func_def`**: the default error is the protection.

### Organizing your shortcuts

When you have a few shortcuts, `~/.zshrc` becomes unreadable. They are stored in a separate file, `~/.zsh_aliases`, which `~/.zshrc` loads, or in a folder `~/.zshrc.d` whose every file is loaded. These two names are **conventions**: Zsh does not read them on its own; it is `~/.zshrc` that must contain the lines below. The test `[[ -f file ]]` is true if this file exists and is an ordinary file (see [conditions](/?c=langages&s=bash&p=conditions)). The pattern `*.zsh` designates all the files whose name ends with `.zsh`, and the **qualifier** `(N)` placed after it says "if no file matches, produce nothing instead of reporting an error" (see [glob qualifiers](/?c=langages&s=zsh&p=expansion-et-jokers-avances#glob-qualifiers-filtering-by-type-or-metadata)). `for ... do ... done` repeats the commands for each file found (see [loops](/?c=langages&s=bash&p=boucles)).

```zsh
# --- to add at the end of ~/.zshrc ---
# if the file ~/.zsh_aliases exists, we load it
if [[ -f ~/.zsh_aliases ]]; then
    # source reads the file in the current shell
    source ~/.zsh_aliases
# fi ends the if
fi
# for each .zsh file in ~/.zshrc.d (none: (N) avoids the error)
for file in ~/.zshrc.d/*.zsh(N); do
    # we load this file
    source "$file"
# done ends the loop
done
```

```zsh
# --- contents of ~/.zsh_aliases ---
# simple shortcuts: a short name for a command
alias ll='ls -la'
# ls -lt: detail of each file, from the most recent to the oldest
alias lt='ls -lt'
# global alias (level 4): throws away the error messages
alias -g NE='2>/dev/null'
# suffix alias (level 4): a .txt file typed alone is displayed by cat
alias -s txt=cat
# searches for the word given as first argument in the current folder
search() {
    grep -rn "$1" .
}
```

The global and suffix aliases are stored in the same file as the others: `alias -L` gives their copyable form. With this file and two files in `~/.zshrc.d` (`git.zsh`, which contains `alias gs='git status'`, from the [Git](/?c=qualite-performance-et-outils&s=git&p=concepts-de-base) software, and `docker.zsh`, which contains `alias dc='docker compose'`, from the [Docker Compose](/?c=infrastructure-devops&s=docker&p=docker-compose) tool), one observes, by launching an interactive Zsh that reads such a `~/.zshrc`:

| Observed case | Result |
|---|---|
| The files exist | `alias` lists `ll`, `lt`, `gs`, `dc` and `NE`; `alias -s` lists `txt=cat`; `type search` answers that it is a function |
| `~/.zsh_aliases` does not exist, with the test `[[ -f ... ]]` | The terminal starts without any message |
| `~/.zsh_aliases` does not exist, with only `source ~/.zsh_aliases` | A `no such file or directory` message at each startup (startup continues) |
| `~/.zshrc.d` empty, with `(N)` | The terminal starts without any message |
| `~/.zshrc.d` empty, without `(N)` | A `no matches found` message followed by the pattern, at each startup |
| A line added to the files after startup | Unknown until `source ~/.zsh_aliases` is run |

### Diagnosing: `zsh -f`

When a command behaves strangely, the cause is sometimes one of your aliases or functions. The command-line options of Zsh (described in [the "Invocation" section of the manual](https://zsh.sourceforge.io/Doc/Release/Invocation.html)) make it possible to set them aside:

| Command | Effect |
|---|---|
| `zsh -f` | Starts a new Zsh that does **not read** your personal startup files (`~/.zshenv`, `~/.zshrc`...): none of your shortcuts exist there |
| `zsh -d` | Does not read the **system** startup files (those of `/etc/zsh`, which may also define or remove aliases) |
| `zsh -d -f` | No startup file at all |
| `zsh -f -c 'text'` | Runs this text in a Zsh with no configuration, then stops (`-c`: execute this text) |

```zsh
# in the normal session, ll exists (created at level 1)
alias ll='ls -la'
# displays the definition of ll
alias ll
# in a Zsh with no configuration, ll does not exist: nothing is displayed, and the code is 1
zsh -f -c 'alias ll; echo "code=$?"'
```

```text
ll='ls -la'
code=1
```

To work in a Zsh with no configuration, you type `zsh -f` alone: the prompt (the text that precedes what you type) changes appearance, `alias` lists only the two starting aliases, and `exit` closes this Zsh and brings you back to the previous session, with your shortcuts. If the behavior becomes normal again in `zsh -f`, the culprit is among your shortcuts: remove them one by one to find which one.

### The aliases of Oh My Zsh

[Oh My Zsh](/?c=langages&s=zsh&p=oh-my-zsh) is a set of settings and extensions (*plugins*) for Zsh. Its plugins define hundreds of aliases, for example those of the `git` plugin. They are loaded at startup and `alias` lists them like yours, which makes it possible to find them and check them:

```zsh
# definition of an alias supplied by the git plugin
alias gst
# the aliases whose name starts with gpu: here only one, git push upstream
alias -m 'gpu*'
# Oh My Zsh defines global aliases itself: we list them (alias -g)
alias -g
```

```text
gst='git status'
gpu='git push upstream'
...=../..
....=../../..
.....=../../../..
......=../../../../..
```

The first two results depend on the installed plugin, the global aliases on the version of Oh My Zsh. Three precautions are needed:

| Precaution | Why |
|---|---|
| `alias name` before creating a shortcut | Oh My Zsh already defines common names: `ll` is `ls -lh` there, `l` is `ls -lah` |
| Add your aliases **after** the `source $ZSH/oh-my-zsh.sh` line of `~/.zshrc` | The last definition of a name wins: after `source`, `alias ll='ls -la'` replaces that of Oh My Zsh |
| Or place them in `~/.oh-my-zsh/custom/` | Every `.zsh` file in this folder is loaded automatically and survives updates (see the chapter [Oh My Zsh](/?c=langages&s=zsh&p=oh-my-zsh)) |

## Summary of the levels

| Level | Need | Tool | Limit |
|---|---|---|---|
| 1 | Another name for a command | `alias ll='ls -la'`, `alias -L`, `unalias`, `~/.zshrc` | A text pasted in front of the arguments; no `$1`; lost when the terminal closes without `~/.zshrc` |
| 2 | An argument placed in the middle, a test on the number of arguments | Function with `"$1"`, `"$@"`, `"$#"` | `name() {` fails if an alias carries that name; `function name {` succeeds but the alias keeps priority |
| 3 | A shortcut in a script | The `aliases` option (on), or better, a function | An alias exists only from the next line; the aliases of `~/.zshrc` are absent from the script, those of `~/.zshenv` are there |
| 4 | Acting anywhere in the line, or according to the extension | `alias -g`, `alias -s` | A global alias is expanded even inside a text; a suffix alias also applies to a file that does not exist |
| 5 | Coexisting, organizing, diagnosing | `\name`, `command`, `whence -a`, `~/.zsh_aliases`, `zsh -f` | `\name` lets a function through; `alias_func_def` renames the wrong name |

## Pitfalls

| Pitfall | Why it is a problem | What to do |
|---|---|---|
| `alias search='grep -r "$1" .'` | `$1` does not exist in an alias: it is empty, and the typed word is pasted at the end | A function with `"$1"` |
| `search() { ... }` when an alias `search` exists | Error `defining function based on alias` | `unalias name` before the function |
| `function search { ... }` when an alias `search` exists | No error, but the alias keeps priority: the function is never called | `unalias name` before the function, and `type -a name` to check |
| `$@` without quotes | The empty arguments disappear (and Bash also cuts the spaces and expands the wildcards) | `"$@"` |
| Believing that a script ignores aliases | Under Zsh, a script expands the aliases it defines | Write the complete command or a function |
| Alias defined and used on the same line or in the same `{ }` block | The alias exists only from the line read next | Define it on one line and use it further on, or use a function |
| Function read before the alias it uses | The word stays ordinary: expansion takes place when the body is read | Prefer the complete command in a function |
| An alias in `~/.zshenv` | This file is read by all the scripts: the behavior changes silently | Reserve `~/.zshenv` for environment variables |
| A global alias with a common name (`echo G`) | The text is replaced by a pipe followed by `grep` | Short upper-case names, rare in text |
| `unalias G`, `alias G`, `unhash -a G` without quotes | The name of a global alias is expanded before being read | `unalias 'G'` or `unalias \G` |
| A global alias as the first word, or in a shared script | Parse error, or a line unreadable for others | Reserve global aliases for typing by hand |
| A suffix alias that assumes the file exists | It applies from the name only, and comes before a program of the same name | Do not name a program with an extension you have linked |
| A file name between quotes, or an extension in upper case | The suffix alias is ignored | `my\ file.txt` and the right case |
| `setopt alias_func_def` | A declaration `ll() {...}` defines a function named like the alias text | Leave the option off |
| `\name` to get around | It bypasses only the alias: a function of the same name still answers | `command name` |
| An alias in a program run by `xargs` | `xargs` runs programs, not aliases | A script or the program itself |
| `source ~/.zsh_aliases` without a `[[ -f ... ]]` test | An error message at each startup if the file is missing | `if [[ -f ~/.zsh_aliases ]]; then ... fi` |
| `~/.zshrc.d/*.zsh` without `(N)` | `no matches found` at each startup if the folder is empty | `~/.zshrc.d/*.zsh(N)` |
| An alias that reuses a name from Oh My Zsh | The old meaning disappears, or yours is overwritten depending on the loading order | `alias name` before choosing, and your lines after `source $ZSH/oh-my-zsh.sh` |
| Modifying `~/.zsh_aliases` without reloading | The current session keeps the old state | `source ~/.zsh_aliases` |

## Best practices

| Best practice | Why |
|---|---|
| An alias for a simple renaming or fixed options, a function as soon as an argument is placed anywhere other than at the end | Each tool stays in its own domain |
| Single quotes around the text of an alias | The variables are read at use |
| `"$@"` with quotes, `"$#"` to count | The script also works under Bash, and empty arguments are kept |
| `alias -L` to save your aliases | The copyable form, global and suffix aliases included |
| Write the complete command or a function in a script | The script works on every machine, with or without your aliases |
| `whence -a name` or `type -a name` before creating a shortcut | No unintended mask, including one from an Oh My Zsh alias |
| `command name` to reach the real command | Bypasses alias and function |
| Global aliases that are short, upper-case, and reserved for typing by hand | They stay easy to spot, and a shared script does not depend on them |
| Store all the shortcuts in `~/.zsh_aliases` or `~/.zshrc.d`, loaded with `[[ -f ... ]]` or `(N)` | A short `~/.zshrc`, and shortcuts that are easy to back up |
| `zsh -f` when a behavior seems strange | Rules out your shortcuts as the cause |
| Keep your shortcuts few and clearly named | You remember them, and you avoid hiding a useful command |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | An **alias** is a **text** substituted for the first typed word, **before** the line is parsed, as in Bash: `alias ll='ls -la'` creates, `alias` lists (without the word `alias` in front of each line; `alias -L` gives the copyable form), `unalias ll` removes, and `~/.zshrc` makes it permanent. An alias has no `$1`: a **function** receives `$1`, `"$@"` and `"$#"`. Under Zsh, `$@` without quotes is not cut on spaces (the empty argument still disappears), and the declaration `name() {` fails if an alias carries that name, whereas `function name {` succeeds without the function being called. Unlike Bash, a script **expands the aliases** it defines (`aliases` option on), but not those of `~/.zshrc` (those of `~/.zshenv` are). The next-line trap also exists. **Global aliases** (`alias -g NE='2>/dev/null'`): expanded anywhere in the line, to be written between quotes for `unalias`. **Suffix aliases** (`alias -s txt=cat`): `file.txt` typed as the first word runs `cat file.txt`, from the name alone, case included. Order of answer: alias, function, builtin command, program; `type -a name`, `whence -a name` and `where name` list them. `\name` bypasses the alias alone, `command name` bypasses the alias and the function. Shortcuts in `~/.zsh_aliases` or `~/.zshrc.d`, and `zsh -f` to diagnose. |
| **Pitfalls to avoid** | `$1` in an alias; function declared without removing the alias of the same name; `function name {` which leaves the alias in priority; believing that a script ignores aliases; alias defined and used on the same line or in the same block; alias in `~/.zshenv`; global alias with a common name or as the first word; `unalias G` without quotes; suffix alias applied to a name that does not exist or to a program; `setopt alias_func_def`; believing that `\name` bypasses a function; alias behind `xargs`; `source` or `*.zsh` without a test or `(N)`; alias name that hides a command or an Oh My Zsh alias. |
| **Best practices** | Alias to rename, function as soon as an argument is placed anywhere other than at the end; single quotes; `"$@"` and `"$#"`; complete command or function in a script; `whence -a name` before naming; `command name` to reach the real command; global aliases short and reserved for typing; shortcuts in `~/.zsh_aliases` or `~/.zshrc.d`; `zsh -f` to set your shortcuts aside during a diagnosis. |
