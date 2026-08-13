---
order: 1
---

# C

A [programming language](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) is a set of rules that lets you write instructions a computer can execute. C is one, known for its direct access to the machine's fundamental mechanisms.

```c
#include <stdio.h>

int main(void) {
    int age = 25;         // a variable, see the dedicated chapter
    printf("%d\n", age);  // prints: 25
    return 0;
}
```

| Term | What it means |
|---|---|
| Low-level | Gives direct access to memory and hardware: few hidden mechanisms between the code you write and what the processor actually does |
| Compiled | The source code is translated once and for all into native machine instructions (see [Compilation](/?c=langages-de-programmation&s=c&p=compilation)) before execution, unlike an interpreted language such as [Python](/?c=langages-de-programmation&s=python&p=python) |
| Manual memory management | The program must allocate and free the memory it needs itself (see [Memory management](/?c=langages-de-programmation&s=c&p=memoire)), with no automatic mechanism |

This closeness to hardware makes it easier to understand what actually happens when a program runs: how data is stored in memory, how the processor executes instructions. This is why C remains widely used for operating systems, hardware drivers, embedded systems, and serves as the foundation for many other languages: see for example [C++](/?c=langages-de-programmation&s=cpp&p=cpp), which builds directly on it.
