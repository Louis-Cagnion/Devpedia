---
order: 8
---

# The Documented Limits of a Structured Decision Model

The [Structured decision models](/?c=ia&s=modeles-de-decision-structuree&p=system-one-vs-llm#what-its-for-and-what-it-isnt) chapter already lists, in a table, the use cases suited or not suited to this family of models. TypeSafe AI documents, for its Jev model at version 1.13, nine concrete failure modes, all of which illustrate the same underlying idea: a model trained for fast "System 1" judgment (see the [introductory chapter](/?c=ia&s=modeles-de-decision-structuree&p=system-one-vs-llm#where-the-idea-comes-from-system-1-and-system-2)) fails on anything that requires reasoning built across several explicit steps ("System 2").

| # | Failure mode | What it concretely means |
|---|---|---|
| 1 | Literal reading | Answers exactly what the question says word for word, without inferring an implicit condition a human would deduce from context |
| 2 | Calculations and numbers | Doesn't count reliably (characters, occurrences in a long list): it isn't a calculator. Also judges numeric values that are close to each other poorly (e.g. two neighboring RGB colors); prefers a word description ("bright red") to a raw number |
| 3 | Dates and times | Reads a date as text, not as an ordered quantity: unreliable temporal comparisons, especially with mixed formats or relative expressions ("next week") |
| 4 | Complex indirection | A double negative or reasoning across several levels of indirection causes accuracy to drop |
| 5 | Large states | A state containing details irrelevant to the question asked distracts the model and degrades the answer |
| 6 | Adversarial content | Instructions injected into the evaluated content, or content phrased to deceive, can influence the answer (see [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection), a risk of the same nature already covered for generative LLMs) |
| 7 | Contradictory instructions | Criteria and instructions that ask for different things create confusion rather than a coherent tie-break |
| 8 | Unguaranteed logical invariants | Two formulations meant to be strictly equivalent (e.g. a Noul's probability and 1 minus the probability of its negation) don't necessarily give the same result: don't rely on an assumed logical identity, phrase each question to say directly what you want to know |
| 9 | Text generation | The model isn't trained to write free text (see the [chapter on training](/?c=ia&s=modeles-de-decision-structuree&p=entrainement-rlcd#rlcd-optimizing-for-a-reliable-probability-not-for-text)): asking it to do so is both slow and unreliable |

## The common thread: fast common sense, not built reasoning

These nine limits aren't isolated bugs but the direct consequence of what this type of model was trained to do: answer a narrow judgment fast, never unroll explicit reasoning. A structured decision model excels at immediate common-sense judgments, and fails at anything that would require several chained reasoning steps.

> **Pitfall:** asking the model for a task that overlaps one or more of these nine points (counting occurrences, comparing relative dates, deciding based on a double negative) while expecting the same reliability as on a simple judgment.
>
> **Best practice:** pre-process in code anything that involves an exact calculation (counting, arithmetic, date comparison, see the code-resolution pattern seen for [date extraction](/?c=ia&s=modeles-de-decision-structuree&p=recettes-extraction-et-structuration#date-extraction-reading-then-resolving-in-code) later in this part), and hand the model only the judgment that remains genuinely subjective or contextual once that calculation is isolated.

## What to remember

| | |
|---|---|
| **To remember** | A structured decision model like Jev documentedly fails at nine types of tasks (literal reading, calculations and numbers, relative dates, complex indirection, large states, adversarial content, contradictory instructions, unguaranteed logical invariants, text generation), all tied to its training for fast judgment rather than built reasoning. |
| **Usable tools** | No direct fix: the workaround is architectural (move the exact calculation into code). |
| **Pitfalls to avoid** | Handing the model an exact calculation, a relative date comparison, or reasoning across several levels of indirection. |
| **Best practices** | Isolate in code anything that involves a verifiable calculation, reserve the model only for the genuinely contextual judgment that remains once that calculation is extracted. |
