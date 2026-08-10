---
order: 9
---

# Resolving a merge conflict

A **conflict** occurs when Git cannot automatically merge two versions of the same file—typically, when the **same lines** have been modified differently in each version (during a `merge`, `rebase`, or `pull`).

## What Git writes to the file in conflict

```text
<<<<<<< HEAD
const TVA = 0.20;
=======
const TVA_TAUX = 0.20;
>>>>>>> feature
```

- Everything between `<<<<<<< HEAD` and `=======` corresponds to **your** version (the branch you're on).
- Everything between `=======` and `>>>>>>> feature` corresponds to the version in the **other** (merged) branch.
- These markers (`<<<<<<<`, `=======`, `>>>>>>>`) are inserted **directly into the file**—the file will no longer compile or run as-is as long as they are present.

## Resolving the conflict

1. Open the file, decide which version to keep (or combine the two manually).
2. Completely remove the markers `<<<<<<<`, `=======`, `>>>>>>>`—they must **never** remain in the final file.
3. Mark the file as resolved, then continue with the current task:

```bash
git add fichier_en_conflit.js

git commit                # If the conflict resulted from a "merge"
git rebase --continue     # if the conflict resulted from a "rebase"
```

## See which files are in conflict

```bash
git status
# Explicitly displays the list of "both modified" files (modified on both sides)
```

## Discard the current merge/rebase

If the solution proves too complex or if you'd rather start from scratch:

```bash
git merge --abort     # Cancels a merge in progress and restores the system to its state prior to the attempt.
git rebase --abort    # Cancel a rebase in progress
```

## Reducing the Risk of Conflicts

- Frequently merge changes made by others (regular `git pull`s / `git fetch`) rather than letting a branch diverge for a long time.
- Keep feature branches short and focused.
- Communicate with the team when multiple people are working on the same files at the same time.

See also [Branches](/?c=git&p=branches) and [Rebase](/?c=git&p=rebase), the two operations that most often cause conflicts.

---

## 📋 Summary

| | |
|---|---|
| **Key Takeaway** | A conflict occurs when Git cannot automatically merge two versions of the same lines. The markers `<<<<<<<` / `=======` / `>>>>>>>` must be removed manually before continuing. |
| **Tools available** | `git status` (conflicting files), `git add` + `git commit` / `git rebase --continue`, `git merge --abort` / `git rebase --abort`. |
| **Pitfalls to Avoid** | Forgetting to remove a conflict marker—the file remains invalid (will no longer compile or run) as long as the marker is present. |
| **Best Practices** | Frequently merge changes made by others to minimize divergence; keep feature branches short and focused. |
