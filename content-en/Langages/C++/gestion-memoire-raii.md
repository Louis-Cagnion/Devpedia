---
order: 7
---

# RAII and Smart Pointers

In [C](/?c=langages-de-programmation&s=c&p=c) (see [Memory Management](/?c=langages-de-programmation&s=c&p=memoire)), every `malloc()` must be followed by a manual `free()`: forget it just once, and you get a memory leak; call it twice, and you get a crash. **RAII** (*Resource Acquisition Is Initialization*) is the central principle of C++ for eliminating this entire class of bugs, relying on a mechanism we’ve already seen: the destructor (see [Classes and Objects](/?c=langages-de-programmation&s=cpp&p=classes-et-objets)).

## The RAII Principle

A resource (memory, file, network connection, etc.) is acquired in an object's **constructor** and automatically released in its **destructor**: when the object goes out of scope, the resource is automatically released, and it is impossible to forget to clean it up:

```cpp
class GestionnaireFichier {
public:
    GestionnaireFichier(const std::string &path) {
        file.open(path);
        if (!file.is_open()) {
            // cf. chapitre sur les exceptions
            throw std::runtime_error("Impossible d'ouvrir : " + path);
        }
    }
    // called automatically, even if an exception occurs!
    ~GestionnaireFichier() { file.close(); }
private:
    std::ifstream file;
};

void traiterFichier() {
    GestionnaireFichier gf("donnees.txt");
    // ... use gf ...
}   // <- Here, ~FileHandler() runs automatically: the file is closed, guaranteed
```

> **Note:** Unlike a simple `close()` called manually at the end of a function, RAII guarantees that resources will be released even if an exception interrupts the function in the middle: the destructor runs during the "stack unwinding" caused by the exception, whereas a manual call would simply be skipped.

## `new` / `delete`: the C++ version of `malloc` / `free`

```cpp
int *p = new int(42);   // allocates AND initializes in a single operation
delete p;                 // releases

int *array = new int[10];   // allocates a dynamic array
// "[]" is required to free an array; otherwise, behavior is undefined
delete[] array;
```

`new` / `delete` replace `malloc` / `free` but are subject to exactly the same risks (forgetting `delete`, duplicate `delete`, *use-after-free*; see Chapter C on memory), which is why, in modern C++, they are rarely used **directly**.

## Smart Pointers

A smart pointer applies RAII to memory management itself: it **is** an object whose destructor automatically calls `delete` on the resource it owns.

### `unique_ptr` : exclusive property

```cpp
#include <memory>

std::unique_ptr<int> p = std::make_unique<int>(42);
std::cout << *p;   // 42 -> is dereferenced as a raw pointer

// No need to delete: when p goes out of scope, the memory is automatically freed
```

A `unique_ptr` can have only one owner: copying it is prohibited (compilation error); only `std::move` is allowed, which transfers ownership from one `unique_ptr` to another:

```cpp
std::unique_ptr<int> p1 = std::make_unique<int>(42);
std::unique_ptr<int> p2 = std::move(p1);   // p2 becomes the owner, p1 becomes nullptr
```

### `shared_ptr` : shared ownership, with reference counting

```cpp
std::shared_ptr<int> p1 = std::make_shared<int>(42);
std::shared_ptr<int> p2 = p1;   // OK, copying allowed: p1 AND p2 share the same resource

// Memory is released only when the LAST shared_ptr referencing it is destroyed
```

Each `shared_ptr` increments a shared reference counter; the resource is released automatically only when this counter reaches zero.

> **Note:** `shared_ptr` has a higher cost (the reference counter, which is updated in a thread-safe manner) than `unique_ptr`: it should be reserved for cases where a resource actually has multiple legitimate owners, not used by default.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | RAII ties a resource's acquisition to the constructor and its release to the destructor: the resource is necessarily released as soon as the object goes out of scope, even when an exception is thrown. `unique_ptr`/`shared_ptr` apply this principle to memory. |
| **Tools you can use** | `unique_ptr` (exclusive ownership), `shared_ptr` (shared ownership, reference counting), `std::move`. |
| **Pitfalls to avoid** | Using `new`/`delete` directly in modern application code: the same risks as `malloc`/`free` (leak, double free, use-after-free). |
| **Best practices** | Always prefer `unique_ptr` by default, `shared_ptr` only when genuine sharing is needed. |
