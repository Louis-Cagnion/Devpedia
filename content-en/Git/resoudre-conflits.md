---
order: 9
---

# Resolving a merge conflict

A **conflict** occurs when Git cannot automatically merge two versions of the same file—typically, when the **same lines** have been modified differently in each version (during a `merge`, `rebase`, or `pull`).

## What Git Writes to the Conflicted File

```
<<<<<<< HEAD
const TVA = 0.20;
=======
const TVA_TAUX = 0.20;
>>>>>>> feature
```

- Everything between `<<<<<<< HEAD` and `=======` corresponds to **your** version (the branch you're on).
- Everything between `=======` and `>>>>>>> feature` corresponds to the version of the other (merged) branch.
- These markers (`<<<<<<<`, `=======`, `>>>>>>>`) are inserted **directly into the file**—the file will no longer compile or run as-is as long as they are present.

## Resolving the Conflict

1. Open the file, decide which version to keep (or combine the two manually).
2. Completely remove the markers `<<<<<<<`, `=======`, `>>>>>>>` — they must **never** remain in the final file.
3. Mark the file as resolved, then continue with the current operation:

```bash
git add fichier_en_conflit.js

git commit                # if the conflict resulted from a "merge"
git rebase --continue     # if the conflict were caused by a "rebase"
```

## See which files are in conflict

```bash
git status
# explicitly displays the list of "both modified" files (modified on both sides)
```

## Abort the current merge/rebase

If the solution turns out to be too complex or if you'd rather start from scratch:

```bash
git merge --abort     # cancels a merge in progress, restores the system to its state prior to the attempt
git rebase --abort    # cancels a rebase in progress
```

## Reducing the Risk of Conflicts

- Frequently incorporate changes made by others (`git pull` / regular `git fetch`) rather than letting a branch diverge for a long time.
- Keep feature branches short and focused.
- Communicate with the team when several people are working on the same files at the same time.

See also the chapters on branches and rebasing, the two operations that most often cause conflicts.
