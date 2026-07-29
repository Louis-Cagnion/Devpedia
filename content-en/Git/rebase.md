---
order: 10
---

# Rebase

`git rebase` offers an alternative to `git merge` (see the chapter on branches) for merging changes between two branches: instead of creating a merge commit with two parents, it **reapplies** the commits from one branch on top of the other, producing a linear history.

## Merge vs. Rebase, Visually

```
Avant :
main:     A -- B -- C
                \
feature:         D -- E

Après un merge :                Après un rebase de feature sur main :
main:     A -- B -- C ----- F   main:     A -- B -- C
               \           /                          \
feature:        D -- E ---'                            D' -- E'  <-- feature (rebasée)
```

Rebasing does not literally "move" the commits `D` and `E`: it creates **new** commits (`D'`, `E'`) with the same content but a different parent—hence the different hashes compared to the originals.

## Perform a rebase

```bash
git checkout feature
git rebase main
```

Git reapplies each commit from `feature` (not present in `main`) one by one on top of the last commit from `main`. If a conflict arises on a specific commit (see the chapter on conflict resolution), the rebase pauses to resolve it:

```bash
# After resolving the conflicts in the affected files:
git add fichier_en_conflit.txt
git rebase --continue

# or, to completely cancel the current rebase and revert to the previous state:
git rebase --abort
```

## Interactive rebase: rewriting your local history

```bash
git rebase -i HEAD~3   # opens an editor for the last 3 commits
```

```
pick a1b2c3d Ajoute le formulaire de contact
pick e4f5g6h Corrige une typo
pick i7j8k9l Ajoute la validation email
```

Each line can be edited before saving:

| Action | Effect |
|---|---|
| `pick` | Keep the commit as is |
| `reword` | Keep the commit, but change its message |
| `squash` | Merge this commit with the previous one (keeps both messages; to be merged) |
| `fixup` | Same as `squash`, but discards the message from this commit |
| `drop` | Completely deletes this commit |

Useful, for example, for cleaning up a work history ("Fix a typo," "Oops," "Really fix the typo this time") into a single clean commit before sharing it.

## The golden rule: Never re-base a history that has already been shared

```bash
# AVOID if other people have already pulled these commits:
git rebase main
git push --force
```

> **Note:** When a force push is truly legitimate (rebasing and then pushing a branch that only you are using), `git push --force-with-lease` is safer than `--force`: it first checks to see if anyone else has pushed a commit to that branch since the last `fetch`, and rejects the operation in that case rather than blindly overwriting work you didn’t notice.

Since rebasing creates **new** commits with different hashes, pushing them and `--force` the remote history causes anyone who had already based their work on the old commits to become severely out of sync—their local branches would reference commits that no longer exist on the server. Rebasing is safe when used on **strictly local** commits that have not yet been shared.

See also the chapter on branches (merge, the safest option for an already shared history) and the chapter on conflict resolution.
