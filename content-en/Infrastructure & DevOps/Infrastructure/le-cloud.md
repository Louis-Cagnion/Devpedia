---
order: 5
---

# What Is the Cloud?

Running a program or storing data requires a physical machine somewhere. The **cloud** refers to using remote machines, owned and managed by a third-party provider ([Amazon AWS](https://aws.amazon.com), [Google Cloud](https://cloud.google.com), [Microsoft Azure](https://azure.microsoft.com)...), rather than hardware bought and managed by the company itself.

> **Analogy:** renting a furnished apartment rather than buying and maintaining your own house: you pay for use, without owning or having to maintain what's behind it.

## Why rent rather than own your own server

| | Owned server (*on-premise*) | Cloud |
|---|---|---|
| Initial investment | High (buy the hardware upfront) | Low (pay for actual use) |
| Adjusting capacity | Limited by hardware already bought | Within a few clicks or minutes |
| Hardware maintenance | The company's responsibility | The cloud provider's responsibility |
| Cost for steady, predictable long-term use | Can end up cheaper overall | Can end up more expensive overall |

## The main categories of cloud services

| Category | Managed by the provider | Managed by the user | Example |
|---|---|---|---|
| **IaaS** (*Infrastructure as a Service*) | Physical hardware, network | Operating system, applications | A rented virtual machine |
| **PaaS** (*Platform as a Service*) | + operating system, runtime environment | Just the application code | A service that directly runs provided code |
| **SaaS** (*Software as a Service*) | Everything, including the application | Nothing, just the use | An online mailbox, browser-accessible software |

The higher a category sits in this table, the more control (and responsibility) the user keeps over what runs; the lower it is, the more the provider manages everything, at the cost of less control.

## The cloud and AI: renting compute power on demand

Training a deep learning model requires one or more powerful [GPUs](/?c=infrastructure&p=cpu-vs-gpu): hardware that's expensive to buy, and rarely used at full capacity continuously once training is done. The cloud makes it possible to rent this compute power only for the actual duration of training, rather than investing in dedicated hardware that would then sit largely unused.

## Pitfall: where is my data actually stored?

> **Pitfall:** assuming that data sent "to the cloud" stays under the same control and the same legal rules as if it remained on the company's own premises. It's actually stored on hardware owned by a third party, sometimes located in a different country, with its own data protection rules.
>
> **Best practice:** check the contractual terms and the geographic location of the data before sending sensitive data to a cloud service (see [classifying data before sending it](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)), rather than assuming it's neutral by default.

## Pitfall: cost can slip past the usual controls

> **Pitfall:** forgetting to turn off a rented cloud resource after use (a virtual machine, a reserved GPU). Billing continues as long as the resource runs, even unused: no "error" alert triggers since, technically, everything is working as expected.
>
> **Best practice:** set up cost alerts, or even automatic shutdown of unused resources, rather than relying on regular manual checks.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | The cloud means renting remote machines managed by a third-party provider, rather than owning your own hardware. IaaS, PaaS, and SaaS differ in what the provider manages on the user's behalf. |
| **Tools you can use** | The main providers (AWS, Google Cloud, Azure) offer cost dashboards and configurable alerts. |
| **Pitfalls to avoid** | Assuming data sent to the cloud stays subject to the same rules as internally. Leaving a rented resource running needlessly after use. |
| **Best practices** | Check the location and contractual terms before sending sensitive data. Set up cost alerts or automatic shutdown of unused resources. |
