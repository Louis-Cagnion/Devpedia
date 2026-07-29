---
order: 3
---

# Classes and Objects

A C++ **class** combines what a C-`struct`e (see the dedicated chapter) separates into two parts: data AND the functions that manipulate it, all in one place—with the added benefit of explicit control over what is visible from the outside.

## Declare a Class

```cpp
class Vehicule {
public:
    // const&: prevents the received strings from being copied (see the chapter on references)
    Vehicule(const std::string &marque, const std::string &modele) : marque(marque), modele(modele) {}

    std::string description() const {
        return marque + " " + modele;
    }

private:
    std::string marque;
    std::string modele;
};

Vehicule v("Peugeot", "308");
std::cout << v.description();   // "Peugeot 308"
```

- `public` : accessible from outside the classroom.
- `private` : accessible only from within the class (`Vehicule` methods).
- `protected` : Like `private`, but also accessible to classes that inherit from it (see the chapter on inheritance).

> **Note:** Unlike a C `struct` (where all data is freely accessible), a C++ class hides its members by default (implicit `private`)—this is **encapsulation**: the outside world interacts only with what the class intentionally exposes.

## The builder, in two different handwritings

```cpp
// Initialization list (preferred): initializes directly, without using an assignment
Vehicule(std::string marque, std::string modele) : marque(marque), modele(modele) {}

// Equivalent with assignment within the body (works, but is less idiomatic)
Vehicule(std::string marque, std::string modele) {
    this->marque = marque;
    this->modele = modele;
}
```

The initialization list (after the `:`) directly initializes each member with the correct value, rather than initializing it once (with the default value) and then overwriting it in the constructor's body—a performance detail that becomes significant for objects that are expensive to construct.

## The Destroyer

```cpp
class GestionnaireFichier {
public:
    GestionnaireFichier(const std::string &chemin) {
        fichier.open(chemin);
    }

    ~GestionnaireFichier() {   // called AUTOMATICALLY when the object goes out of scope
        fichier.close();
    }

private:
    std::ifstream fichier;
};
```

The `~NomClasse()` is automatically executed as soon as the object is destroyed (end of scope for a local object, `delete` for a dynamically allocated object)—this is the basis of the RAII mechanism (see the dedicated chapter), which is central to C++ to ensure that resources are never forgotten to be released.

## Methods`const`

```cpp
std::string description() const {   // "const" here: ensures that this method does NOT modify the object
    return marque + " " + modele;
}
```

Marking a method as `const` documents and ensures that the compiler enforces the rule that it does not modify any members of the object—which is particularly useful for allowing this method to be called on an object that is itself declared as `const`.

## Static members and methods

```cpp
class Compteur {
public:
    Compteur() { totalCrees++; }
    static int totalCrees;   // shared by ALL instances, not one per object
};

int Compteur::totalCrees = 0;   // Required definition outside the class
```

See also the chapters on inheritance and polymorphism, and on operator overloading, to extend a class's behavior beyond simple named methods.
