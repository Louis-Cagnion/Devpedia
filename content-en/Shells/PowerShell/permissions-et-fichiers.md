---
order: 11
---

# Permissions and File Manipulation

Windows doesn't use the Unix permission model (owner/group/others, `rwx`) seen in Bash's equivalent chapter: it relies on **Access Control Lists** (ACLs), finer-grained but more verbose. This chapter covers this system as well as the basic commands for manipulating files and folders.

## Reading permissions with `Get-Acl`

```powershell
Get-Acl file.txt | Format-List
```

Unlike `ls -l`'s compact 10 characters (`-rw-r--r--`), a Windows ACL explicitly lists each user or group and the rights granted to them:

```text
Owner   : DESKTOP\user
Access  : DESKTOP\user  Allow  FullControl
          BUILTIN\Users Allow  ReadAndExecute
```

Each access line maps an **identity** (user or group) to a **right** (`FullControl`, `Modify`, `ReadAndExecute`...): there can be an arbitrary number of them, unlike Unix's three fixed categories (owner/group/others).

## `Set-Acl`: modifying permissions

```powershell
$acl = Get-Acl file.txt
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule("DESKTOP\john", "ReadAndExecute", "Allow")
$acl.SetAccessRule($rule)
Set-Acl file.txt $acl
```

> **Note:** unlike `chmod 755` (a single command, a single number), modifying a Windows ACL requires fetching the existing ACL, building a rule, then reapplying it: more verbose, but it allows granting different rights to an arbitrary number of users on the same file, which the Unix model doesn't natively support.

## `icacls`: the classic command-line equivalent

Closer in spirit to `chmod`/`chown`, `icacls` remains widely used in practice for its conciseness:

```powershell
icacls file.txt /grant "john:(R,W)"    # grants read+write to the user john
icacls file.txt /remove "john"          # removes all of john's explicit rights
```

## Basic file commands

```powershell
New-Item -ItemType Directory -Path folder         # creates a folder
New-Item -ItemType Directory -Path a\b\c -Force     # creates the whole tree at once
New-Item -ItemType File -Path file.txt               # creates an empty file
Copy-Item source.txt destination.txt                  # copies a file
Copy-Item -Recurse source_folder dest_folder           # recursive copy, needed for a folder
Move-Item old.txt new.txt                              # moves OR renames, like mv in Bash
Remove-Item file.txt                                     # deletes a file (goes to the recycle bin by default in Explorer, but not here)
Remove-Item -Recurse folder                               # deletes a folder and all its content
```

> **Note:** like `rm -rf` in Bash, `Remove-Item -Recurse -Force` is irreversible from the command line (unlike a deletion via Windows Explorer, which goes through the recycle bin): a mistargeted path can delete far more than intended, with no confirmation or recourse.

## `Get-ChildItem -Recurse`: searching for files (the equivalent of `find`)

```powershell
Get-ChildItem -Path . -Filter "*.txt" -Recurse                          # every .txt file, recursively
Get-ChildItem -Path C:\logs -Recurse | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) }  # recently modified
Get-ChildItem -Recurse -Directory -Filter "node_modules"                  # every folder named "node_modules"
Get-ChildItem -Recurse -Filter "*.tmp" | Remove-Item                       # finds AND deletes in a single chain
```

See also [Text and Object Processing](/?c=shells&s=powershell&p=traitement-de-texte) (`Select-String`, `-replace`, `ConvertFrom-Json`) to go further in working with these files' content.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Windows uses ACLs (access control lists) rather than Unix's owner/group/others model: more verbose, but allows different rights for an arbitrary number of users. |
| **Tools you can use** | `Get-Acl`/`Set-Acl`, `icacls` (more concise), `New-Item`/`Copy-Item`/`Move-Item`/`Remove-Item`. |
| **Pitfalls to avoid** | `Remove-Item -Recurse -Force` is irreversible from the command line, unlike a deletion via Explorer (recycle bin). |
| **Best practices** | Use `icacls` for a quick, readable ACL change, `Get-Acl`/`Set-Acl` when fine-grained scripted control is needed. |
