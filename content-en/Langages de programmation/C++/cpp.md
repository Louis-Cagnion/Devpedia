# C++

C++ began as an extension of C ("C with Classes"), and remains backward-compatible with virtually all of C (see the C section)—almost everything we've already covered there (pointers, memory, structs, compilation) applies directly in C++. What C++ adds on top of that is essentially **object-oriented programming**, **automatic resource management** (RAII), and **generic programming** (templates).

Among the key concepts added by C++ compared to C are the following:

- Classes and Objects (Encapsulation, Inheritance, Polymorphism)
- References: A Safer Alternative to Pointers in Many Cases
- RAII and smart pointers, which drastically reduce the memory leaks discussed in the chapter on C
- Templates: Writing Generic Code Without Sacrificing Performance
- The Standard Library (STL): Ready-to-Use Containers, Algorithms, and Iterators
- Exceptions: A Structured Alternative to the "C-style" Error Handling Approach (Return Values + `errno`)

Learning C++ allows you to retain the low-level control of C (memory, performance, no garbage collection) while providing higher-level tools for structuring large-scale projects—a balance that explains its enduring presence in game engines, demanding embedded systems, and software that requires both high performance and significant software complexity.

> **Note:** Unlike PHP, Python, or JavaScript, C++ is **compiled** into native machine code (see the chapter on compilation, section C)—there is no virtual machine or interpreter between the code and its execution.
