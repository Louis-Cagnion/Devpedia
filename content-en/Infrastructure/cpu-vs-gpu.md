---
order: 3
---

# CPU vs. GPU: Parallel Computing

A computer runs its computations on one or more **processors**, but two families of processors exist, designed for two very different types of tasks: the **CPU** (*Central Processing Unit*), present in every computer, and the **GPU** (*Graphics Processing Unit*), originally designed for graphics display.

## The CPU: a few fast, versatile workers

A CPU has few **cores** (typically 4 to a few dozen): each able to execute complex instructions very quickly, including branching (if this condition, do this, otherwise do that).

> **Analogy:** a small team of a few highly skilled workers, each able to handle a complex task alone from start to finish, adapting to whatever comes up.

## The GPU: thousands of simple workers, all at once

A GPU, by contrast, has **thousands** of cores, each simpler and less versatile than a CPU core, but all able to execute the **same** operation simultaneously, each on a different piece of data.

> **Analogy:** an assembly line with thousands of workers, each repeating the same simple motion on a different part, all at the same time: much faster for this kind of repetitive task, but each worker, on their own, only knows how to do one motion.

## Why vector computation especially benefits from the GPU

The [dot product](/?c=mathematiques&p=vecteurs-et-produit-scalaire) between two vectors (and more generally, any matrix computation) repeats the same simple operation (multiply two numbers, add) thousands or millions of times, on data independent of one another:

```text
Multiplying two vectors of 1000 numbers, term by term:

CPU (a few cores)    : processes the 1000 multiplications in several successive waves
GPU (thousands of cores) : can process almost all 1000 multiplications in a single pass
```

This is exactly the type of computation (repetitive, identical, on independent data) that makes up nearly all the operations performed by a [neural network](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones): hence the systematic use of a GPU for training a deep learning model.

| | CPU | GPU |
|---|---|---|
| Number of cores | A few (4 to a few dozen) | Thousands |
| Power per core | High, versatile | Low, specialized |
| Suited to | Sequential tasks, complex logic, branching | Repetitive, identical tasks, on independent data |
| Example use | Running an operating system, a browser | Training a neural network, 3D graphics rendering |

## Pitfall: moving data between CPU and GPU has a cost

The CPU and GPU each have their own memory: having the GPU compute on a piece of data requires first **transferring** it from the CPU's memory, then retrieving the result the other way around. This transfer takes time, regardless of how fast the computation itself is.

> **Pitfall:** transferring data between CPU and GPU on every small operation. The fixed cost of each transfer can exceed the parallelism gained, if the data moved is too small or the transfer repeats too often.
>
> **Best practice:** batch the data to process into as few transfers as possible (one large transfer rather than thousands of small ones), and reserve the GPU for computations large enough to make that transfer cost worthwhile.

## Pitfall: a GPU doesn't speed up just any computation

> **Pitfall:** expecting a GPU to speed up any program. A process where each step depends on the result of the previous one (impossible to spread across independent cores), or one that relies on many conditional branches that differ depending on the data, doesn't benefit from thousands of simple cores designed to repeat the same operation.
>
> **Best practice:** reserve the GPU for computations that are genuinely parallelizable (the same simple operation, repeated over a large number of independent pieces of data) and leave the rest to the CPU.

## Key takeaways

| | |
|---|---|
| **Key takeaways** | A CPU has few, fast, versatile cores, suited to sequential tasks and branching. A GPU has thousands of simple cores, suited to repeating the same operation on independent data: the case for the vector/matrix computation behind a neural network. |
| **Tools you can use** | Deep learning libraries ([PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch), [TensorFlow](https://www.tensorflow.org)) handle transferring data to the GPU and parallelizing computation automatically. |
| **Pitfalls to avoid** | Transferring data between CPU and GPU too often or in too small amounts. Expecting a speedup from a GPU on an inherently sequential computation. |
| **Best practices** | Batch CPU/GPU transfers into as few large operations as possible. Reserve the GPU for computations that are genuinely parallelizable. |
