---
order: 8
---

# The ARM Architecture

The previous chapters in this category relied on x86-64, the most common architecture on PCs. **ARM** is a different architecture, now ubiquitous elsewhere: nearly all smartphones, Apple Silicon chips (M1 and later) on Mac, a large share of connected devices. Understanding its differences becomes necessary as soon as a target isn't a typical PC anymore.

## RISC vs CISC

| | x86 (CISC) | ARM (RISC) |
|---|---|---|
| Philosophy | *Complex Instruction Set Computer*: rich instructions, sometimes doing several operations at once | *Reduced Instruction Set Computer*: deliberately simple, uniform instructions |
| Consequence | A program can fit in fewer instructions, each more complex for the processor to decode | A program needs more instructions, but each one runs faster and more predictably |

This difference in philosophy largely explains why ARM dominates on battery power (mobile, embedded): simpler instructions consume less energy per instruction executed.

## Renamed Registers, Same Roles

The registers seen in [How a Program Actually Executes](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme) also exist on ARM, under different names:

| Role | x86-64 | ARM (64-bit) |
|---|---|---|
| Next instruction | `rip` | `pc` |
| Top of the stack | `rsp` | `sp` |
| Return address | Saved on the stack by `call` | Saved directly in a dedicated register, `lr` (*link register*), before being copied onto the stack if needed |
| General-purpose registers | `rax`, `rbx`, `rcx`... | `x0` through `x30` |

The most notable difference for exploitation: on x86, the return address goes straight onto the stack at the moment of the call (`call`), so it's directly exposed to a neighboring [buffer overflow](/?c=securite&s=securite-offensive&p=corruption-memoire). On ARM, it first passes through `lr`, a register separate from the stack: a simple buffer overflow therefore doesn't automatically reach it, which changes how you build an exploit, without making the underlying principle any different.

## Why It Matters More and More

A binary compiled for x86 doesn't run as-is on ARM (and vice versa): each architecture has its own instruction set, and therefore its own assembly to read during [reverse engineering](/?c=securite&s=securite-offensive&p=bases-retro-ingenierie). With ARM's growing footprint (mobile, Apple Silicon, low-cost cloud), a real target today has a significant chance of not being x86 at all.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | ARM (RISC, simple and uniform instructions) differs from x86 (CISC, rich instructions) and dominates on battery power. Registers are renamed (`pc`/`sp`/`lr`/`x0`-`x30` versus `rip`/`rsp`/`rax`...) and the return address passes through a dedicated register (`lr`) instead of going straight onto the stack. |
| **Tools you can use** | Ghidra and `gdb` (reverse engineering chapter) both support ARM, with the same workflow as on x86. |
| **Pitfalls to avoid** | Assuming an x86 exploitation technique works as-is on ARM without accounting for `lr`. |
| **Best practices** | Identify the target architecture before any analysis (`file` on a Linux binary shows it directly), to pick the right assembly reference from the start. |
