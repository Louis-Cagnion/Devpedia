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
- `pool`: which machine (provided by Microsoft, or your own) runs the pipeline.
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

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | An Azure pipeline is organized into stages, containing jobs, containing steps run in order. `trigger` defines when it runs, `pool` on which machine, `steps`/`task` the actions to run. |
| **Available Tools** | Official tasks (`PublishBuildArtifacts@1` and many others) for common actions, without rewriting their logic by hand. |
| **Pitfalls to Avoid** | Omitting `trigger` and letting an implicit behavior decide when the pipeline runs. Writing a secret in plain text in the versioned YAML file. |
| **Best Practices** | Declare `trigger` explicitly. Store secrets in a dedicated variable group and reference them by name, never in plain text. |
