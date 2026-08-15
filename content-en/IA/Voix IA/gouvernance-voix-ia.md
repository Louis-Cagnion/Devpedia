---
order: 34
---

# Governance of an AI voice pipeline

[Data governance for an AI system](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) lays out the general principles (classifying data, tracing who requested what, honoring the right to erasure). This chapter revisits them for a speech synthesis pipeline, where the data at stake, a **voice**, has a special status already flagged in [Cloning a Voice](/?c=ia&s=voix-ia&p=cloner-une-voix): it's biometric data, identifying by nature.

## Voice as biometric data

Unlike a text prompt, a voice directly identifies a person, the same way a fingerprint or a face does: classifying a voice as "personal" data in the most common sense (see the [general chapter](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) underestimates its actual sensitivity.

| | "Classic" personal data (name, email) | Voice |
|---|---|---|
| Can be changed if compromised | Yes (change your email) | No (impossible to "change" your voice) |
| Reusable to impersonate an identity | Limited (a name alone usually isn't enough) | Yes, directly (see the fraud risk already flagged in [Cloning a Voice](/?c=ia&s=voix-ia&p=cloner-une-voix)) |

> **Pitfall:** applying the same classification rules to a voice sample as to "classic" personal data (name, email), without accounting for the fact that a compromised voice can never be "changed" like a password or an email address.
>
> **Best practice:** treat any identifiable voice sample as biometric data in its own right, with a protection level at least equivalent to a fingerprint or a face photo.

## Traceability: which sample produced which cloned voice

A voice-cloning pipeline must be able to answer, after the fact, *"which reference sample was used to produce this audio, with whose consent?"*, the same traceability requirement as for an LLM (see [LLM Monitoring and Operations](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)), with an extra log specific to voice: proof of the consent obtained (see [Cloning a Voice](/?c=ia&s=voix-ia&p=cloner-une-voix)), kept separately from the generated audio itself.

> **Pitfall:** keeping the reference audio and the generated audio, but not the proof of consent obtained at the time of cloning. Without that proof, it becomes impossible to later demonstrate that this cloning was authorized, especially in case of a dispute.
>
> **Best practice:** log proof of consent as a traceability element in its own right, distinct from the audio itself, with the same rigor as a model's version or the prompt sent to an LLM.

## Retention and the right to erasure: several copies of the same voice

The principle already seen (data can be copied in several places, and a single `DELETE` isn't enough, see the [general chapter](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) applies to a voice with an extra variant: a **speaker embedding** (see [Cloning a Voice](/?c=ia&s=voix-ia&p=cloner-une-voix)) is itself a compact, but still identifying, representation of that voice.

| Place the voice may have been copied | Erased by deleting the original audio sample? |
|---|---|
| Reference audio file, stored as-is | Yes |
| Speaker embedding, extracted from that sample | No: the embedding keeps existing and stays usable for cloning, even after the source audio is deleted |
| Audio already generated from that voice | No: each generated audio is an independent copy |

> **Pitfall:** responding to a deletion request by erasing only the reference audio file, leaving the already-extracted speaker embedding and any already-generated audio intact: the voice then remains clonable, or already present in existing content.
>
> **Best practice:** apply the deletion procedure to the source sample, the speaker embedding extracted from it, and the already-generated content that depends on it, the exact same reflex already flagged for a RAG vector embedding in the general chapter.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | A voice is biometric data, never "changeable" once compromised, to be protected like a fingerprint or a face. Traceability of a cloning pipeline must include proof of consent, not just the audio. Deletion must cover the source sample, the speaker embedding extracted from it, and content already generated from it. |
| **Tools you can use** | A consent log kept separate from the generated audio. A deletion procedure that walks through the sample, the embedding, and generated content. |
| **Pitfalls to avoid** | Classifying a voice as "classic" personal data. Not logging proof of consent. Deleting only the source sample without the embedding or already-generated content. |
| **Best practices** | Treat any identifiable voice as biometric data in its own right. Log proof of consent separately. Extend deletion to the embedding and already-generated content. |
