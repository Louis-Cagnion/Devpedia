---
order: 10
---

# Injection Beyond SQL

[The Main Families of Vulnerabilities](/?c=securite&s=cybersecurite&p=types-de-failles) introduces injection as *"untrusted data interpreted as an instruction rather than a plain value"*, with [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql) injection as the reference example (protection detailed in [Securing Your Data](/?c=langages&s=php&p=securite)). The same principle touches many other systems as soon as they receive external data and, wrongly, treat it as part of their own code or instructions.

## Overview: the same trap, a different target system

| Variant | Target system | Typical booby-trapped data | Defense |
|---|---|---|---|
| Shell/OS command | The server's terminal | `; rm -rf /` appended to a filename | Never build a command by concatenating text (details below) |
| LDAP | An [LDAP directory](https://ldap.com/basic-ldap-concepts/) (a company's directory of users/machines) | `*)(uid=*))(|(uid=*` in a search field, which widens the filter to every account | Parameterized query, like for SQL |
| XPath | An engine querying an [XML](https://developer.mozilla.org/en-US/docs/Web/XML/XML_introduction) document | `' or '1'='1` in an identifier, which matches every node in the document | Parameterized query, escaping XPath special characters |
| Server-side template (SSTI) | A rendering engine like [Jinja2](https://jinja.palletsprojects.com/) or [Twig](https://twig.symfony.com/) | `{{7*7}}` in a field displayed as-is in a template | Details below |
| HTTP header (CRLF) | The browser or an intermediate server (proxy, cache) | A line break (`\r\n`) injected into a response header value | Reject/escape any line break in a dynamically generated header value |
| Log (*log forging*) | The log file itself, and whoever reads it afterward | A line break injected into logged data, fabricating a fake log line | Escape line breaks before writing external data into a log |

## Shell/OS command injection

A program that builds a system command by assembling text, then hands it as-is to the terminal, lets the user add their own instructions into that text:

```python
import subprocess

# DANGEROUS: shell=True executes the string as-is, as if typed at the terminal
filename = "photo.jpg; rm -rf /"  # supplied by the user
subprocess.run(f"convert {filename} output.png", shell=True)
# The command actually executed is TWO commands separated by ";":
# convert photo.jpg output.png   AND   rm -rf /

# SAFE: each argument stays separate data, never interpreted as shell syntax
subprocess.run(["convert", filename, "output.png"])
# The entire filename (including "; rm -rf /") is passed as A SINGLE argument to convert,
# which will fail cleanly (file not found) rather than executing anything
```

The reflex is the same as a prepared SQL statement: never let external data become part of the command's own text, always pass it alongside, as a separate argument.

> **Less obvious angle:** a workflow orchestration tool (n8n, Zapier, Airflow) often offers a "Run a command" node, where the command is built in the workflow's CONFIGURATION rather than in the project's own code. The exact same concatenation risk applies there, but becomes easy to miss during a regular code review that only examines the application repository, never the orchestration tool's configuration.

## SSTI: when the HTML rendering engine becomes an interpreter

A template engine turns text containing placeholders (`{{ name }}`) into a final page, inserting the real values into them. Some of these engines also accept genuine programming expressions inside those placeholders (calculations, function calls): if user data lands directly in the template BEFORE it's rendered (instead of being merely a value inserted INTO a placeholder), the engine executes it as code.

```text
Normal template, a value inserted into an intended placeholder:
  "Hello {{ user_name }}"  +  user_name = "Louis"
  -> "Hello Louis"                                    (no risk)

Vulnerable template, user data inserted INTO the template's structure:
  template = "Hello " + user_name                       (already a template, not a value)
  if user_name = "{{ 7*7 }}"
  -> the engine renders "Hello 49": the expression was EXECUTED, not just displayed
```

An attacker who confirms this behavior (`{{7*7}}` displays `49`) can then try more dangerous expressions specific to the engine in use (reading a file, running a system command), depending on what its expression language allows.

## XXE: when an XML document reads what it shouldn't

An XML document can declare its own text shortcuts, called **entities**, and an entity can point to an EXTERNAL resource (a local file, a URL) rather than plain text:

```xml
<?xml version="1.0"?>
<!DOCTYPE data [
  <!ENTITY secret_file SYSTEM "file:///etc/passwd">
]>
<data>&secret_file;</data>
```

If the XML parser resolves this entity (actually goes and reads `/etc/passwd`) before inserting the result into the processed document, the file's content ends up exposed in the application's response, even though nothing in this document looks like "data" in the ordinary sense: it's an instruction hidden in the format's own syntax.

| | |
|---|---|
| **Defense** | Disable external entity resolution in the XML parser's configuration (most modern libraries do this by default, but not all, depending on the version) |

## Unsafe deserialization: rebuilding an object from untrusted data

**Serializing** an object means converting it to text/binary to store or send it; **deserializing** is the reverse operation: rebuilding the object from that text. Some serialization formats (Python's [`pickle`](https://docs.python.org/3/library/pickle.html) module, PHP's `unserialize()`, or an unrestricted YAML load) can encode far more than a plain value: up to instructions to run at reconstruction time.

```python
import pickle

# DANGEROUS: pickle.loads() can execute arbitrary code contained in the data,
# if it comes from an untrusted source (upload, parameter, received message)
obj = pickle.loads(data_received_from_outside)

# SAFE: a serialization format that represents ONLY values (never code)
import json
obj = json.loads(data_received_from_outside)
```

| | |
|---|---|
| **Defense** | Never deserialize externally sourced data with a format that can encode code (`pickle`, PHP `unserialize`, YAML with an unrestricted loader); prefer a format that only represents values, such as JSON |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | The SQL injection principle recurs identically as soon as an external system (shell, LDAP directory, XML document, template engine, serialization format) receives data and wrongly treats it as an instruction rather than a plain value. |
| **Tools you can use** | `subprocess.run([...])` (argument list) rather than `shell=True`; parameterized queries for LDAP/XPath; `json` rather than `pickle`/`unserialize` for exchanging data. |
| **Pitfalls to avoid** | Building a command/query by concatenating text; letting user data reach a template's text before it's rendered; deserializing external data with a format able to encode code; letting an XML parser resolve external entities. |
| **Best practices** | Always separate structure (code/query/command) from data, whatever the target system; disable XML external entity resolution; choose a serialization format that represents only values for any untrusted data. |
