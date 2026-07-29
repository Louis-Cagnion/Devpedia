---
order: 7
---

# Tags

A **tag** is a pointer to a specific commit, just like a branch—but unlike a branch, a tag **never** **moves** once it has been created. It is typically used to mark a released version of a project (`v1.0.0`, `v2.3.1`...).

## Create a tag

```bash
git tag v1.0.0                 # "light" tag: simple pointer, no metadata
git tag -a v1.0.0 -m "Première version stable"   # "annotated" tag: includes author, date, and message
```

> **Note:** An annotated tag (`-a`) is generally preferable for a true release—it is committed as a full-fledged Git object (with its own message and author), unlike a lightweight tag, which is simply an alias to a commit hash.

## List and inspect tags

```bash
git tag                     # list all tags
git tag -l "v1.*"            # filter by pattern
git show v1.0.0               # displays the tag details (and the associated commit)
```

## Tag a past commit

```bash
git tag -a v0.9.0 a3f9c1d -m "Version bêta"   # tag a specific commit—not necessarily the most recent one
```

## Push tags to a remote

Tags are **not** automatically sent by a standard `git push`:

```bash
git push origin v1.0.0     # searches for a specific tag
git push origin --tags      # pushes all local tags at once
```

## Delete a tag

```bash
git tag -d v1.0.0                    # deletes locally
git push origin --delete v1.0.0       # also removes it on the remote side
```

## Return to a tagged version

```bash
git checkout v1.0.0
```

> **Note:** This sets the repository to the **"detached HEAD"** state (`HEAD` points directly to a commit, not to a branch) — useful for inspecting this specific version, but any new commits made in this state would not belong to any branch and could easily be lost. To continue working from there, first create a branch: `git checkout -b nouvelle-branche v1.0.0`.
