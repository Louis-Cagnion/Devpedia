---
order: 1
---

# Write and Run a Bash Script

A Bash script is a simple text file containing a sequence of commands that are executed in order, as if they had been typed one by one into the terminal.

## The whole shebang

The first line of a script tells the system which interpreter to use to run it:

```bash
#!/bin/bash

echo "Bonjour"
```

`#!/bin/bash` (the "shebang") is not a regular comment, despite the "`#`": the operating system specifically reads it to determine which program to run to interpret the rest of the file. `#!/bin/sh` would run the script using a more restricted POSIX shell (without certain Bash-specific features, such as `[[ ]]` or arrays).

## Making a Script Executable

```bash
chmod +x script.sh   # adds the execute permission (see the chapter on permissions)
./script.sh            # Run the script (the "./" is required if the current directory is not in $PATH)
```

An alternative that doesn't require `chmod +x`: explicitly run the interpreter on the file:

```bash
bash script.sh
```

## The arguments of a script

```bash
#!/bin/bash
echo "Script : $0"
echo "Premier argument : $1"
echo "Tous les arguments : $@"
echo "Nombre d'arguments : $#"
```

```bash
./script.sh alice bob
# Script: ./script.sh
# First argument: Alice
# All the arguments: Alice Bob
# Number of arguments: 2
```

## 

Each command—and therefore each script—ends with an **exit code**: `0` indicates success; any other value (1 through 255) indicates failure, the exact meaning of which depends on the program:

```bash
#!/bin/bash

if [ ! -f "config.txt" ]; then
    echo "Erreur : fichier de config manquant" >&2   # >&2: error message to stderr
    exit 1
fi

echo "Tout est prêt"
exit 0
```

The calling script (or command) can verify this code via `$?`:

```bash
./script.sh
if [ $? -eq 0 ]; then
    echo "Le script a réussi"
fi

# equivalent, more idiomatic shortcut:
./script.sh && echo "Le script a réussi"
./script.sh || echo "Le script a échoué"
```

`&&` Executes the following command only if the previous one succeeded (`0`); `||` only if it failed.

## Stopping a script on the first error: `set -e`

By default, Bash continues to execute the following lines even if a command fails—which is often undesirable in an automation script:

```bash
#!/bin/bash
set -e   # immediately stops the script if a command fails (non-zero exit code)

cd /dossier/inexistant   # If this folder does not exist, the script stops here
echo "Cette ligne ne s'exécute jamais si cd a échoué"
```

Other options enhance a script's robustness; these are often used in combination:

```bash
#!/bin/bash
set -euo pipefail
# -e: stop at the first error
# -u: error if an undefined variable is used
# -o pipefail: A pipe fails if ANY of its commands fails (not just the last one)
```

See also the chapter on process management for information on what happens after a script is launched in the background.
