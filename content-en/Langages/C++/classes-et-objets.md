---
order: 3
---

# Classes and Objects

A C++ **class** combines what a [C `struct`](/?c=langages-de-programmation&s=c&p=variables) separates into two parts: data AND the functions that manipulate it, all in one place, with the added benefit of explicit control over what is visible from the outside.

## Declare a Class

```cpp
class Vehicule {
public:
    // const&: prevents the received strings from being copied (see the chapter on references)
    Vehicule(const std::string &brand, const std::string &model) : brand(brand), model(model) {}

    std::string description() const {
        return brand + " " + model;
    }

private:
    std::string brand;
    std::string model;
};

Vehicule v("Peugeot", "308");
std::cout << v.description();   // "Peugeot 308"
```

- `public` : accessible from outside the class.
- `private` : accessible only from within the class (`Vehicule` methods).
- `protected` : like `private`, but also accessible to classes that inherit from this one (see [Inheritance and Polymorphism](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme)).

> **Note:** Unlike a C `struct` (where all data is freely accessible), a C++ class hides its members by default (implicit `private`); this is **encapsulation**: the outside world interacts only with what the class intentionally exposes.

## The constructor, two ways to write it

```cpp
// Initialization list (preferred): initializes directly, without using an assignment
Vehicule(std::string brand, std::string model) : brand(brand), model(model) {}

// Equivalent with assignment within the body (works, but is less idiomatic)
Vehicule(std::string brand, std::string model) {
    this->brand = brand;
    this->model = model;
}
```

The initialization list (after the `:`) directly initializes each member with the correct value, rather than initializing it once (with the default value) and then overwriting it in the constructor's body, a performance detail that becomes significant for objects that are expensive to construct.

## The destructor

```cpp
class GestionnaireFichier {
public:
    GestionnaireFichier(const std::string &path) {
        file.open(path);
    }

    ~GestionnaireFichier() {   // called AUTOMATICALLY when the object goes out of scope
        file.close();
    }

private:
    std::ifstream file;
};
```

The `~ClassName()` destructor runs automatically as soon as the object is destroyed (end of scope for a local object, `delete` for a dynamically allocated one): this is the basis of the [RAII](/?c=langages-de-programmation&s=cpp&p=gestion-memoire-raii) mechanism, central to C++ to never forget to release a resource.

## The Rule of Three

A class that manages a resource itself (dynamically allocated memory, an open file...) must define four special members together, never just some of them: the default constructor, the **copy constructor**, the **copy assignment operator**, and the destructor (seen above). This convention is called the **Rule of Three**.

```cpp
class Array {
public:
    Array(int size) : size(size), data(new int[size]) {}

    // Copy constructor: builds a NEW object from another already-existing one
    Array(const Array &other) : size(other.size), data(new int[other.size]) {
        for (int i = 0; i < size; i++) data[i] = other.data[i];
    }

    // Copy assignment operator: copies INTO an object that already exists
    Array &operator=(const Array &other) {
        if (this != &other) {   // guard against self-assignment (a = a)
            delete[] data;
            size = other.size;
            data = new int[size];
            for (int i = 0; i < size; i++) data[i] = other.data[i];
        }
        return *this;   // allows chaining: a = b = c
    }

    ~Array() { delete[] data; }

private:
    int size;
    int *data;
};
```

Without an explicit copy constructor or assignment operator, C++ generates default versions that copy each member **as-is** (a shallow copy): for a pointer like `data`, that copies the address, never the pointed-to data. Two objects would then end up sharing the same memory block, and whichever destructor runs first would free memory the other object still believes is valid.

> **Pitfall:** forgetting the `this != &other` check in the assignment operator. On **self-assignment** (`a = a`), `delete[] data` would free the memory before the loop tries to read it back from itself: a use-after-free on the object's own data.
>
> **Best practice:** implement all four members together as soon as one is needed, never just a subset: a copy constructor with no matching assignment operator (or vice versa) is a strong signal of an oversight, not a deliberate choice.

## `const` methods

```cpp
std::string description() const {   // "const" here: ensures that this method does NOT modify the object
    return brand + " " + model;
}
```

Marking a method as `const` documents and ensures that the compiler enforces the rule that it does not modify any members of the object, which is particularly useful for allowing this method to be called on an object that is itself declared as `const`.

## Static members and methods

```cpp
class Counter {
public:
    Counter() { totalCrees++; }
    static int totalCrees;   // shared by ALL instances, not one per object
};

int Counter::totalCrees = 0;   // Required definition outside the class
```

See also [Inheritance and Polymorphism](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme) and [Operator Overload](/?c=langages-de-programmation&s=cpp&p=surcharge-d-operateurs), to extend a class's behavior beyond simple named methods.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A class groups data and methods together, with access control (`public`/`private`/`protected`). The constructor initializes the object, the destructor automatically releases its resources at the end of its scope. |
| **Tools you can use** | Initialization list (`: member(value)`), `const` methods, `static` members/methods. Copy constructor and assignment operator for a class that manages a resource. |
| **Pitfalls to avoid** | Forgetting that a class hides its members by default (implicit `private`), unlike a fully public C `struct`. Forgetting the self-assignment guard in `operator=`. |
| **Best practices** | Prefer the initialization list over an assignment in the constructor's body; mark `const` any method that doesn't modify the object. Implement all four Rule-of-Three members together, never a subset. |
