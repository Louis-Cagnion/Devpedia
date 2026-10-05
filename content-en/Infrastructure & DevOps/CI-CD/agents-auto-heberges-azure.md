---
order: 5
---

# Self-hosted Azure DevOps agents

An Azure DevOps pipeline (see [the pipeline YAML syntax](/?c=ci-cd&p=yaml-pipelines-azure)) does not run "inside Azure DevOps": it is run by a small program installed on a machine, the **agent**. This chapter explains how to install that program on a machine you manage (a **self-hosted agent**), start it, and what this changes for security.

## Agent, pool, job: who runs what

| Term | What it is |
|---|---|
| **Agent** | Program installed on a machine that waits for work, runs it and sends back the logs |
| **Pool** | Named list of agents; a pipeline asks for a pool, not for a specific machine |
| **Job** | Set of steps given to a single agent of the pool ([pipeline hierarchy](/?c=ci-cd&p=yaml-pipelines-azure)) |

```text
Azure DevOps (online service)              Your machine
┌──────────────────────────┐               ┌────────────────────────┐
│ Pipeline started         │               │ Agent                  │
│ Pool "Robots": 1 job     │ <──────────── │ asks: "any work for    │
│ waiting                  │  outgoing     │ me?"                   │
└──────────────────────────┘  connection   └────────────────────────┘
                              (HTTPS)
```

The agent contacts Azure DevOps, never the other way round: no port has to be opened towards the outside on your machine, it only needs to reach `dev.azure.com` over HTTPS ([agent communication](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/agents#communication)).

## Microsoft-hosted or self-hosted agent

| | Agent provided by Microsoft | Self-hosted agent |
|---|---|---|
| Machine | Fresh virtual machine for each job, destroyed afterwards | Yours, which stays in place |
| Tool installation | Already done by Microsoft (fixed list) | Up to you (tools, versions, licences) |
| Access to the internal network | No | Yes (internal database, deployment server) |
| Visible window, special hardware | No | Yes (screen, graphics card, device) |
| Maintenance and security | Microsoft | You |

You pick a self-hosted agent when the job needs something the Microsoft agent cannot offer: reaching an internal server, using a licensed tool, or driving a graphical interface (a robot that controls a browser with a real window, for example).

## Installing and registering an agent

Steps, on the target machine ([Windows documentation](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent)):

1. In Azure DevOps, open *Organization settings* > *Agent pools*, pick the pool, then *New agent*: the site gives the download link of an archive.
2. Unpack the archive into a folder with **no space** in its path, for example `C:\agents\robot-1`.
3. In a PowerShell console started **as administrator**, go to that folder and run `.\config.cmd`: the program asks questions (organization address, pool, agent name, start mode).
4. For authentication, `config.cmd` asks for a **personal access token** (*Personal Access Token*, or PAT: a generated password, limited to certain actions and to a duration, already defined in [GitHub and Git hosting platforms](/?c=git&p=github-et-plateformes)). Its *scope* must be *Agent Pools (Read & manage)*.

The PAT is used **only for registration**: once the agent is registered in the pool, it uses its own credentials, stored in its folder. The account that registers the agent must be a pool administrator; the account that runs it need not be.

> **Pitfall:** creating a PAT with no expiry date, or with broad rights ("Full access"), then forgetting it: the token stays valid even though the agent no longer needs it.
>
> **Best practice:** a PAT limited to the *Agent Pools (Read & manage)* scope and expiring within a few days, revoked as soon as the agent is registered.

## Service mode or interactive mode

The agent can start in two ways, depending on what its jobs have to do ([interactive or service](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/agents#interactive-or-service)). The notions of service and Windows session are detailed in [Windows: Services, Sessions and Rights](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits).

| | Service mode | Interactive mode |
|---|---|---|
| Start | By Windows, when the machine starts | When `run.cmd` is launched in an open session |
| Logged-in user required | No | Yes (a session must be open) |
| Session | Session 0, no screen | The user's session, with a desktop |
| Job windows | Invisible | Visible |
| Machine restart | The agent comes back by itself | The agent comes back only if a session opens by itself (autologon) |
| `config.cmd` option | `--runAsService` | `--runAsAutoLogon` (or no option, then `run.cmd` by hand) |

> **Rule of thumb:** service mode by default (it is the one Microsoft recommends). Interactive mode only if a job needs a real window (UI test, robot driving a visible browser).

With `--runAsAutoLogon`, `config.cmd` sets up automatic session opening (the *autologon* mechanism and its risks are described in [the Windows chapter](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits)) and registers the agent to start when that session opens. By default, the machine restarts at the end of the configuration.

> **Pitfall:** an agent in interactive mode depends on its session. If the session is closed, or if someone connects to it remotely and moves it (see [remote access to Windows](/?c=infrastructure-devops&s=administration-systeme&p=acces-a-distance-windows)), graphical jobs fail or produce black images, and the agent shows as "offline" if the console is closed.
>
> **Best practice:** dedicate a machine (or a virtual machine) to the interactive agent, with a dedicated account, and never log on to it with that same account.

## Configuring without interaction

To install several agents, or redo the configuration identically, `config.cmd` accepts all its answers as options (`--unattended`: no question asked):

```powershell
cd C:\agents\robot-1
.\config.cmd --unattended `
  --url https://dev.azure.com/my-organization `
  --auth pat `
  --token $env:AGENT_PAT `
  --pool Robots `
  --agent robot-1 `
  --runAsAutoLogon `
  --windowsLogonAccount robot-1 `
  --overwriteAutoLogon
```

| Option | Role |
|---|---|
| `--url` | Address of the Azure DevOps organization |
| `--auth pat`, `--token` | Authentication type and token (used only at registration) |
| `--pool`, `--agent` | Pool to join, and agent name (unique within the pool) |
| `--runAsService` or `--runAsAutoLogon` | Start mode (see the previous section) |
| `--windowsLogonAccount`, `--windowsLogonPassword` | Windows account that runs the agent, and its password (not needed for a built-in account such as `NT AUTHORITY\NETWORK SERVICE`) |
| `--overwriteAutoLogon` | Replaces an autologon already configured on the machine |
| `--noRestart` | Avoids restarting the machine after a `--runAsAutoLogon` |
| `--replace` | Replaces an agent with the same name already registered in the pool |

Each option can also be given through an environment variable: its name in upper case, prefixed with `VSTS_AGENT_INPUT_` (for example `VSTS_AGENT_INPUT_TOKEN` for `--token`) ([unattended configuration](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent#unattended-config)).

> **Pitfall:** typing `--token` or `--windowsLogonPassword` in clear text in the command: the line stays in the console history (PowerShell's history file), in versioned installation scripts, and it can be read in the process list while it runs.
>
> **Best practice:** let `config.cmd` ask its questions, or read the secret from an environment variable filled from a secrets manager (see [secrets management](/?c=securite&s=cybersecurite&p=gestion-des-secrets)), then clear the variable.

## Several agents on the same machine

A machine can host several agents, provided that **each one has its own folder**: each folder holds the agent's configuration, its credentials and its `_work` working folder, which must never be shared ([configuration options](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent#unattended-config)).

```text
C:\agents\
├── robot-1\   (agent "robot-1", pool Robots, its own _work)
├── robot-2\   (agent "robot-2", pool Robots, its own _work)
└── deploy-1\  (agent "deploy-1", pool Deployment, its own _work)
```

| Need | Solution |
|---|---|
| Two jobs in parallel | Two agents in the same pool |
| Separate two uses (robot / deployment) | Two pools, each with its own agents |
| Two agents with different rights | Two Windows accounts, one per agent |

> **Pitfall:** copying the folder of an already configured agent to create a second one: both share the same credentials and the same name, and one of them shuts down after a few minutes of conflict.
>
> **Best practice:** unpack a fresh archive for each agent, with a unique name.

## Choosing your pool from the YAML

The pipeline names the pool (instead of `vmImage`, which targets Microsoft agents). A job can also require a **capability** of the agent (*demand*): each agent advertises what is installed on its machine (system, tools) and Azure DevOps only hands it compatible jobs ([capabilities](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent#capabilities)).

```yaml
jobs:
  - job: Robot
    pool:
      name: Robots
      demands:
        - Agent.OS -equals Windows_NT
    workspace:
      clean: all
    steps:
      - script: python robot.py
```

> **Pitfall:** installing a tool on the machine after the agent has started: its capability list only updates when the agent restarts, and the job stays waiting with "no agent found in pool".
>
> **Best practice:** restart the agent after installing any tool; when a wait is unexplained, compare the job's `demands` with the agent's *Capabilities* tab.

## Security: the agent runs the repository's code

An agent runs the commands written in the pipeline with the rights of the account that runs it. Whoever can edit the `azure-pipelines.yml` file (or a script it calls) can therefore run code on your machine; Microsoft says so explicitly: the agent is designed to run downloaded code, hence a possible target for remote code execution.

| Risk | Countermeasure |
|---|---|
| A job reads the secrets in the agent folder (credentials, logs) | Agent folder accessible only to administrators and the agent's account |
| An over-powerful account (administrator, domain account) runs the agent | Dedicated local account, with minimal rights ([least privilege](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise) principle) |
| An untrusted pipeline uses another project's agent | One separate pool per trust level, with the pool's usage rights restricted |
| The account that registers the agent is also the one that runs it | Two distinct accounts |

> **Pitfall:** connecting to a self-hosted agent, which has access to the internal network, a repository whose any contributor can propose a pipeline change: a simple merge request is then enough to run code in your network.
>
> **Best practice:** require a review before any change to a pipeline that uses a self-hosted agent, and keep agents that have internal network access out of reach of repositories you do not control.

## Maintenance

| Task | How |
|---|---|
| Agent update | Automatic: the agent updates itself when a job requires a newer version |
| Disk filling up | `_work` folder cleaned at each job by `workspace: clean: all` (see the YAML above) |
| See the state of an agent in service mode | `services.msc`, "Azure Pipelines Agent" entry (or "vstsagent.…") |
| Diagnose an agent | `.\run.cmd --diagnostics` |
| Remove an agent | `.\config.cmd remove`, then check it has disappeared from the pool |

> **Pitfall:** deleting an agent's folder without running `config.cmd remove`: the agent stays listed in the pool (offline) and clutters the view of the pool's state.
>
> **Best practice:** always remove the agent cleanly before deleting its folder or reinstalling the machine.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A pipeline is run by an **agent**, a program installed on a machine and grouped in a **pool**. The agent contacts Azure DevOps (outgoing connection); a PAT is only used to register it. Service mode by default (starts with the machine, no visible window); interactive mode (autologon) only if a job needs a real window. One agent per folder, with a unique name. |
| **Tools you can use** | `config.cmd` (configuration, with `--unattended` to automate it), `run.cmd` (interactive start, `--diagnostics`), `services.msc` (service state), the YAML `demands` to target a capability, `workspace: clean: all` to clean the working folder. |
| **Pitfalls to avoid** | PAT with no expiry or broad rights. Secret written in clear text on the command line. Interactive agent whose session is closed or moved. Agent folder copied as is. Over-powerful agent account. Uncontrolled repository connected to an agent that sees the internal network. |
| **Best practices** | PAT limited to *Agent Pools (Read & manage)*, expiring quickly, revoked after registration. Dedicated local account with minimal rights, distinct from the one that registers. One pool per trust level. Mandatory review of pipeline changes. Clean removal with `config.cmd remove`. |
