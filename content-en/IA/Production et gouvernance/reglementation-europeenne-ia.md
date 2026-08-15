---
order: 13
---

# EU AI Regulation: the AI Act

The **EU Artificial Intelligence Act** (*AI Act*, Regulation (EU) 2024/1689) is the world's first horizontal legal framework devoted to AI: rather than regulating sector by sector, it imposes obligations based on an AI system's **risk level**, regardless of its field of application. Published in the Official Journal on July 12, 2024, it entered into force on August 1, 2024, but its application is **phased in over several years**, not immediate.

## A risk-level classification

| Risk level | Examples | Obligation |
|---|---|---|
| **Unacceptable** | Social scoring by a state, subliminal manipulation, real-time mass facial recognition in public spaces (with limited exceptions for law enforcement) | Banned outright |
| **High** | Recruitment, credit scoring, critical systems (energy, transport), medical devices, justice | Conformity assessment, technical documentation, human oversight, risk management, traceability |
| **Limited** | Chatbot, deepfake generator | Transparency obligation (inform the user they're interacting with an AI, flag generated content) |
| **Minimal** | Spam filter, video game AI | No specific obligation |

A chatbot (see [Building a Chatbot](/?c=ia&s=applications-llm&p=chatbot)) typically falls into the "limited risk" category: its main obligation is to never let the user believe they're talking to a human without saying so.

> **Pitfall:** underestimating your own system's risk level out of optimism or unfamiliarity with the rules: a chatbot that looks harmless can shift to "high risk" if, for example, it's involved in a recruitment or credit-scoring decision, two cases explicitly listed at that level.
>
> **Best practice:** assess risk level based on the system's actual use (the domain it operates in), not just its underlying technology: two technically identical chatbots can fall under two different risk levels depending on their use.

## The application timeline

Unlike a regulation that would apply all at once, the AI Act comes into force **in stages**, each adding new obligations:

| Date | What becomes applicable |
|---|---|
| **August 1, 2024** | Entry into force of the regulation (the text legally exists, but most obligations aren't yet enforceable) |
| **February 2, 2025** | Ban on unacceptable-risk practices; AI literacy obligation (training staff who design or use AI systems) |
| **August 2, 2025** | Obligations for general-purpose AI models (GPAI, see below); national supervisory authorities and the European AI Office set up; penalty regime applicable |
| **August 2, 2026** | Application of most of the regulation: obligations for high-risk systems (Annex III), transparency obligations for limited risk (chatbots, deepfakes) |
| **August 2, 2027** | Extra grace period for high-risk systems that are safety components of products already regulated (medical devices, machinery, toys...) |

> **A concrete tension, still open at present:** obligations for high-risk systems have been legally enforceable since August 2026, but the **harmonized technical standards** meant to specify exactly how to comply with them (drafted by the CEN-CENELEC standardization bodies, JTC 21 working group) are still being finalized. A company can therefore find itself having to meet a legal obligation before the official technical instructions for doing so fully exist, a situation to watch, not a mere administrative detail.

> **Pitfall:** assuming no obligation applies until the 2026 deadline is reached. The bans on unacceptable-risk practices and the obligations for GPAI models have, in fact, already been in force since 2025.
>
> **Best practice:** check the application date specific to **each** category of obligation involved (bans, GPAI, high risk, limited risk), rather than remembering a single date for the whole regulation.

## General-purpose AI models (GPAI)

A large language model (see [NLP and LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)) isn't designed for a single use: it serves as the basis for a wide variety of uses. The AI Act creates specific obligations for this category ("*General-Purpose AI*", GPAI), applicable since August 2, 2025:

- Technical documentation on the model's training and capabilities, kept available to authorities.
- Compliance with copyright law on training data (a compliance policy must exist).
- Transparency about the content used for training (a sufficiently detailed summary, without requiring full disclosure of the data).

Models deemed to pose a **systemic risk** (beyond a training-compute power threshold) carry reinforced obligations: adversarial evaluation (*red teaming*), serious incident reporting, stronger cybersecurity. A voluntary **Code of Practice** for GPAI providers was published in 2025 to help anticipate these obligations before regulatory oversight ramps up.

> **Pitfall:** confusing the obligations of a GPAI model's **provider** (technical documentation, copyright compliance...) with those of a company that merely **uses** that already-existing model (via an API, for instance): GPAI obligations fall on whoever builds and distributes the model, not on whoever uses it to build a product on top of it.
>
> **Best practice:** clearly identify your own role (model provider, or mere user of a third-party model) before determining which AI Act obligations actually apply to your case.

## Human oversight: an obligation, not an option

For a high-risk system, the AI Act requires effective human oversight, directly echoing a principle already seen for [agents](/?c=ia&s=nlp-llm&p=agents): an autonomous system should never be able to decide alone on an action with real consequences without a human able to intervene or stop it. What good engineering sense already recommended becomes, for high-risk cases, a documented legal obligation.

## What this changes relative to the GDPR

The AI Act does **not** replace the GDPR: it adds to it. [Data governance](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) (classification, traceability, access control) remains necessary independently of the AI Act: the GDPR governs the personal data itself, the AI Act governs the **AI system** that processes it: the two sets of obligations stack rather than substitute for one another.

## Penalties

Fines are tiered by the severity of the infringement, up to €35 million or 7% of annual global turnover for a banned practice (whichever is higher), a level deliberately comparable to the GDPR's.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | The AI Act classifies AI systems by risk level (unacceptable, high, limited, minimal), with increasing obligations, phased in between 2024 and 2027. It adds to the GDPR rather than replacing it, and requires effective human oversight for any high-risk system. |
| **Tools you can use** | The voluntary Code of Practice for GPAI providers, published in 2025, to anticipate obligations ahead of increasing regulatory oversight. |
| **Pitfalls to avoid** | Underestimating your system's risk level based on anything other than its actual use. Assuming no obligation applies before 2026 when some are already in force. Confusing a GPAI provider's obligations with those of a mere user. |
| **Best practices** | Assess risk level based on the system's actual use, not just its underlying technology. Check the application date specific to each category of obligation. Clearly identify your role (provider or user) before determining the applicable obligations. |
