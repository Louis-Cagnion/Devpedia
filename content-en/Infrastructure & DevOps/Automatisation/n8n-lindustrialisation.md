---
order: 5
---

# n8n: going to production

Building a workflow that works is one thing; running it reliably in production, with several people contributing to it, is another. This chapter covers what changes between "it works on my machine" and an industrialized n8n deployment.

## Self-hosted or n8n Cloud: revisiting the question in more detail

The chapter on [visual workflow automation](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow) already laid out the SaaS/self-hosted distinction. For n8n specifically, each option shifts responsibility differently:

| | n8n Cloud | Self-hosted |
|---|---|---|
| **Infrastructure** | Fully managed by n8n | Owner's responsibility |
| **Updates** | Automatic, handled by n8n | Applied by the owner |
| **Control** | Limited to what the platform offers | Full control over configuration and deployment |
| **Cost** | Paid subscription (time-limited free trial) | Free Community edition for most features |

Neither is universally better: n8n Cloud removes the operational burden, self-hosting removes the third-party dependency and recurring costs, at the price of maintenance.

## Two notions of "variable" not to confuse

The word "variable" refers to two distinct mechanisms in n8n, with different uses:

| | Environment variable | n8n variable (`$vars`) |
|---|---|---|
| **Configures what** | The n8n instance itself (database, security, ports) | A value reusable inside workflows |
| **Defined where** | At the operating system/container level hosting n8n | In the n8n interface (Variables menu) |
| **Used how** | Read by n8n at startup | Referenced in a workflow via `$vars.variableName` |
| **Example** | `NODES_EXCLUDE`, database configuration | An API URL that changes between environments |

> **Pitfall:** confusing the two and trying to set a system environment variable for a value only actually useful inside a workflow (or the reverse). The two have different lifecycles and configuration methods.
>
> **Best practice:** reserve environment variables for the instance's own configuration, and n8n variables (`$vars`) for any value a workflow needs to read without being hardcoded into its parameters.

## Credentials: specific to each instance

As seen in the chapter on a [workflow's JSON format](/?c=infrastructure-devops&s=automatisation&p=n8n-le-format-json-dun-workflow), an export only holds a reference to a credential, never the secret itself: each n8n instance (dev, staging, production) therefore keeps its own credentials, stored and encrypted separately, to be manually reconfigured once a workflow is imported onto a new instance.

## Dev/prod environments: separate instances

n8n doesn't offer a single instance with a built-in "dev/prod" switcher: each environment is a **distinct n8n instance**, with its own credentials and its own execution history. Moving a workflow from one environment to another happens in two ways:

| Method | How it works |
|---|---|
| **Manual export/import** | Download the JSON from the source instance, import it on the target instance (seen in the previous chapter) |
| **Source Control ([Git](/?c=qualite-performance-et-outils&s=git&p=git))** | An n8n instance connects to a Git repository branch; a single versioned workflow can be pushed from one environment to another following the usual Git flow (dev → staging → production) |

> **Pitfall:** pushing a change directly to production without going through an intermediate environment, especially for a workflow touching real data (a production database, an email sent to real customers).
>
> **Best practice:** route every change through a dev/staging environment before production, just like any code deployment.

## Monitoring executions

The **Executions** tab (accessible from the home page or a specific workflow) lists every past run, with its status. For a failed run, two recovery options exist: **"Retry with original workflow"** (replays the run exactly as it happened, ignoring any fix made since) and **"Retry with currently saved workflow"** (replays the same input data, but with the current version of the workflow, after a fix).

A complementary setting, **"Retry on Fail"**, available on each individual node, automatically reruns that node a set number of times on failure, useful for absorbing a transient error (an external service temporarily unavailable) with no human intervention.

Combined with the error workflow covered in the [chapter on the feature catalog](/?c=infrastructure-devops&s=automatisation&p=n8n-catalogue-des-fonctionnalites), these mechanisms cover the essentials of monitoring a production deployment: being notified of a failure, understanding why it happened, and replaying it without starting from scratch.

## Editor security: restricting sensitive nodes

On a self-hosted instance shared by several people who aren't all equally trustworthy, some nodes represent a real risk: the **Execute Command** node, for example, runs an arbitrary shell command on the server hosting n8n. The `NODES_EXCLUDE` environment variable removes one or more nodes from the list of those usable on the instance:

```text
NODES_EXCLUDE=["n8n-nodes-base.executeCommand", "n8n-nodes-base.readWriteFile"]
```

The Execute Command node is in fact **blocked by default** on a recent self-hosted install, precisely for this reason; it must be explicitly allowed (`NODES_EXCLUDE=[]`) to become available.

> **Pitfall:** enabling Execute Command (or an equally powerful node) on a shared instance without having thought through who can actually create workflows there. A node capable of running system commands effectively grants access equivalent to the server itself.
>
> **Best practice:** keep the most sensitive nodes blocked by default, and only enable them for an identified need, on an instance where every user is trusted to the same degree as direct server access would require.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | n8n Cloud and self-hosted shift infrastructure responsibility differently, with no universally better option. Environment variables configure the instance, n8n variables (`$vars`) configure values inside workflows. Credentials stay specific to each instance. Dev/prod environments are separate n8n instances, synced via export/import or Git Source Control. |
| **Usable tools** | The Executions tab and its retry options; the per-node "Retry on Fail" setting; the `NODES_EXCLUDE` environment variable to block sensitive nodes like Execute Command. |
| **Pitfalls to avoid** | Confusing environment variables and n8n variables. Pushing a change directly to production without an intermediate environment. Enabling a powerful node (Execute Command) on a shared instance without considering the trust granted to its users. |
| **Best practices** | Reserve each variable type for its own use. Route every change through dev/staging before production. Keep sensitive nodes blocked by default, enabled only for an identified need. |
