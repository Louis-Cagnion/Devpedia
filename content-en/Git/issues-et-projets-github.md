---
order: 11
---

# Issues and project management on GitHub

An **issue** is a ticket: a reported bug, a requested feature, a question, discussed in comments attached to that ticket. Unlike a [pull request](/?c=git&p=pull-requests-github), an issue contains no code: it's a structured discussion, independent of any commit.

| | Issue | Pull request |
|---|---|---|
| Contains code? | No: only text and comments | Yes: a branch with real commits |
| Used to | Report, discuss, plan | Propose and review a concrete change |
| Can be linked to | One or more pull requests that close it | One or more issues it closes |

## Organizing issues: labels, assignees, milestones

On an active project, dozens of issues open in parallel quickly become hard to track without explicit organization:

| Tool | Role |
|---|---|
| **Label** | Categorizes an issue with a colored keyword (`bug`, `documentation`, `high priority`...), filterable in the issue list |
| **Assignee** | Designates who is responsible for handling this particular issue |
| **Milestone** | Groups several issues and pull requests around a shared goal (a release, a due date), with a progress bar based on the ones already closed |

> **Best practice:** keep a small, consistent set of labels (issue type, priority, status) rather than creating a new one for every one-off need: a rarely reused label loses its filtering usefulness.

## Issue templates

An issue template pre-fills the creation form with the expected sections (steps to reproduce a bug, expected vs. observed behavior, environment...), set up once by the repository's maintainers. Without a template, each person opening an issue decides for themselves what to put in it, with a real risk of missing details (software version, reproduction steps) that slows down handling.

> **Pitfall:** leaving an active repository without an issue template, hoping every bug report will naturally include the necessary information. In practice, an issue with no imposed structure often omits the very information most useful for diagnosing it.
>
> **Best practice:** set up at least a "bug report" template and a "feature request" template as soon as a repository accepts outside contributions.

## GitHub Projects: a Kanban view on top of issues

**GitHub Projects** is a board (often styled as a [**Kanban**](https://en.wikipedia.org/wiki/Kanban_board) board: columns like "To do" / "In progress" / "Done", each card moved from one column to the next as it progresses) that groups issues and pull requests from one or more repositories, for an overview of a project's progress rather than a plain flat list:

```text
To do                In progress          Done
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Issue #12    │     │ Issue #9     │     │ Issue #3     │
│ Issue #15    │     │ PR #14       │     │ PR #7        │
└─────────────┘     └─────────────┘     └─────────────┘
```

Moving a card from one column to another changes neither the issue nor the pull request itself: it's an independent visual organization, which can in fact group items from several different repositories into a single board.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | An issue tracks a bug/task/discussion, with no code. Labels, assignees, and milestones organize a large number of issues. GitHub Projects offers a Kanban view on top of issues and pull requests, potentially from several repositories. |
| **Tools you can use** | Labels, assignees, milestones, issue templates, GitHub Projects. |
| **Pitfalls to avoid** | Multiplying one-off labels rather than a small, consistent set. Leaving an active repository without an issue template. |
| **Best practices** | Keep a small set of labels. Set up issue templates as soon as a repository accepts outside contributions. |
