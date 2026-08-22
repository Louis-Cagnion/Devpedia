---
order: 6
---

# Beyond the GPU: TPU, NPU, LPU, and VPU

The [CPU vs. GPU](/?c=infrastructure-devops&s=infrastructure&p=cpu-vs-gpu) chapter contrasts two families of chips: the CPU, general-purpose, and the GPU, built to repeat the same simple operation on thousands of pieces of data in parallel. But the GPU itself remains fairly versatile: the same chip can display a video game, simulate weather, or train a [neural network](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones). When a single, very specific task repeats at massive scale (a data center running the same type of computation billions of times, or a product sold in the millions), it becomes worthwhile to design a chip that can only do **that** task, but does it faster and with less energy than a general-purpose GPU.

```text
General-purpose                                                Ultra-specialized
   CPU        ─────────►        GPU        ─────────►   TPU / NPU / LPU / VPU
(do anything,        (parallelize any                (a single family of task,
 sequential)           operation)                       at very large scale)
```

TPU, NPU, LPU, and VPU are four chips born of this same principle, each specialized on a different task.

## TPU (Tensor Processing Unit): AI's matrix math, even more targeted than the GPU

A **TPU** (*Tensor Processing Unit*) is a chip designed by [Google](https://cloud.google.com/tpu) specifically for a single type of computation: the matrix operations (multiplications and additions of large grids of numbers) that make up nearly all of the training and use of a neural network. A GPU can do this computation, but remains designed for much more; a TPU can only do this, which lets it go faster and consume less energy on this precise task, at the cost of being useless for anything else (it's impossible to display a video game on a TPU).

> **Analogy:** if the GPU is an assembly line able to repeat any simple motion, the TPU is a machine tool built for a single motion, and only that one: multiplying two grids of numbers together. It can do nothing else, but it does that one thing better than the general-purpose assembly line.

Google uses its TPUs in its own data centers, notably to run Search or Google Translate at the scale of billions of requests.

## NPU (Neural Processing Unit): AI on-device, on battery

An **NPU** (*Neural Processing Unit*) is a chip found today in most recent smartphones and laptops, dedicated to running an already-trained AI model (**inference**, not training) directly on the device, with very little energy. That's what lets a phone blur a photo's background in real time or recognize a voice keyword ("Hey Siri," "OK Google") without sending any data to [a remote server](/?c=infrastructure-devops&s=infrastructure&p=le-cloud): the computation stays local, which is both faster (no network round trip) and more privacy-friendly (nothing leaves the device).

| | GPU (data center) | NPU (personal device) |
|---|---|---|
| Where the computation happens | On a remote server | Directly on the phone/laptop |
| Main constraint | Raw computing power | Energy consumption (battery) |
| Typical task | Training a model | Running an already-trained model |

## LPU (Language Processing Unit): generating text, token by token, with no detour

An **LPU** (*Language Processing Unit*) is a chip designed by the company [Groq](https://groq.com/blog/the-groq-lpu-explained) solely for inference on large language models (the [LLMs](/?c=ia&s=nlp-llm&p=nlp-et-llm)): producing the response text one word (more precisely one [token](/?c=ia&s=nlp-llm&p=nlp-et-llm)) at a time. A classic GPU must repeatedly fetch the model's weights from external memory that's fairly slow, for every token generated, which limits its speed (the "memory wall"). The LPU works around this problem by keeping the entire model in memory built directly into the chip, much faster, and by executing computations in an order fixed in advance rather than decided dynamically: this predictable execution allows particularly fast and steady text generation.

## VPU (Vision Processing Unit): continuous computer vision, on battery

A **VPU** (*Vision Processing Unit*) is a chip specialized in analyzing image and video in real time, at minimal energy cost. A chip like [Intel's Movidius Myriad X](https://www.intel.com/content/www/us/en/developer/topic-technology/edge-5g/hardware/vision-accelerator-movidius-vpu.html) consumes about 1.5 watts (versus several hundred watts for a data center GPU) while continuously analyzing a video stream: this type of chip is what equips drones, surveillance cameras, or augmented reality headsets, where video must be analyzed at all times without ever draining a battery.

## Comparing the five chips

| Chip | Specialty | Typical context of use | Concrete example |
|---|---|---|---|
| **CPU** | General-purpose, sequential | Any computer | Running an operating system |
| **GPU** | Parallel, general-purpose | Data center, workstation | Training a neural network, 3D rendering |
| **TPU** | AI matrix computation only | Data center (Google) | Running Google Translate at large scale |
| **NPU** | On-device AI inference, low energy | Smartphone, laptop | Real-time portrait blur, local voice assistant |
| **LPU** | Deterministic LLM inference, low latency | Dedicated inference server (Groq) | Very fast token-by-token text generation |
| **VPU** | Computer vision, ultra-low energy | Drone, camera, on-device AR/VR headset | Continuous object detection on battery |

> **Pitfall:** believing that a more specialized chip is "better" in absolute terms. It's faster and more energy-efficient **only** on the precise task it was designed for, and strictly unusable outside of it (unlike the CPU, general-purpose, or even the GPU, which stays fairly versatile).
>
> **Best practice:** reserve an ultra-specialized chip (TPU, NPU, LPU, VPU) for a volume of repetitive computation large enough to justify its design cost (the scale of a data center, or a product sold in the millions); for everything else, a general-purpose CPU or GPU remains the right choice.

## 📋 Summary

| | |
|---|---|
| **To remember** | TPU, NPU, LPU, and VPU all apply the same principle as CPU vs. GPU, pushing specialization even further: a chip that can only do one task (respectively AI matrix computation, on-device AI inference, LLM inference, computer vision) goes faster and consumes less than a general-purpose chip on that precise task. |
| **Usable tools** | TPUs available via [Google Cloud](https://cloud.google.com/tpu); NPUs already built into most recent smartphones/laptops; LPUs accessible via [Groq](https://groq.com/blog/the-groq-lpu-explained)'s API; VPUs found in embedded modules like the Movidius. |
| **Pitfalls to avoid** | Believing that a specialized chip is universally better than a general-purpose chip. |
| **Best practices** | Reserve each ultra-specialized chip for the scale that justifies its design cost; keep CPU/GPU for everything else. |
