---
order: 11
---

# The Internal Architecture of Git

The commands covered in the other chapters (`add`, `commit`, `branch`...) are merely the visible ("porcelain") part of a surprisingly simple storage mechanism: a **content-addressed** key-value database, where the key for each piece of data is the hash of its own content. Understanding this model allows you to “see through” any Git command and provides the building blocks needed to design a similar version control system.

## A content-based database

Every piece of data stored by Git (the contents of a file, a directory structure, a commit, etc.) is saved as an **object**, identified solely by the SHA-1 hash of its own contents:

```text
content -> SHA-1(content) -> storage key
```

```bash
echo "Hello" | git hash-object --stdin
# c6b7f... -> always the same hash for the same content, regardless of where or when
```

> **Note:** A **hash function** (in this case, SHA-1) transforms an input of any size into a fixed-size number in a deterministic manner (same input → always the same result) and well-distributed (two pieces of content, even if very similar, produce very different results: this is what makes an accidental collision extremely unlikely). See [Hash Tables](/?c=langages-de-programmation&s=c&p=tables-de-hachage) for an example of this mechanism applied to a specific data structure.

Specifically, each object is compressed (using [zlib](https://zlib.net), a lossless compression algorithm) and stored in `.git/objects/`, under a path derived from its hash: the first two hexadecimal characters form a subfolder, and the remaining 38 characters form the filename (`.git/objects/c6/b7f4a2...`). This is nothing more or less than a [hash table](/?c=langages-de-programmation&s=c&p=tables-de-hachage) stored directly on the file system: the subfolder acts as a slot (a *bucket*).

> **Direct consequence:** two files with exactly the same content produce the **same** hash, and therefore the **same** object stored only once, an automatic and cost-free form of deduplication that is inherent to the model, not an optimization added as an afterthought.

## The Four Types of Objects

| Type | Content |
|---|---|
| **blob** | The raw content of a file: just the bytes, no filename or metadata |
| **tree** | A list of entries (mode, type, name, hash): represents a directory, with each entry pointing to a blob (file) or another tree (subdirectory) |
| **commit** | A tree hash (the root snapshot), one or more parent commit hashes, author, date, message |
| **tag** (annotated) | A hash of a target object (usually a commit), a message, used by `git tag -a` |

```text
commit ---> tree (project root)
              |--> blob (main.c)
              |--> tree (src/)
                     |--> blob (utils.c)
        \--> commit (parent)
```

> **Note:** A blob does **not** know its own filename: it is the `tree` that contains the association “this filename corresponds to this blob hash.” That’s why renaming a file without changing its contents does not create any new blobs: only the `tree` (and, consequently, the commit) changes.

## What `git add` and `git commit` actually do

1. `git add file.txt`: calculates the SHA-1 hash of the file’s contents, compresses it, writes it as a **blob** object to `.git/objects/`, and saves an entry in the index (`.git/index`, the actual filename of the staging area) associating the file path with this blob hash.
2. `git commit`: Recursively constructs the **`tree`** objects corresponding to the current state of the index (one `tree` per folder), creates a **`commit`** object pointing to the root `tree` and to the current commit at `HEAD` (which becomes its parent), and then updates the reference to the current branch so that it points to this new commit.

## The refs: simple text files

```bash
cat .git/refs/heads/main
# a3f9c1d4e5f6...  -> just 40 hexadecimal characters, nothing more
```

A branch is **literally nothing more than** a file containing a commit hash. `git branch nouvelle` simply creates a new file in `.git/refs/heads/`, copied from the current commit.

```bash
cat .git/HEAD
# ref: refs/heads/main   -> HEAD does not contain a hash, but rather the PATH to the current ref
```

`HEAD` is a pointer to a pointer: `git checkout autre-branche` only changes a single line in `.git/HEAD`, which now references a different file at `refs/heads/`. In *detached HEAD* mode (see [Tags](/?c=git&p=tags)), `.git/HEAD` directly contains a commit hash, without going through a named ref.

## Why modifying a commit changes all its descendants

A commit’s hash depends on **its entire contents**, including the hash of its parent commit. Modifying an older commit (via a rebase or a `commit --amend`) therefore changes its own hash, and since each subsequent commit references its parent’s hash, their contents (and thus their hashes as well) change in a chain reaction. It is precisely this mechanism that explains why a [rebase](/?c=git&p=rebase) produces commits with hashes different from the originals, even when the file contents are identical.

## Standalone objects vs. packfiles

Each new object begins its life as an independent compressed file ("*loose object*"). Periodically (via `git gc`, or automatically during a `push`), Git groups these objects into a **packfile**: a single large file where similar objects are stored as **deltas** (a complete reference object, followed by a sequence of differences rather than full copies), which is much more compact for a large history.

## Plumbing vs. Porcelain

Everyday commands (`add`, `commit`, `merge`...) are the **porcelain**: a user-friendly interface built entirely on top of lower-level commands, the **plumbing**, which directly manipulate objects:

```bash
echo "content" | git hash-object -w --stdin  # creates a blob, displays its hash
git cat-file -p a3f9c1d                      # displays the decompressed content of an object
git cat-file -t a3f9c1d                      # displays its type (blob/tree/commit/tag)
git write-tree                               # builds a tree object from the current index
git commit-tree a3f9c1d -m "message"         # manually creates a commit object
git update-ref refs/heads/main a3f9c1d       # manually moves a branch to a commit
```

Under the hood, a “normal” `git commit` is nothing more than a sequence of `write-tree`, `commit-tree`, and `update-ref`.

## Rewriting the entire history: purging a file from every commit

A `rebase` or `commit --amend` only rewrites the commits **after** the modified point. Sometimes you need to go further: remove a file (a secret file, a large binary, etc.) from **every** commit where it existed, from the very first to the last: a simple `rm` followed by a new commit isn’t enough, since the file remains readable in the previous commits.

```bash
git filter-branch --index-filter "git rm --cached --ignore-unmatch secret.pem" --prune-empty -- --all
```

`--index-filter` replays this command against the index of **every** commit in the history (across all refs, via `--all`), rebuilds a new tree without the file, then a new commit, which, due to the mechanism described above (a commit’s hash depends on its parent’s hash), changes the hash of **all** commits starting from the first one affected.

> **Note:** `git filter-branch` is officially deprecated in favor of [`git filter-repo`](https://github.com/newren/git-filter-repo) (faster, fewer pitfalls), but the latter is not included with Git: separate installation ([Python](/?c=langages-de-programmation&s=python&p=python)) required. `filter-branch` remains available wherever Git is installed, which is sufficient for a one-time operation.

Direct consequences of this cascading hash change:
- Any existing clone or fork of the repository will inevitably diverge from the new version, a normal push will be rejected, a `push --force` / `--force-with-lease` (see [Remote Repositories](/?c=git&p=remotes)) is required, and anyone who has already cloned the repository must re-clone it or hard reset their copy.
- Always perform a full backup (`git bundle create ... --all`, see [Remote Repositories](/?c=git&p=remotes)) **before** undertaking a rewrite of this type: an error in the filter is just as irreversible as the operation itself.

## Inaccessible objects: deletion is never immediate

After a history rewrite (or a simple `reset --hard`), the old commits are no longer referenced by any branch, but their objects remain physically present in `.git/objects/`. Two mechanisms keep them alive:

- `git filter-branch` itself automatically saves a backup copy in `refs/original/` (explicitly delete it with `git update-ref -d refs/original/refs/heads/main` once you are certain you no longer need it).
- The **reflog** (see [Undo Changes and Browse History](/?c=git&p=annuler-et-historique)) keeps a record of every old commit for several weeks by default, even if no ref points to it.

An object is only truly removed from the local repository when nothing is holding it back:

```bash
git reflog expire --expire=now --all  # immediately clears the reflog of all refs (instead of waiting for the default expiration time)
git gc --prune=now                    # removes any object that has become inaccessible ("unreachable")
git fsck --unreachable                # lists objects that are still present but not referenced by any branch, tag, or reflog
```

> **Note:** This cleanup applies only to the **local** repository. A remote repository ([GitHub](/?c=git&p=github-et-plateformes), GitLab, etc.) follows its own `gc` according to its own schedule: after a `push --force` that removes a sensitive file from the history, the old commit may remain accessible on the server via its exact hash (a targeted request, not normal browsing) until the server performs its own cleanup. To ensure immediate deletion on the server side, only the platform’s support team can take action.

## Designing Your Own Version Control System

The components required for a minimal system, in this logical order:

1. **Content-addressed key-value storage**: a hash function (SHA-1, or a simpler one for a prototype) + compression + a file system or hash table to store each object under its own key.
2. **A tree structure** for representing a complete snapshot of a folder tree at a given point in time (`tree`).
3. **Commit objects linked** by a pointer to their parent(s): it is this chain that constitutes the history.
4. **Named, mutable pointers** (branches) pointing to a commit, plus a special pointer (`HEAD`) indicating the current "state of affairs."
5. **A diff algorithm**: necessary only for displaying readable differences or merging branches, but not for the storage model itself, which structurally does not require one. [The Myers algorithm](https://en.wikipedia.org/wiki/Diff#Algorithm), used by Git, finds the shortest sequence of line additions and deletions that transforms one text into another: this is what allows a `git diff` to display a minimal, readable change rather than “delete everything and rewrite it all.”

---

## 📋 Summary

| | |
|---|---|
| **Key Takeaway** | Git stores each piece of data as an object identified by the hash of its own content (blob, tree, commit, tag). Everyday commands (“porcelain”) are merely an interface built on top of this low-level storage model (“plumbing”). |
| **Tools available** | `git hash-object`, `git cat-file`, `git write-tree`, `git commit-tree`, `git update-ref`, `git fsck --unreachable`. |
| **Pitfalls to Avoid** | Rewriting history (`filter-branch`) without a prior backup: an error in the filter is just as irreversible as the operation itself. |
| **Best Practices** | Always run `git bundle` before rewriting the history; check `git fsck --unreachable` before assuming an object is permanently lost. |
