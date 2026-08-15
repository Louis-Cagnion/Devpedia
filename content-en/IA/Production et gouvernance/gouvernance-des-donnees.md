---
order: 12
---

# Data Governance for an AI System

Sending data to an LLM isn't neutral: unlike an internal database, the data often passes through a third-party service hosted in the [cloud](/?c=infrastructure&p=le-cloud), can show up in logs no one planned to create (see [LLM Monitoring and Operations](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)), and can be retained by the provider under contractual terms that need to be known before sending anything at all. Data governance applied to an AI system reuses the classic principles (GDPR, access control, traceability), adapting them to this extra hop, obligations that stack on top of those specific to the AI system itself, from the [EU AI regulation](/?c=ia&s=production-et-gouvernance&p=reglementation-europeenne-ia).

## Classifying data before sending it to a model

Any data that enters a prompt (a user's question, a document injected by [RAG](/?c=ia&s=nlp-llm&p=rag), a result from a tool called by an [agent](/?c=ia&s=nlp-llm&p=agents)) deserves to be classified before it's sent, not after:

| Category | Example | Handling |
|---|---|---|
| Public | Already published documentation | No particular precaution |
| Internal | Non-confidential company procedure | Check the provider's contractual terms before sending |
| Personal | A customer's name, email, phone number | Anonymize or pseudonymize before sending if the use case allows it, otherwise a compliant provider (hosting, contract) is required |
| Secret | API key, password, trade secret | Never pass through a prompt, regardless of the provider |

> **Pitfall:** only classifying what the initial prompt explicitly contains. An agent that calls tools (see [Agents](/?c=ia&s=nlp-llm&p=agents)) can pull data into the prompt that no one explicitly decided to put there: the result of a SQL query returned to a model, for instance, carries every column from that query, not just the one useful for the answer.
>
> **Best practice:** base the classification on what *can* pass through a tool or a search, not just on what the initial prompt explicitly contains.

## Traceability: reconstructing who asked what

An AI system in production must be able to answer, after the fact, *"who asked this question, with what data, and what answer was produced?"*, the same requirement as a classic audit system, but with two extra logs compared to ordinary CRUD: the prompt actually sent (not just the user's raw question, but everything assembled around it), and the exact version of the model that answered (see version drift in [LLM Monitoring and Operations](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)).

> **Note:** CRUD (*Create, Read, Update, Delete*) refers to the four basic operations on stored data: creating it, reading it, modifying it, deleting it (the SQL commands `INSERT`/`SELECT`/`UPDATE`/`DELETE`, see [SQL](/?c=domain-specific-languages-dsl&p=sql), or the `POST`/`GET`/`PUT`/`DELETE` HTTP methods of a REST API). An "ordinary CRUD" audit therefore traces, for each of these four actions: who triggered it, on which row, at what time. An AI system adds two more (the assembled prompt, the model version) because an answer depends on much more than just the data modified: it also depends on the entire context provided to the model and on the model itself, two elements that don't exist in a classic CRUD.

## Access control: RAG either inherits permissions, or bypasses them

With a poorly designed [RAG](/?c=ia&s=nlp-llm&p=rag), the vector database indexes documents at several confidentiality levels, but the search doesn't filter based on the rights of the person asking the question.

> **Pitfall:** filtering by permission only **after** the search (reviewing the answer after the fact). A user who would never have had direct access to a document can then have its content quoted back to them, rephrased by the model, because the search judged it relevant without checking who is allowed to see it: once the information is in the answer, the damage is done.
>
> **Best practice:** filter by permission **before** the search (only search documents the user is authorized to see), never only after the fact.

## Retention and the right to be forgotten

The logs needed for traceability and evaluation (see [LLM Monitoring and Operations](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)) sit in direct tension with the right to be forgotten: a prompt containing personal data, kept indefinitely to analyze model quality, is personal data retention like any other. An explicit retention policy must cover these logs just as it would a business database: forgetting them because they're technical rather than functional is one of the most common ways to become non-compliant without realizing it.

| Policy element | Question it answers | Concrete example |
|---|---|---|
| Maximum retention period | After how long should a piece of data disappear or be anonymized? | Prompt logs kept in clear text for 90 days, then anonymized (name/email replaced with a generic identifier) |
| Anonymization after a delay | Can the data useful for analysis be kept without keeping the person's identity? | After 90 days, the prompt remains usable for measuring answer quality, but no longer traces back to a specific customer |
| Deletion procedure on request | What happens if someone exercises their right to be forgotten before the normal deadline? | A GDPR request triggers deletion of the prompt, the answer, and any trace in the logs associated with that person |
| Documented exceptions | Does some data need to survive longer for a legal reason (accounting, ongoing litigation)? | A conversation cited in ongoing legal proceedings is kept beyond the normal period, but isolated and justified |

What complicates this compared to a classic business database: personal data sent to an LLM may have been copied to several places, and no single `DELETE` is enough to erase it everywhere.

| Place the data may have been copied | Deletion triggered by a classic `DELETE`? |
|---|---|
| Row in the application database | Yes |
| Prompt log (see traceability above) | Only if the log is explicitly included in the deletion procedure |
| A [RAG](/?c=ia&s=nlp-llm&p=rag)'s vector index, if the document contained the data | No: the embedding generated from the document must be found and deleted separately |
| Logs kept by the model provider (outside the company's infrastructure) | Depends entirely on the provider's contractual terms, not on what the company does internally |

> **Pitfall:** treating the right to be forgotten as a simple `DELETE FROM users WHERE id = ...` and considering the matter closed. A document containing personal data, once indexed in a RAG, continues to exist as an embedding even after the source document is deleted, and a third-party model provider may retain the prompt under its own contractual terms, independently of what's deleted on the company's side.
>
> **Best practice:** make deletion a process that explicitly walks through every place the data may have been copied (database, logs, vector index), rather than a single query on the source table, and check, before choosing a provider, what its contract says about retention and deletion on request.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | Any data entering a prompt must be classified (public/internal/personal/secret) before it's sent. An AI system traces two more elements than ordinary CRUD (the assembled prompt, the model version). A RAG must filter by permission before the search, never after. The right to be forgotten must cover every place data may have been copied, not just the source database. |
| **Tools you can use** | An explicit retention policy (duration, anonymization, deletion procedure). Permission filtering applied upstream of the RAG search. |
| **Pitfalls to avoid** | Only classifying the initial prompt's explicit content, without accounting for what a tool can pull into it. Filtering a RAG's permissions after the search rather than before. Treating the right to be forgotten as a simple `DELETE` on the source table. |
| **Best practices** | Classify any data that *can* pass through, not just what the prompt explicitly contains. Filter by permission before the RAG search. Make deletion a process that walks through every place the data may have been copied. |
