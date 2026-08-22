---
order: 7
---

# ELK: Centralizing and Querying Infrastructure Logs

A **log** is a timestamped event (a request received, an error that occurred, a connection established), distinct from a **metric**, which measures a quantity over time (CPU usage rate, number of requests per second). On a single machine, `grep`ing a log file is enough; as soon as several servers or containers each generate their own logs, you need a way to gather and query them all together.

## The problem: logs scattered across each machine

```text
Without centralization:              With centralization:

Server A: local logs                 Server A -\
Server B: local logs                            Elasticsearch (indexed search)
Server C: local logs                 Server B -/       |
                                      Server C -/     Kibana (search interface)

-> connect to each machine           -> a single search, across all logs at once
   to look for an error
```

Without centralization, tracking down a specific error means connecting to each machine one by one and searching through each file separately — an approach that doesn't scale beyond a handful of servers.

## ELK: three tools, one pipeline

**ELK** (Elasticsearch, Logstash, Kibana) refers to the most widely used stack for this need, with each letter covering a distinct step:

| Tool | Role |
|---|---|
| **Elasticsearch** | Search and storage engine: indexes each incoming log to make it immediately searchable, even among millions of entries |
| **Logstash** (or a lighter agent, such as Filebeat) | Collects logs at the source (file, network stream), formats them, and forwards them to Elasticsearch |
| **Kibana** | Web interface for searching, filtering, and visualizing indexed logs (dashboards, frequency charts for a type of event) |

```text
Server/container -> collection agent (Logstash/Filebeat) -> Elasticsearch -> Kibana
      (generates the log)   (collects, formats)              (indexes)      (searches, visualizes)
```

## Logs and metrics: two kinds of data, two tools

| | Metric | Log |
|---|---|---|
| Nature | A number, sampled at regular intervals | A timestamped event, with its full context |
| Example | 72% CPU usage at 14:03 | "Error 500 on `/order/1234` at 14:03:27, user 42" |
| Typical question | "How does this value change over time?" | "What exactly happened at that moment?" |
| Typical tool | Prometheus/Grafana and equivalents | ELK and equivalents |

The two remain complementary rather than competing: a metric alerts you that a problem exists (a climbing error rate), a log details what actually happened so you can diagnose it.

## Structuring logs to make them actually usable

A log written as a plain free-form sentence (`"Error while processing order 1234"`) remains hard to filter precisely once millions of lines have piled up. A **structured** log, most often in JSON, separates each piece of information into its own field:

```json
{"timestamp": "2026-08-20T14:03:27Z", "level": "error", "service": "commandes", "id_commande": 1234, "message": "Echec du paiement"}
```

> **Pitfall:** logging in unstructured free text, then discovering in production that it's impossible to filter precisely by service, severity level, or identifier without resorting to fragile regular expressions on the message text.
>
> **Best practice:** structure each log from the moment it's emitted (one field per piece of information: timestamp, level, service, relevant identifiers), so that searching in Kibana filters on exact fields rather than free text.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | ELK (Elasticsearch, Logstash, Kibana) centralizes logs from multiple machines to make them searchable in one place: Logstash collects and formats, Elasticsearch indexes, Kibana lets you search and visualize. Logs (timestamped events) and metrics (numbers over time) answer different questions and generally use different tools. |
| **Tools you can use** | Logstash or Filebeat for collection, Elasticsearch for indexing and search, Kibana for the search interface and dashboards. |
| **Pitfalls to avoid** | Logging in unstructured free text, making precise filtering impossible at scale. |
| **Best practices** | Structure each log into distinct fields (timestamp, level, service, identifiers) from the moment it's emitted, for precise search in the centralization tool. |
