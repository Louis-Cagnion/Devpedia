---
order: 4
---

# File structure and paths

A [file](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) doesn't just sit on its own on the disk: it's stored in a folder, which is itself stored in another folder. This chapter explains how this organization works and how to specify a file within it precisely.

## The folder: organizing files and other folders

A **folder** (or **directory**) contains files—and may also contain other folders. By repeating this structure across multiple levels of depth, a tree-like structure is formed: **the directory tree**.

```text
Documents/
├── photos/
│   ├── vacances.jpg
│   └── famille.jpg
└── travail/
    └── rapport.docx
```

> **Analogy:** Just like files stored in drawers, which are themselves stored in a cabinet—finding a specific sheet requires knowing the cabinet, the drawer, and then the file.

> **Caution:** Deleting a folder deletes **all** of its contents along with it, including the folders it contains—often without asking for confirmation for each file individually.
>
> **Best practice:** Before deleting a folder, check its contents (list what it contains) rather than assuming it is empty or unimportant.

## Path: the full address of a file

A **path** describes where to find a file or folder by listing the folders to traverse, separated by a character that depends on the system:

| System | Delimiter | Example |
|---|---|---|
| Linux / macOS | `/` | `Documents/photos/vacances.jpg` |
| Windows | `\` | `Documents\photos\vacances.jpg` |

> **Pitfall:** copying a Windows path (with `\`) into a Linux/macOS terminal. On these systems, `\` is not a path separator—it is an escape character that changes the meaning of the following character—so the path will not be interpreted as expected.
>
> **Best practice:** Always use the separator of the system on which the command is actually executed, never that of the machine where the path was originally written.

## Absolute Path vs. Relative Path

| | Absolute path | Relative path |
|---|---|---|
| Starting point | The **root directory**—always the same, no matter where you are | The **current directory**—where the terminal is currently "located" |
| What it looks like | `/home/jean/Documents/rapport.docx` (Linux) or `C:\Users\jean\Documents\rapport.docx` (Windows) | `Documents/rapport.docx`, if you're already at `/home/jean` |
| Advantage | Works from anywhere | Shorter to write, and remains valid even if the entire project is moved as a whole |

The **root** is the very first folder in the directory tree, the one from which all others branch out: `/` on Linux/macOS, a drive letter (`C:\`) on Windows. The** current*** working ***directory** is where you are “located” in this directory tree at any given moment—this is precisely what the [terminal prompt](/?c=bases-de-l-informatique&p=le-terminal) sometimes displays, even though we didn’t yet know what it meant.

> **Pitfall:** Using a relative path while assuming you are in the correct current directory, without verifying it. The same command, with the same relative path, may affect a completely different file depending on where it is run from.
>
> **Best practice:** When in doubt, display the current directory before executing a command that modifies or deletes a file using a relative path—an absolute path completely eliminates this risk, though it takes longer to write.

## Two universal shortcuts: `.` and `..`

Regardless of the shell, two notations always refer to the same thing, relatively speaking:

| Notation | Means |
|---|---|
| `.` | The current directory itself |
| `..` | The parent folder, one level up |

```text
Documents/photos/../travail/rapport.docx
                 └─┬─┘
                   └── remonte d'un niveau (sort de "photos"), puis redescend dans "work"
```

> **Pitfall:** Forgetting the space between the movement command and “`..`” (typing “`cd..`” instead of “`cd ..`”). Without the space, the shell reads a single word (“`cd..`”) that it does not recognize as a command, rather than the command “`cd`” followed by the argument “`..`.”
>
> **Best practice:** If you encounter an unexpected "command not found" error for a command that is otherwise correct, first check for spaces before punctuation marks.

## Navigating and listing files from the terminal

Changing the current directory and listing the contents of a directory are two basic actions—but the exact names of the commands depend on the shell being used, as discussed in the [chapter on the terminal](/?c=bases-de-l-informatique&p=le-terminal):

- In Bash: see [Permissions and File Handling](/?c=shells&s=bash&p=permissions-et-fichiers).
- In PowerShell: see [Basic Commands](/?c=shells&s=powershell&p=commandes-de-base).

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | Files are stored in folders, organized in a tree structure. A **path** describes their location: **absolute** from the root (always valid), or **relative** from the **current folder** (shorter). `.` refers to the current folder, `..` to its parent folder. |
| **Tools You Can Use** | The navigation and listing commands specific to your shell—see the Bash/PowerShell chapters linked above. |
| **Pitfalls to Avoid** | Using a relative path while assuming you are in the correct current directory without verifying it—the same command may then affect a completely different file depending on where it is run. |
| **Best Practices** | If you are unsure of your current location, check the current directory before executing a command that modifies or deletes a file using a relative path. |
