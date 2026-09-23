---
order: 3
---

# State and Speculative Fan-Out: Asking All the Questions at Once

The [Choice, Score, and Noul primitives](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul#comparing-the-three-primitives) are always evaluated against a **state**: the content the model must judge. This chapter details what a state can hold, then a direct consequence of the questions' independence: asking many questions at once costs barely more than asking a single one.

## The state: the content to evaluate

The state is the data supplied to the model, against which one or more questions are asked. It accepts three formats:

| Format | Typical use case |
|---|---|
| Simple string | A single message, an isolated passage of text |
| [JSON](/?c=infrastructure&p=json) object | Several named fields, a structured application state (e.g. `{"ticket": "...", "history": [...]}`) |
| [JSON](/?c=infrastructure&p=json) array | A sequence of messages or records |

```json
{
  "ticket": {
    "subject": "Package never received",
    "message": "Order placed 12 days ago, still nothing received.",
    "vip_customer": true
  }
}
```

The structured object preserves relationships between data (here, the fact that `vip_customer` describes exactly this ticket) better than a single string that mixes everything into prose. Only text is accepted: no image, audio, or video. The model also favors English, other languages (including French) currently having lower accuracy according to the vendor's documentation.

| Pitfall | Best practice |
|---|---|
| Stuffing everything into a single unstructured string | Separate the content (the state) from the requested judgments (the questions), and group into a JSON object only the information actually relevant to the decision |

## Questions evaluated independently

A central point of how these models work: **all questions asked in a single request see the same state, and are evaluated independently of one another**. No question "sees" another's answer. This independence has a direct consequence: nothing prevents asking several questions at once, including questions whose usefulness isn't yet known.

## The speculative fan-out pattern

**Speculative fan-out** consists of sending all plausible questions for a given case upfront, rather than chaining calls one by one as needs arise, then letting the code decide afterward which answers to keep:

```text
Sequential approach (3 calls, one after another)
  Call 1 -> ticket category = "bug"
  Call 2 -> (since it's a bug) severity = "blocking"
  Call 3 -> (since blocking) is a refund requested?

Speculative fan-out (1 single call, 5 questions in parallel)
  category, bug_severity, reproduction_steps, refund_requested, frustration
  -> the code then ignores bug_severity if the category isn't "bug"
```

Since the questions are evaluated in parallel against the same state, adding extra questions has little effect on response time: the dominant cost is reading the state itself, not the number of questions asked against it.

```python
answer = client.system_one(
    state=ticket,
    questions={
        "category": Choice(instructions="Ticket category?", criteria=CATEGORIES),
        "bug_severity": Score(instructions="Severity if it's a bug?", criteria=LEVELS),
        "reproduction_steps": Noul(instructions="Are reproduction steps given?"),
        "refund_requested": Noul(instructions="Is a refund requested?"),
        "frustration": Score(instructions="Level of frustration expressed?", criteria=FRUSTRATION_LEVELS),
    },
)

# The code then chooses which answers to use, based on the category returned
if answer.answers["category"].choice == "bug":
    handle_bug(answer.answers["bug_severity"], answer.answers["reproduction_steps"])
```

## What this changes in cost and speed

On a case measured by the vendor (13 regulatory questions asked against the same document), grouping the questions into a single request rather than 13 separate requests gives:

| | 13 separate requests | 1 grouped request |
|---|---|---|
| Cost | Baseline | **12.2× cheaper** (the document is transmitted only once) |
| Speed | Baseline | **10× faster** |
| Answer reliability | Baseline | Identical: each question remains independent of the others |

This figure comes from the vendor and has not been independently verified; what matters here is the principle it illustrates (the dominant cost is reading the state, not the number of questions), not the exact benchmark.

> **Pitfall:** believing that adding speculative questions risks "polluting" the useful answers, the way an overloaded prompt would with a generative LLM. Here, each question is evaluated independently against the same state: an unneeded question never changes another's answer.
>
> **Best practice:** as soon as a decision potentially depends on several factors, ask all plausible questions in a single call rather than chaining calls as they come up, and let the code (not a new request) filter out the irrelevant answers.

## What to remember

| | |
|---|---|
| **To remember** | The state (text, object, or JSON array) is the content being evaluated. Questions asked against the same state are independent of one another, which enables speculative fan-out: asking all plausible questions at once, then filtering the useful answers in code, for a cost and latency close to that of a single question. |
| **Usable tools** | A structured JSON object as state; several Choice/Score/Noul questions in a single request; application code to filter out irrelevant speculative answers. |
| **Pitfalls to avoid** | Stuffing everything into a single unstructured string. Fearing that adding questions degrades the other answers (it doesn't, they're independent). |
| **Best practices** | Separate content and questions, structure the state as JSON. Group all plausible questions for a case into a single request rather than chaining sequential calls. |
