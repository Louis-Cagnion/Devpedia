---
order: 6
---

# Prompt Engineering: Structuring a Request for Better Results

The chapter on [NLP and LLMs](/?c=ia&s=nlp-llm&p=nlp-et-llm) distinguishes *prompting* from fine-tuning: without touching a single weight in the model, the way the input is phrased strongly influences the quality of the output. **Prompt engineering** is the largely empirical practice of designing that input methodically rather than improvising it: a handful of techniques come up often enough to be treated as basic vocabulary, not just isolated tricks.

## Giving an explicit role and instructions

A model given neither a role nor constraints has to guess the expected register (tone, level of detail, format) from the content of the question alone. Making it explicit in the instructions (often at the top of the prompt, in a "system" role) reduces that ambiguity:

```text
Bad prompt:   "Explain database indexes."

Better prompt: "You are a trainer addressing junior developers.
                Explain database indexes in 3 sentences maximum,
                with a concrete analogy, with no unexplained SQL jargon."
```

See how a system prompt is configured in [Building a Chatbot](/?c=ia&s=applications-llm&p=chatbot) for this same principle applied to a full conversational assistant.

### Anticipating missing information

Faced with missing information, a model doesn't stop on its own to ask for it: it fills the gap with a silent assumption, which can diverge from what was actually wanted with nothing flagging it. Specifying in the instructions how to handle this case takes that implicit choice away from the model:

```text
If a necessary piece of information is missing, say so explicitly
instead of making a silent assumption, or ask, if the context
allows for it.
```

The choice between asking a question and proceeding on an explicit assumption depends on context: an interactive use (chat) benefits from a direct question, whereas an automated use (pipeline, agent, no human available to answer in real time) needs the model to move forward regardless, clearly stating which assumption was made rather than leaving it implicit.

> **Pitfall:** saying nothing about this case, assuming the model will ask for clarification on its own if needed. Without explicit instruction, it most often silently fills the gap with the statistically most plausible assumption, not necessarily the one the user had in mind.
>
> **Best practice:** always specify the expected behavior for missing information, rather than relying on the model's common sense.

## Spotting an imprecise prompt and offering a refined version

The previous section covers the case where information is missing *midway* through a task already underway. A prompt can also be imprecise *from the start*: a vague goal, an unspecified format, a choice that actually belongs to the person making the request, to the point that no attempt, however careful, has any good reason to head in one direction rather than another. In that case, the best response is neither to guess nor to produce a generic result: it's to return a **refined version of the prompt**, precisely listing what's missing and proposing a concrete rephrasing, before committing to work that stands a good chance of needing to be redone:

```text
Prompt received:  "Write a report on sales."

Without refining -> a report produced on a random guess at implicit
                     assumptions (which period? which products? which
                     format? for whom?)

With refining    -> "For this report, can you specify:
                     - the period covered (current month? year?
                       comparison to last year?)
                     - the expected format (one-page summary?
                       detailed table?)
                     - the recipient (management? sales team?)
                     Otherwise, I'll go with: the current month, a
                     one-page summary, for management."
```

A concrete question, phrased as identifiable options (as above), gets a faster and more useful answer than an open-ended question like "can you clarify?", which leaves the person the burden of guessing themselves what was missing.

> **Pitfall:** asking for refinement on a prompt that's already precise enough to execute with no real ambiguity. Making the question a habit instead of reserving it for cases that justify it slows down the exchange and gives the impression the model is dodging the task rather than trying to do it well.
>
> **Best practice:** reserve refinement for cases where several interpretations remain equally plausible, or where a choice (scope, format, constraint) clearly belongs to the person making the request, and always offer, alongside the question, a reasonable default assumption so as not to fully block progress if they don't respond.

### Offering several directions rather than a single question

The question above works well when the missing information is a factual parameter (a period, a recipient): the person immediately knows how to answer. It works less well when the uncertainty concerns a stylistic or creative direction (a tone, a structure, an angle), hard to settle in the abstract, with nothing concrete in front of you. In that case, rather than an open question, sketching out two or three short, clearly different directions lets the person react to something tangible, rather than having to picture a verbal description:

```text
Prompt received:  "Write a tagline for our new fitness app."

Without options -> a single tagline, in a tone arbitrarily
                    chosen by the model

With options    -> "Three possible directions, tell me which one to
                    develop:
                    1. Humorous: 'Your couch is about to need a
                       new best friend.'
                    2. Factual: 'Track your progress, day after day.'
                    3. Premium: 'Performance, no compromise.'"
```

Each option should stay short (one line, not a paragraph): the goal is to get a direction chosen, not to deliver finished work in several copies; full development comes after the choice, once the direction is validated.

> **Pitfall:** offering more than 3-4 options, or proposing variants that only differ in phrasing details rather than a genuinely different axis (tone, structure, angle). Beyond a certain number, or with no clear difference between them, the person spends more time comparing than they would have spent answering a direct question.
>
> **Best practice:** limit options to 2-3 genuinely distinct choices on the axis in question, each cheap enough to produce, and reserve the technique for cases where the difference is better judged from a concrete example than from an abstract description.

## Few-shot prompting: showing rather than describing

Rather than abstractly describing the expected format or style, giving one or more input → output examples directly in the prompt (*few-shot prompting*) leverages the model's ability to spot a pattern and reproduce it:

```text
Classify the sentiment of each review as positive/negative/neutral.

Review: "Fast delivery, product as described."       -> positive
Review: "Fine, nothing special."                       -> neutral
Review: "Package arrived damaged, no response from support." -> negative

Review: "The product works but the packaging was torn." -> ?
```

A prompt with no example (*zero-shot*) works for simple tasks or ones already well represented in the model's training; adding 2 to 5 well-chosen examples noticeably improves reliability on a specific format or style, without costing the time or data of a fine-tune.

> **Pitfall:** choosing unrepresentative or biased examples (all positive, all written in the same tone, all very short). The model faithfully reproduces the pattern of the examples provided, including their biases, not just their format.
>
> **Best practice:** choose examples that cover the real diversity of expected cases (styles, lengths, edge cases), not just easy or similar-to-each-other cases.

## Step-by-step reasoning (*chain-of-thought*)

An LLM generates its answer token by token, each token building on all those already produced (see [LLMs in Production](/?c=ia&s=nlp-llm&p=llm-en-production)), including those of its own answer as it's being written. Explicitly asking the model to detail its reasoning before concluding ("think step by step before answering") thus concretely gives it more intermediate tokens to build a conclusion on: a gain that's especially clear on multi-step tasks (computation, logic, breaking down a problem):

```text
Without chain-of-thought: "A train leaves at 2:12 PM at 50 mph, another
                           leaves at 2:27 PM at 62 mph on the same
                           track. What time does the second one catch
                           up to the first?"
                           -> risk of giving a result directly, without checking it

With chain-of-thought:    "... Detail your reasoning step by step,
                           then give the final answer on the last line."
                           -> the model lays out intermediate calculations before concluding
```

Also asking for a verification step before concluding ("re-read your answer and check that it satisfies [constraint]") extends the same principle: it gives the model a chance to catch an unmet constraint itself before it reaches the final output, rather than discovering the gap only when re-reading it afterward yourself.

> **Pitfall:** taking the reasoning displayed by the model as a faithful account of what actually produced the answer. Nothing guarantees that the displayed steps exactly match the internal mechanism that led to the conclusion: reasoning that *looks* coherent can accompany a wrong conclusion, or the reverse.
>
> **Best practice:** treat chain-of-thought reasoning as an aid to the answer's reliability (and to a human reviewing it), not as guaranteed proof of its accuracy.

## Structuring the prompt: separating instructions, context, and data

A prompt that mixes instructions, context, and data to process into a single block of text leaves the model to guess where one ends and the other begins. Clearly delimiting each part (tags, triple quotes, headings) reduces this ambiguity, and also makes it harder for data injected into the context to be interpreted as an instruction (see [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection)):

```text
### Instructions
Summarize the text below in 2 sentences, in English.

### Text to summarize
"""
{user_text}
"""
```

Specifying the expected output format (JSON with named keys, a bullet list, a table) in the instructions themselves also avoids having to re-parse a free-form answer.

> **Pitfall:** mixing instructions and external data (user input, content from a file or site fetched automatically...) into a single block of text with no visual separation at all: the model then has no reliable way to distinguish a legitimate instruction from text that, inside the data itself, poses as an instruction (see [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection)).
>
> **Best practice:** always explicitly delimit each part (tags, triple quotes, headings) and state in the instructions that content delimited this way is data to process, never a command to execute.

## Template: a single prompt for a simple task

The skeleton below brings together all the previous techniques into a single reusable template, to adapt task by task: each section corresponds to a technique seen above (role, handling ambiguity, few-shot, verification, format):

```text
## Role
You are [role / expected expertise].
Your mission: [main goal, in one sentence].

## Instructions
1. [precise instruction]
2. [precise instruction]

Constraints: [content to respect]; [what to avoid].
If a necessary piece of information is missing: [ask a question / state the assumption made].

## Context
"""
[information needed to complete the task]
"""

## Data to process
"""
[text / code / file / problem in question]
"""

## Example(s)
Input: [example input]  ->  Expected output: [example output]

## Method
Before concluding, check that the result satisfies the constraints above.

## Output format
[exact expected format: short / detailed / structured / directly usable]
```

Not all of these sections are systematically needed: a simple, already unambiguous question needs neither an example nor a separate "Context" section. The template serves as a checklist, not a form to fill in completely every time.

## Breaking down a complex task rather than one monolithic prompt

A single prompt asking to analyze, compute, and write all at once stacks up the error risk of each sub-task. Splitting into several smaller, chained prompts (*prompt chaining*: the output of one becomes the input of the next) makes it possible to check an intermediate result before continuing, rather than discovering an error only in the final result. This is the same principle, not automated here, that drives the [agent](/?c=ia&s=nlp-llm&p=agents) loop: an agent is nothing more than this chaining, now driven by the model instead of by a developer chaining prompts by hand.

On a project of significant size, this breakdown is structured into successive stages, each limited to a precise objective before moving to the next:

1. **Framing**: objectives, constraints, available resources; ask the model to identify missing information and risks, without producing anything yet.
2. **Design**: breakdown into sub-tasks, dependencies between them, overall architecture; still with no coding.
3. **Implementation plan**: for each sub-task: inputs, expected output, success criteria, tests to run.
4. **Implementation**, one sub-task at a time, restating the relevant context and validated architecture in each prompt, so the model doesn't have to re-derive it at every step.
5. **Independent review**: a separate prompt where the model takes on the role of reviewer rather than author: this separation reduces the risk that it validates its own work uncritically, a bias more pronounced when writing and reviewing are mixed into the same prompt.
6. **Fixes**, targeted only at the issues raised in the previous step.
7. **Tests**, then **finalization**: one last overall review comparing the result against the original requirements.

> **Pitfall:** letting the model rush toward an implementation before framing and design have been validated: a frequent eagerness that produces a technical result before the problem has even been properly framed.
>
> **Best practice:** explicitly ask the model to produce nothing ("don't code yet") during the framing and design stages: this instruction is rarely superfluous.

### Template: a prompt chain for a complex project

Each stage below becomes a separate prompt, whose output (validated before moving on) feeds the next prompt:

```text
[1. Framing]
Objectives: [...]  |  Constraints: [...]  |  Available resources: """[...]"""
-> Don't implement anything: list risks, missing information, questions to settle.

[2. Design]
Validated framing: """[output of step 1]"""
-> Breakdown into sub-tasks, dependencies between them, overall architecture. Still with no coding.

[3. Implementation plan]
Validated design: """[output of step 2]"""
-> For each sub-task: inputs, expected output, files involved, success criteria.

[4. Implementing a sub-task]
Relevant context + validated architecture: """[...]"""  |  Current sub-task: """[...]"""
-> Implement only this sub-task; flag without fixing any issue found elsewhere.

[5. Independent review]
Result to review: """[output of step 4]"""  |  Success criteria: """[...]"""
-> Act as an independent reviewer. Change nothing. Classify the issues found
   (CRITICAL / IMPORTANT / MINOR), conclude with APPROVED or NEEDS FIXES.

[6. Fixes]
Review result: """[output of step 5]"""
-> Fix only the listed issues, without touching anything else.

[7. Tests and finalization]
Final state: """[...]"""  |  Original requirements: """[output of step 1]"""
-> Check that every requirement is met; list what remains, if anything.
```

## Iterating and evaluating rather than judging on a single attempt

An LLM's non-determinism (see [LLMs in Production](/?c=ia&s=nlp-llm&p=llm-en-production)) makes a single attempt unreliable for judging that a prompt "works": one good answer doesn't guarantee it will happen again on a slightly different case. Systematically replaying a candidate prompt against a small set of representative cases (the same *golden set* used to evaluate a system in production, see [LLM Monitoring and Operations](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)) before considering it stable is what sets prompt engineering apart from mere trial-and-error tinkering.

> **Pitfall:** validating a prompt on a single successful attempt, then considering it reliable. The model's non-determinism means the same prompt can produce a different output from one call to the next: a single success proves nothing about overall reliability.
>
> **Best practice:** systematically replay a candidate prompt against several representative cases (a *golden set*) before considering it stable, rather than judging on a single attempt.

## The limits of prompt engineering

None of these techniques adds knowledge or capability the model hasn't already acquired during training: they only make the best use of what already exists (see the fine-tuning vs. prompting distinction in [NLP and LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)). A model that has never seen relevant data on a topic, or that has no knowledge of events after its cutoff date, won't produce a better answer just because the prompt is better written: that's the role of [RAG](/?c=ia&s=nlp-llm&p=rag) (external data) or fine-tuning (new capabilities), not prompt engineering.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | Prompt engineering methodically phrases an LLM's input: explicit role and instructions, spotting an imprecise prompt before committing (via a targeted question or several concrete directions), examples (few-shot), step-by-step reasoning (chain-of-thought), separating instructions/context/data, breaking a complex task into verifiable steps. It adds no capability the model doesn't already have. |
| **Tools you can use** | A reusable prompt template (see the template above); a *golden set* of representative cases to evaluate a prompt before considering it stable. |
| **Pitfalls to avoid** | Not specifying the expected behavior for missing information. Making refinement requests a habit even on an already precise prompt. Offering too many options, or ones too similar to each other. Unrepresentative or biased few-shot examples. Mixing instructions and data without delimiting them. Taking chain-of-thought reasoning as proof of accuracy. Rushing toward implementation before validating framing and design. Validating a prompt on a single successful attempt. |
| **Best practices** | Always specify the expected behavior in case of ambiguity. Reserve refinement for cases of real ambiguity, with a default assumption alongside the question. Faced with stylistic or creative uncertainty, offer 2-3 short, clearly distinct directions rather than an abstract question. Choose few-shot examples representative of the real diversity of cases. Always explicitly delimit instructions, context, and data. Replay a prompt against several cases before considering it reliable. |
