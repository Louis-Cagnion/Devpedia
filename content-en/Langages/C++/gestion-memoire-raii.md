---
order: 7
---

# RAII and Smart Pointers

In [C](/?c=langages-de-programmation&s=c&p=c) (see the chapter on memory management), every `malloc()` must be followed by a manual `free()`: forget it just once, and you get a memory leak; call it twice, and you get a crash. **RAII** (*Resource Acquisition Is Initialization*) is the central principle of C++ for eliminating this entire class of bugs, relying on a mechanism we’ve already seen: the destructor (see the chapter on classes and objects).

## The RAII Principle

A resource (memory, file, network connection, etc.) is acquired in an object's **constructor** and automatically released in its **destructor**: when the object goes out of scope, the resource is automatically released, and it is impossible to forget to clean it up:

```cpp
class GestionnaireFichier {
public:
    GestionnaireFichier(const std::string &path) {
        file.open(path);
        if (!file.is_open()) {
            throw std::runtime_error("Impossible d'ouvrir : " + path); // cf. chapitre sur les exceptions
        }
    }
    ~GestionnaireFichier() { file.close(); }   // called automatically, even if an exception occurs!
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
delete[] array;               // "[]" is required to free an array; otherwise, behavior is undefined
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

## Abstract

| | `new` / `delete` brut | `unique_ptr` | `shared_ptr` |
|---|---|---|---|
| Automatic release | No | Yes | Yes |
| Number of owners | N/A | One | Several |
| Cost | Minimal | Virtually zero (no additional cost at runtime) | Reference counting (slight additional cost) |

> **Modern C++ best practice:** Never use `new` or `delete` directly in application code: always use `unique_ptr` (by default) or `shared_ptr` (if sharing is truly necessary) instead, to take advantage of RAII without having to think about it every time.
