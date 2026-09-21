---
order: 1
---

# References

A **reference** is an alias: another name for an existing variable, never an independent variable. It solves a very concrete problem in [C](/?c=langages-de-programmation&s=c&p=c): passing a variable to a function so it could modify it used to require explicitly manipulating [pointers](/?c=langages-de-programmation&s=c&p=pointeurs).

## Declaring a Reference

```cpp
int age = 25;
int &refAge = age;   // refAge is ANOTHER NAME for age, not a duplicate

refAge = 30;
std::cout << age;    // 30 -> Changing refAge directly changes age
```

> **Note:** Unlike a pointer, a reference **must** be initialized at the time of declaration and can never be reassigned to point to another variable: once bound to `age`, `refAge` will remain an alias for `age` for the rest of its lifetime.

## Passing a Function by Reference

```cpp
void incrementer(int &number) {
    number++;   // You don't need to dereference with *, unlike a pointer in C
}

int x = 5;
incrementer(x);
std::cout << x;   // 6
```

Compared to [the C equivalent](/?c=langages-de-programmation&s=c&p=pointeurs):

```c
void incrementer(int *number) {
    (*number)++;
}
incrementer(&x);
```

The reference avoids the syntax `*` / `&` when calling the function and within the function, while achieving exactly the same behavior (modifying the caller's variable).

## `const &` : Avoid copying without risking changes

Passing a large object by value (a complete copy) with each function call consumes time and memory. Passing by reference avoids the copy, but allows the function to modify the original: `const &` combines both advantages:

```cpp
void afficher(const std::string &text) {   // No copying, AND the text cannot be edited here
    std::cout << text;
}
```

> **Note:** This has become the default convention in C++ for passing a large object (string, vector, structure, etc.) to a function on a read-only basis, faster than a copy, safer than a raw pointer (no risk of "`nullptr`," no dereferencing syntax to worry about).

## Reference vs. Pointer

| | Reference | Pointer |
|---|---|---|
| Maybe `null` | No, never | Yes (`nullptr`) |
| Reassignable after initialization | No | Yes |
| Access syntax | Direct, like the variable itself | Requires `*` to dereference |
| Must be initialized upon declaration | Yes, required | No |

A reference is therefore more restricted than a pointer, and that is precisely what makes it safer in cases where these restrictions do not need to be bypassed (we already know that the variable exists and that its target will not change).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A reference is an alias for an existing variable: never `null`, never reassignable after initialization, no `*`/`&` syntax at use. `const &` passes a large object with no copy and no risk of modification. |
| **Tools you can use** | `&` in a type declaration (reference), `const &` for a read-only parameter. |
| **Pitfalls to avoid** | Thinking a reference can be `null` or reassigned like a pointer: both are impossible. |
| **Best practices** | Pass a large object by `const &` by default, rather than by value (expensive copy) or by raw pointer. |
