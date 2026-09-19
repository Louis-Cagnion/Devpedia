---
order: 4
---

# Herencia y polimorfismo

La **herencia** permite que una clase reutilice (y amplíe o modifique) el comportamiento de otra. El **polimorfismo** permite tratar objetos de clases diferentes de manera uniforme, a través de una interfaz común: el mecanismo más potente, y a menudo el más malinterpretado, de la POO en C++.

## Herencia simple

```cpp
class Animal {
public:
    Animal(std::string nombre) : nombre(nombre) {}
    std::string hablar() const { return "..."; }
protected:
    std::string nombre;
};

class Perro : public Animal {
public:
    // llama explícitamente al constructor padre
    Perro(std::string nombre) : Animal(nombre) {}
    std::string hablar() const { return nombre + " ladra"; }
};
```

## El problema sin `virtual`

```cpp
Animal *a = new Perro("Rex");
std::cout << a->hablar();   // muestra "..." -> ¡NO "Rex ladra"!
```

> **Trampa clásica:** sin la palabra clave `virtual`, C++ elige qué versión de `hablar()` llamar basándose en el **tipo declarado** del puntero (`Animal*`), no en el tipo real del objeto al que apunta (`Perro`): un mecanismo llamado *enlace estático*. El resultado parece "ignorar" la herencia, lo que a menudo sorprende cuando se viene de un lenguaje como [PHP](/?c=langages-de-programmation&s=php&p=poo), [Python](/?c=langages-de-programmation&s=python&p=poo) o [Java](https://docs.oracle.com/en/java/), donde este comportamiento es automático.

## Hacer que un método sea polimórfico: `virtual`

```cpp
class Animal {
public:
    Animal(std::string nombre) : nombre(nombre) {}
    // "virtual" activa el ENLACE DINÁMICO
    virtual std::string hablar() const { return "..."; }
    // destructor virtual: véase la nota más abajo
    virtual ~Animal() {}
protected:
    std::string nombre;
};

class Perro : public Animal {
public:
    Perro(std::string nombre) : Animal(nombre) {}
    // "override": comprobado por el compilador
    std::string hablar() const override { return nombre + " ladra"; }
};

Animal *a = new Perro("Rex");
// "Rex ladra" -> se llama a la versión CORRECTA, gracias a "virtual"
std::cout << a->hablar();
delete a;
```

`virtual` hace que el método a llamar se elija en función del **tipo real** del objeto, resuelto en tiempo de ejecución (*enlace dinámico*) en lugar de en tiempo de compilación; es este mecanismo el que permite el polimorfismo: una misma línea de código (`a->hablar()`) se comporta de forma diferente según el objeto realmente apuntado.

> **Nota:** `override` (opcional, pero muy recomendable) le pide al compilador que compruebe que este método efectivamente redefine un método `virtual` de la clase padre: un error tipográfico en la firma (número de parámetros, `const` olvidado...) se convierte entonces en un error de compilación, en lugar de un fallo silencioso en el que el método del padre seguiría llamándose sin que nos diéramos cuenta.

## Por qué el destructor también debe ser `virtual`

```cpp
Animal *a = new Perro("Rex");
delete a;   // sin destructor virtual: SOLO se llama a ~Animal(), nunca a ~Perro()
```

Sin `virtual` en el destructor, eliminar un objeto `Perro` a través de un puntero `Animal*` ejecuta únicamente el destructor de `Animal`: cualquier recurso propio de `Perro` (memoria asignada, archivo abierto...) nunca se liberaría. Toda clase destinada a ser heredada y manipulada mediante un puntero a la clase base debe, por tanto, declarar sistemáticamente su destructor `virtual`.

## La herencia múltiple y el problema del diamante

Una clase puede heredar de varias clases a la vez:

```cpp
class A { public: void metodo() {} };
class B : public A {};
class C : public A {};
class D : public B, public C {};   // hereda a la vez de B y de C
```

`D` hereda de `A` por dos caminos distintos (vía `B` y vía `C`). Sin precaución, el objeto `D` contiene entonces **dos** subobjetos `A` distintos, uno por camino: llamar a `d.metodo()` se vuelve ambiguo, ya que el compilador no sabe cuál de los dos usar. Es el **problema del diamante**, llamado así por la forma del diagrama de herencia.

```text
      A
     / \
    B   C
     \ /
      D
```

> **Buena práctica:** declarar la herencia hacia la clase común como **virtual** (`class B : virtual public A {}`, e igual para `C`): el compilador construye entonces un único subobjeto `A`, compartido por ambos caminos, y `d.metodo()` deja de ser ambiguo.

Una ambigüedad residual sobre un nombre heredado (dos métodos con el mismo nombre provenientes de dos padres distintos, por ejemplo) se resuelve mediante la **resolución de ámbito explícita** (`A::metodo()`), que fuerza la llamada hacia una clase precisa en lugar de dejar que el compilador elija.

## Clases abstractas: imponer un contrato sin implementación

```cpp
class FormaGeometrica {
public:
    // "= 0": función PURAMENTE virtual, sin implementación aquí
    virtual double area() const = 0;
    virtual ~FormaGeometrica() {}
};

class Circulo : public FormaGeometrica {
public:
    Circulo(double radio) : radio(radio) {}
    double area() const override { return 3.14159 * radio * radio; }
private:
    double radio;
};

FormaGeometrica *forma = new Circulo(5);                // OK
// ERROR: clase abstracta, no instanciable
FormaGeometrica *imposible = new FormaGeometrica();
```

Una clase que contiene al menos un método puramente virtual (`= 0`) se convierte en **abstracta**: nunca puede instanciarse directamente, solo heredarse; define un contrato ("toda forma geométrica debe saber calcular su área") que cada clase hija debe implementar.

## El patrón Prototype: clonar un objeto polimórfico

El constructor de copia de C++ nunca es virtual (de hecho, no existe el "constructor virtual" en C++): copiar un objeto cuyo tipo real solo se conoce en tiempo de ejecución plantea entonces un problema.

```cpp
FormaGeometrica *forma = new Circulo(5);
FormaGeometrica *copia = new FormaGeometrica(*forma);   // SOLO copia la parte FormaGeometrica!
```

`new FormaGeometrica(*forma)` construye un objeto del tipo declarado del puntero (`FormaGeometrica`), nunca del tipo real apuntado (`Circulo`): todo lo específico de `Circulo` (aquí, el radio) se pierde, una consecuencia directa del enlace estático visto más arriba (véase "El problema sin `virtual`"), aplicada esta vez a la construcción en lugar de a una llamada a método.

El **patrón de diseño Prototype** resuelve este problema: cada clase hija implementa un método `virtual` que construye y devuelve una copia del tipo dinámico correcto.

```cpp
class FormaGeometrica {
public:
    virtual FormaGeometrica *clonar() const = 0;
    virtual ~FormaGeometrica() {}
};

class Circulo : public FormaGeometrica {
public:
    Circulo(double radio) : radio(radio) {}
    // construye un Circulo, no una FormaGeometrica
    Circulo *clonar() const override { return new Circulo(*this); }
private:
    double radio;
};

FormaGeometrica *forma = new Circulo(5);
FormaGeometrica *copia = forma->clonar();   // copia un VERDADERO Circulo, radio incluido
```

El código llamador se limita a llamar a `forma->clonar()` sin conocer nunca el tipo concreto: es `virtual` quien garantiza que se ejecute la versión correcta de `clonar()`, exactamente igual que para cualquier otro método polimórfico.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La herencia reutiliza el comportamiento de una clase padre. `virtual` activa el enlace dinámico (el tipo real del objeto decide qué método se llama), indispensable para el polimorfismo. Una clase abstracta (método `= 0`) impone un contrato sin implementación. La herencia múltiple puede crear un problema de diamante, resuelto con herencia virtual. |
| **Herramientas utilizables** | `virtual`, `override`, destructor `virtual`, clases abstractas. Herencia virtual para el problema del diamante; método `clonar()` virtual (patrón Prototype) para copiar un objeto polimórfico. |
| **Trampas a evitar** | Olvidar `virtual` en un método destinado a ser polimórfico (enlace estático silencioso); olvidar `virtual` en el destructor de una clase destinada a ser manipulada mediante un puntero a la clase base (fuga de recursos); copiar un objeto polimórfico vía `new Base(*ptr)`, que trunca todo lo específico de la clase hija. |
| **Buenas prácticas** | Declarar siempre `virtual` el destructor de una clase destinada a ser heredada; usar `override` sistemáticamente para que el compilador detecte una firma mal redefinida. Declarar herencia virtual en cuanto un diamante sea posible. |
