---
order: 10
---

# Templates (Generic Programming)

A **template** allows you to write a function or class **just once**, applicable to any type, without sacrificing type checking at compile time or performance (unlike dynamically typed languages such as [Python](/?c=langages-de-programmation&s=python&p=python) or [PHP](/?c=langages-de-programmation&s=php&p=php); see the relevant chapters).

## Without a template: duplication

```cpp
int maximum(int a, int b) { return (a > b) ? a : b; }
double maximum(double a, double b) { return (a > b) ? a : b; }
std::string maximum(std::string a, std::string b) { return (a > b) ? a : b; }
```

Three functions that are strictly identical in their logic, duplicated solely because of their type, exactly the kind of repetition that a template eliminates (see the DRY principle, already discussed in relation to other languages).

## Function Template

```cpp
template <typename T>
T maximum(T a, T b) {
    return (a > b) ? a : b;
}

maximum(3, 7);            // T is automatically inferred as int
maximum(3.5, 2.1);          // T is marked as a duplicate
maximum<std::string>("a", "b");  // T explicitly specified if necessary
```

The compiler **generates** a separate version of the function for each type that is actually used (`maximum<int>`, `maximum<double>`...): this is known as template instantiation, which takes place entirely at compile time, with no overhead at runtime.

## Class Template

```cpp
template <typename T>
class Pile {
public:
    void empiler(T value) { elements.push_back(value); }
    T depiler() {
        if (estVide()) {
            throw std::out_of_range("Pile vide"); // See the chapter on exceptions: Never unload an empty stack
        }
        T dernier = elements.back();
        elements.pop_back();
        return dernier;
    }
    bool estVide() const { return elements.empty(); }

private:
    std::vector<T> elements;
};

Pile<int> pileEntiers;
pileEntiers.empiler(42);

Pile<std::string> pileTextes;
pileTextes.empiler("bonjour");
```

A single definition of `Pile` that can be used with any type: this is exactly how [the STL's containers](/?c=langages-de-programmation&s=cpp&p=stl-conteneurs) are built (`std::vector<T>`, `std::map<K, V>`...).

## Type Constraints (C++20: `concepts`)

Without constraints, a template accepts any type, including types for which the operation makes no sense, resulting in a compilation error that is often lengthy and unclear:

```cpp
template <typename T>
T addition(T a, T b) { return a + b; }

addition(2, 3);          // OK
addition("a", "b");        // A potentially cryptic compilation error depending on the type
```

Since C++20, **concepts** have made it possible to explicitly express requirements on `T`, resulting in clearer error messages and more readable code:

```cpp
template <typename T>
concept Numerique = std::is_arithmetic_v<T>;

template <Numerique T>
T addition(T a, T b) { return a + b; }
```

## `typename` for a Type Dependent on a Template Parameter

When a type used inside a template depends on the template parameter itself (for instance `T::iterator`, where `T` is a generic type), the compiler can't know, before the template is actually instantiated, whether `T::iterator` names a type or a value (a static member, for instance):

```cpp
template <typename T>
void printFirst(T &container) {
    typename T::iterator it = container.begin();   // "typename" required here
    std::cout << *it;
}
```

By default, the compiler assumes a name like `T::iterator` refers to a **value**, not a type. The `typename` keyword, placed right before it, lifts this ambiguity by explicitly stating "this is a type name": required whenever a type dependent on a template parameter is used this way, whether for a local variable or as a return type (`typename T::iterator myFunction(...)`).

> **Pitfall:** forgetting `typename` before a nested dependent type (`T::value_type`, `T::iterator`...). A compilation error shows up, but its message ("expected expression", or similar depending on the compiler) never explicitly mentions the missing `typename` keyword, which makes it hard to diagnose without already knowing this rule.

## Templates vs. Dynamic Genericity (Python, PHP)

| | C++ Templates | Dynamic Typing (Python/PHP) |
|---|---|---|
| Type checking | At compile time | At runtime (or never, depending on the language) |
| Runtime Cost | None (code generated specifically for each type) | Slight overhead (continuous type checks) |
| Type error detection | Even before running the program | Only when executing the relevant code path |

See also [STL: Containers](/?c=langages-de-programmation&s=cpp&p=stl-conteneurs), which is based entirely on this template mechanism.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A template writes a function/class once for any type, with compile-time checking and no runtime cost (the compiler generates one version per type actually used). |
| **Tools you can use** | `template <typename T>`, `concepts` (C++20) to constrain the accepted types. `typename` to disambiguate a type dependent on a template parameter. |
| **Pitfalls to avoid** | A template with no constraint accepts any type, including ones for which the operation makes no sense: a sometimes cryptic compile error. Forgetting `typename` before a nested dependent type (`T::iterator`). |
| **Best practices** | Use `concepts` (C++20) to explicitly express the requirements on a template type, rather than letting a generic error message discover them. |
