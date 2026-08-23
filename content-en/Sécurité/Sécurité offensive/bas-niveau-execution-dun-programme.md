---
order: 1
---

# How a Program Actually Executes

Writing a function, calling another function, declaring a variable: these are familiar gestures in any language. This chapter looks at what actually happens, once the code is compiled, inside the processor and the computer's memory. It's the essential foundation for understanding how a low-level security flaw (covered in the following chapters) becomes exploitable.

## The Processor Only Works With Registers

A **register** is a small storage space built directly into the processor, much faster to access than RAM. An x86-64 processor (the most common architecture on PCs) exposes several of them, each with a usual role:

| Register | Usual role |
|---|---|
| `rip` | Address of the **next instruction** to execute (*instruction pointer*) |
| `rsp` | Address of the **top of the stack** (*stack pointer*), detailed below |
| `rbp` | **Reference address of the current function** (*base pointer*), used to find its local variables |
| `rax`, `rbx`, `rcx`, ... | General-purpose registers: computation, temporary values, a function's return value (`rax`) |

A compiled program is, at its core, just a long sequence of very simple instructions ("copy this value into this register", "add these two registers", "jump to this address if this condition is true") that `rip` walks through one by one.

## The Stack: Where Function Calls Live

The **stack** is a memory area that stores, for each function currently running, everything it needs: its local variables, and the address to return to once it finishes. Each function call pushes a new block, called a **frame**, onto the top of the stack; each function return pops it off.

```text
callerA() calls callerB() which calls callerC():

Top of the stack (rsp)  -->  [ Frame of C: C's local variables, return address to B ]
                              [ Frame of B: B's local variables, return address to A ]
                              [ Frame of A: A's local variables, return address to main ]
Bottom of the stack           [ ... ]
```

The **return address**, automatically saved on each call, is what lets the program know where to resume once the function finishes: it's precisely this value that memory corruption (next chapter) can try to overwrite.

## The Heap: Memory Allocated on Demand

Unlike the stack, which fills and empties automatically at the pace of function calls, the **heap** is a memory area that the program reserves and frees explicitly, when it needs to (e.g. `malloc`/`free` in C), for data whose lifetime doesn't match any specific function call (e.g. the contents of a file loaded into memory, used well after the function that read it).

| | Stack | Heap |
|---|---|---|
| Management | Automatic, tied to function calls | Manual or semi-automatic (explicit allocation/freeing) |
| Speed | Very fast (just moving `rsp`) | Slower (the system has to find a free spot) |
| Data lifetime | As long as the function that created it | Until explicitly freed, independent of the function |
| Typical error | Writing past the reserved space (see memory corruption) | Using data that's already been freed (*use-after-free*) |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | A compiled program is just a sequence of instructions that `rip` walks through, manipulating registers. The stack automatically stores the local variables and return address of each function call; the heap stores data that's explicitly allocated and freed, with a lifetime independent of any specific function call. |
| **Tools you can use** | A debugger (covered in the reverse engineering chapter) to observe registers and the stack live during execution. |
| **Pitfalls to avoid** | Confusing the stack (fast, automatic, limited size) with the heap (flexible, manual management): the wrong choice, or a mistake in managing either, opens the door to the flaws covered in the next chapter. |
| **Best practices** | Keep in mind that the return address saved on the stack is just another piece of data in memory: if a program can be made to overwrite it, it can be hijacked. |
