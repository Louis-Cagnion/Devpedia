---
order: 13
---

# Rebase

`git rebase` Offers an alternative to `git merge` (see [Branches](/?c=git&p=branches)) for merging changes between two branches: instead of creating a merge commit with two parents, it **reapplies** the commits from one branch on top of the other, producing a linear history.

## Merge vs. Rebase, Visually

```text
Before:
main:     A -- B -- C
                \
feature:         D -- E

After a merge:                  After rebasing feature onto main:
main:     A -- B -- C ----- F   main:     A -- B -- C
               \           /                          \
feature:        D -- E ---'                            D' -- E'  <-- feature (rebased)
```

Rebasing does not literally "move" the commits `D` and `E`: it creates **new** commits (`D'`, `E'`) with the same content but a different parent, hence the different hashes compared to the originals.

## Performing a rebase

```bash
git checkout feature
git rebase main
```

Git reapplies each commit from `feature` (not present at `main`) one by one on top of the latest commit from `main`. If a conflict arises on a specific commit (see [Resolving a merge conflict](/?c=git&p=resoudre-conflits)), the rebase pauses to resolve it:

```bash
# After resolving conflicts in the affected files:
git add fichier_en_conflit.txt
git rebase --continue

# Or, to completely cancel the current rebase and revert to the previous state:
git rebase --abort
```

## Interactive rebase: rewriting your local history

```bash
git rebase -i HEAD~3   # Opens an editor for the last 3 commits
```

```text
pick a1b2c3d Add the contact form
pick e4f5g6h Fix a typo
pick i7j8k9l Add email validation
```

Each line can be edited before saving:

| Action | Effect |
|---|---|
| `pick` | Keep the commit as is |
| `reword` | Keep the commit, but change its message |
| `squash` | Merge this commit with the previous one (keep both messages; to be merged) |
| `fixup` | Same as `squash`, but discards the message from this commit |
| `drop` | Completely deletes this commit |

Useful, for example, for cleaning up a work history ("Fix a typo," "Oops," "Really fix the typo this time") into a single clean commit before sharing it.

## Rewording without an interactive editor: `reset --soft` + targeted recommit

`rebase -i` opens an interactive text editor, which fails outright in a context with no attached terminal (script, CI, automated agent). To reword the message of a commit that isn't the last one, without going through an editor, `git reset --soft` to the common base lets you unstage everything back into the working tree, then recommit each commit one by one with the right message:

```bash
git reset --soft <commit-before-the-oldest-to-reword>
git reset            # Unstages everything (the working directory keeps the final state)

# For each commit to recreate, in its original order:
# Restores THIS file to its state at that commit
git show <old-hash-of-the-commit>:path/file.py > path/file.py
git add path/file.py ...
git commit -F fixed-message.txt   # Never -m for a multi-line message with accents: see below
```

`git show <hash>:<path>` extracts a file's content as it was at a specific commit, which lets you reconstruct each commit's intermediate state before recommitting it, including when the same file changed across several of the commits being reworded.

> **Note:** Writing an accented multi-line message directly in `git commit -m "$(cat <<'EOF' ... EOF)"` (bash heredoc) is a frequent source of errors: a message typed "on the fly" in a command call easily falls back to an ASCII convention (e.g., "vehicule" instead of "véhicule") without anything flagging it. Writing the message to a text file, proofreading it, then `git commit -F file.txt` avoids this pitfall by separating writing the message from executing the command.

This method changes neither the content nor the order of commits, only their messages: it's a manual `reword`, more verbose than `rebase -i` but usable with no human interaction at all.

## The golden rule: never rebase a history that has already been shared

```bash
# AVOID if other people have already checked out these commits:
git rebase main
git push --force
```

> **Note:** When a force-push is truly legitimate (rebasing and then re-pushing a branch that only you are using), `git push --force-with-lease` is safer than `--force`: it first checks that no one else has pushed a commit to that branch since the last `fetch`, and rejects the operation in that case rather than blindly overwriting work you didn’t see coming.

Since rebase creates **new** commits with different hashes, pushing it by `--force` causes anyone who had already based their work on the old commits to become severely out of sync: their local branches would reference commits that no longer exist on the server. Rebasing is safe on commits that are **strictly local** and have never been shared.

See also [Branches](/?c=git&p=branches) (merge, the safest option for an already shared history) and [Resolving a merge conflict](/?c=git&p=resoudre-conflits).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | `git rebase` re-runs the commits from one branch over another, producing a linear history, at the cost of new commits (with different hashes) rather than a single merge commit. |
| **Tools available** | `git rebase`, `git rebase -i` (interactive rewriting: pick/reword/squash/fixup/drop), `git rebase --continue` / `--abort`. |
| **Pitfalls to Avoid** | Rebasing an already-shared commit history: the hashes change, which desynchronizes anyone who had already based their work on the old commits. |
| **Best Practices** | Rebase only strictly local commits; if a forced push is truly necessary, use `--force-with-lease` instead of `--force`. |
