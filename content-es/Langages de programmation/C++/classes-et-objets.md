---
order: 3
---

# Las clases y los objetos

Una **clase** de C++ agrupa en un mismo lugar lo que un «`struct`» de C (véase el capítulo dedicado a este tema) separa en dos: los datos y las funciones que los manipulan, además de ofrecer un control explícito sobre lo que es visible desde el exterior.

## Declarar una clase

```cpp
class Vehicule {
public:
    // const&: evita copiar las cadenas recibidas (véase el capítulo sobre referencias)
    Vehicule(const std::string &marca, const std::string &modelo) : marca(marca), modelo(modelo) {}

    std::string description() const {
        return marca + " " + modelo;
    }

private:
    std::string marca;
    std::string modelo;
};

Vehicule v("Peugeot", "308");
std::cout << v.description();   // «Peugeot 308»
```

- `public` : accesible desde fuera del aula.
- `private` : accesible únicamente desde dentro de la clase (los métodos de «`Vehicule`»).
- `protected` : igual que `private`, pero también accesible para las clases que heredan de ella (véase el capítulo sobre herencia).

> **Nota:** a diferencia de un`struct`e en C (donde se puede acceder libremente a todos los datos), una clase en C++ oculta por defecto sus miembros (con un `private`e implícito); esto es lo que se **conoce como encapsulación**: el exterior solo interactúa con lo que la clase expone voluntariamente.

## El constructor, en dos formas de escritura

```cpp
// Lista de inicialización (preferida): inicializa directamente, sin pasar por una asignación
Vehicule(std::string marca, std::string modelo) : marca(marca), modelo(modelo) {}

// Equivalente con asignación en el cuerpo (funciona, pero es menos idiomático)
Vehicule(std::string marca, std::string modelo) {
    this->marca = marca;
    this->modelo = modelo;
}
```

La lista de inicialización (tras el `:`) crea directamente cada miembro con el valor correcto, en lugar de crearlo una primera vez (con el valor por defecto) y luego sobrescribirlo en el cuerpo del constructor; un detalle de rendimiento que cobra importancia en el caso de objetos cuya creación resulta costosa.

## El destructor

```cpp
class GestionnaireFichier {
public:
    GestionnaireFichier(const std::string &ruta) {
        archivo.open(ruta);
    }

    ~GestionnaireFichier() {   // Se invoca AUTOMÁTICAMENTE cuando el objeto sale del ámbito.
        archivo.close();
    }

private:
    std::ifstream archivo;
};
```

El destructor (`~NomClasse()`) se ejecuta automáticamente en cuanto se destruye el objeto (fin del ámbito para un objeto local, `delete` para un objeto asignado dinámicamente); es la base del mecanismo RAII (véase el capítulo dedicado a este tema), fundamental en C++ para no olvidarse nunca de liberar un recurso.

## Métodos`const`

```cpp
std::string description() const {   // «const» aquí: garantiza que este método NO modifica el objeto
    return marca + " " + modelo;
}
```

Al marcar un método c`const`, se documenta y se garantiza que el compilador respete que dicho método no modifique ningún miembro del objeto, lo cual resulta especialmente útil para permitir la llamada a este método sobre un objeto declarado a su vez como «`const`».

## Miembros y métodos estáticos

```cpp
class Contador {
public:
    Contador() { totalCrees++; }
    static int totalCrees;   // compartida por TODAS las instancias, no una por objeto
};

int Contador::totalCrees = 0;   // Definición obligatoria fuera de la clase
```

Véase también el capítulo sobre herencia y polimorfismo, así como sobre la sobrecarga de operadores, para ampliar el comportamiento de una clase más allá de los simples métodos con nombre.
