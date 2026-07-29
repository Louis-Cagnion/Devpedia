---
order: 10
---

# File Permissions and File Handling

In Linux/Unix, every file and folder has **permissions** that determine who can read, modify, or execute it. This chapter covers both this permission system and the basic commands for managing files and folders from the command line.

## Read permissions with `ls -l`

```bash
ls -l fichier.txt
# -rw-r--r-- 1 user group 1024 Jul 28 10:00 file.txt
```

The first 10 characters break down as follows:

```
-  rw-  r--  r--
^   ^    ^    ^
|   |    |    +-- droits pour les autres utilisateurs
|   |    +------- droits pour le groupe propriétaire
|   +------------ droits pour le propriétaire
+---------------- type (- = fichier, d = dossier, l = lien symbolique)
```

Each group of three characters represents `r`, `w`, and `x`, in that order—a `-` indicates that the corresponding right is not granted.

## `chmod` : Change permissions

### Symbolic notation

```bash
chmod u+x script.sh    # Adds execution permissions for the owner (user)
chmod g-w fichier.txt   # revokes write permissions for the group
chmod o=r fichier.txt   # Sets others' permissions to read-only; nothing else
chmod a+r fichier.txt   # Add "Read" for everyone (all)
```

### Octal notation

Each permission is worth a power of 2: `r=4`, `w=2`, `x=1` — we add them up for each category (owner, group, others):

```bash
chmod 755 script.sh
# 7 = rwx (4+2+1) for the owner
# 5 = r - x (4 + 0 + 1) for the group
# 5 = r - x (4+0+1) for the others
```

| Value | Rights |
|---|---|
| `7` | `rwx` (read + write + execute) |
| `6` | `rw-` (read + write) |
| `5` | `r-x` (read + execute) |
| `4` | `r--` (read-only) |
| `0` | No rights |

> **Note:** `chmod 644 fichier` (read/write for the owner, read-only for everyone else) is the most common configuration for a regular file; `755` for a script or folder intended to be executed or browsed.

## `chown` : Change the owner

```bash
chown utilisateur fichier.txt           # change the owner
chown utilisateur:groupe fichier.txt    # Change the owner AND group at once
```

## Basic File Commands

```bash
mkdir dossier              # create a folder
mkdir -p a/b/c              # creates the entire directory tree in one go, without errors if it already exists
touch fichier.txt           # creates an empty file (or updates its last-modified date if it already exists)
cp source.txt destination.txt        # copy a file
cp -r dossier_source dossier_dest    # recursive copy, required for a folder
mv ancien.txt nouveau.txt   # move OR rename (both are the same operation for mv)
rm fichier.txt              # deletes a file (permanently; no Recycle Bin)
rm -r dossier               # deletes a folder and all its contents
```

> **Note:** `rm -rf` (recursive + `-f` to ignore confirmation prompts/errors) is irreversible and requires no confirmation—an incorrectly specified target (e.g., a path with an extra space, `rm -rf ~ /dossier` instead of `rm -rf ~/dossier`) can delete much more than intended.

## `find` : Search for files

```bash
find . -name "*.txt"                 # all .txt files in the current folder
find /var/log -mtime -7               # files modified within the last 7 days
find . -type d -name "node_modules"   # all folders named "node_modules"
find . -name "*.tmp" -delete          # Find and delete with a single command
```

See also the chapter on word processing (`grep`, `sed`, `awk`) to learn more about how to make the most of the content in these files.
