---
order: 4
---

# Inheritance and Polymorphism

**Inheritance** lets a class reuse (and extend or modify) another class's behavior. **Polymorphism** lets objects of different classes be treated uniformly, through a common interface: the most powerful, and most often misunderstood, mechanism of OOP in C++.

## Simple inheritance

```cpp
class Animal {
public:
    Animal(std::string name) : name(name) {}
    std::string speak() const { return "..."; }
protected:
    std::string name;
};

class Dog : public Animal {
public:
    Dog(std::string name) : Animal(name) {}   // explicitly calls the parent constructor
    std::string speak() const { return name + " barks"; }
};
```

## The problem without `virtual`

```cpp
Animal *a = new Dog("Rex");
std::cout << a->speak();   // displays "..." -> NOT "Rex barks"!
```

> **Common pitfall:** without the `virtual` keyword, C++ chooses which version of `speak()` to call based on the pointer's **declared type** (`Animal*`), not the actual type of the pointed-to object (`Dog`): a mechanism called *static binding*. The result seems to "ignore" inheritance, which is often surprising when coming from a language like [PHP](/?c=langages&s=php&p=poo), [Python](/?c=langages&s=python&p=poo), or [Java](https://docs.oracle.com/en/java/), where this behavior is automatic.

## Making a method polymorphic: `virtual`

```cpp
class Animal {
public:
    Animal(std::string name) : name(name) {}
    virtual std::string speak() const { return "..."; }  // "virtual" enables DYNAMIC BINDING
    virtual ~Animal() {}                                  // virtual destructor: see note below
protected:
    std::string name;
};

class Dog : public Animal {
public:
    Dog(std::string name) : Animal(name) {}
    std::string speak() const override { return name + " barks"; }   // "override": checked by the compiler
};

Animal *a = new Dog("Rex");
std::cout << a->speak();   // "Rex barks" -> the RIGHT version is called, thanks to "virtual"
delete a;
```

`virtual` makes the method to call chosen based on the object's **actual type**, resolved at runtime (*dynamic binding*) rather than at compile time; this mechanism is what enables polymorphism: the same line of code (`a->speak()`) behaves differently depending on the object actually pointed to.

> **Note:** `override` (optional but strongly recommended) asks the compiler to verify that this method really does redefine a `virtual` method from the parent class: a typo in the signature (wrong number of parameters, a forgotten `const`...) then becomes a compile error, rather than a silent bug where the parent method keeps being called without anyone noticing.

## Why the destructor must also be `virtual`

```cpp
Animal *a = new Dog("Rex");
delete a;   // without a virtual destructor: ONLY ~Animal() is called, never ~Dog()
```

Without `virtual` on the destructor, deleting a `Dog` object through an `Animal*` pointer only runs `Animal`'s destructor: any resource specific to `Dog` (allocated memory, an open file...) would never be released. Any class meant to be inherited from and handled through a base pointer must therefore always declare its destructor `virtual`.

## Abstract classes: imposing a contract with no implementation

```cpp
class Shape {
public:
    virtual double area() const = 0;   // "= 0": PURELY virtual function, no implementation here
    virtual ~Shape() {}
};

class Circle : public Shape {
public:
    Circle(double radius) : radius(radius) {}
    double area() const override { return 3.14159 * radius * radius; }
private:
    double radius;
};

Shape *shape = new Circle(5);          // OK
Shape *impossible = new Shape();       // ERROR: abstract class, cannot be instantiated
```

A class containing at least one purely virtual method (`= 0`) becomes **abstract**: it can never be instantiated directly, only inherited from; it defines a contract ("every shape must know how to compute its area") that every child class must implement.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Inheritance reuses a parent class's behavior. `virtual` enables dynamic binding (the object's real type decides which method is called), essential for polymorphism. An abstract class (a `= 0` method) imposes a contract with no implementation. |
| **Tools you can use** | `virtual`, `override`, `virtual` destructor, abstract classes. |
| **Pitfalls to avoid** | Forgetting `virtual` on a method meant to be polymorphic (silent static binding); forgetting `virtual` on the destructor of a class meant to be handled through a base pointer (resource leak). |
| **Best practices** | Always declare `virtual` the destructor of a class meant to be inherited from; use `override` systematically so the compiler catches a wrongly redefined signature. |
