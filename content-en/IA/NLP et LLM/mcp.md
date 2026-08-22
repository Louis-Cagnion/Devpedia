---
order: 8
---

# MCP (Model Context Protocol): standardizing an agent's tools

[Function calling](/?c=ia&s=nlp-llm&p=agents) describes *how* a model calls a tool (a JSON description, a decision made by the model, an execution on the code side), but not *how* that tool reaches the application running the model. Without a shared convention, every application that wants to give access to the same service (GitHub, for instance) has to rewrite its own integration: its own code to list repositories, create an issue, and so on. **MCP** (*Model Context Protocol*) is a standardized protocol that solves this second problem: exposing tools once, in a way reusable by any compatible application.

> **Analogy:** before USB, every peripheral (mouse, printer, hard drive) had its own connector and required a driver written specifically for each computer. USB standardized the connector and the protocol: a USB-compatible peripheral works with any USB-compatible computer, with no device-specific integration. MCP plays the same role between a tool (GitHub, a database, a file system) and an application that runs an LLM.

## MCP client and server

MCP reuses the client/server vocabulary already seen for [HTTP](/?c=infrastructure&p=api-et-http), with different roles:

| Role | What it is | Example |
|---|---|---|
| **MCP server** | Exposes a specific service (tools, data) according to the MCP protocol | A GitHub MCP server, an MCP server for a local database |
| **MCP client** | The application that runs the model and connects to one or more MCP servers | An IDE, a command-line assistant, a chat application |

```text
Application (MCP client)  <-- MCP protocol -->  GitHub MCP server
       |                                                |
     runs the                                    knows how to talk
      model                                       to the GitHub API
```

The same GitHub MCP server works, with no modification whatsoever, with any MCP-compatible application: it is the server that carries the integration with GitHub, once, not each application that uses it.

## Three types of exposed resources

An MCP server can offer three distinct things, not just tools:

| Type | Role | Example |
|---|---|---|
| **Tools** | Functions the model can decide to call (the usual [function calling](/?c=ia&s=nlp-llm&p=agents)) | `create_issue`, `list_pull_requests` |
| **Resources** | Data the client can read and give to the model as context, without a call decided by the model itself | The content of a file, a database schema |
| **Prompts** | Reusable prompt templates, provided by the server rather than hand-written in each application | A ready-made "summarize this pull request" template |

## Transport: local or remote

An MCP client communicates with an MCP server through one of these two channels:

| Transport | Principle | Typical use case |
|---|---|---|
| `stdio` | The server runs as a local process, communicating through standard input/output | A tool that accesses the local file system |
| HTTP / SSE | The server runs remotely, communicating over the network | A service shared across several users or machines |

> **Pitfall:** connecting a client to an MCP server while granting it more permissions than necessary (a "files" server that can write anywhere on disk rather than to a specific folder), the same risk as an unrestricted parameter in function calling.
>
> **Best practice:** limit each MCP server to the strictly necessary scope (a specific folder, a read-only database), and require human confirmation before any action with real-world consequences, exactly as with a regular [agent](/?c=ia&s=nlp-llm&p=agents).

## Key takeaways

| | |
|---|---|
| **Key takeaways** | MCP standardizes how a tool, a piece of data (resource), or a prompt template is exposed to an application running an LLM, so that the same MCP server can be reused by any compatible client, with no integration rewritten each time. |
| **Tools you can use** | One MCP server per service to integrate (GitHub, database, file system...); `stdio` transport locally, HTTP/SSE remotely. |
| **Pitfalls to avoid** | Granting an MCP server more permissions than the scope it actually needs. |
| **Best practices** | Limit each MCP server to the strictly required scope; require human confirmation before any action with real-world consequences. |
