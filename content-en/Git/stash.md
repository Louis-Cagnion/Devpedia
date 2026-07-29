---
order: 6
---

# The stash

`git stash` Temporarily sets aside uncommitted changes to restore a clean working directory—useful when you need to switch branches urgently (e.g., to fix a critical bug) without losing your work in progress or committing it in an incomplete state.

## Save your changes

```bash
git stash                          # saves all tracked changes and restores the "clean" version of the file
git stash push -m "en cours : formulaire de contact"  # with a note, so you can find your way back later
git stash -u                        # also includes untracked files (new, never added)
```

After running `git stash`, `git status` no longer shows any changes—as if a commit had just been made, except that nothing appears in the history (`git log`): the changes are stored separately, in a stack.

## View and retrieve your stash

```bash
git stash list
# stash@{0}: in progress: contact form
# stash@{1}: WIP on main: a3f9c1d Fixes the discount calculation

git stash apply          # Reapply the most recent stash, WITHOUT removing it from the stack
git stash apply stash@{1} # reapply a specific stash
git stash pop             # reapply the most recent stash, AND remove it from the stack
```

> **Note:** `apply` keeps the stash on the stack after reapplying it (useful for applying it to multiple branches in succession), while `pop` removes it—the choice depends on whether you're certain you won't need it elsewhere.

## Delete a stash

```bash
git stash drop stash@{0}   # deletes a specific stash without reapplying it
git stash clear             # Removes ALL stashes from the stack
```

## Typical Use Case

```bash
# While working on "feature," an urgent bug pops up in "main"
git stash push -m "travail en cours sur feature"
git checkout main
# ... fix the bug, commit, push ...
git checkout feature
git stash pop   # picks up exactly where we left off
```
