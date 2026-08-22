---
order: 4
---

# n8n: a workflow's JSON format

Underneath the visual interface, an n8n workflow is nothing more than a [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) file: every node placed on the canvas and every connection drawn between them shows up there in a readable form. Understanding this structure makes it possible to export, share, and version a workflow like any other configuration file.

## Exporting and importing

The workflow menu (three dots, top right of the editor) offers **"Download"**, which downloads the entire workflow as a `.json` file. Conversely, **"Import from File"** reloads a workflow from such a file. A shortcut also exists for part of the canvas: selecting nodes then `Ctrl+C`/`Ctrl+V` copies and pastes their JSON, even between two different n8n tabs.

## The overall structure

An exported workflow is organized around two main keys, `nodes` and `connections`, alongside general information about the workflow itself (name, active status, settings):

```json
{
  "name": "Notify a new order",
  "active": false,
  "nodes": [ /* the list of nodes, detailed below */ ],
  "connections": { /* the links between nodes, detailed below */ },
  "settings": {}
}
```

## A node in the JSON

Each node on the canvas corresponds to an object in the `nodes` array: its name (as shown on the canvas), its type (which connector or function), its visual position, and its **parameters** (the content actually configured in the panel seen in the first chapter):

```json
{
  "name": "Send a Slack message",
  "type": "n8n-nodes-base.slack",
  "typeVersion": 1,
  "position": [900, 300],
  "parameters": {
    "channel": "sales",
    "text": "New order received"
  },
  "credentials": {
    "slackApi": {
      "id": "17",
      "name": "slack_credentials"
    }
  }
}
```

The `credentials` field only holds a **reference** (an id and a name) to credentials stored separately by n8n, never the password or API key itself: an exported file can therefore be shared without revealing a secret, but stays unusable as-is until the matching credentials have been reconfigured on the destination instance.

## Connections: who sends its data to whom

The `connections` object maps a source node's **name** to the list of nodes that receive its output data:

```json
{
  "connections": {
    "New order": {
      "main": [
        [
          { "node": "Send a Slack message", "type": "main", "index": 0 }
        ]
      ]
    }
  }
}
```

This nested structure (an array of arrays) exists to represent nodes with several outputs (like the IF or Switch nodes covered in the previous chapter): each output of the source node has its own array of target nodes, in the order they appear on the canvas.

> **Pitfall:** renaming a node directly in the raw JSON, forgetting that this name is used as a key in the `connections` object. A desynced name silently breaks the link between the two nodes involved on the next import.
>
> **Best practice:** rename a node from the visual editor rather than in the raw JSON; n8n then handles updating every reference in `connections` automatically.

## The format of data flowing through

Alongside the workflow file itself, it's useful to know the format of the **data** each node handles internally (visible in the execution panel): n8n always passes around an array of objects, each holding a `json` key (regular data) or a `binary` key (a file):

```json
[
  {
    "json": {
      "customer": "Alice",
      "amount": 149.90
    }
  }
]
```

This is the same structure a Code node manipulates (see the previous chapter) via `$input.all()`.

## Versioning a workflow like code

Since a workflow is just a structured text file, nothing prevents committing it to a [Git](/?c=qualite-performance-et-outils&s=git&p=commandes-essentielles) repository: version history, diffs between two versions (`git diff`), and review before a change all become possible, exactly like regular source code.

> **Pitfall:** committing a workflow export without checking that no sensitive data is hardcoded in its `parameters` (a URL with a plaintext access token, for example): unlike `credentials`, a value typed directly into a text field is exported as-is.
>
> **Best practice:** use n8n's credentials system, or environment variables, for any sensitive value, never a hardcoded text field, so an export stays safe to share or version.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | An exported workflow is a JSON with two main keys: `nodes` (name, type, position, parameters) and `connections` (which node sends its data to which other, by name). `credentials` only store a reference, never the secret itself. Data flowing between nodes is always an array of `{json: ...}` or `{binary: ...}` objects. |
| **Usable tools** | "Download"/"Import from File" to export/import; `Ctrl+C`/`Ctrl+V` to copy a node selection; Git to version a workflow like code. |
| **Pitfalls to avoid** | Renaming a node directly in the raw JSON, desyncing references in `connections`. Committing an export containing sensitive data hardcoded in a parameter. |
| **Best practices** | Rename a node from the visual editor, never in the raw JSON. Use n8n's credentials system or environment variables for any sensitive value before sharing or versioning an export. |
