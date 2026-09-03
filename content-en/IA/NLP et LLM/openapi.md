---
order: 10
---

# OpenAPI: Describing an API Contract, for Humans and Machines

The chapter on [APIs and HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) presents an API as a server that answers structured requests. But nothing in an API itself states in advance which routes exist, what parameters they expect, or what response format to expect: that information has to be described somewhere. **OpenAPI** is the most widely used standard format (YAML or JSON) for that description: a single file documenting every endpoint of a REST API, readable by both a human and by tools.

## One contract, two uses

```yaml
# openapi.yaml (excerpt)
paths:
  /weather:
    get:
      summary: Retrieves the weather for a city
      parameters:
        - name: city
          in: query
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Weather found
          content:
            application/json:
              schema:
                type: object
                properties:
                  temperature: { type: number }
                  conditions: { type: string }
```

| Use | What it provides |
|---|---|
| Readable documentation | An automatically generated interface (Swagger UI style) where a developer explores available routes without reading the code |
| Tooling generation | An HTTP client automatically generated in the language of your choice, from the spec alone |
| Verification | The spec can be tested against the actual implementation, to catch a gap between what's documented and what's actually served |

The same file thus serves both as documentation and as a **verifiable source of truth**: unlike a code comment or a wiki page, a gap between the spec and the API's actual behavior can be detected automatically.

## The link to LLM agents: describing actions, not just routes

[Function calling](/?c=ia&s=nlp-llm&p=agents) lets a model decide to call a tool, described by a name, parameters, and their types. An existing OpenAPI file provides **exactly** that description for a REST API: rather than hand-rewriting every route in the format function calling expects, an agent can read an API's OpenAPI file directly and infer which actions it can call.

| | OpenAPI | [MCP](/?c=ia&s=nlp-llm&p=mcp) |
|---|---|---|
| Nature | A **static** contract: a file describing an already-existing REST API | An **execution protocol**: a client and server communicating live |
| What it describes | Classic HTTP routes, originally designed for any client (not just an LLM) | Tools, data, and prompts designed from the start for a client running an LLM |
| Origin | Predates LLMs, reused for them (GPT Actions, function calling) | Designed specifically to standardize integrating an LLM with external tools |

The two aren't opposed: an integration can expose a classic REST API documented in OpenAPI, and an MCP server can then wrap it to make it directly usable by an MCP-compatible client, without rewriting the integration.

> **Pitfall:** letting an OpenAPI file drift from the actual implementation over time (a route added without updating the spec, a renamed parameter). An agent relying on that spec to know which calls are possible may then attempt an invalid call, or miss an action that's actually available.
>
> **Best practice:** generate the OpenAPI spec directly from the code (annotations, decorators depending on the framework) rather than maintaining it by hand in parallel, or automatically test it against the actual implementation (contract testing) to catch any drift as soon as it appears.

---

## 📋 Key Takeaways

| | |
|---|---|
| **Key Points** | OpenAPI describes, in a single file (YAML/JSON), a REST API's routes: parameters, response formats. It serves both as readable documentation and as a verifiable contract. Increasingly reused to describe to an LLM agent which actions it can call. |
| **Available Tools** | A generated documentation interface (Swagger UI style), an HTTP client generated from the spec, a contract test comparing the spec to the actual implementation. |
| **Pitfalls to Avoid** | Letting the spec drift from the actual implementation without detecting it. |
| **Best Practices** | Generate the spec from the code rather than maintaining it by hand in parallel; automatically test it against the real API. |
