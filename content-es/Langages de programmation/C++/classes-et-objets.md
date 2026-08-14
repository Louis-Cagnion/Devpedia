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
    Vehiculo(const std::string &marca, const std::string &modelo) : marca(marca), modelo(modelo) {}

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

## Métodos `const`

```cpp
std::string descripcion() const {   // "const" aquí: garantiza que este método NO modifica el objeto
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
| **Herramientas utilizables** | Lista de inicialización (`: miembro(valor)`), métodos `const`, miembros/métodos `static`. |
| **Trampas a evitar** | Olvidar que una clase oculta sus miembros por defecto (`private` implícito), a diferencia de un `struct` de C, enteramente público. |
| **Buenas prácticas** | Preferir la lista de inicialización a una asignación en el cuerpo del constructor; marcar `const` todo método que no modifique el objeto. |
