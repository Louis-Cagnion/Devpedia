---
order: 5
---

# Self-hosted Azure Pipelines agents

A [pipeline](/?c=infrastructure-devops&s=ci-cd&p=pipeline-cicd) describes **what** to do (build, test, deploy), but a machine is needed to do it. In Azure Pipelines, that machine runs a small program, the **agent**: it asks the server whether there is any work, runs it, then sends back the logs and the result. This chapter explains how to install and run **your own** agent on a Windows machine.

| Concept | In one sentence |
|---|---|
| Agent | The program that runs a pipeline's steps on a machine |
| Agent pool | A group of agents; the pipeline names a pool (`pool:`), not a specific agent |
| Job | A set of steps given to a single agent of the pool |
| Self-hosted agent | An agent installed on **your** machine, which you administer |
| Personal access token (PAT) | A password with limited scope, used here to register the agent |
| Service or interactive mode | The agent runs as a Windows service, or as a program in a logged-in session |

## Microsoft-hosted agent or self-hosted agent

| | Microsoft-hosted agent | Self-hosted agent |
|---|---|---|
| Where it runs | At Microsoft, on a machine recreated for each pipeline run | On your machine |
| State between two runs | Nothing is kept: the agent is destroyed at the end | Caches, folders, and tools stay: incremental builds are faster |
| Installed software | What the chosen image contains | Anything you install on it (and must maintain) |
| Access to an internal network | Not directly | Yes, depending on where the machine sits |
| Maintenance | None | Updates, permissions, disk, security: it's up to you |

A self-hosted agent is justified when the work needs software or access that the Microsoft agent does not have (an internal network, a browser with a real session, special hardware), or when persistent caches matter. When in doubt, try the Microsoft-hosted agent first, as it is simpler (see [Azure Pipelines and GitHub Actions](/?c=infrastructure-devops&s=ci-cd&p=azure-pipelines-vs-github-actions) for the `pool` and `runs-on` vocabulary).

## How the agent talks to the server

The agent **always initiates** the communication: it polls the server over HTTPS and never receives an incoming call. So there is **no port to open** toward the agent, only outbound access to the Internet.

```
   your machine                                Azure DevOps (server)
  +--------------+   1. registration (PAT)    +----------------------+
  |    agent     | -------------------------> |   agent pool         |
  |              |   2. "any work?"           |                      |
  |              | <------------------------> |   job queue          |
  |              |   (long poll, HTTPS)       |                      |
  |              |   3. job + short token     |                      |
  |              | <------------------------- |                      |
  |     runs     |   4. logs, result          |                      |
  |              | -------------------------> |                      |
  +--------------+                            +----------------------+
```

| Step | What happens |
|---|---|
| Registration | An authorized person adds the agent to the pool; their permissions are **not** kept by the agent |
| Listening | The agent downloads a listening token and polls the job queue with a "long" HTTP request (the connection stays open until there is work) |
| Job | The agent receives the work and a **token specific to that job**, with a short lifetime |
| End | The job token is discarded; the agent goes back to listening |

## Registering with a PAT

A **personal access token** (*PAT*) is a substitute password, with limited scope and an expiration date, created in your account settings (see [GitHub and platforms](/?c=git&p=github-et-plateformes) for the same mechanism on the GitHub side). To register an agent:

| Point | Value |
|---|---|
| Where to create it | Azure DevOps > user settings > **Personal access tokens** |
| Scope to select | **Agent Pools (read, manage)**, and **nothing else** ("Show all scopes" to see the full list) |
| Who | An account that is a member of the **pool administrator** role (or the organization owner) |
| When it is used | **Only for registration**: afterwards, the agent communicates with its own tokens |
| How many agents | A single PAT can register several agents |

Practical consequences: an expired or deleted PAT **does not stop** an already registered agent (a new one is needed only to register or remove an agent). And the Windows account that **runs** the agent should be different from the person who registered it: the documentation recommends separate identities, and the agent folder contains secrets (logs, job credentials) that should be visible only to administrators and to the account that runs the agent.

## Installing and configuring by hand

Prerequisites: Windows 10 or 11, or Windows Server 2012 or newer, and PowerShell 3.0 or later (the agent brings its own version of .NET). Do this by hand the first time to see how it works:

| Step | Detail |
|---|---|
| 1. Download | Azure DevOps > Organization settings > **Agent pools** > **Default** pool > **Agents** tab > **New agent** > Windows; choose x64 for 64-bit Windows |
| 2. Unzip | Into a folder with **no spaces** in its path, for example `C:\agents` (not in the Downloads folder: permission problems) |
| 3. Protect the folder | Writable by administrators only |
| 4. Open PowerShell **as administrator** | Required to install a service. Not PowerShell ISE, not a mintty terminal such as git-bash |
| 5. Configure | `config.cmd` asks questions (URL, authentication type, token, pool, agent name, work folder, mode) |

```
cd C:\agents
.\config.cmd
```

| `config.cmd` question | Answer |
|---|---|
| Server URL | `https://dev.azure.com/{your-organization}` |
| Authentication type | `PAT`, then the token created above |
| Pool | `Default` or the pool you want |
| Agent name | A name that is **unique** within the pool |
| Work folder | `_work` by default, inside the agent folder |
| Mode | Service or interactive (next section) |

In interactive mode, you then start the agent with `.\run.cmd` (Ctrl+C to stop it). `.\run.cmd --once` accepts **a single** job, then stops cleanly. The agent appears in the pool, along with its status (online, offline).

## Service or interactive

| | Windows service | Interactive with automatic logon |
|---|---|---|
| Startup | Automatic when the machine boots, with no session open | At boot, **after** the chosen account's session is opened automatically |
| Managed by | The service manager (`services.msc`) | A program in a visible session (`run.cmd`) |
| Agent updates | Best experience | Possible |
| Use case | The default: builds, windowless tests, deployments | When the work needs a **desktop**: UI tests, a browser with a real window |
| Account | Network Service or Local Service recommended (reduced permissions, password that never expires); in service mode, user name of 20 characters maximum | A dedicated account whose password is stored for the autologon |
| Risk | No screen to protect | Session permanently open; screen saver disabled |

Why two modes? A Windows service runs in **Session 0**, isolated from the desktop (see [Windows: services, sessions and permissions](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits)): it cannot open a visible window. A test that drives a browser or a graphical application needs a real session: that is the role of interactive mode. The agent is started there at boot by the **autologon** (the password is kept in the [LSA secrets](/?c=infrastructure-devops&s=administration-systeme&p=windows-services-sessions-et-droits)).

**How do you tell which mode an agent runs in?** Azure DevOps > Organization settings > **Agent pools** > the pool > the agent > **Capabilities** tab: the system capability `InteractiveSession` (a piece of information the agent publishes about itself, see "Capabilities, demands, and diagnostics" below) is `True` in interactive mode and `False` in service mode. Observed on a real agent: a robot that drives Chrome cannot open a window while the agent is in service mode (`InteractiveSession = False`). Only the **windowless** mode (*headless*) remains, which some sites protected against robots detect and block: switching to interactive mode is an infrastructure decision (autologon, dedicated account), not a code setting.

| Interactive mode pitfall | Why | Remedy |
|---|---|---|
| Closing a Remote Desktop session locks the machine | UI tests in progress fail | Hand the session back to the physical screen with `tscon` (see [Windows: remote access](/?c=infrastructure-devops&s=administration-systeme&p=acces-a-distance-windows)) |
| Autologon account too powerful | Any administrator of the machine can extract its password | **Dedicated, local, least-privilege** account and a physically locked machine |
| Domain policy | It may forbid autologon or a disabled screen saver | Request an exception, or use a machine outside the domain |

## Configuring without answering questions

To install with nobody at the screen (script, several machines), pass `--unattended` **and** the answers to all the questions. In an administrator PowerShell window, in the agent folder:

```
# agent in service mode, built-in Network Service account (no password needed)
.\config.cmd --unattended `
    --url https://dev.azure.com/my-organization `
    --auth pat --token <token> `
    --pool Default --agent agent-build-01 `
    --runAsService --windowsLogonAccount "NT AUTHORITY\NETWORK SERVICE"
```

```
# interactive agent, started by the autologon of a dedicated account
.\config.cmd --unattended `
    --url https://dev.azure.com/my-organization `
    --auth pat --token <token> `
    --pool Default --agent agent-ui-01 `
    --runAsAutoLogon --windowsLogonAccount "MACHINE\agent-ui" `
    --windowsLogonPassword <password> --overwriteAutoLogon
```

(The backtick `` ` `` at the end of a line is PowerShell's line continuation character: the command continues on the next line.)

| Option | Role |
|---|---|
| `--unattended` | No questions: everything must be given as options |
| `--url` | The organization's address |
| `--auth pat` / `--token` | Token authentication (also `SP`, `negotiate`, `alt`, `integrated`) |
| `--pool`, `--agent` | The pool to join and the agent's name |
| `--replace` | Replace an agent in the pool that has the same name |
| `--work` | Work folder (specific to **this** agent) |
| `--runAsService` | Install the agent as a Windows service (administrator rights required) |
| `--runAsAutoLogon` | Configure autologon and start the agent at boot (administrator rights required) |
| `--windowsLogonAccount` | Account that runs the agent (`domain\user`), with `--runAsService` or `--runAsAutoLogon` |
| `--windowsLogonPassword` | Its password (not needed for built-in accounts such as `NT AUTHORITY\NETWORK SERVICE`) |
| `--overwriteAutoLogon` | Replace the autologon already configured on the machine |
| `--noRestart` | Do not restart the machine at the end of an autologon configuration |

Any option can also be given as an **environment variable**: its name in uppercase, prefixed with `VSTS_AGENT_INPUT_` (for example `VSTS_AGENT_INPUT_PASSWORD` for `--password`). This is preferable for a secret: a token or password written on the command line stays in the terminal history and can be read by other programs while it runs. `.\config.cmd --help` always lists the options of **your** version.

## Several agents on the same machine

It is possible, but the documentation recommends **a single agent per machine**: two agents share the processor, the disk, and the installed tools, which can degrade performance and results.

| Rule | Why |
|---|---|
| **One folder per agent** (`C:\agents\a1`, `C:\agents\a2`), with `config.cmd` run from each | Each agent has its own configuration |
| A **unique name** per agent (`--agent`) | Two agents with the same name fight over their place in the pool: one ends up stopping |
| **One work folder per agent** (`--work`) | A work folder belongs to one agent and is not shared |
| Avoid it if the jobs are heavy on disk or I/O | No efficiency gain |
| Beware of "single-instance" tools (for example shared npm packages) | One job may update a dependency while another is using it: unstable results |
| Autologon is a **machine** setting | Only one account logs in automatically; `--overwriteAutoLogon` replaces the existing one |
| **Several jobs in parallel**: two agents in the same pool | Each agent runs one job at a time |
| **Two separate uses** (robot, deployment): one pool per use | The pipeline names a pool; each pool has its own agents |
| Never copy the folder of an already configured agent | Both would share credentials and name: one of them cuts out after a few minutes of conflict. Unzip a fresh archive for each agent |

## Maintenance: removing, replacing, reconfiguring

| Need | Command |
|---|---|
| Remove the agent | `.\config.cmd remove` (with `--auth PAT --token <token>` in unattended mode) |
| Replace an agent with the same name | Reconfigure with the same name and answer `Y` (or `--replace`), **then** remove the old one: otherwise, after a few minutes of conflict, one of the two stops |
| Change a service's account | Reconfigure the agent; **not** from the services console |
| An autologon that no longer starts the agent | Remove the agent, check that it has disappeared from the pool, reconfigure in a freshly unzipped folder |
| Delete an agent's folder | Only **after** `config.cmd remove`: otherwise the agent stays listed (offline) in the pool |
| Agent updates | Automatic: the agent updates itself when a job requires a newer version |
| Disk filling up | Clean `_work` at every job with `workspace: clean: all` in the job's YAML |
| State of a service-mode agent | `services.msc`, entry "Azure Pipelines Agent" (or `vstsagent.…`) |

## Capabilities, demands, and diagnostics

Each agent advertises its **capabilities**: machine name, operating system, versions of certain software, environment variables. A pipeline declares its **demands**, and the server only sends the job to compatible agents.

```yaml
pool:
  name: Default          # the pool, not a specific agent
  demands:
  - npm                  # only agents with npm installed are candidates
```

| Point | Good to know |
|---|---|
| After installing software | **Restart the agent** so the new capability shows up |
| Environment variables | They become capabilities; `VSO_AGENT_IGNORE` (comma-separated list of names) lets you exclude some. **Their value is shown in clear text** on the Capabilities tab, readable by anyone with read access to the pool: never put a secret in an environment variable of the agent's machine |
| Variables specific to one agent | A `.env` file at the agent's root, one `NAME=value` line per variable, then restart |
| An agent that won't start | `.\run --diagnostics` runs a series of checks |
| Firewall | Allow **outbound** traffic to `dev.azure.com`, `*.dev.azure.com`, `login.microsoftonline.com` and `download.agent.dev.azure.com` (full list in the documentation) |

> **Verification limit:** these Windows commands could not be run here. Their syntax and options were checked against the Microsoft documentation: [Windows agent](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent), [agents](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/agents) and [registration by PAT](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/personal-access-token-agent-registration).

## Security: the agent runs the repository's code

An agent runs the pipeline's commands with the rights of the account that runs it. Whoever can edit `azure-pipelines.yml` (or a script it calls) can therefore run code on your machine: Microsoft states it explicitly, the agent is designed to run downloaded code, so it is a possible target for remote code execution.

| Risk | Remedy |
|---|---|
| A job reads the secrets in the agent's folder (credentials, logs) | Folder accessible only to administrators and the agent's account |
| An overly powerful account (administrator, domain account) runs the agent | Dedicated local account with minimal rights ([least privilege](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise) principle) |
| An untrusted pipeline uses another project's agent | A separate pool per trust level, with the pool's usage rights restricted |
| A repository where any contributor can propose a pipeline change is plugged into an agent that sees the internal network | Mandatory review before any change to a pipeline that uses a self-hosted agent; internal-network agents kept out of reach of uncontrolled repositories |

## Pitfalls

| Pitfall | What happens | Remedy |
|---|---|---|
| PAT with too many scopes | A stolen token grants far more than registering an agent | Select **Agent Pools (read, manage)** only |
| Token or password on the command line | It stays in the terminal history | `VSTS_AGENT_INPUT_...` variables, never in a versioned file |
| Agent folder readable by everyone | Logs and job secrets exposed | Folder restricted to administrators and the agent's account |
| Folder with spaces | Some tools and scripts escape spaces poorly | A path such as `C:\agents` |
| Configuring from PowerShell ISE, git-bash, or without elevation | Service installation impossible or incorrect configuration | **Administrator** PowerShell |
| Personal autologon account | Anyone with access to the machine uses it | Dedicated, local, minimal account |
| Two agents with the same name | Conflict, one stops | A unique name per agent, `--replace` then remove the old one |
| Software installed without restarting the agent | The job stays "waiting for a compatible agent" | Restart the agent |
| PAT with no expiry date | The token stays valid although the agent no longer needs it | Short expiry, revoke once the agent is registered |
| Copied agent folder | Same credentials and same name: one of the two cuts out | One fresh archive per agent |
| Folder deleted without `config.cmd remove` | The agent stays listed (offline) in the pool | Remove it properly first |
| An agent that runs code coming from repositories | It is a program built to run downloaded code: a remote execution target | Minimal permissions, isolated machine, control over who can write to the pipeline |
| A secret in an environment variable of the machine (for example `SFTP_PASSWORD`) | It becomes a capability of the agent, shown in clear text to every reader of the pool, even if the pipeline concerned does not use it: an agent shared between several flows exposes each one's secrets | Secret in a secret variable group of the pipeline (or a vault), machine variable deleted, password changed if it was exposed |

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | An agent runs a pipeline's jobs on a machine; it polls the server over HTTPS (no inbound port). A PAT with the **Agent Pools (read, manage)** scope is used only for registration. **Service** mode by default; **interactive mode with autologon** only if the job needs a desktop. `config.cmd --unattended` automates everything; one agent per folder, a unique name, its own work folder. |
| **Available Tools** | `config.cmd` (with `--unattended`, `--runAsService`, `--runAsAutoLogon`, `--replace`, `--overwriteAutoLogon`, `--noRestart`), `run.cmd` and `run.cmd --once`, `config.cmd remove`, `services.msc`, `.\run --diagnostics`, the pipeline's `demands`, `tscon` to hand a remote session back to the screen, `workspace: clean: all` to clean the working folder. |
| **Pitfalls to Avoid** | Overly broad PAT, secret on the command line, agent folder readable by everyone, path with spaces, PowerShell without elevation, personal autologon account, two agents with the same name, tool installed without restarting the agent, PAT with no expiry, copied agent folder, folder deleted without `config.cmd remove`, secret in an environment variable of the machine (shown in clear text in the capabilities). |
| **Best Practices** | Try a Microsoft-hosted agent first; a dedicated run account, different from the one that registers; secrets through environment variables; one agent per machine unless there is a specific need; check `.\config.cmd --help` for the installed version; short-lived PAT revoked after registration; mandatory review of pipeline changes; one pool per trust level. |
