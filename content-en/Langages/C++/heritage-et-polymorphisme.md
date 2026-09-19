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
    // "override": checked by the compiler
    std::string speak() const override { return name + " barks"; }
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

## Multiple inheritance and the diamond problem

A class can inherit from several classes at once:

```cpp
class A { public: void method() {} };
class B : public A {};
class C : public A {};
class D : public B, public C {};   // inherits from both B and C
```

`D` inherits from `A` through two different paths (via `B` and via `C`). Without precautions, the `D` object then contains **two** distinct `A` sub-objects, one per path: calling `d.method()` becomes ambiguous, since the compiler doesn't know which of the two to use. This is the **diamond problem**, named after the shape of the inheritance diagram.

```text
      A
     / \
    B   C
     \ /
      D
```

> **Best practice:** declare inheritance toward the shared class as **virtual** (`class B : virtual public A {}`, and likewise for `C`): the compiler then builds only a single `A` sub-object, shared by both paths, and `d.method()` is no longer ambiguous.

A residual ambiguity on an inherited name (two methods with the same name coming from two different parents, for instance) is resolved through **explicit scope resolution** (`A::method()`), which forces the call toward a specific class rather than letting the compiler choose.

## Abstract classes: imposing a contract with no implementation

```cpp
class Shape {
public:
    // "= 0": PURELY virtual function, no implementation here
    virtual double area() const = 0;
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

## The Prototype pattern: cloning a polymorphic object

C++'s copy constructor is never virtual (there's actually no such thing as a "virtual constructor" in C++): copying an object whose real type is only known at runtime is therefore a problem.

```cpp
Shape *shape = new Circle(5);
Shape *copy = new Shape(*shape);   // ONLY copies the Shape part!
```

`new Shape(*shape)` builds an object of the pointer's declared type (`Shape`), never the actual pointed-to type (`Circle`): everything specific to `Circle` (here, the radius) is lost, a direct consequence of the static binding seen above (see "The problem without `virtual`"), applied this time to construction rather than a method call.

The **Prototype design pattern** solves this problem: each child class implements a `virtual` method that builds and returns a copy of the correct dynamic type.

```cpp
class Shape {
public:
    virtual Shape *clone() const = 0;
    virtual ~Shape() {}
};

class Circle : public Shape {
public:
    Circle(double radius) : radius(radius) {}
    // builds a Circle, not a Shape
    Circle *clone() const override { return new Circle(*this); }
private:
    double radius;
};

Shape *shape = new Circle(5);
Shape *copy = shape->clone();   // copies a REAL Circle, radius included
```

The calling code just calls `shape->clone()` without ever knowing the concrete type: it's `virtual` that guarantees the right version of `clone()` runs, exactly like for any other polymorphic method.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Inheritance reuses a parent class's behavior. `virtual` enables dynamic binding (the object's real type decides which method is called), essential for polymorphism. An abstract class (a `= 0` method) imposes a contract with no implementation. Multiple inheritance can create a diamond problem, solved with virtual inheritance. |
| **Tools you can use** | `virtual`, `override`, `virtual` destructor, abstract classes. Virtual inheritance for the diamond problem; a virtual `clone()` method (Prototype pattern) to copy a polymorphic object. |
| **Pitfalls to avoid** | Forgetting `virtual` on a method meant to be polymorphic (silent static binding); forgetting `virtual` on the destructor of a class meant to be handled through a base pointer (resource leak); copying a polymorphic object via `new Base(*ptr)`, which truncates everything specific to the child class. |
| **Best practices** | Always declare `virtual` the destructor of a class meant to be inherited from; use `override` systematically so the compiler catches a wrongly redefined signature. Declare virtual inheritance as soon as a diamond is possible. |
