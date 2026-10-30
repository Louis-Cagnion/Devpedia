---
order: 14
---

# Aliases and command shortcuts in PowerShell

A **command shortcut** is a short name typed in place of a long command or a series of commands. In [PowerShell](/?c=langages&s=powershell&p=powershell), the shell (the program that reads what you type into a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) and runs it), there are several tools for this, from the simplest to the most powerful. This chapter presents them **in four levels**, each one building on the previous one:

| Level | Need | Tool | Section |
|---|---|---|---|
| 1 | Another name for a single command | The **alias** (`Set-Alias`) | [Level 1](#level-1-the-simple-alias) |
| 2 | A command with arguments already filled in | A short **function** | [Level 2](#level-2-fixed-arguments-with-a-function) |
| 3 | A real small tool: named parameters, default values, [pipeline](/?c=langages&s=powershell&p=redirections-et-pipes) | An advanced function, then an alias set on it | [Level 3](#level-3-a-complex-shortcut) |
| 4 | Making all of this coexist without bad surprises | `Get-Command`, `$PROFILE`, dot sourcing (loading a file into the current session) | [Level 4](#level-4-coexistence-and-pitfalls) |

A **cmdlet** (pronounced "command-let") is a native PowerShell command, named `Verb-Noun` like `Get-ChildItem`; it is presented in [basic commands](/?c=langages&s=powershell&p=commandes-de-base). An **argument** is everything you write after the name of a command; a **parameter** is a named argument that starts with a dash, like `-Force` in `Get-ChildItem -Force`. The **session** is the period from opening the terminal window to closing it. This chapter assumes that you know [functions](/?c=langages&s=powershell&p=fonctions) and [environment variables](/?c=langages&s=powershell&p=variables-denvironnement) (which present the `$PROFILE` profile file).

## What an alias is, and why we create one

An **alias** is a second name given to **one** command. The closest image is a contact in a phone: the entry "Mom" contains no conversation, it designates a number. When you call "Mom", the phone dials the number. In the same way, when you type the alias, PowerShell runs the command it designates.

```
   You type:      ll -Force
                   |
                   v
   1. PowerShell reads the first word: ll
   2. It finds the alias ll, which designates the cmdlet Get-ChildItem
   3. It replaces ll with Get-ChildItem and keeps the rest as it is
                   |
                   v
   It runs:       Get-ChildItem -Force
```

We create an alias to type less (`ll` instead of `Get-ChildItem`), to get back a name known from another shell, or to keep a short name that is easy to remember.

## Level 1: the simple alias

### Creating an alias: `Set-Alias` and `New-Alias`

```powershell
# Set-Alias creates an alias: -Name gives the new name, -Value the command it designates
Set-Alias -Name ll -Value Get-ChildItem
# ll now does the same thing as Get-ChildItem: it lists the current folder
ll
# what is written after the alias is passed to the command: here, the -Force parameter
ll -Force
# short form: without -Name and -Value, the 1st word is the name, the 2nd the command
Set-Alias g git
# g designates the git program (to be installed separately): "g status" runs "git status"
g status
```

Two cmdlets create an alias. They differ in only one case: the name already exists.

| | `Set-Alias` | `New-Alias` |
|---|---|---|
| The name does not exist yet | Creates the alias | Creates the alias |
| The name already exists | **Replaces** the existing alias, without a warning | **Refuses** and displays an error |
| With `-Force` | Unnecessary | Behaves like `Set-Alias` |
| To use for | A profile file that you reload | Creating a name you believe is free, and being warned if it is not |

```powershell
# first creation: the name ll is free, the alias is created
New-Alias -Name ll -Value Get-ChildItem
# second creation of the same name: error, because ll already exists (nothing is changed)
New-Alias -Name ll -Value Get-ChildItem
# with -Force, New-Alias replaces the existing alias, like Set-Alias
New-Alias -Name ll -Value Get-ChildItem -Force
```

A few useful parameters of these two cmdlets (the [Set-Alias](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/set-alias) page and the [New-Alias](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/new-alias) page from Microsoft give the complete list):

| Parameter | Role |
|---|---|
| `-Name` | The name of the alias |
| `-Value` | The name of the designated command (a single name, see [the central limit](#the-central-limit-a-name-never-a-command-with-arguments)) |
| `-Description` | Free text that reminds you what the alias is for |
| `-Option ReadOnly` | Protects the alias: changing it then requires `-Force` |
| `-Scope Global` | Chooses the scope where the alias lives (see [level 4](#level-4-coexistence-and-pitfalls)) |

### Listing and finding an alias: `Get-Alias`

```powershell
# without an argument, Get-Alias lists all the aliases of the session (yours included)
Get-Alias
# what does the alias ls designate?
Get-Alias -Name ls
# which aliases designate the cmdlet Get-ChildItem? (finding the alias of a cmdlet)
Get-Alias -Definition Get-ChildItem
# a wildcard (see below): all the aliases whose name starts with g
Get-Alias -Name g*
```

A **wildcard** (*wildcard*) is a special character that stands in for unknown letters: `*` stands in for any sequence of characters (see [expansion and wildcards](/?c=langages&s=powershell&p=expansion-et-jokers)). `Get-Alias` displays one line per alias, in the form `ll -> Get-ChildItem` in the name column. With `-Definition Get-ChildItem`, you will find for example `gci` and, on Windows, `dir` and `ls`, plus `ll` if you created it. The [Get-Alias](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-alias) page details the parameters.

### The central limit: a name, never a command with arguments

An alias can only designate a **command name**. It cannot contain a command **followed by its arguments**. The mistake is common, because it works in other shells (see [the comparison table](#and-in-bash-and-zsh)):

```powershell
# Trap: we put a command AND an argument in -Value
Set-Alias -Name gs -Value "git status"
# The creation produces no message: PowerShell checks nothing at this point
# We type the alias: that is when the error appears
gs
# Error, in substance: the term git status is not recognized as the name of a cmdlet,
# a function, a script file or a program (the exact text varies)
```

The explanation fits in one sentence: PowerShell reads `"git status"` as **a single name**, with a space in the middle, and looks for a command that would be called that way. There is none. The alias is created, but it points into thin air.

```powershell
# Correct: the alias designates ONLY the name git
Set-Alias -Name g -Value git
# What you type after the alias is added as it is: this line runs "git status"
g status
# but you cannot fix "status" in the alias itself: a function is needed
```

| Syntax | What PowerShell looks for | Result |
|---|---|---|
| `Set-Alias -Name g -Value git` | A command named `git` | Works; `g status` runs `git status` |
| `Set-Alias -Name gs -Value "git status"` | A command named `git status` (with the space) | Error when used |
| `Set-Alias -Name ll -Value "Get-ChildItem -Force"` | A command named `Get-ChildItem -Force` | Error when used |

To fix an argument inside a shortcut, you must move on to [level 2](#level-2-fixed-arguments-with-a-function).

### Removing an alias

```powershell
# Alias: behaves like a virtual disk drive that contains the aliases
# Remove-Item (the cmdlet that deletes) therefore removes the alias the way you delete a file
Remove-Item Alias:ll
# the alias no longer exists: this command reports a "not found" error
Get-Alias -Name ll
```

PowerShell presents aliases as the files of a drive named `Alias:`. See also [deleting files](/?c=langages&s=powershell&p=permissions-et-fichiers) with `Remove-Item`. On PowerShell (Core), the cmdlet [Remove-Alias](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/remove-alias) does the same thing; it is missing from the historical version shipped with Windows, hence the form `Remove-Item Alias:` which works everywhere.

### Scope: the current session only

An alias created in the terminal is kept **in memory**, in the session. Close the window and reopen it: the alias no longer exists.

| Where the alias is created | How long it lives |
|---|---|
| Typed in the terminal | Until the window is closed |
| In a script run normally (`.\script.ps1`) | Until the end of the script (see [level 4](#level-4-coexistence-and-pitfalls)) |
| In the `$PROFILE` profile file | In each new session: this is the solution |

### Making an alias permanent with `$PROFILE`

The **profile** is a script file that PowerShell runs at every start of an interactive session (see [configuration files](/?c=langages&s=powershell&p=variables-denvironnement#configuration-files-profiles)). Its path is stored in the variable `$PROFILE`, and its value depends on the system: always read it rather than guess it.

```powershell
# displays the path of the profile file
$PROFILE
# Test-Path returns True if the path exists, False otherwise
# -not inverts this result: the block only runs if the file does NOT exist
if (-not (Test-Path -Path $PROFILE)) {
    # New-Item creates the file; -Force also creates the missing folders
    # Out-Null discards the message that New-Item would display
    New-Item -ItemType File -Path $PROFILE -Force | Out-Null
}
# Add-Content adds a line at the end of the file, without touching the rest
Add-Content -Path $PROFILE -Value "Set-Alias -Name ll -Value Get-ChildItem"
# the dot followed by a space (dot sourcing) runs the file IN the current session
. $PROFILE
```

The `if (-not (Test-Path ...))` test is not decorative: `New-Item -Force` on a file **that already exists** replaces it with an empty file, and therefore erases all your settings (`if` conditions are explained in [the dedicated chapter](/?c=langages&s=powershell&p=conditions)). Dot sourcing is detailed in [level 4](#level-4-coexistence-and-pitfalls).

In a profile that you reload often, we use `Set-Alias` rather than `New-Alias`: running `New-Alias` a second time on an existing name would display an error at every reload.

## Level 2: fixed arguments with a function

As soon as the shortcut must **contain an argument** (`git status`, `Get-ChildItem -Force`), the alias is no longer enough: a **function** is needed, that is, a block of instructions to which a name is given (see [functions](/?c=langages&s=powershell&p=fonctions)). A function is typed like a command, so it plays the role of a shortcut.

```powershell
# function declares a function named gs; the braces { } enclose its instructions
function gs {
    # $args: automatic variable that contains what is typed after gs
    # @args: splits this list into separate arguments, added after "git status"
    git status @args
}
```

The `@` in front of `args` is called **splatting** (from the word *splat*, meaning a splash): instead of passing the list as a single block, PowerShell splits it into as many separate arguments, each with its meaning. For a cmdlet, `@args` even keeps the named parameters (`-Force` stays a parameter), which `$args` alone does not guarantee. `$args` is an [automatic variable](/?c=langages&s=powershell&p=variables#automatic-variables), that is, one created and filled in by PowerShell itself. The [about_Splatting](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_splatting) page describes the mechanism.

```powershell
gs                     # runs: git status
gs --short             # runs: git status --short
gs --short --branch    # runs: git status --short --branch
```

The same principle applies with a cmdlet, whose parameter we fix:

```powershell
# the function runs Get-ChildItem with -Force (also displaying hidden items)
function la {
    # -Force is fixed; everything typed after "la" is added afterwards
    Get-ChildItem -Force @args
}
la                     # runs: Get-ChildItem -Force
la -Recurse            # runs: Get-ChildItem -Force -Recurse
la src                 # runs: Get-ChildItem -Force src
```

| | Alias | Short function |
|---|---|---|
| Give another name to a command | Yes | Yes |
| Fix one or more arguments | **No** | Yes |
| Pass on what is typed after it | Yes, automatically | Yes, with `@args` |
| Chain several commands | No | Yes |
| Removed with | `Remove-Item Alias:name` | `Remove-Item Function:name` |
| Found with | `Get-Alias` | `Get-Command` or `Get-ChildItem Function:` |

A function typed in the terminal also lives in the session only: to keep it, you place it in `$PROFILE`, like an alias.

### Another option: default values for parameters

So that a **cmdlet** always receives a parameter, without creating a new name, PowerShell has the variable `$PSDefaultParameterValues`. It is an **associative table**: a list of `key = value` pairs.

```powershell
# the key "Get-ChildItem:Force" designates the -Force parameter of Get-ChildItem
# $true means "true": the parameter is enabled at every call of the cmdlet
$PSDefaultParameterValues["Get-ChildItem:Force"] = $true
# removes this setting
$PSDefaultParameterValues.Remove("Get-ChildItem:Force")
```

| | `la` function | `$PSDefaultParameterValues` |
|---|---|---|
| New name to type | Yes (`la`) | No: we keep `Get-ChildItem` |
| Works for an external program like `git` | Yes | No: only cmdlets and functions |
| Visible in the code that uses it | Yes | No: the setting works behind the scenes, including on the scripts run in the session |

The [about_Parameters_Default_Values](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_parameters_default_values) page from Microsoft documents this variable.

## Level 3: a complex shortcut

A shortcut can become a small tool: it receives **named parameters** (with a type and a default value), accepts values coming from a **pipeline** (the chaining `command1 | command2` where the output of the first becomes the input of the second, see [pipes](/?c=langages&s=powershell&p=redirections-et-pipes)) and behaves like a real cmdlet. Example: listing the largest files of one or more folders.

```powershell
function Get-LargeFile {
    # attribute: a setting in square brackets placed before param; this one gives the function
    # the behaviors of a cmdlet (common parameters such as -Verbose)
    [CmdletBinding()]
    param(
        # this parameter can also receive its values from the pipeline
        [Parameter(ValueFromPipeline)]
        # [string]: the text type; "." designates the current folder (default value)
        [string]$Folder = ".",
        # [int]: the whole number type; 5 if nothing is given
        [int]$Count = 5
    )
    # process block: runs once for each value received from the pipeline
    process {
        # displayed only if the call contains -Verbose
        Write-Verbose "Analyzing $Folder"
        # all the files (-File) of the folder and of its subfolders (-Recurse)
        Get-ChildItem -Path $Folder -File -Recurse |
            # sorts from largest to smallest, according to the Length property (the size)
            Sort-Object -Property Length -Descending |
            # keeps the first $Count, and only the Name and Length columns
            Select-Object -First $Count -Property Name, Length
    }
}
```

| Element | Role |
|---|---|
| `[CmdletBinding()]` | Adds the common parameters (`-Verbose`, `-ErrorAction`...) and **refuses** an argument that the function does not declare (`$args` no longer exists, so no more `@args`) |
| `[Parameter(ValueFromPipeline)]` | The parameter can receive its values from the pipeline |
| `[string]$Folder = "."` | A named parameter, `-Folder`, of text type, worth `"."` if omitted |
| `[int]$Count = 5` | A named parameter, `-Count`, of whole number type, worth `5` if omitted |
| `process { }` | The block repeated for each value arriving from the pipeline |
| `Write-Verbose` | A tracking message, invisible unless you use `-Verbose` |

The [about_Functions_CmdletBindingAttribute](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_functions_cmdletbindingattribute) and [about_Functions_Advanced_Parameters](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_functions_advanced_parameters) pages from Microsoft give all the options.

```powershell
Get-LargeFile                                   # current folder, the 5 largest files
Get-LargeFile -Folder src -Count 3              # named parameters
Get-LargeFile src 3                             # without the names: in the declared order
"src", "docs" | Get-LargeFile -Count 3          # pipeline: one pass per folder
Get-LargeFile -Folder src -Verbose              # also displays "Analyzing src"
```

The name `Get-LargeFile` follows the `Verb-Noun` convention, which makes it easy to find (`Get-Command -Verb Get`), but it is long to type. We then set an **alias on the function**: `Set-Alias` accepts the name of a function as well as that of a cmdlet.

```powershell
# the alias big designates the function Get-LargeFile
Set-Alias -Name big -Value Get-LargeFile
big                    # runs: Get-LargeFile
big -Count 3          # the parameters follow the alias, as for a cmdlet
"src" | big           # the pipeline also works through the alias
Get-Alias -Name big   # confirms: big -> Get-LargeFile
```

The logic lives in the function; the alias is only the short name. This is the recommended split: a full name for scripts, a short name for your fingers.

## Level 4: coexistence and pitfalls

### Who answers when you type a name?

Several commands can carry the same name. PowerShell chooses according to a fixed order (alias, then function, then cmdlet, then program), described in [the chapter on the architecture](/?c=langages&s=powershell&p=architecture-dun-shell#how-powershell-finds-which-command-to-run). The direct consequence: an alias **always wins** against a function of the same name, and a function wins against the cmdlet. `Get-Command` ([documentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/get-command)) shows who answers.

```powershell
# gl is already an alias provided by PowerShell (it designates Get-Location)
# we think we are creating a shortcut for "git log", but the alias takes precedence
function gl { git log --oneline @args }
# displays the current folder: it is the alias that answered, not our function
gl
# who answers to the name gl? (the command that wins)
Get-Command -Name gl
# -All also shows the hidden commands, in priority order
Get-Command -Name gl -All
# we remove the function, now useless: Function: is the virtual drive of functions
Remove-Item Function:gl
```

Before choosing a name, we check that it is free:

```powershell
# -ErrorAction SilentlyContinue: display nothing if no command bears this name
$existing = Get-Command -Name glg -ErrorAction SilentlyContinue
# the variable is empty (false) when the name is free, filled (true) otherwise
if ($existing) { "Name already taken" } else { "Name free" }
```

| You define | The name is already held by | What answers then |
|---|---|---|
| A function `gl` | The alias `gl` | The alias: your function is never called |
| An alias `ls` | The default alias `ls` (which designates `Get-ChildItem`) | Yours replaces it, unless the default alias is protected |
| A function named like a cmdlet (`Get-Date`) | The cmdlet | Your function, throughout the session |
| An alias named like a program (`git`) | The program | Your alias: the program is hidden |

The default aliases (`ls`, `cp`, `cat`, `rm`...) are listed in [familiar aliases](/?c=langages&s=powershell&p=commandes-de-base#familiar-aliases). Redefining them is tempting but risky: your habits, the examples found online and your colleagues' scripts rely on their original meaning. Another trap: these aliases are not the same everywhere. PowerShell on Linux and macOS lets the system's command answer for certain names such as `ls`; the historical version shipped with Windows even defines `curl` as an alias of `Invoke-WebRequest`. When in doubt, `Get-Command` gives the answer on the machine you are using.

### Bypassing an alias or a function

| I want | Syntax | Note |
|---|---|---|
| The cmdlet hidden behind an alias | Its full name: `Get-ChildItem` | The alias is only consulted for its short name |
| The cmdlet when a function of the same name hides it | `Microsoft.PowerShell.Management\Get-ChildItem` | The name is preceded by that of its module (the package that contains the cmdlet) |
| A program hidden by an alias or a function | `& (Get-Command git -CommandType Application)` | `&` (call operator) runs the command designated by what follows |
| Removing the mask for the session | `Remove-Item Alias:name` or `Remove-Item Function:name` | Permanent until the next session |
| Checking whether a problem comes from my shortcuts | `pwsh -NoProfile` | `pwsh` starts a new PowerShell (Core) session, here without reading `$PROFILE`; `powershell -NoProfile` for the version shipped with Windows |

### Not putting your shortcuts in a shared script

Your aliases and functions exist **on your machine**, because your profile creates them. A script that uses `gs` or `ll` fails on a colleague's machine, on a server, or in a scheduled task (a command launched automatically at a fixed time) that does not load any profile. In a script meant to be shared, we write the full names: `Get-ChildItem`, `git status`. Shortcuts are made for typing quickly by hand, not for being read by others.

There is a second subtlety, on the definition side. A script run normally runs in its **own scope** (the area of the session where names live, see [variable scope](/?c=langages&s=powershell&p=variables#variable-scope)), and what it creates there disappears when it ends.

```powershell
# shortcuts.ps1 contains the line: Set-Alias -Name ll -Value Get-ChildItem
# normal run: the script has its own scope, which is destroyed when it ends
.\shortcuts.ps1
# error: the alias ll no longer exists
ll
# dot sourcing: the dot, a space, then the path; the script runs in the
# current scope (that of the session), and its aliases and functions stay there
. .\shortcuts.ps1
# this time, ll exists
ll
```

### Organizing your `$PROFILE`

A profile that keeps growing becomes unreadable. We keep a few lines in it, which load by dot sourcing a dedicated file placed in the same location.

```powershell
# --- contents of $PROFILE (the profile file) ---
# Split-Path -Parent: the folder that contains the profile
$profileFolder = Split-Path -Path $PROFILE -Parent
# Join-Path assembles a folder and a file name with the right separator
$shortcuts = Join-Path -Path $profileFolder -ChildPath "shortcuts.ps1"
# we load the file only if it exists, so as not to cause an error at startup
if (Test-Path -Path $shortcuts) { . $shortcuts }
```

```powershell
# --- contents of shortcuts.ps1 (in the same folder as the profile) ---
Set-Alias -Name ll -Value Get-ChildItem        # level 1: simple alias
Set-Alias -Name g -Value git                   # level 1: alias to a program
function gs { git status @args }               # level 2: fixed argument
function glg { git log --oneline --graph @args }
```

The profile itself being loaded by dot sourcing, the aliases and functions of `shortcuts.ps1` remain available throughout the session. To apply a change without reopening the terminal: `. $PROFILE`.

| File | Content | Why |
|---|---|---|
| `$PROFILE` | The three loading lines, and the environment settings (see [environment variables](/?c=langages&s=powershell&p=variables-denvironnement)) | It stays short and readable |
| `shortcuts.ps1` | All the personal aliases and functions | A single place to reread, back up, and copy to another machine |
| A shared script | No personal shortcut | It must work without your profile |

On Windows, the profile and `shortcuts.ps1` are scripts: the **execution policy** can prevent them from loading at startup. This security setting is described in [the chapter on scripts](/?c=langages&s=powershell&p=ecrire-et-executer-un-script#no-shebang-but-an-execution-policy).

## Summary of the levels

| Level | Need | Tool | Limit |
|---|---|---|---|
| 1 | Another name for a command | `Set-Alias -Name ll -Value Get-ChildItem` | A single name: no fixed argument; current session only without a profile |
| 2 | A command with fixed arguments | `function gs { git status @args }` | No named parameters or default values; no structured pipeline |
| 3 | Named parameters, default values, pipeline | Function with `[CmdletBinding()]`, then `Set-Alias` on it | Longer to write; the full name still has to be remembered for scripts |
| 4 | Several shortcuts without conflict, reloaded at each session | `Get-Command`, `$PROFILE`, dot sourcing | A personal shortcut does not exist on other machines |

## And in Bash and Zsh?

The same questions arise in [Bash](/?c=langages&s=bash&p=bash) and [Zsh](/?c=langages&s=zsh&p=zsh) (two other shells, common on Linux and macOS), with one fundamental difference: their `alias` command stores a **text** that replaces the word typed before the line is parsed. This text can therefore contain arguments, which is impossible in PowerShell.

| | PowerShell | Bash | Zsh |
|---|---|---|---|
| Create | `Set-Alias -Name ll -Value Get-ChildItem` | `alias ll='ls -la'` | `alias ll='ls -la'` |
| Alias content | A single command name | Any text, arguments included | Same as Bash |
| Alias with a fixed argument | Impossible: a function | `alias gs='git status'` works | Same as Bash |
| List | `Get-Alias` | `alias` | `alias` |
| Remove | `Remove-Item Alias:ll` | `unalias ll` | `unalias ll` |
| Who answers to the name | `Get-Command name` | `type -a name` | `type -a name` or `whence -a name` |
| Bypass | Full name, `&` | `\name` or `command name` | Same as Bash |
| Make permanent | `$PROFILE` file | `~/.bashrc` (see [environment variables](/?c=langages&s=bash&p=variables-denvironnement)) | `~/.zshrc` (see [startup files](/?c=langages&s=zsh&p=fichiers-de-demarrage)) |
| In a script | Absent, unless defined in the script or loaded by dot sourcing | Not expanded by default in a script | Defined in `~/.zshrc`, read only by an interactive shell: a script does not see it |
| Need for logic or parameters | Function (levels 2 and 3) | Function (see [Bash functions](/?c=langages&s=bash&p=fonctions)) | Function |

The advanced aliases specific to Bash and Zsh are not covered here: they belong to the chapters [Advanced aliases in Bash](/?c=langages&s=bash&p=alias-avances) and [Advanced aliases in Zsh](/?c=langages&s=zsh&p=alias-avances).

## Pitfalls

| Pitfall | Why it is a problem | What to do |
|---|---|---|
| `Set-Alias -Name gs -Value "git status"` | The alias designates only a name: the error appears only when it is used | A function: `function gs { git status @args }` |
| Alias created in the terminal | Lost when the session closes | Add it to the `$PROFILE` file |
| `New-Alias` in a reloaded profile | Error at every reload, because the name already exists | `Set-Alias` in the profile |
| `New-Item -Force` on an existing `$PROFILE` | The file is replaced by an empty file | Test first with `Test-Path` |
| Function without `@args` | What is typed after the shortcut is ignored | End the line with `@args` |
| `[CmdletBinding()]` combined with `$args` | An undeclared argument is refused, and `$args` is no longer available | Declare each parameter in `param()` |
| Function named like an existing alias (`gl`) | The alias takes precedence: the function never runs | `Get-Command -Name name` before choosing |
| Redefining `ls`, `cp`, `cat`, `rm`... | Habits and online examples lose their meaning | Choose a new free name |
| Assuming the same aliases everywhere | Depending on the system and version, a name designates another command, or none | Check with `Get-Command` on the machine concerned |
| Shortcuts in a shared script | They do not exist for others, nor in a scheduled task | Write the full names in scripts |
| Alias defined in a script run normally | It disappears at the end of the script | Dot sourcing (`. .\file.ps1`) |
| `$PSDefaultParameterValues` forgotten | It changes the behavior of all the cmdlets concerned, scripts included | Reserve it for a deliberate setting, and note it in `shortcuts.ps1` |
| Profile blocked by the execution policy | The file is ignored at startup, and the shortcuts are missing | Set the policy as described in the chapter on scripts |
| Profile too heavy | Every terminal opening slows down | Only put what is useful in it |

## Best practices

| Best practice | Why |
|---|---|
| An alias for a simple rename, a function as soon as an argument is fixed | Each tool stays in its own domain |
| End shortcut functions with `@args` | What is typed after the shortcut reaches the command |
| For a rich shortcut: a `Verb-Noun` function with `[CmdletBinding()]`, then a short alias | A full name for scripts, a short name for typing by hand |
| Check the name with `Get-Command` before creating it | No unintended mask |
| `Set-Alias` in the profile, `New-Alias` for a name you believe is free | Reloading without error; a warning if the name is taken |
| Store all shortcuts in `shortcuts.ps1`, loaded by dot sourcing from `$PROFILE` | A short profile, and shortcuts that are easy to back up |
| Write full names in every shared script | The script works on all machines |
| Test with `pwsh -NoProfile` when a behavior seems strange | Rule out your shortcuts as the cause |
| Keep your profile light | A terminal that opens quickly |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | An **alias** is a second name for **one** command: `Set-Alias -Name ll -Value Get-ChildItem` (overwrites an existing alias) or `New-Alias` (refuses, unless `-Force`); `Get-Alias` lists and finds (`-Definition` to start from a cmdlet); `Remove-Item Alias:ll` removes it. It lives in the session and is made permanent through `$PROFILE`. The central limit: `-Value` is a **command name**, never a command followed by its arguments; `Set-Alias -Name gs -Value "git status"` looks for a command named "git status" and fails when used. With fixed arguments, you write a **function** (`function gs { git status @args }`, `@args` passing on what is typed after it). For a complex shortcut: a function with `[CmdletBinding()]`, named and typed parameters with default values, `[Parameter(ValueFromPipeline)]` and a `process` block, then `Set-Alias` on its name. An alias takes precedence over a function, which takes precedence over a cmdlet: `Get-Command name -All` shows who answers. The profile loads a `shortcuts.ps1` file by dot sourcing. Bash and Zsh keep a whole text in `alias`, arguments included. |
| **Pitfalls to avoid** | Putting an argument in `-Value`; believing an alias survives the session; `New-Alias` in a reloaded profile; `New-Item -Force` on an existing profile; function without `@args`; `[CmdletBinding()]` with `$args`; function masked by an alias of the same name; redefining `ls`, `cp`, `cat`; personal shortcuts in a shared script; alias defined in a script without dot sourcing; profile blocked by the execution policy. |
| **Best practices** | Alias to rename, function to fix arguments, advanced function plus alias for a real tool; `Get-Command` before naming; `Set-Alias` in the profile; all shortcuts in `shortcuts.ps1`; full names in shared scripts; `pwsh -NoProfile` to rule out your shortcuts during a diagnosis. |
