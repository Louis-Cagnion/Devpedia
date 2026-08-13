---
order: 4
---

# How Data Is Laid Out in Memory

Memory is a huge array of numbered bytes. Understanding how values are arranged in it explains several confusing behaviors: why a structure takes up more space than the sum of its fields, or why a binary file written on one machine can be unreadable on another.

> This chapter covers data **layout**. For allocation (stack, heap, `malloc`/`free`) and the bugs that go with it, see C's [Memory Management](/?c=langages-de-programmation&s=c&p=memoire) chapter.

## The addressing unit is the byte

Every **byte** (8 bits) has its own address. You can't address a single bit: to read one specific bit, you have to load the byte that contains it, then apply a mask (see [Bitwise Operators](/?c=langages-de-programmation&s=c&p=operateurs-binaires)).

The processor itself works in **words**: 8 bytes on a 64-bit machine. It's this difference in scale between the addressing unit and the processing unit that explains everything that follows.

## Alignment

A processor reads memory in blocks aligned on multiples of the word size. A 4-byte value placed at an address that's a multiple of 4 is read in a single access; straddling two blocks, it takes two, plus a merge step.

The rule compilers apply: **a value of size *n* is placed at an address that's a multiple of *n***.

On some architectures, an unaligned access is simply **forbidden** and triggers a hardware error. On x86 it works but costs more. Either way, the compiler prefers to align.

## Padding in structures

This is the most visible consequence of alignment: a structure often takes up **more** than the sum of its fields.

```c
struct Example {
    char  a;    // 1 byte
    int   b;    // 4 bytes
    char  c;    // 1 byte
};

sizeof(struct Example)   // 12, not 6!
```

What the compiler actually does:

```text
byte 0     : a
bytes 1-3  : PADDING (to align b on a multiple of 4)
bytes 4-7  : b
byte 8     : c
bytes 9-11 : PADDING (so the total size is a multiple of 4)
```

The final padding exists so that, in an **array** of structures, every element stays aligned.

**Practical consequence: declaration order changes the size.** By grouping fields from largest to smallest, waste is reduced:

```c
struct Compact {
    int   b;    // bytes 0-3
    char  a;    // byte 4
    char  c;    // byte 5
                // bytes 6-7: final padding
};              // sizeof = 8 instead of 12
```

On a structure used in millions of instances, this detail changes memory usage by a third — and above all, processor cache efficiency, often more decisive than the computation itself.

> So **never** compute a structure's size by hand: use `sizeof`. And don't write a raw structure to a file or over the network assuming its layout: padding varies by compiler and architecture. That's the role of **serialization** ([JSON](/?c=infrastructure&p=json), [Protobuf](https://protobuf.dev)...) — producing a format defined independently of the machine.

## Byte order (*endianness*)

For a multi-byte value, in what order should the bytes be arranged in memory? Two conventions coexist. Take the 32-bit integer `0x12345678`:

| Convention | Bytes in memory | Used by |
|---|---|---|
| **Little-endian** | `78 56 34 12` | x86, x86-64, ARM (by default) |
| **Big-endian** | `12 34 56 78` | Networking, some processors (SPARC, PowerPC) |

*Little-endian* places the **low-order** byte first. It's neither better nor worse, it's a historical choice — but it isn't universal, hence two implications:

- A binary file written on a little-endian machine and read by a big-endian one will give wrong values, with no error reported: the read succeeds, the numbers are just wrong.
- Network protocols mandate big-endian, called for this reason **network order**. The `htons()`/`ntohl()` functions in C exist exactly for this conversion.

This is yet another reason to prefer an explicit serialized format (text or specified binary) over a raw copy of memory.

## What "address" actually means

A pointer holds the address of the **first** byte of a value. It's its **type** that indicates how many bytes to read from there, and how to interpret them.

```c
int    x = 65;
int   *pi = &x;
char  *pc = (char *)&x;

*pi   // 65      -> reads 4 bytes, interprets them as an integer
*pc   // 'A'     -> reads 1 byte at the SAME address, interprets it as a character
```

This is also why `pointer + 1` advances by `sizeof(type)` bytes and not by 1: pointer arithmetic counts in elements, not bytes. See the [Pointers](/?c=langages-de-programmation&s=c&p=pointeurs) chapter.

## What about higher-level languages?

[Python](/?c=langages-de-programmation&s=python&p=python), [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), or [PHP](/?c=langages-de-programmation&s=php&p=php) hide all of this: you don't choose the memory layout. But it doesn't disappear, it just shows up differently:

- a Python list of 1,000 integers takes up much more than 4,000 bytes, because each integer is an **object** with its own header;
- this is precisely why NumPy exists: a NumPy array stores raw contiguous values, aligned, with no per-element header — hence order-of-magnitude speedups on numeric computation (see [NumPy](/?c=data-science&p=numpy)).

## Summary

| Concept | Key point |
|---|---|
| Addressing unit | The byte; a single bit isn't addressable |
| Alignment | A value of *n* bytes is placed at an address that's a multiple of *n* |
| Padding | A structure ≥ the sum of its fields; declaration order matters |
| `sizeof` | Always measure, never compute by hand |
| Endianness | Byte order; networking mandates big-endian |
| Writing raw memory | To avoid: serialize into a defined format instead |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Memory is addressed by byte, but the processor prefers reading values aligned on multiples of their size — hence the padding that grows a structure beyond the sum of its fields. Byte order (*endianness*) varies by architecture. |
| **Tools you can use** | `sizeof` to measure an actual size, reordering a structure's fields (largest to smallest) to reduce padding. |
| **Pitfalls to avoid** | Computing a structure's size by hand instead of using `sizeof`; writing a structure's raw memory to a file/network without accounting for padding or endianness. |
| **Best practices** | Serialize into a defined format (JSON, Protobuf...) rather than copying a structure's raw memory between machines. |
