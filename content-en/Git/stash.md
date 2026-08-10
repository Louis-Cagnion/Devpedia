---
order: 6
---

# The Stash

`git stash` Temporarily sets aside uncommitted changes to restore a clean working directory—useful when you need to switch branches urgently (e.g., to fix a critical bug) without losing your work in progress or committing it in an incomplete state.

## Save your changes

```bash
git stash                          # Saves all tracked changes and restores the "clean" folder
git stash push -m "In progress: contact form"  # with a note, so you can find your way back later
git stash -u                        # Also includes untracked files (new, never added)
```

After running `git stash`, `git status` no longer shows any changes—as if a commit had just been made, except that nothing appears in the history (`git log`): the changes are stored separately, in a stack.

## View and retrieve your stashes

```bash
git stash list
# stash@{0}: in progress: contact form
# stash@{1}: WIP on main: a3f9c1d Fixes the discount calculation

git stash apply          # Reapplies the most recent stash WITHOUT removing it from the stack
git stash apply stash@{1} # Reapplies a specific stash
git stash pop             # Reapplies the most recent stash AND removes it from the stack
```

> **Note:** `apply` keeps the stash on the stack after reapplying it (useful for applying it to multiple branches in succession), while `pop` removes it—the choice depends on whether you’re certain you won’t need it elsewhere.

## Delete a stash

```bash
git stash drop stash@{0}   # Deletes a specific stash without reapplying it
git stash clear             # Removes ALL stashes from the stack
```

## Behind the scenes: a stash is a somewhat special kind of commit

A stash is nothing more and nothing less than a commit (see [Git's Internal Architecture](/?c=git&p=architecture-interne) for the underlying object structure), referenced by the ref `refs/stash`. Its first parent is the current commit at the time of the stash, and a second parent captures the state of the index (a third if `-u` was used, for untracked files)—it is this multi-parent structure that `git stash apply` / `pop` interpret to separately reconstruct the index and the working directory.

> **Caution:** A tool that rewrites the history without following this convention (`git filter-branch`, see [Git’s Internal Architecture](/?c=git&p=architecture-interne)) may flatten this commit to a single parent—`apply` / `pop` then become unusable (`fatal: ... is not a stash-like commit`). The content remains directly retrievable, however, since the commit tree reflects the complete state of the working directory at the time of the stash: `git checkout refs/stash -- file.txt`.

## Typical use case

```bash
# While working on a "feature," an urgent bug pops up in "main."
git stash push -m "Work in progress on a feature"
git checkout main
# ... fix the bug, commit, push ...
git checkout feature
git stash pop   # picks up exactly where we left off
```

---

## 📋 Summary

| | |
|---|---|
| **Key Takeaway** | `git stash` sets aside uncommitted changes to restore a clean directory. It is actually a special commit with multiple parents, referenced by `refs/stash`. |
| **Tools available** | `git stash push` / `list` / `apply` / `pop` / `drop` / `clear`. |
| **Pitfalls to Avoid** | A tool that rewrites the history without knowing the structure of a stash can break it (flattened to a single parent; `apply` / `pop` become unusable). |
| **Best Practices** | Name your stashes using `-m` to keep track of them; use `pop` only if you are certain you no longer need them elsewhere; otherwise, use `apply`. |
