---
order: 33
---

# Choosing a provider and going to production

The trade-off between a self-hosted model and a cloud API (cost, data exposure, latency) is already detailed in [Local vs. cloud trade-off for a vision model](/?c=traitement-de-documents&p=arbitrage-local-cloud-vision); this chapter applies it to speech synthesis, where two criteria carry particular weight: real-time latency and a sometimes overlooked constraint, available infrastructure.

## Three families of solutions

| | Web Speech API (browser) | Self-hosted (e.g. [Piper](https://github.com/OHF-Voice/piper1-gpl)) | Cloud API (e.g. [ElevenLabs](https://elevenlabs.io)) |
|---|---|---|
| Usage cost | None (delegates to voices already installed on the user's device) | Cost of the server running the model, independent of volume | Billed per character or per minute generated |
| Voice quality | Variable depending on the user's system, outside the developer's control | Controlled, depends on the chosen model | Generally the highest, including voice cloning |
| Infrastructure required | None (computation happens in the user's browser) | A server (with or without a GPU depending on the model) | None on the developer's side |
| Works offline | Yes, once system voices are installed | Yes | No, requires a network connection |

## A concrete case: the choice made for Devpedia itself

[Devpedia's automatic audio playback](/?c=ia&p=synthese-classique-vs-deep-learning) concretely illustrates this choice. Devpedia is a **100% static** site (hosted on GitHub Pages, with no server or build step): hosting a model like Piper would have required an inference server, incompatible with this hosting; a cloud API would have introduced a per-use cost, for a freely browsed site with no business model. The **Web Speech API** was chosen precisely because it needs neither a server nor a usage cost: the computation happens entirely in each visitor's browser.

> **Pitfall:** choosing self-hosting or a cloud API "by default", because voice quality is higher there, without first checking whether the project's infrastructure can actually host an inference server, or whether the project's business model supports a recurring per-use cost.
>
> **Best practice:** start from the project's actual constraints (available infrastructure, business model) before comparing options on voice quality alone, the exact same approach as choosing between local and cloud for a vision model.

## Real-time latency, a criterion of its own

For interactive use (a voice assistant, live translation), the [delay before the first audible sound](/?c=ia&p=evaluer-synthese-vocale) outweighs perceived quality:

| | Web Speech API | Self-hosted | Cloud API |
|---|---|---|---|
| Delay before the first sound | Very low (local computation, no network round trip) | Low if the server is geographically close to the user | Variable, depends on the network and the provider's load |

> **Pitfall:** ignoring a cloud API's network latency for real-time use, based only on tests run from a fast connection close to the provider's server.
>
> **Best practice:** measure actual latency under network conditions representative of the target users, not only from the development environment.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | Three families of solutions exist: the Web Speech API (no cost or infrastructure, quality outside the developer's control), self-hosting (controlled quality, fixed infrastructure cost), the cloud API (highest quality, variable usage cost, requires a network connection). The choice should start from the project's actual constraints (infrastructure, business model), not voice quality alone. |
| **Tools you can use** | The Web Speech API for a static site with no usage cost. Piper for lightweight self-hosting. ElevenLabs for a high-quality cloud API, including voice cloning. |
| **Pitfalls to avoid** | Choosing a default option without checking actual infrastructure and business-model constraints. Measuring a cloud API's latency only under favorable network conditions. |
| **Best practices** | Start from the project's actual constraints before comparing options. Measure latency under network conditions representative of the target users. |
