---
order: 17
---

# A clean shell environment

A [shell](/?c=langages&s=bash&p=bash) (the program that reads your commands in a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal)) passes a copy of its **environment** to every program it launches: the whole set of its [environment variables](/?c=langages&s=bash&p=variables-denvironnement). This environment comes from your machine, with everything it contains: your settings, your aliases, your folders in `$PATH`. When you want to build software in a reproducible way, or to build a Linux system by hand (as the [Linux From Scratch](https://www.linuxfromscratch.org/lfs/) project suggests), this inheritance is a danger: the build then depends, without you noticing, on the machine that launched it. This chapter shows how to start from an empty environment and put in only what you choose.

It assumes you already know `export`, the order of `$PATH`, `~/.bashrc` versus `~/.bash_profile`, and `source`, covered in the chapter on [environment variables](/?c=langages&s=bash&p=variables-denvironnement).

> **Vocabulary.** The **host** is the machine (or the system) that runs the build. A **process** is a program being executed (see [process management](/?c=langages&s=bash&p=gestion-des-processus)).

## The overall diagram

```text
HOST: your session
  rich environment: PATH, HOME, PS1, aliases, dozens of variables
        |
        |  env -i HOME=... TERM=... PS1=... PATH=...   (only 4 variables are passed)
        v
EMPTY ENVIRONMENT: nothing inherited, except what was just declared
        |
        |  /bin/bash   (a new shell, which then reads its own files)
        v
BUILD: compile, install, with a known and complete environment
```

## `env`: displaying and building an environment

`env` is a system program (it comes from [GNU coreutils](https://www.gnu.org/software/coreutils/manual/html_node/env-invocation.html), the collection of basic tools). Without argument, it displays the variables of its environment. With `-i` (*ignore environment*), it **empties** the environment, adds the `NAME=value` variables given, then runs the command that follows.

```bash
# counts the variables of an ordinary shell's environment (one per line of env)
bash -c 'env | wc -l'
# same count, but the shell is launched with an empty environment
env -i bash -c 'env | wc -l'
```

```text
78
3
```

The first number depends on your machine. The three remaining variables do not come from you: Bash itself creates them at startup.

```bash
# empty environment: env only displays the variables given
env -i bash -c 'env'
```

```text
PWD=/tmp
SHLVL=0
_=/usr/bin/env
```

Here `PWD` is the current folder, `SHLVL` the nesting level of shells, and `_` the last program launched. Now let's pass a variable of our own:

```bash
# we declare MY_VAR and PATH; HOME is not declared, so it does not exist
env -i MY_VAR=hello PATH=/usr/bin:/bin bash -c 'echo "[$MY_VAR] [$HOME]"'
# the ls command is found thanks to the PATH we gave
env -i MY_VAR=hello PATH=/usr/bin:/bin bash -c 'ls /etc/hostname'
```

```text
[hello] []
/etc/hostname
```

| Command | Environment received by the launched program |
|---|---|
| `env` | Displays the current environment, launches nothing else |
| `env VAR=val command` | That of the host, plus `VAR=val` |
| `env -i command` | Empty (apart from the three variables Bash creates) |
| `env -i VAR=val command` | Empty, plus `VAR=val` only |

> **Pitfall:** without `HOME`, `TERM`, `PATH` and the others, many programs behave differently: `$HOME` is empty, `~` no longer expands, an editor no longer knows how to display the terminal. This is intended: it is up to you to declare what is needed, and only that.

## `exec`: replacing the shell instead of starting a second one

Normally, when a script runs a command, the shell stays there, waits for the command to finish, then reads the next line. The built-in command `exec` does something else: it **replaces** the shell's process with the requested program (see [`fork()` and `execve()`](/?c=langages&s=bash&p=architecture-dun-shell) for the mechanism). There is no shell behind it any more: everything that follows `exec` in the script is never read.

```bash
# $$ is the number (PID) of the current shell process
# exec replaces this shell with another bash: the number does not change
bash -c 'echo "before: $$"; exec bash -c "echo \"after: \$\$\""'
```

```text
before: 59235
after: 59235
```

The number is the same before and after: there was no second process, the first one changed program. The numbers shown change on each run, only their equality matters.

```bash
#!/bin/bash
# launcher.sh: a script that copies a line from a book without understanding exec
echo "start of the launcher"
# exec replaces the script with a clean bash: the script no longer exists after this line
exec env -i HOME=/tmp TERM=xterm /bin/bash -c 'echo "in the clean bash"'
echo "this line is never displayed"
```

```bash
# runs the script
bash launcher.sh
```

```text
start of the launcher
in the clean bash
```

The script's last line disappeared with it. The trap came up in practice: an `exec env -i ...` line copied from a book into a launcher, and everything that followed (the build itself) was ignored without the slightest error message.

| Form | What happens next |
|---|---|
| `env -i ... bash` | A second shell is started; the first waits for it to end, then carries on |
| `exec env -i ... bash` | The first shell is replaced; nothing carries on after it |
| `(exec command)` | The replacement only happens in the [subshell](/?c=langages&s=bash&p=architecture-dun-shell) inside the parentheses; the script carries on |

> **Note:** `exec` therefore belongs at the **end** of a launcher, or in a startup file whose only role is to hand over to another shell. Elsewhere, forgetting what it does is costly.

## Which files does a shell read at startup?

The chapter on [environment variables](/?c=langages&s=bash&p=variables-denvironnement) contrasts `~/.bashrc` and `~/.bash_profile`. Here is the exact rule, according to the [GNU Bash](https://www.gnu.org/software/bash/manual/html_node/Bash-Startup-Files.html) manual:

- A **login shell** is the one you get when you log in. Bash is one when it is launched with `--login` (or `-l`), or when its name is preceded by a dash.
- An **interactive shell** is a shell that waits for typed commands (as opposed to a script).

| Type of shell | Files read |
|---|---|
| Login | `/etc/profile`, then the first one found among `~/.bash_profile`, `~/.bash_login`, `~/.profile` |
| Interactive, non-login | `~/.bashrc` (and, on Debian and Ubuntu, `/etc/bash.bashrc` before it) |
| Neither (script, `bash -c`) | No startup file |

Demonstration with a test home folder, so as not to touch yours:

```bash
# creates a fake home folder
mkdir -p /tmp/test-home
# a file read by a login shell: it sets a variable
echo 'export FROM_PROFILE=yes' > /tmp/test-home/.bash_profile
# a file read by an interactive shell: it sets another variable
echo 'export FROM_BASHRC=yes' > /tmp/test-home/.bashrc

# -l asks for a login shell: .bash_profile is read
env -i HOME=/tmp/test-home bash -l -c 'echo "login: [$FROM_PROFILE]"'
# without -l: no file is read
env -i HOME=/tmp/test-home bash -c 'echo "no login: [$FROM_PROFILE]"'
# -i asks for an interactive shell: .bashrc is read
env -i HOME=/tmp/test-home bash -i -c 'echo "interactive: [$FROM_BASHRC]"'
```

```text
login: [yes]
no login: []
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

interactive: [yes]
```

The two lines of sudo text do not come from your file: they come from a file on the host, which the next section explains.

### `su - NAME` versus `su NAME`

`su` (*substitute user*) opens a shell under another user's identity. This part is described from the manual of `su` (`man su`): it was not run here, because `su` asks for a password.

| Command | Kind of shell obtained | Effect |
|---|---|---|
| `su - NAME` (with the dash, or `-l`) | Login shell | Clears almost the whole environment (except `TERM`), recreates `HOME`, `SHELL`, `USER`, `LOGNAME` and `PATH`, moves to the home folder of `NAME`, then reads `~/.bash_profile` |
| `su NAME` (without dash) | Interactive, non-login shell | Keeps most of the caller's environment, does not read `~/.bash_profile` (it reads `~/.bashrc`) |

A `~/.bash_profile` file that only hands over to a clean shell is the classic way to guarantee a controlled environment from login:

```bash
# ~/.bash_profile: replaces the login shell with a bash with a minimal environment
# TERM describes the type of terminal, PS1 is the text displayed before each command
exec env -i HOME=$HOME TERM=$TERM PS1='\u:\w\$ ' PATH=/usr/bin:/bin /bin/bash
```

The `bash` launched this way is interactive, non-login: it therefore reads `~/.bashrc`, and that is where the rest of the setup goes (project-specific variables, aliases). Here `exec` is in its place: the login shell has nothing left to do and disappears.

## When the host barges in despite `env -i`

In the previous demonstration, a message about `sudo` appeared even though the environment was empty: a host file, `/etc/bash.bashrc`, is read by every interactive shell on Debian and Ubuntu, even before `~/.bashrc`. It can also **change `PS1`**, the variable that holds the text displayed before each command (the *prompt*), even when it was passed on cleanly:

```bash
# we pass PS1='$ ' to an interactive shell launched with an empty environment
env -i HOME=/nonexistent PS1='$ ' bash -i -c 'echo "[$PS1]"'
# same thing, but --norc forbids reading the host's startup files
env -i HOME=/nonexistent PS1='$ ' bash --norc -i -c 'echo "[$PS1]"'
```

```text
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

[${debian_chroot:+($debian_chroot)}\u@\h:\w\$ ]
[$ ]
```

The first shell replaced `PS1='$ '` with the value defined in the host's `/etc/bash.bashrc`; the second, with `--norc`, kept it. The checking method is always the same:

| Step | Command | What to look for |
|---|---|---|
| 1. Note what was passed | The `env -i ...` line itself | The exact list of declared variables |
| 2. Display what the shell sees | `env` in the new shell | A different variable, or an extra one |
| 3. Identify the source | `grep -n PS1 /etc/bash.bashrc` (for example) | The host file that changed it |
| 4. Rule out the file | `bash --norc`, or do not start an interactive shell | An environment equal to what was passed |

## `export`: making visible, not giving a value

`export` does not set a value: it marks an existing variable as **to be passed on** to the programs launched afterwards. The value is written elsewhere (an assignment `NAME=value`, or the line `env -i NAME=value`). That is what separates a shell variable from an environment variable:

```bash
# VAL is a simple shell variable: it is not yet in the environment
VAL=1
# a child shell launched now does not see it: the brackets stay empty
bash -c 'echo "child without export: [$VAL]"'
# export marks VAL as to be passed on to programs launched afterwards
export VAL
# the same child now receives it
bash -c 'echo "child with export: [$VAL]"'
# removes the variable to leave nothing in this terminal
unset VAL
```

```text
child without export: []
child with export: [1]
```

With `env -i`, there is no need for `export`: a variable given to `env` is part of the launched program's environment, by construction.

## Limiting `make`'s parallelism with `MAKEFLAGS`

[`make`](/?c=langages&s=c&p=makefiles) reads its environment variable `MAKEFLAGS` as if its content were written on the command line. The `-jN` option lets it run N jobs at once, which speeds up the build a lot. `nproc` displays the number of computing cores (processors) available: it is a reasonable value for N.

```bash
# displays the number of cores on the machine
nproc
# a minimal test Makefile: a rule that displays the value of MAKEFLAGS
printf 'all:\n\t@echo "MAKEFLAGS is: $(MAKEFLAGS)"\n' > /tmp/Makefile.test
# -j followed by the number of cores, passed through the environment
MAKEFLAGS=-j$(nproc) make -f /tmp/Makefile.test
# -j without a number: make launches as many jobs as there are ready to run
make -j -f /tmp/Makefile.test
```

```text
16
MAKEFLAGS is:  -j16 --jobserver-auth=3,4
MAKEFLAGS is:  -j
```

The number `16` is that of the test machine. In the first case, `make` completed the variable with an internal detail (`--jobserver-auth`) used to coordinate its subprocesses: only `-j16` is yours.

| Setting | Effect |
|---|---|
| `MAKEFLAGS=-j$(nproc)` | At most as many jobs as cores |
| `MAKEFLAGS=-j4` | At most 4 jobs, for example to keep the machine usable |
| `-j` without a number | **No limit**: on a large project, hundreds of compilers start together and can saturate memory and processor |

## The principle of isolation

This whole chapter applies one same idea: **start from an empty state and put in only what you declare**. The result no longer depends on what the machine happens to contain; it can therefore be reproduced elsewhere, or later, and yield the same thing.

| Tool | What it empties | What it declares |
|---|---|---|
| `env -i` | The environment variables | The `NAME=value` given to `env` |
| A [Docker container](/?c=infrastructure-devops&s=docker&p=concepts-de-base) | The file system and the visible processes | An image, variables, volumes |
| A [Python virtual environment](/?c=langages&s=python&p=modules-et-environnements) (`venv`) | The libraries installed for this project | The dependencies installed in this folder |

Each tool isolates at its own scale: `env -i` only the environment of one process, `venv` only the Python libraries, the container much more. None of them protects against a hostile program: they make a result **reproducible**, not unbreakable.

### The link with least privilege

The [principle of least privilege](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise) says that a component receives only the rights it needs. Isolation through an empty environment is its counterpart: it protects in the other direction.

| Measure | What it protects | From what |
|---|---|---|
| Building as an ordinary user (see [file permissions](/?c=langages&s=bash&p=permissions-et-fichiers)) | The **host** | An error in the build (a command that overwrites system files, a badly targeted `rm`) |
| Building with an empty environment | The **build** | The host (variables, aliases, startup files that change the result without you seeing it) |

The two combine: an ordinary user in an empty environment can only damage its own folder, and depends only on what was given to it.

## Pitfalls

| Pitfall | Why it is a problem |
|---|---|
| `exec` followed by other lines in a script | `exec` replaces the script: everything that follows is ignored, without error. Reserve it for the last line |
| `env -i` without `PATH`, `HOME`, `TERM` | The shell takes a default `PATH`, but `HOME` is empty and `TERM` is missing: programs that crash or display badly |
| Believing `env -i` is enough to isolate | An interactive shell rereads the host's files (`/etc/bash.bashrc`, `~/.bashrc`): `PS1` or other variables change. Compare `env` with what was passed |
| `su NAME` instead of `su - NAME` | No login shell: `~/.bash_profile` is not read and the caller's environment is kept |
| Writing `export` thinking it gives a value | `export` only makes an existing variable visible; the value comes from an assignment |
| `MAKEFLAGS=-j` without a number | Unlimited parallelism: memory and processor saturated |

## Best practices

| Practice | Why |
|---|---|
| Run the build with `env -i` and the complete list of needed variables, written in a single file | It is readable, replayable, and checkable at a glance |
| Put `exec env -i ... /bin/bash` in `~/.bash_profile`, never in the middle of a script | The shell replacement happens in the right place |
| Display `env` in the new shell and compare it with the list passed on | Detects a variable added by a host file |
| Rule out the faulty file (`--norc`, or move it) rather than fixing the variable afterwards | The cause disappears, instead of being hidden |
| Set `MAKEFLAGS=-j$(nproc)` | Fast without saturating the machine |
| Combine an ordinary user and an empty environment | The host is protected from the build, and the build from the host |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | A program inherits the environment of the shell that launched it. `env -i NAME=value command` replaces it with an empty environment plus what is declared. `exec` replaces the shell instead of starting a second one: nothing runs after it. A login shell reads `~/.bash_profile`, an interactive non-login shell reads `~/.bashrc`. |
| **Tools you can use** | `env`, `env -i`, `exec`, `bash -l`, `bash --norc`, `su -`, `export`, `nproc`, `MAKEFLAGS`. |
| **Pitfalls to avoid** | `exec` in the middle of a script; believing an empty environment is watertight when `/etc/bash.bashrc` is read; `-j` without a number. |
| **Best practices** | Start from an empty state and declare what you want, as with `env -i`, a container or `venv`; check the result with `env`; combine with an ordinary user. |
