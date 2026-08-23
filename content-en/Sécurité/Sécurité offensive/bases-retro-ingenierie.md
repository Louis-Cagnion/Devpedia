---
order: 3
---

# The Basics of Reverse Engineering

**Reverse engineering** consists of understanding how a program works without having its source code, starting from the compiled binary alone. It's an almost systematic step in offensive security: an attacker never receives the source code of their target, only the program it runs.

## Two Complementary Tools: Disassembler and Debugger

| Tool | What it does | Example |
|---|---|---|
| **Disassembler** | Translates the binary (a sequence of bytes) into readable assembly instructions, without ever running the program | Ghidra, `objdump` |
| **Debugger** | Actually runs the program, letting you pause it at any moment to inspect registers, the stack, and memory (see [How a Program Actually Executes](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme)) | `gdb` |

```text
Disassembler:  Binary --> read-only --> "here are the instructions it contains"

Debugger:      Binary --> execution --> pause at a chosen point --> "here is the REAL state
                                                                       of memory at this instant"
```

The two complement each other: the disassembler gives a quick overview without running anything (useful against a potentially dangerous binary), the debugger confirms what actually happens at runtime, including behavior that a plain reading of the disassembly wouldn't reveal (e.g. a dynamically computed value).

## Reading a Minimum of x86 Assembly

**Assembly** is the human-readable representation of the instructions a processor executes directly. A handful of x86 instructions are enough to follow a program's general logic:

| Instruction | Effect |
|---|---|
| `mov dest, src` | Copies `src` into `dest` (e.g. `mov rax, rbx` copies `rbx` into `rax`) |
| `push`/`pop` | Pushes/pops a value onto/off the stack |
| `call`/`ret` | Calls a function (pushes the return address) / returns to the caller (pops that address) |
| `cmp` | Compares two values (result used by the next instruction) |
| `jmp`/`je`/`jne` | Jumps to another instruction, unconditionally (`jmp`) or based on the result of the preceding `cmp` (`je`: if equal, `jne`: if not equal) |

```text
Pseudocode:          Equivalent assembly (simplified):

if (a == b) {         cmp  rax, rbx      ; compare a (in rax) and b (in rbx)
    doX();             jne  else_        ; if not equal, jump to "else_"
} else {               call doX
    doY();              jmp  end
}                      else_:
                        call doY
                       end:
```

## Black Box or White Box

| Approach | What you have access to |
|---|---|
| **White-box** | The source code is available: you read the business logic directly |
| **Black-box** | Only the binary (or the exposed service) is accessible: you have to infer the behavior by observing it, via a disassembler/debugger or through its inputs/outputs |

> **Best practice:** always start with the disassembler for a quick, risk-free overview, before moving to the debugger to confirm a specific detail at actual runtime: stepping through an entire program in a debugger with no plan takes a disproportionate amount of time.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | Reverse engineering means understanding a program without its source code. A disassembler translates the binary into readable assembly without running it; a debugger runs it and lets you inspect its actual state at any moment. A handful of x86 instructions (`mov`, `push`/`pop`, `call`/`ret`, `cmp`, `jmp`/`je`/`jne`) are enough to follow a program's general logic. |
| **Tools you can use** | Ghidra or `objdump` to disassemble; `gdb` to debug. |
| **Pitfalls to avoid** | Jumping straight into a debugger without a prior overview from the disassembly. |
| **Best practices** | Disassemble first to spot interesting areas, then debug to confirm a specific behavior. |
