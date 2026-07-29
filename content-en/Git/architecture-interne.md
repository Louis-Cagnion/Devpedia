---
order: 11
---

# The Internal Architecture of Git

The commands discussed in the other chapters (`add`, `commit`, `branch`...) are merely the visible part ("façade") of a surprisingly simple storage mechanism: a **content-addressed** key-value database, where the key for each piece of data is the hash of its own content. Understanding this model allows you to “see through” any Git command and provides the building blocks needed to design a similar version control system.

## A content-based database

Every piece of data stored by Git (the contents of a file, a directory structure, a commit, etc.) is stored as an **object**, identified solely by the SHA-1 hash of its own contents:

```
contenu -> SHA-1(contenu) -> clé de stockage
```

```bash
echo "Bonjour" | git hash-object --stdin
# c6b7f... -> always the same hash for the same content, no matter where or when
```

> **Note:** A **hash function** (in this case, SHA-1) transforms an input of any size into a fixed-size number in a deterministic manner (the same input always produces the same result) and is well-distributed (two pieces of data, even if very similar, produce very different results—this is what makes an accidental collision extremely unlikely). See the chapter on hash tables (Section C) for an example of this mechanism applied to a specific data structure.

Specifically, each object is compressed (using zlib, a lossless compression algorithm) and stored in `.git/objects/`, under a path derived from its hash: the first 2 hexadecimal characters form a subfolder, and the remaining 38 form the filename (`.git/objects/c6/b7f4a2...`). This is nothing more or less than a **hash table** (see the dedicated chapter, section C) stored directly on the file system—the subfolder acts as a bucket.

> **Direct consequence:** two files with exactly the same content produce the **same** hash, and therefore the **same** object stored only once—automatic and cost-free deduplication, a property inherent to the model, not an optimization added as an afterthought.

## The Four Types of Objects

| Type | Content |
|---|---|
| **blob** | The raw content of a file—just the bytes, no filename or metadata |
| **tree** | A list of entries (mode, type, name, hash) — represents a directory, with each entry pointing to a blob (file) or another tree (subdirectory) |
| **commit** | A tree hash (the root snapshot), one or more parent commit hashes, author, date, message |
| **tag** (annotated) | A hash of a target object (usually a commit), a message — used by `git tag -a` |

```
commit ---> tree (racine du projet)
              |--> blob (main.c)
              |--> tree (src/)
                     |--> blob (utils.c)
        \--> commit (parent)
```

> **Note:** A blob does **not** know its own filename—it is the `tree` that contains the association "this filename corresponds to this blob hash." That’s why renaming a file without changing its contents doesn’t create any new blobs: only the `tree` (and, consequently, the commit) changes.

## What `git add` and `git commit` Actually Do

1. `git add fichier.txt`: calculates the SHA-1 hash of the file's contents, compresses it, writes it as a **blob** object to `.git/objects/`, and creates an entry in the index (`.git/index`, the actual filename of the staging area) that associates the file path with this blob hash.
2. `git commit`: Recursively constructs `**tree`** objects corresponding to the current state of the index (one `tree` per folder), creates a **`commit`** object pointing to the root `tree` and to the current `commit` from `HEAD` (which becomes its parent), and then updates the current branch's reference so that it points to this new `commit`.

## Refs: Simple Text Files

```bash
cat .git/refs/heads/main
# a3f9c1d4e5f6...  -> just 40 hexadecimal characters, nothing more
```

A branch is **literally nothing more** **than** a file containing a commit hash. `git branch nouvelle` simply creates a new file in `.git/refs/heads/`, copied from the current commit.

```bash
cat .git/HEAD
# ref: refs/heads/main   -> HEAD does not contain a hash, but rather the PATH to the current ref
```

`HEAD` is a pointer to a pointer: `git checkout autre-branche` only changes a single line in `.git/HEAD`, which then starts referencing another file at `refs/heads/`. In *detached HEAD* mode (see the chapter on tags), `.git/HEAD` directly contains a commit hash, without going through a named ref.

## Why Modifying a Commit Affects All Its Descendants

A commit’s hash depends on **its entire contents**, including the hash of its parent commit. Modifying an older commit (via a rebase or a `commit --amend`) therefore changes its own hash—and since each subsequent commit references its parent’s hash, their contents (and thus their hashes as well) change in a chain reaction. It is precisely this mechanism that explains why a rebase (see the dedicated chapter) produces commits with hashes different from the originals, even when the file contents are identical.

## Standalone objects vs. packfiles

Each new object begins its life as an independent compressed file ("*loose object*"). Periodically (via `git gc`, or automatically during a `push`), Git groups these objects into a **packfile**: a single large file where similar objects are stored as **deltas** (a complete reference object, followed by a sequence of differences rather than full copies)—which is much more compact for a large history.

## Plumbing vs. Porcelain

The daily commands (`add`, `commit`, `merge`...) are the "**porcelain**"—a user-friendly interface built entirely on top of lower-level commands, the "**plumbing**," which directly manipulate objects:

```bash
echo "contenu" | git hash-object -w --stdin   # creates a blob, displays its hash
git cat-file -p a3f9c1d                        # displays the decompressed content of an object
git cat-file -t a3f9c1d                        # displays its type (blob/tree/commit/tag)
git write-tree                                  # creates a tree object from the current index
git commit-tree a3f9c1d -m "message"             # manually creates a commit object
git update-ref refs/heads/main a3f9c1d           # manually move a branch to a commit
```

A "normal" `git commit` is, behind the scenes, nothing more than a sequence of `write-tree`, `commit-tree`, and `update-ref`.

## Designing Your Own Version Control System

The components needed for a minimal system, in this logical order:

1. **A content-addressed key-value store**: a hash function (SHA-1, or a simpler one for a prototype) + compression + a file system or hash table to store each object under its own key.
2. **A tree structure** that represents a complete snapshot of a folder tree at a given point in time (`tree`).
3. **Commit objects linked** by a pointer to their parent(s)—it is this chain that constitutes the history.
4. **Named, mutable pointers** (branches) pointing to a commit, plus a special pointer (`HEAD`) indicating "where we are" right now.
5. **A diff algorithm** (e.g., the Myers algorithm)—required only to display readable differences or merge branches, but not for the storage model itself, which structurally does not need one.
