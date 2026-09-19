---
order: 3
---

# Las clases y objetos

Una **clase** de C++ agrupa en un mismo lugar lo que un [`struct` de C](/?c=langages-de-programmation&s=c&p=variables) separa en dos: los datos Y las funciones que los manipulan, con además un control explícito de lo que es visible desde el exterior.

## Declarar una clase

```cpp
class Vehiculo {
public:
    // const&: evita copiar las cadenas recibidas (véase Las referencias)
    Vehiculo(const std::string &marca, const std::string &modelo)
        : marca(marca), modelo(modelo) {}

    std::string descripcion() const {
        return marca + " " + modelo;
    }

private:
    std::string marca;
    std::string modelo;
};

Vehiculo v("Peugeot", "308");
std::cout << v.descripcion();   // "Peugeot 308"
```

- `public`: accesible desde fuera de la clase.
- `private`: accesible únicamente desde dentro de la clase (los métodos de `Vehiculo`).
- `protected`: como `private`, pero también accesible a las clases que heredan de esta (véase [Herencia y polimorfismo](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme)).

> **Nota:** a diferencia de un `struct` de C (donde todos los datos son de libre acceso), una clase de C++ oculta por defecto sus miembros (`private` implícito): es la **encapsulación**, el exterior solo interactúa con lo que la clase expone voluntariamente.

## El constructor, en dos formas de escritura

```cpp
// Lista de inicialización (preferida): inicializa directamente, sin pasar por una asignación
Vehiculo(std::string marca, std::string modelo) : marca(marca), modelo(modelo) {}

// Equivalente con asignación en el cuerpo (funciona, pero es menos idiomático)
Vehiculo(std::string marca, std::string modelo) {
    this->marca = marca;
    this->modelo = modelo;
}
```

La lista de inicialización (tras los `:`) construye directamente cada miembro con el valor correcto, en lugar de construirlo una primera vez (valor por defecto) y luego sobrescribirlo en el cuerpo del constructor: un detalle de rendimiento que se vuelve significativo para objetos costosos de construir.

## El destructor

```cpp
class GestorArchivo {
public:
    GestorArchivo(const std::string &ruta) {
        archivo.open(ruta);
    }

    ~GestorArchivo() {   // se llama AUTOMÁTICAMENTE cuando el objeto sale de ámbito
        archivo.close();
    }

private:
    std::ifstream archivo;
};
```

El destructor (`~NombreClase()`) se ejecuta automáticamente en cuanto el objeto se destruye (fin de ámbito para un objeto local, `delete` para un objeto asignado dinámicamente): es la base del mecanismo [RAII](/?c=langages-de-programmation&s=cpp&p=gestion-memoire-raii), central en C++ para no olvidar nunca liberar un recurso.

## La forma canónica ortodoxa (Rule of Three)

Una clase que gestiona ella misma un recurso (memoria asignada dinámicamente, un archivo abierto...) debe definir cuatro miembros especiales juntos, nunca solo algunos: el constructor por defecto, el **constructor de copia**, el **operador de asignación por copia**, y el destructor (visto más arriba). Esta convención se llama la **forma canónica ortodoxa** (*Rule of Three*).

```cpp
class Arreglo {
public:
    Arreglo(int tamano) : tamano(tamano), datos(new int[tamano]) {}

    // Constructor de copia: construye un NUEVO objeto a partir de otro ya existente
    Arreglo(const Arreglo &otro) : tamano(otro.tamano), datos(new int[otro.tamano]) {
        for (int i = 0; i < tamano; i++) datos[i] = otro.datos[i];
    }

    // Operador de asignación por copia: copia DENTRO de un objeto ya construido
    Arreglo &operator=(const Arreglo &otro) {
        if (this != &otro) {   // protección contra la autoasignación (a = a)
            delete[] datos;
            tamano = otro.tamano;
            datos = new int[tamano];
            for (int i = 0; i < tamano; i++) datos[i] = otro.datos[i];
        }
        return *this;   // permite el encadenamiento: a = b = c
    }

    ~Arreglo() { delete[] datos; }

private:
    int tamano;
    int *datos;
};
```

Sin constructor de copia ni operador de asignación explícitos, C++ genera versiones por defecto que copian cada miembro **tal cual** (una copia superficial): para un puntero como `datos`, eso copia la dirección, nunca los datos apuntados. Dos objetos terminarían entonces compartiendo el mismo bloque de memoria, y el primer destructor que se ejecute liberaría memoria que el otro objeto todavía cree válida.

> **Trampa:** olvidar la comprobación `this != &otro` en el operador de asignación. En una **autoasignación** (`a = a`), `delete[] datos` liberaría la memoria antes de que el bucle intente releerla desde sí misma: un use-after-free sobre sus propios datos.
>
> **Buena práctica:** implementar los cuatro miembros juntos en cuanto uno solo sea necesario, nunca un subconjunto: un constructor de copia sin operador de asignación correspondiente (o al revés) es una señal fuerte de olvido, no una elección deliberada.

## Métodos `const`

```cpp
// "const" aquí: garantiza que este método NO modifica el objeto
std::string descripcion() const {
    return marca + " " + modelo;
}
```

Marcar un método como `const` documenta y hace respetar por el compilador que no modifica ningún miembro del objeto: útil en particular para permitir llamar a ese método sobre un objeto declarado a su vez como `const`.

## Miembros y métodos estáticos

```cpp
class Contador {
public:
    Contador() { totalCreados++; }
    static int totalCreados;   // compartido por TODAS las instancias, no uno por objeto
};

int Contador::totalCreados = 0;   // definición obligatoria fuera de la clase
```

Véase también [Herencia y polimorfismo](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme) y [La sobrecarga de operadores](/?c=langages-de-programmation&s=cpp&p=surcharge-d-operateurs), para extender el comportamiento de una clase más allá de simples métodos con nombre.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una clase agrupa datos y métodos, con un control de acceso (`public`/`private`/`protected`). El constructor inicializa el objeto, el destructor libera sus recursos automáticamente al final de su ámbito. |
| **Herramientas utilizables** | Lista de inicialización (`: miembro(valor)`), métodos `const`, miembros/métodos `static`. Constructor de copia y operador de asignación para una clase que gestiona un recurso. |
| **Trampas a evitar** | Olvidar que una clase oculta sus miembros por defecto (`private` implícito), a diferencia de un `struct` de C, enteramente público. Olvidar la protección contra la autoasignación en `operator=`. |
| **Buenas prácticas** | Preferir la lista de inicialización a una asignación en el cuerpo del constructor; marcar `const` todo método que no modifique el objeto. Implementar los cuatro miembros de la forma canónica juntos, nunca un subconjunto. |
