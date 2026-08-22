---
order: 2
---

# C++

C++ began as an extension of [C](/?c=langages-de-programmation&s=c&p=c) ("C with Classes"), and remains backward-compatible with virtually all of that language: almost everything that applies there (pointers, memory, structs, compilation) works directly in C++.

```cpp
#include <iostream>

int main() {
    int age = 25;                   // a variable, exactly like in C
    std::cout << age << std::endl;  // prints: 25
}
```

What C++ adds on top of C:

| Term | What it means |
|---|---|
| Object-oriented programming | Organizing code around objects that bundle data together with the functions that operate on it (see [Classes and objects](/?c=langages-de-programmation&s=cpp&p=classes-et-objets)) |
| RAII | A resource (memory, a file...) is automatically released when the object that owns it is destroyed, see [Memory management and RAII](/?c=langages-de-programmation&s=cpp&p=gestion-memoire-raii), which drastically limits the memory leaks possible in C |
| Templates | Writing a function or a class once, valid for several different types, without sacrificing performance, see [Templates](/?c=langages-de-programmation&s=cpp&p=templates) |

C++ thus keeps C's low-level control (memory, performance, no garbage collector) while offering higher-level tools for structuring a large-scale project: a trade-off that explains its enduring presence in game engines and demanding embedded systems.

> **Note:** unlike [Python](/?c=langages-de-programmation&s=python&p=python) or [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), C++ remains **compiled** to native machine code (see [Compilation](/?c=langages-de-programmation&s=c&p=compilation)): no virtual machine, no interpreter between the code and its execution.
