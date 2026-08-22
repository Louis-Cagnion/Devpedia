---
order: 7
---

# Tags

A **tag** is a pointer to a specific commit, much like a branch, but unlike a branch, a tag **never** **changes** once it is created. It is typically used to mark a released version of a project (`v1.0.0`, `v2.3.1`...).

## Create a tag

```bash
git tag v1.0.0                 # "lightweight" tag: simple pointer, no metadata
git tag -a v1.0.0 -m "First stable release"   # "Annotated" tag: includes author, date, and message
```

> **Note:** An annotated tag (`-a`) is generally preferable for a true released version: it is committed as a full-fledged Git object (with its own message and author), unlike a lightweight tag, which is simply an alias to a commit hash.

## List and inspect tags

```bash
git tag                     # List all tags
git tag -l "v1.*"            # pattern-based filtering
git show v1.0.0               # Displays the tag details (and the associated commit)
```

## Tagging a past commit

```bash
git tag -a v0.9.0 a3f9c1d -m "Beta version"   # Tag a specific commit, not necessarily the most recent one
```

## Pushing tags to a remote

Tags are **not** automatically sent by a standard web`git push`:

```bash
git push origin v1.0.0     # triggers a specific tag
git push origin --tags      # Puts all local tags in at once
```

## Delete a tag

```bash
git tag -d v1.0.0                    # deletes locally
git push origin --delete v1.0.0       # Also removes from the remote side
```

## Return to a tagged version

```bash
git checkout v1.0.0
```

> **Note:** This puts the repository in a **"detached HEAD"** state (`HEAD` points directly to a commit, no longer to a branch), useful for inspecting this specific version, but any new commits made in this state would not belong to any branch and could easily be lost. To continue working from here, first create a branch: `git checkout -b nouvelle-branche v1.0.0`.

---

## 📋 Summary

| | |
|---|---|
| **Key Takeaway** | A tag is a fixed pointer to a commit, unlike a branch, it never changes. It is typically used to mark a released version. |
| **Tools available** | `git tag`, `git tag -a`, `git push origin --tags`. |
| **Pitfalls to Avoid** | Tags are not automatically pushed by a standard `git push`; moving to a tag places you in *detached HEAD mode*. |
| **Best Practices** | Use an annotated tag (`-a`) for a true released version; create a branch before continuing to work from a tag. |
