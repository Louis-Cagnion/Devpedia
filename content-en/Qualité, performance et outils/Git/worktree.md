---
order: 15
---

# The Worktree: Several Branches Open at Once

A classic Git working directory has only one branch checked out at a time: switching branches replaces the directory's content with that of the target branch. A **worktree** is an additional working directory, connected to the same repository, with its own branch checked out separately: several branches stay available at once, each in its own folder.

## The problem the worktree solves

A feature is half-finished on `feature`, and an urgent bug lands on `main`. Switching branches to fix the bug forces a choice: either commit incomplete work, or use a [`git stash`](/?c=git&p=stash) that sets everything aside while the fix happens. A worktree avoids this choice: the fix happens in a second folder, while the first keeps `feature` intact and untouched.

```text
Without a worktree                   With a worktree
one folder, one branch               one folder per branch, in parallel
at a time -> stash to switch         my-project/         (main)
                                      my-project-hotfix/  (hotfix)
                                      my-project-feature/ (feature)
```

## Creating, listing, and removing a worktree

```bash
git worktree add ../my-project-hotfix hotfix   # creates a folder, "hotfix" branch checked out
git worktree list                              # lists the repo's worktrees and their branch
git worktree remove ../my-project-hotfix       # removes a finished worktree
```

`git worktree add` also accepts a branch that doesn't exist yet (`-b new-branch`), created on the fly from the current commit.

## Shared history, separate working files

All of a repository's worktrees share the same history (`.git`): no need to fully clone the repository for each branch. Only the working files (working directory + index) are specific to each worktree.

> **Pitfall:** history is shared, but installed dependencies (`node_modules`, a Python virtual environment...) aren't. Each worktree keeps its own copy of these folders, which uses disk space and requires reinstalling per worktree.

> **Note:** a merge between two branches from different worktrees is still an ordinary Git merge, with the same possible conflicts as between two branches in a single working directory. A worktree isolates work in progress; it never removes the need to resolve a real conflict when merging.

## A typical use case: several agents in parallel

An increasingly common use: giving each agent coding in parallel (or each independent task) its own worktree, so none of them ever edits files another is already working on:

```bash
git worktree add ../project-auth authentication
git worktree add ../project-billing billing
# an agent works in each folder, never stepping on the other's toes
```

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A worktree is an additional working directory connected to the same repository, with its own branch checked out. Several branches thus stay open at once, without `stash` or a separate clone: only history is shared, working files (installed dependencies included) stay specific to each worktree. |
| **Tools you can use** | `git worktree add`/`list`/`remove`. |
| **Pitfalls to avoid** | Assuming installed dependencies (`node_modules`...) are shared between worktrees: each has its own copy to reinstall. |
| **Best practices** | Give a separate worktree to each branch/task run in parallel (an urgent hotfix, several agents coding at once), rather than chaining `stash` calls. |
