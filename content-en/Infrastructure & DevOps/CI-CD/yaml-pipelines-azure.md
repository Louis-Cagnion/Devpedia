---
order: 3
---

# Azure Pipeline YAML Syntax

An Azure DevOps pipeline is described in an `azure-pipelines.yml` file, in **YAML** format (see the basic syntax, already covered in [Docker Compose](/?c=docker&p=docker-compose)): this chapter only covers what's specific to a pipeline's structure.

## The hierarchy of a pipeline

A pipeline is organized into four nested levels, from broadest to most precise:

```text
Pipeline
  └─ Stage    (a major phase, e.g. "Build", "Test", "Deploy")
       └─ Job       (a set of tasks run on the same machine)
            └─ Step      (a specific task: running a command, publishing a file...)
```

Stages within the same pipeline can run one after another, or in parallel; so can jobs within the same stage. Steps within the same job, though, always run in the order they're written.

## A minimal example

```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: ubuntu-latest

steps:
  - script: npm install
    displayName: Install dependencies
  - script: npm test
    displayName: Run tests
```

- `trigger`: when the pipeline runs automatically (here, on every push to `main`).
- `pool`: in which group of agents (the programs that run the jobs, on a machine provided by Microsoft or your own) the pipeline runs; a pool is a list of agents, not a machine: it can group agents from several machines, and a machine can host agents from several pools.
- `steps`: the list of steps, run in order. `script` runs a raw command; `displayName` is just the name shown in the run logs.

> **Pitfall:** forgetting `trigger`. Without it, the default behavior depends on the project's configuration (triggered on any branch, or a pipeline that never runs on its own): better to state it explicitly than to guess what the absence of this field will do.
>
> **Best practice:** declare `trigger` explicitly, even to reproduce a behavior that would be the default anyway: the file stays understandable without having to know that default by heart.

## Tasks: ready-made steps

A **task** is a step predefined by Azure DevOps (or by the marketplace) for a common action, rather than writing the raw command yourself:

```yaml
steps:
  - script: npm run build
  - task: PublishBuildArtifacts@1
    inputs:
      PathtoPublish: dist
      ArtifactName: my-app
```

`PublishBuildArtifacts@1` is an official task that publishes a folder as the pipeline's output (retrievable by another stage or by manual download): this avoids having to rewrite the archiving and upload logic yourself.

## Pitfall: putting a secret in plain text in the YAML file

```yaml
# never do this: the password appears in plain text in the Git history
steps:
  - script: deploy.sh --password myPassword123
```

> **Pitfall:** writing a password, an API key, or an access token directly into `azure-pipelines.yml`. This file is versioned in the [Git](/?c=git&p=git) repository: the secret stays visible in the history even after it's removed from a later version.
>
> **Best practice:** store secrets in a **variable group** or a dedicated Azure DevOps library, then reference them in the YAML by name (`$(password)`): the versioned file then never contains the value itself.

## Authorizing a pipeline to use a resource for the first time: "Permit"

A pipeline that references a variable group or an Environment in its YAML that this specific pipeline has never used before doesn't start automatically on the first `Run`: Azure DevOps shows a banner *"This pipeline needs permission to access N resource(s)"* with a **Permit** button per resource involved.

```text
Run pipeline
  -> "This pipeline needs permission to access 1 resource(s)"
  -> Permit button (checkbox: "for this run and future runs")
```

Distinct from the question of who can read/write the variable group (already a secrets security best practice): Permit is a pipeline-to-resource allowlist, granted once. The Permit button itself only appears for an administrator of the referenced resource: another user sees no button at all, with no explicit error message to indicate why.

> **Pitfall:** interpreting the absence of the Permit button as a bug rather than as a lack of admin rights on the referenced resource (variable group, Environment).
>
> **Best practice:** check "for this run and future runs" on the first Permit of a stable pipeline, to avoid re-authorizing on every new run.

## Azure DevOps Environments: a distinct resource, with approval checks

An `environment: OnPrem-Prod` declared in a `deployment job` is a first-class resource, distinct from a variable group, which can carry **checks**: for example a named approver, with a delay before the stage continues.

```yaml
jobs:
  - deployment: DeployProd
    environment: OnPrem-Prod
    strategy:
      runOnce:
        deploy:
          steps:
            - script: ./deploy.sh
```

An unauthorized Environment blocks the run with the same "Permission needed" banner as an unauthorized variable group; but an Environment protected by an approval check blocks differently: the run waits for the designated approver's manual sign-off, until a configured timeout expires.

> **Pitfall:** confusing a "Permit" block (access authorization, granted once) with a block from an approval check (human validation on every deployment): both show a pending run, but the resolution differs.
>
> **Best practice:** reserve approval checks for high-stakes Environments (production), not a test Environment that only needs an initial Permit.

## Pipeline Parameters: Choosing at Launch

A pipeline started by hand can ask the person starting it to make choices: this is the role of the `parameters` block, placed at the top of the file ([Runtime parameters](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/runtime-parameters)). Azure DevOps then shows a form before the run starts.

```yaml
parameters:
  - name: mode            # name used in the file
    displayName: Run mode # label shown in the form
    type: string
    default: normal       # value if nobody changes anything
    values:               # offered choices (drop-down list)
      - normal
      - unblock

steps:
  - script: python robot.py
    displayName: Start the robot
  - ${{ if eq(parameters.mode, 'unblock') }}:
      - script: python robot.py --visible-window
        displayName: Restart with a visible window
```

The line `${{ if eq(parameters.mode, 'unblock') }}:` is a **template expression** ([Template expressions](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/template-expressions)): it is evaluated when the file is **compiled**, that is when Azure DevOps turns the YAML into a list of jobs, before any step runs. If the condition is false, the step simply does not exist in the run.

| Syntax | Evaluated | Knows |
|---|---|---|
| `${{ parameters.mode }}` | At compile time, before execution | Parameters and values fixed in the file |
| `$(variableName)` | When the step runs | Also variables computed during the run |

> **Pitfall:** using `${{ }}` with a variable computed during the run: at compile time it does not exist yet, and the expression evaluates to an empty string.
>
> **Best practice:** restrict a text parameter to a `values` list, so that a typo at launch is impossible instead of silently flowing into the condition.

## Blocking Check or Non-Blocking Alert

A step that ends with an [exit code](/?c=langages&s=c&p=exit-et-codes-de-retour) other than `0` makes its job fail: the run turns red and the following stages do not run. That is the right behavior for a **blocking check** (failing tests, impossible deployment).

To report a problem without stopping everything, a script can print **logging commands**, special lines that Azure DevOps interprets instead of just displaying them ([Logging commands](https://learn.microsoft.com/en-us/azure/devops/pipelines/scripts/logging-commands)):

```powershell
# shows a yellow warning in the run summary, without failing
Write-Host "##vso[task.logissue type=warning]3 pages could not be read"
# ends the step as "succeeded with issues": the run turns orange
Write-Host "##vso[task.complete result=SucceededWithIssues;]"
```

| Situation | Mechanism | Run result |
|---|---|---|
| Problem that must stop everything | Non-zero exit code | Red, following stages canceled |
| Problem worth reporting, not serious | `task.logissue type=warning` | Green, with a visible warning |
| Partial result to keep an eye on | `task.complete result=SucceededWithIssues` | Orange ("partially succeeded") |

> **Pitfall:** failing the whole pipeline for a minor incident (a few unreadable pages): real critical alerts then drown among usual failures that nobody looks at anymore.
>
> **Best practice:** keep failure for situations that require immediate action, and distinguish in messages between "legitimately empty result" and "read failure".

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | An Azure pipeline is organized into stages, containing jobs, containing steps run in order. `trigger` defines when it runs, `pool` in which group of agents, `steps`/`task` the actions to run. `parameters` offers choices at launch, evaluated at compile time by `${{ }}`. A variable group or an Environment never used by a given pipeline requires an explicit Permit (only available to an administrator of the resource); an Environment can also carry a human approval check. |
| **Available Tools** | Official tasks (`PublishBuildArtifacts@1` and many others) for common actions, without rewriting their logic by hand. Environments to carry approval checks on a sensitive deployment. Logging commands (`##vso[task.logissue]`, `##vso[task.complete]`) for a non-blocking alert. |
| **Pitfalls to Avoid** | Omitting `trigger` and letting an implicit behavior decide when the pipeline runs. Writing a secret in plain text in the versioned YAML file. Confusing a Permit block (access authorization) with a block from an approval check (human validation on every deployment). Using `${{ }}` with a variable computed during the run. Failing the whole pipeline for a minor incident. |
| **Best Practices** | Declare `trigger` explicitly. Store secrets in a dedicated variable group and reference them by name, never in plain text. Check "for this run and future runs" on the first Permit of a stable pipeline. Reserve approval checks for high-stakes Environments. Restrict a text parameter to a `values` list. Keep pipeline failure for situations that require immediate action. |
