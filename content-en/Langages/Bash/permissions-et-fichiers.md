---
order: 11
---

# Permissions and File Manipulation

On Linux/Unix, every file and folder carries **permissions** that determine who can read, modify, or execute it. This chapter covers both this permission system and the basic commands for manipulating files and folders from the command line.

## Reading permissions with `ls -l`

```bash
ls -l file.txt
# -rw-r--r-- 1 user group 1024 Jul 28 10:00 file.txt
```

The first 10 characters break down like this:

```text
-  rw-  r--  r--
^   ^    ^    ^
|   |    |    +-- rights for other users
|   |    +------- rights for the owning group
|   +------------ rights for the owner
+---------------- type (- = file, d = folder, l = symbolic link)
```

Each group of three characters represents **read** (`r`), **write** (`w`), and **execute** (`x`), in that order: a `-` means the corresponding right is absent.

## `chmod`: changing permissions

### Symbolic notation

```bash
chmod u+x script.sh    # adds execute permission for the owner (user)
chmod g-w file.txt      # removes write permission for the group
chmod o=r file.txt      # sets others' rights to read-only, nothing else
chmod a+r file.txt      # adds read for everyone (all)
```

### Octal notation

Each right is worth a power of 2: `r=4`, `w=2`, `x=1`: you add them up for each category (owner, group, others):

```bash
chmod 755 script.sh
# 7 = rwx (4+2+1) for the owner
# 5 = r-x (4+0+1) for the group
# 5 = r-x (4+0+1) for others
```

| Value | Rights |
|---|---|
| `7` | `rwx` (read + write + execute) |
| `6` | `rw-` (read + write) |
| `5` | `r-x` (read + execute) |
| `4` | `r--` (read only) |
| `0` | No rights |

> **Note:** `chmod 644 file` (read/write for the owner, read-only for everyone else) is the most common configuration for a normal file; `755` for a script or a folder meant to be executed/browsed.

## `chown`: changing the owner

```bash
chown user file.txt           # changes the owner
chown user:group file.txt      # changes owner AND group at once
```

## Basic file commands

```bash
mkdir folder                # creates a folder
mkdir -p a/b/c                # creates the whole tree at once, no error if it already exists
touch file.txt               # creates an empty file (or updates its modification date if it exists)
cp source.txt destination.txt        # copies a file
cp -r source_folder dest_folder      # recursive copy, needed for a folder
mv old.txt new.txt          # moves OR renames (both are the same operation for mv)
rm file.txt                  # deletes a file (permanent, no trash bin)
rm -r folder                 # deletes a folder and all its content
```

> **Note:** `rm -rf` (recursive + `-f` to skip confirmations/errors) is irreversible and asks for no confirmation: a mistargeted path (e.g. an extra space in the path, `rm -rf ~ /folder` instead of `rm -rf ~/folder`) can delete far more than intended.

## `find`: searching for files

```bash
find . -name "*.txt"                 # every .txt file, starting from the current folder
find /var/log -mtime -7               # files modified in the last 7 days
find . -type d -name "node_modules"   # every folder named "node_modules"
find . -name "*.tmp" -delete          # finds AND deletes in a single command
```

See also [Text Processing](/?c=shells&s=bash&p=traitement-de-texte) (`grep`, `sed`, `awk`) to go further in working with these files' content.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Every file has read/write/execute permissions for owner/group/others. `chmod` changes them (symbolic or octal notation), `chown` changes the owner. |
| **Tools you can use** | `ls -l`, `chmod`/`chown`, `mkdir`/`cp`/`mv`/`rm`, `find`. |
| **Pitfalls to avoid** | `rm -rf` without checking the exact target (irreversible, with no confirmation). |
| **Best practices** | `chmod 644` for a normal file, `755` for an executable script/folder; always check a `find ... -delete` command by first testing it without `-delete`. |
