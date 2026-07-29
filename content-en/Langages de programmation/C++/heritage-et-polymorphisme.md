---
order: 4
---

# Inheritance and Polymorphism

**Inheritance** allows one class to reuse (and extend or modify) the behavior of another. **Polymorphism** allows objects of different classes to be treated uniformly through a common interface—the most powerful, and most often misunderstood, mechanism of OOP in C++.

## Simple Inheritance

```cpp
class Animal {
public:
    Animal(std::string nom) : nom(nom) {}
    std::string parler() const { return "..."; }
protected:
    std::string nom;
};

class Chien : public Animal {
public:
    Chien(std::string nom) : Animal(nom) {}   // explicitly calls the parent constructor
    std::string parler() const { return nom + " aboie"; }
};
```

## The problem with "`virtual`"

```cpp
Animal *a = new Chien("Rex");
std::cout << a->parler();   // "..." poster -> NOT "Rex barks"!
```

> **Common pitfall:** Without the `virtual` keyword, C++ chooses which version of `parler()` to call based on the **declared type** of the pointer (`Animal*`), not on the actual type of the object being pointed to (`Chien`)—a mechanism called *static binding*. The result seems to “ignore” inheritance, which is often surprising to those coming from languages like PHP, Python, or Java, where this behavior is automatic.

## Making a Method Polymorphic: `virtual`

```cpp
class Animal {
public:
    Animal(std::string nom) : nom(nom) {}
    virtual std::string parler() const { return "..."; }   // "virtual" enables DYNAMIC LINKING
    virtual ~Animal() {}   // virtual shredder: see note below
protected:
    std::string nom;
};

class Chien : public Animal {
public:
    Chien(std::string nom) : Animal(nom) {}
    std::string parler() const override { return nom + " aboie"; }   // "override": checked by the compiler
};

Animal *a = new Chien("Rex");
std::cout << a->parler();   // "Rex barks" -> the CORRECT version is called, thanks to "virtual"
delete a;
```

`virtual` causes the system to choose which method to call based on the object's **actual type**, determined at runtime (*dynamic binding*) rather than at compile time—it is this mechanism that enables polymorphism: the same line of code (`a->parler()`) behaves differently depending on the object it actually points to.

> **Note:** `override` (optional but strongly recommended) instructs the compiler to verify that this method does indeed override a `virtual` method from the parent class—a typo in the signature (number of parameters, missing `const`, etc.) — will then result in a compilation error, rather than a silent bug where the parent method would continue to be called without anyone noticing.

## Why the shredder should also be `virtual`

```cpp
Animal *a = new Chien("Rex");
delete a;   // without a virtual destructor: ONLY ~Animal() is called; ~Dog() is never called
```

Without a `virtual` on the destructor, deleting an `Chien` object via a `Animal*` pointer will only execute the destructor of `Animal`—any resources specific to `Chien` (allocated memory, open files, etc.) would never be released. Any class intended to be inherited from and manipulated via a base class pointer must therefore always declare its destructor as `virtual`.

## Abstract Classes: Enforcing a Contract Without an Implementation

```cpp
class FormeGeometrique {
public:
    virtual double aire() const = 0;   // "= 0": PURELY virtual function; no implementation here
    virtual ~FormeGeometrique() {}
};

class Cercle : public FormeGeometrique {
public:
    Cercle(double rayon) : rayon(rayon) {}
    double aire() const override { return 3.14159 * rayon * rayon; }
private:
    double rayon;
};

FormeGeometrique *forme = new Cercle(5);   // OK
FormeGeometrique *impossible = new FormeGeometrique();   // ERROR: abstract class, cannot be instantiated
```

A class containing at least one `= 0` becomes **abstract**: it can never be instantiated directly, only inherited—it defines a contract (“every geometric shape must be able to calculate its area”) that every child class must implement.
