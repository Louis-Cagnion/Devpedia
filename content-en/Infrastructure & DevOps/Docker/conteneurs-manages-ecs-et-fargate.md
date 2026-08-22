---
order: 7
---

# Managed containers in the cloud: ECS and Fargate

[Docker](/?c=infrastructure-devops&s=docker&p=docker) lets you package an application into a [container](/?c=infrastructure-devops&s=docker&p=concepts-de-base) and run it anywhere. But running that container in production, for real, raises a question Docker alone doesn't answer: on which machine, for how long, and who restarts the container if it crashes at 3 a.m.? A **managed container service** answers this question by handing off all or part of that management to a [cloud](/?c=infrastructure-devops&s=infrastructure&p=le-cloud) provider.

## The problem: Docker doesn't manage production for you

Running Docker containers in production yourself means continuously managing:

| Responsibility | Detail |
|---|---|
| The underlying servers | Provisioning them, updating them, replacing a failed machine |
| Container placement | Deciding which container runs on which machine, based on load |
| Resilience | Automatically restarting a container that crashes or stops responding |
| Scaling | Adding containers (or machines) if traffic increases |

A service like **Amazon ECS** (*Elastic Container Service*) takes care of these four points: you give it a container image (the result of a [Dockerfile](/?c=infrastructure-devops&s=docker&p=dockerfile)), and it runs it, monitors it, and restarts it if needed.

## Two ways to run ECS: with or without managing servers yourself

The chapter on [the cloud](/?c=infrastructure-devops&s=infrastructure&p=le-cloud) distinguishes IaaS (the provider manages only the hardware, you manage the rest) from PaaS (the provider also manages the runtime environment). ECS offers exactly this choice, in the form of two "launch types":

| | ECS on EC2 | ECS on [Fargate](https://aws.amazon.com/fargate/) |
|---|---|---|
| Who manages the underlying servers? | You (choosing the machine type, updates) | Amazon, entirely |
| What you provide | The container image + the machines to run it on | Only the container image |
| Billing | Per rented machine, used or not | Per container actually used (CPU/memory, by the second) |
| Closest to | IaaS | PaaS |

> **Analogy:** ECS on EC2 is like renting an empty commercial space and installing the shelving yourself; Fargate is like renting a stand that's already equipped, ready to receive merchandise, without ever having to deal with the space itself.

Other providers offer services equivalent to Fargate (Google Cloud Run, Azure Container Apps): the principle — provide a container, never manage the underlying machine — stays the same from one provider to another.

> **Pitfall:** believing that a managed service exempts you from any thought about sizing. You still need to specify how much memory and computing power to allocate to each container, and how many copies to run in parallel: poor sizing is still possible, only the physical management of machines disappears.
>
> **Best practice:** start with Fargate by default (no machine to manage, billing closest to actual usage) and only switch to ECS on EC2 if a specific need requires it (access to specific hardware, fine-grained cost optimization for constant, predictable usage).

## 📋 Summary

| | |
|---|---|
| **To remember** | ECS runs Docker containers in production in the developer's place (placement, restarting, scaling). Fargate goes further by removing even the management of the underlying machines. |
| **Usable tools** | [Amazon ECS](https://aws.amazon.com/ecs/) and [Fargate](https://aws.amazon.com/fargate/); equivalents from other providers (Google Cloud Run, Azure Container Apps). |
| **Pitfalls to avoid** | Believing that a managed service exempts you from properly sizing each container. |
| **Best practices** | Start with a fully managed service (Fargate-style) and only manage machines yourself if a specific need justifies it. |
