---
order: 2
---

# Memory Corruption

The main families of flaws already covered in [The Main Families of Vulnerabilities](/?c=cybersecurite&p=types-de-failles) (injection, access control, configuration...) mostly affect web applications. **Memory corruption** is a separate family, specific to compiled programs (C, C++...) that directly manipulate the memory described in [How a Program Actually Executes](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme): it covers cases where a program reads or writes to a memory location different from the one its author intended.

## The Buffer Overflow: Writing Past the Reserved Space

A **buffer** is a fixed-size memory space reserved for a piece of data (e.g. a 16-byte string). A **buffer overflow** happens when a program writes more data than that space can hold, without checking, spilling over into neighboring memory.

```text
Space reserved for "name": 8 bytes

Normal write:        [ L | O | U | I | S | \0 |   |   ]   -> fits in the reserved space

Overflowing write (input too long, never checked):
                      [ A | A | A | A | A | A | A | A ] [ A | A | A | A ]
                        space reserved for "name"         spills into neighboring memory
                                                            (potentially the return address,
                                                             see the previous chapter)
```

On the stack, the memory neighboring a local buffer often contains the **return address** of the current function (see the previous chapter): a sufficiently precise overflow can replace it with an address chosen by the attacker, redirecting the program's execution to code of their choosing as soon as the function returns.

> **Pitfall:** believing a crash is the only possible symptom. A buffer overflow that only overwrites a neighboring variable, without crashing the program, can stay silent while still altering its behavior (e.g. an `is_admin` flag accidentally set to true).

## The Use-After-Free: Using Memory That's Already Been Freed

As seen in the previous chapter, data on the [heap](/?c=securite&s=securite-offensive&p=bas-niveau-execution-dun-programme) must be explicitly freed once it's no longer needed. A **use-after-free** happens when the program keeps using a pointer to that area after freeing it: in the meantime, that memory space may have been reassigned to completely different data, which the program then reads or writes by mistake, thinking it's still handling the old data.

```text
1. The program allocates memory for an object A, keeps a pointer to it
2. The program frees that space (A no longer exists, but the pointer still does)
3. The program allocates memory for an object B: the system reuses the same space
4. The program, via its old (stale) pointer, reads/writes -> it actually touches B
```

## The Format String Bug: Input Treated as a Formatting Instruction

Some functions (like `printf` in C) accept a **format string**, which describes how to display the values that follow (`%d` for an integer, `%s` for a string...). A **format string bug** happens when user-supplied data is used directly as the format string, instead of being a plain argument to display:

```text
// Vulnerable code: the user data IS the format string
printf(user_input);

// If user_input is "%x %x %x %x", printf reads 4 values
// off the stack where no argument was ever provided: it prints
// arbitrary memory content, potentially sensitive.

// Correct code: the user data is an ARGUMENT, never the format
printf("%s", user_input);
```

The same trap already seen for SQL injection in [The Main Families of Vulnerabilities](/?c=cybersecurite&p=types-de-failles): external data treated as an instruction rather than as a plain value.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | Memory corruption covers cases where a program reads or writes to an unintended memory location: buffer overflow (writing past a reserved space, potentially overwriting the return address), use-after-free (using a pointer to memory that's already been freed and reassigned), format string bug (external data used as a formatting instruction). |
| **Tools you can use** | A debugger (next chapter) to concretely observe a memory overflow; a fuzzer (covered later in this category) to discover one automatically. |
| **Pitfalls to avoid** | Checking an input only for its presence, never for its actual size against the reserved space; reusing a pointer after freeing the memory it points to. |
| **Best practices** | Always explicitly bound a write to the actually reserved size; set a pointer to `NULL` immediately after freeing its memory, so an accidental reuse crashes right away instead of staying silent. |
