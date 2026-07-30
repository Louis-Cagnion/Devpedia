---
order: 4
---

# Herencia y polimorfismo

**La herencia** permite que una clase reutilice (y amplíe o modifique) el comportamiento de otra. El **polimorfismo** permite tratar objetos de clases diferentes de manera uniforme, a través de una interfaz común: el mecanismo más potente —y a menudo más malinterpretado— de la programación orientada a objetos (POO) en C++.

## Herencia simple

```cpp
class Animal {
public:
    Animal(std::string número) : número(número) {}
    std::string parler() const { return "..."; }
protected:
    std::string número;
};

class Chien : public Animal {
public:
    Chien(std::string número) : Animal(número) {}   // llama explícitamente al constructor principal
    std::string parler() const { return número + " aboie"; }
};
```

## El problema «sin`virtual`»

```cpp
Animal *a = new Chien("Rex");
std::cout << a->parler();   // muestra «...» -> ¡NO «Rex ladra»!
```

> **Trampa clásica:** sin la palabra clave «`virtual`», C++ elige qué versión de «`parler()`» llamar basándose en el **tipo declarado** del puntero (`Animal*`), y no en el tipo real del objeto al que apunta (`Chien`); un mecanismo denominado *«enlace estático*». El resultado parece «ignorar» la herencia, lo que a menudo sorprende cuando se viene de un lenguaje como PHP, Python o Java, donde este comportamiento es automático.

## Cómo hacer que un método sea polimórfico: `virtual`

```cpp
class Animal {
public:
    Animal(std::string número) : número(número) {}
    virtual std::string parler() const { return "..."; }   // «virtual» activa la VINCULACIÓN DINÁMICA
    virtual ~Animal() {}   // destructor virtual: véase la nota más abajo
protected:
    std::string número;
};

class Chien : public Animal {
public:
    Chien(std::string número) : Animal(número) {}
    std::string parler() const override { return número + " aboie"; }   // «override»: comprobado por el compilador
};

Animal *a = new Chien("Rex");
std::cout << a->parler();   // «Rex ladra» -> se llama a la versión CORRECTA, gracias a «virtual»
delete a;
```

`virtual` permite elegir el método que se va a llamar en función del **tipo real** del objeto, lo cual se resuelve en tiempo de ejecución (*enlace dinámico*) en lugar de en tiempo de compilación; este mecanismo es el que permite el polimorfismo: una misma línea de código (`a->parler()`) se comporta de forma diferente según el objeto al que realmente apunte.

> **Nota:** «`override`» (opcional, pero muy recomendable) indica al compilador que compruebe que este método redefine efectivamente un método «`virtual`» de la clase padre; un error tipográfico en la firma (número de parámetros, «`const`» omitido...) se convierte entonces en un error de compilación, en lugar de un error silencioso en el que el método padre seguiría llamándose sin que nos diéramos cuenta.

## ¿Por qué el destructor también debe ser «`virtual`»?

```cpp
Animal *a = new Chien("Rex");
delete a;   // sin destructor virtual: SOLO se llama a ~Animal(), nunca a ~Chien()
```

Si no se e`virtual`e el destructor, al eliminar un objeto `Chien` mediante un puntero `Animal*` solo se ejecuta el destructor de `Animal`; cualquier recurso propio de `Chien` (memoria asignada, archivo abierto...) nunca se liberaría. Por lo tanto, toda clase destinada a ser heredada y manipulada mediante un puntero base debe declarar sistemáticamente su destructor `virtual`.

## Clases abstractas: imponer un contrato sin implementación

```cpp
class FormeGeometrique {
public:
    virtual double aire() const = 0;   // «= 0»: función PURAMENTE virtual, sin implementación aquí
    virtual ~FormeGeometrique() {}
};

class Cercle : public FormeGeometrique {
public:
    Cercle(double rayon) : rayon(rayon) {}
    double aire() const override { return 3.14159 * rayon * rayon; }
private:
    double rayon;
};

FormeGeometrique *forme = new Cercle(5);   // De acuerdo
FormeGeometrique *impossible = new FormeGeometrique();   // ERROR: clase abstracta, no instanciable
```

Una clase que contenga al menos un método puramente virtual (`= 0`) se convierte **en** **abstracta**: nunca puede instanciarse directamente, solo heredarse; define un contrato («toda forma geométrica debe saber calcular su área») que cada clase hija debe implementar.
