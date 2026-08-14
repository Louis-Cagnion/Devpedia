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
    Perro(std::string nombre) : Animal(nombre) {}   // llama explícitamente al constructor padre
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
    virtual std::string hablar() const { return "..."; }  // "virtual" activa el ENLACE DINÁMICO
    virtual ~Animal() {}                                  // destructor virtual: véase la nota más abajo
protected:
    std::string nombre;
};

class Perro : public Animal {
public:
    Perro(std::string nombre) : Animal(nombre) {}
    std::string hablar() const override { return nombre + " ladra"; }   // "override": comprobado por el compilador
};

Animal *a = new Perro("Rex");
std::cout << a->hablar();   // "Rex ladra" -> se llama a la versión CORRECTA, gracias a "virtual"
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

## Clases abstractas: imponer un contrato sin implementación

```cpp
class FormaGeometrica {
public:
    virtual double area() const = 0;   // "= 0": función PURAMENTE virtual, sin implementación aquí
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
FormaGeometrica *imposible = new FormaGeometrica();      // ERROR: clase abstracta, no instanciable
```

Una clase que contiene al menos un método puramente virtual (`= 0`) se convierte en **abstracta**: nunca puede instanciarse directamente, solo heredarse; define un contrato ("toda forma geométrica debe saber calcular su área") que cada clase hija debe implementar.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La herencia reutiliza el comportamiento de una clase padre. `virtual` activa el enlace dinámico (el tipo real del objeto decide qué método se llama), indispensable para el polimorfismo. Una clase abstracta (método `= 0`) impone un contrato sin implementación. |
| **Herramientas utilizables** | `virtual`, `override`, destructor `virtual`, clases abstractas. |
| **Trampas a evitar** | Olvidar `virtual` en un método destinado a ser polimórfico (enlace estático silencioso); olvidar `virtual` en el destructor de una clase destinada a ser manipulada mediante un puntero a la clase base (fuga de recursos). |
| **Buenas prácticas** | Declarar siempre `virtual` el destructor de una clase destinada a ser heredada; usar `override` sistemáticamente para que el compilador detecte una firma mal redefinida. |
