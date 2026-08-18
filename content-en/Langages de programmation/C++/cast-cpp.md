---
order: 11
---

# Casts in C++

Converting a value from one type to another is called a **cast**. C has a single syntax for it: `(type)value`. C++ offers four distinct ones, each reserved for a specific intent: this precision lets the compiler (and a future reader of the code) immediately know what kind of conversion is happening, instead of having to guess.

## Why not just `(type)value`?

A C-style cast **silently** performs whatever conversion is requested, even the riskiest ones (dropping a `const`, reinterpreting raw bytes, going down a class hierarchy without any check), with no visible distinction between a harmless conversion and a dangerous one:

```cpp
int number = 65;
char letter = (char)number;          // harmless numeric conversion
const char *text = "hello";
char *mutable_text = (char *)text;   // drops a "const": far riskier, yet identical syntax
```

C++'s four casts make this distinction explicit, and above all **searchable**: `grep -r "reinterpret_cast"` immediately finds every risky spot in a project, something a C-style cast doesn't allow.

## `static_cast`: conversions known at compile time

`static_cast` covers "normal" conversions, whose validity the compiler can check without any extra information at runtime: numeric conversions, an explicit conversion to a type that has a matching constructor, or moving up (*upcast*) a [class hierarchy](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme) (from a derived class to its base class).

```cpp
double price = 19.99;
int rounded = static_cast<int>(price); // explicit numeric conversion

Derived derived;
Base *base = static_cast<Base *>(&derived); // upcast: always valid
```

## `dynamic_cast`: safe downcasting in a hierarchy

Going down (*downcast*) from a base class to a derived class is risky: the base pointer might actually point to any derived class in the hierarchy, not necessarily the one you're targeting. `dynamic_cast` checks this **at runtime**, using [RTTI](https://en.cppreference.com/w/cpp/language/rtti) (*Run-Time Type Information*, the type information kept by polymorphic classes):

```cpp
Base *base = getSomeObject(); // returns a pointer to a derived type unknown at compile time

Derived *derived = dynamic_cast<Derived *>(base);
if (derived != nullptr) {
    // the cast succeeded: "base" really was pointing to a "Derived"
} else {
    // the cast failed: "base" was pointing to a different derived type
}
```

> **Note:** `dynamic_cast` requires the base class to contain at least one `virtual` function (see [Inheritance and Polymorphism](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme)): without one, no type information is available at runtime, and the compiler refuses to compile.

| `dynamic_cast` target | On failure |
|---|---|
| A pointer (`Derived *`) | Returns `nullptr` |
| A reference (`Derived &`) | Throws a `std::bad_cast` [exception](/?c=langages-de-programmation&s=cpp&p=exceptions) |

## `const_cast`: adding or removing a `const`

`const_cast` is the only one of the four that **never** changes the underlying type or the binary representation of the value: it only adds or removes the `const` qualifier.

```cpp
void legacyAPI(char *string); // external function that never modifies "string", but doesn't declare it

void call(const char *text)
{
    legacyAPI(const_cast<char *>(text)); // drop the "const" to satisfy the signature
}
```

> **Pitfall:** using `const_cast` to modify data that was **genuinely** declared `const` in the first place (rather than simply passed through a poorly declared function signature): the behavior is then undefined. `const_cast` is only justified to work around an imprecise external API, never to modify a real constant.

## `reinterpret_cast`: reinterpreting raw bytes

`reinterpret_cast` is the most dangerous of the four: it reinterprets a value's binary representation as if it were a different type, with no verification and no actual conversion of the data (unlike `static_cast`, which converts a real numeric value).

```cpp
int value = 42;
int *intPointer = &value;

uintptr_t rawAddress = reinterpret_cast<uintptr_t>(intPointer); // the pointer, viewed as a plain integer
```

Reserved for low-level cases (raw pointer manipulation, hardware interfacing, binary serialization): using it outside that context is almost always a sign of a design problem elsewhere.

## Overview

| Cast | Checked at | Typical use |
|---|---|---|
| `static_cast` | Compile time | Numeric conversions, upcast in a hierarchy |
| `dynamic_cast` | Runtime | Safe downcast in a polymorphic hierarchy |
| `const_cast` | Neither (no check) | Adding/removing `const` for an external API |
| `reinterpret_cast` | Neither (no check) | Low-level reinterpretation of the binary representation |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | C++ replaces C's single cast with 4 distinct casts, each reserved for a specific, searchable intent in the code. |
| **Tools you can use** | `static_cast` (safe conversions), `dynamic_cast` (checked downcast), `const_cast` (const), `reinterpret_cast` (low-level). |
| **Pitfalls to avoid** | Using `const_cast` to modify a value that's genuinely `const` (undefined behavior); using `reinterpret_cast` outside a justified low-level context. |
| **Best practices** | Always check the result of a `dynamic_cast` on a pointer (`nullptr` is possible); prefer the most restrictive cast available rather than reaching for `reinterpret_cast` out of convenience. |
