---
order: 10
---

# Pull requests on GitHub

The **pull request** (PR) is the central collaboration mechanism on [GitHub](/?c=git&p=github-et-plateformes): an explicit request, "here are commits on my branch, please review them and merge them into yours." It relies entirely on ordinary Git [branches](/?c=git&p=branches), without adding anything on the Git side itself.

## The basic workflow

```text
1. Create a branch dedicated to the change (see Branches)
2. Commit and push this branch to GitHub
3. Open a pull request: source branch -> target branch (often main)
4. One or more people review it, comment, request changes
5. Once approved: the pull request is merged
```

```bash
git checkout -b fix-display
# ... changes, commits ...
git push -u origin fix-display
# -> opening the pull request itself happens on the GitHub website, not the command line
```

> **Note:** a pull request is not a Git object: it only exists in GitHub's own database (metadata, comments, review history). The only Git object involved is the branch itself; deleting the pull request on GitHub doesn't erase any commit.

## The fork: contributing to a repository you don't control

Opening a pull request requires being able to push a branch to the target repository. For a repository owned by someone else, a **fork** first creates a full copy under your own account, with full rights:

```text
Original repository (e.g. github.com/project/tool)
       │  "Fork" button
       ▼
Your copy (e.g. github.com/you/tool)  <-- you have full rights here
       │  git clone
       ▼
Local copy on your machine
```

| | `fork` | `clone` |
|---|---|---|
| Where | On GitHub (creates a new remote repository, under your account) | On your machine (creates a local copy) |
| Needed for | Contributing to a repository where you don't have write access | Working locally on any repository, including your own |
| Link to the original | Keeps a link (`upstream`) to the original repository | No particular link: it's just a copy |

Once the fork is cloned, the pull request is made from a branch of the fork to the original repository: GitHub recognizes the link between the two and suggests this destination automatically.

> **Pitfall:** thinking a fork updates itself automatically as the original repository evolves. A fork is a frozen copy taken at the moment it's created: without an explicit action, it falls behind the original.
>
> **Best practice:** add the original repository as a second [remote](/?c=git&p=remotes) (conventionally named `upstream`) and resync it regularly: `git remote add upstream https://github.com/project/tool.git`, then `git fetch upstream` and merge its changes, **before** creating a new working branch.

## Draft pull requests

A pull request can be opened in **draft** mode: visible and open to discussion, but explicitly marked as not yet ready to be merged, or even fully reviewed. Useful for sharing work in progress (getting early feedback, running automated checks) without implying it's finished.

## Requesting a review

A pull request can explicitly designate one or more people as **reviewers**. Each review results in a status:

| Review status | Meaning |
|---|---|
| *Approve* | The change is validated, ready to merge (subject to any other rules in place) |
| *Request changes* | Changes are requested before merging; blocks the merge if protection rules require it (next section) |
| *Comment* | Remarks with no explicit approval or block |

## Protecting a branch: only accept reviewed changes

A **branch protection rule** prevents pushing directly to a sensitive branch (typically `main`), and imposes conditions before a pull request can be merged:

| Common condition | Effect |
|---|---|
| Require at least one approved review | The merge is blocked until an *Approve* has been given |
| Require automated checks to pass | The merge is blocked until CI/CD (tests, build) has succeeded on the branch's latest version |
| Forbid direct pushes | Any change to this branch must go through a pull request, no exception |

> **Pitfall:** relying solely on team discipline ("we never push directly to `main`") without a technical protection rule. Nothing then prevents an accidental direct push, nor a premature merge of a pull request not yet approved.
>
> **Best practice:** enable a protection rule on any branch meant to stay stable, rather than relying only on a non-technical team convention.

## The three ways to merge a pull request

GitHub offers three merge strategies, each with a different effect on the final history:

| Strategy | Effect on history |
|---|---|
| **Merge commit** | A [two-parent merge commit](/?c=git&p=branches) that keeps every individual commit of the branch, with its own detail |
| **Squash and merge** | All the branch's commits are grouped into a **single** commit on the target branch: a linear target history, but the detail of the pull request's individual commits is lost |
| **Rebase and merge** | Each commit of the branch is [replayed](/?c=git&p=rebase) individually on top of the target branch: a linear history, no merge commit, but each original commit stays distinct |

> **Pitfall:** choosing "Squash and merge" for a pull request that contains several logically independent changes (e.g. a bug fix **and** a new feature, mixed on the same branch): squashing melts them into a single commit, making it impossible to later revert one without the other.
>
> **Best practice:** reserve "Squash and merge" for a pull request whose individual commits have no value of their own (successive fixes of the same change, for example); prefer "Merge commit" or "Rebase and merge" when the pull request's detailed history deserves to be kept.

## Linking a pull request to an issue

Including `closes #12` (the [issue](/?c=git&p=issues-et-projets-github)'s number) in a pull request's description closes it automatically as soon as the pull request is merged, with no extra manual action.

## The force-push pitfall during a review

Rewriting the history of an already-pushed branch (`git commit --amend`, [rebase](/?c=git&p=rebase)) requires a [`git push --force`](/?c=git&p=remotes) to update it on GitHub's side.

> **Pitfall:** force-pushing a branch already reviewed by someone else. Review comments stay attached to the old lines of code, which may have disappeared or moved: a reviewer coming back to the pull request can end up facing a completely different diff from the one they'd already approved, without knowing it.
>
> **Best practice:** avoid rewriting the history of a branch already under active review; if it's necessary, explicitly warn reviewers in a pull request comment.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A pull request proposes a branch for review before merging. A fork lets you contribute to an external repository. Branch protection rules impose conditions (review, CI) before merging. Three merge strategies (merge commit, squash, rebase) leave a different final history. |
| **Tools you can use** | Draft pull requests, designated reviewers, branch protection rules, `closes #12` to link an issue. |
| **Pitfalls to avoid** | Thinking a fork updates itself. Relying on discipline rather than a technical protection rule. Squashing a pull request with logically independent commits. Force-pushing a branch under active review. |
| **Best practices** | Resync a fork with `upstream` before each new branch. Enable branch protection on any stable branch. Choose the merge strategy based on the value of the detailed history. Warn reviewers before a force-push. |
