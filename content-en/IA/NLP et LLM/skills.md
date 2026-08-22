---
order: 9
---

# Skills: packaging a reusable capability for an agent

The chapter on [agents](/?c=ia&s=nlp-llm&p=agents) showed how to give a model tools it can call. Those tools stay one-off actions, though (calling an API, reading a file): they say nothing about *how* to carry out a complex, recurring task (debugging methodically, running a code review, framing a project before coding). A **skill** answers that need: a reusable package of instructions, and optionally scripts or associated documents, that the agent loads on demand rather than being re-explained every time.

## The problem: repeating the same instructions in every conversation

Without a skill, getting an agent to follow a precise method (a test-driven development cycle, say, see the [TDD](/?c=tests&p=tdd) chapter) requires re-explaining that method in every new conversation, or pasting it into a long system prompt. A skill packaged once and for all avoids this repetition, and stays available from one session to the next without needing to be resent.

## The structure: a folder, a SKILL.md file

The most widespread convention (standardized by Anthropic under the name **Agent Skills**, and implemented by several agents) organizes a skill as a folder containing a required `SKILL.md` file, plus optional associated resources:

```text
my-skill/
├── SKILL.md          <- required: metadata + instructions
├── scripts/            <- optional: executable code
├── references/          <- optional: detailed documentation
└── assets/               <- optional: templates, reference files
```

`SKILL.md` itself combines a structured header with natural-language instructions:

```markdown
---
name: security-review
description: Methodical security review of a code change, to
  use before merging a pull request touching authentication or
  sensitive data.
---

# Security review

1. Identify every user-data entry point changed by this diff.
2. For each one, check: validation, escaping, authorization.
3. ...
```

## Progressive loading: not loading everything at once

An agent with access to dozens of skills can't afford to read every single one in full on every turn, or it would fill its [context window](/?c=ia&s=nlp-llm&p=llm-en-production) for nothing. The mechanism used, **progressive disclosure**, only loads each level if the previous one justifies it:

```text
Level 1: the name and description of every available skill
         (a few lines each) -> always present

Level 2: if a task matches a skill's description, load the
         full body of its SKILL.md

Level 3: if the skill's instructions call for it, load a
         reference file or run an associated script
```

This mechanism explains why a skill's **description** matters as much as its content: it's the only thing the agent sees before deciding whether the skill applies to the current task.

> **Pitfall:** writing a vague or overly general description ("help with code"). A description that doesn't precisely state which situation the skill answers doesn't let the agent know when to load it, nor the skill's author verify it doesn't trigger on unintended cases.
>
> **Best practice:** write the description as an answer to "in what precise situation should this skill trigger?", with concrete keywords rather than general phrasing.

## Where to find existing skills

Rather than writing every skill from scratch, public collections already exist. [skills.sh](https://skills.sh), a directory of skills ranked by usage popularity, references thousands of them. The [mattpocock/skills](https://github.com/mattpocock/skills) repository is a concrete, widely used example: a collection built for real software engineering rather than shallow prototyping, with skills like `tdd` (an automated red/green/refactor cycle), `diagnosing-bugs` (a disciplined debugging method), or `grill-me` (a thorough interview to clarify a plan before executing it).

> **Pitfall:** installing a third-party skill without reading its content, especially if it bundles executable scripts (a `scripts/` folder). A malicious or poorly written skill can make the agent run arbitrary code, exactly like any other code downloaded from an unverified source.
>
> **Best practice:** read a skill's content (instructions and any bundled scripts) before installing it, especially if it comes from a source outside your own control, applying the same level of caution as running any third-party code.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | A skill packaged once and for all (a folder + `SKILL.md`, optionally scripts/references/assets) avoids re-explaining a recurring method in every conversation. Progressive disclosure only loads a skill's full content when its description matches the current task, keeping the context cost low even with many skills available. |
| **Usable tools** | The `SKILL.md` format (`name`/`description` header + instructions). skills.sh to discover existing skills; mattpocock/skills as a concrete collection geared toward real engineering. |
| **Pitfalls to avoid** | A skill description too vague for the agent to know when to trigger it. Installing a third-party skill, especially with executable scripts, without reading its content. |
| **Best practices** | Write the description as a precise answer to "when should this skill trigger?" Read a skill before installing it, as with any third-party code. |
