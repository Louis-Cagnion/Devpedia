---
order: 1
---

# What Is a CI/CD Pipeline?

After pushing a change to a [Git](/?c=git) repository, someone still has to rebuild the project, run its tests, and then deploy it. Done by hand on every change, this work is slow, repetitive, and skipping just one step (rerunning the tests, for example) is enough to let an error slip through. A **CI/CD pipeline** automates exactly this sequence of steps.

## The problem: repeating the same steps without ever forgetting one

```text
Without automation, on every change:
developer -> rebuilds the project -> runs tests by hand -> deploys by hand

A slip at any step (tests not rerun, wrong version deployed...)
goes unnoticed until a user runs into the problem in production.
```

> **Pitfall:** relying on human discipline to never skip a step. Under deadline pressure, a step skipped "just this once" (usually the tests) is precisely the one that would have caught the problem.
>
> **Best practice:** automate the sequence of steps once and for all, so no step depends on the memory or discipline of whoever pushes the change.

## Continuous Integration (CI): building and testing on every change

**Continuous Integration** (CI) automatically rebuilds the project and runs its tests on every change pushed to the repository, before anyone needs to ask for it.

```text
push to the repository -> automatically triggers -> build -> tests
                                                                 |
                                                failure <--------+--------> success
                                              (the change                (the change
                                             is not integrated,        is integrated, ready
                                            the author is notified)        for the next step)
```

> **Pitfall:** ignoring a failing CI pipeline thinking "I'll fix it later," and continuing to pile up changes on top. Every new change then builds on an already-broken base, making the real origin of the problem harder and harder to isolate.
>
> **Best practice:** treat a failing CI pipeline as blocking: fix it before adding new code on top, not after.

## Continuous Delivery and Continuous Deployment (CD): two levels of automation

**CD** actually refers to two different practices, often conflated:

| | Continuous Delivery | Continuous Deployment |
|---|---|---|
| What's automated | Preparing a version ready to deploy | Preparing **and** deploying to production |
| Remaining human step | A human triggers the production release | None: the production release is automatic after a CI success |
| Control | More control before going live | Fastest possible time to go live |

> **Pitfall:** confusing the two and assuming a "CD" pipeline automatically deploys to production, when it might only prepare a version awaiting human validation (continuous delivery).
>
> **Best practice:** explicitly clarify, for each pipeline, whether it stops at a version ready to deploy or goes all the way to automatic production deployment, rather than assuming one or the other.

## The full pipeline: a sequence of steps that must succeed in order

```text
commit -> build -> tests -> package -> deployment (staging) -> deployment (production)
```

Each step only runs if the previous one succeeded: a failure stops the pipeline before the next step, rather than letting a problem slip further down the chain.

> **Best practice:** order the steps from fastest/cheapest to slowest/most expensive (a unit test before a full deployment, for example): a pipeline that fails does so as early as possible, without wasting time on the following steps.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A CI/CD pipeline automates a project's build, tests, and deployment on every change. CI builds and tests; CD (continuous delivery or continuous deployment, two different levels) takes over up to a version ready to deploy, or even deployed automatically. |
| **Available Tools** | [Azure Pipelines](/?c=ci-cd&p=azure-devops-plateforme), [GitHub Actions](/?c=ci-cd&p=azure-pipelines-vs-github-actions), and other equivalent platforms, to define and run these steps automatically. |
| **Pitfalls to Avoid** | Skipping a step "just this once" under deadline pressure. Ignoring a failing CI pipeline and piling up new code on top. Confusing continuous delivery with continuous deployment. |
| **Best Practices** | Automate the sequence of steps to stop depending on human discipline. Treat a CI failure as blocking. Order steps from fastest to slowest. |
