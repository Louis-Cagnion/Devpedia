---
order: 7
---

# RAII y los punteros inteligentes

En C (véase el capítulo sobre la gestión de la memoria), cada `malloc()` debe ir seguido de un `free()` manual: si se olvida una sola vez, se produce una fuga de memoria; si se llama dos veces, se produce un fallo del sistema. **RAII** (*Resource Acquisition Is Initialization*) es el principio central de C++ para eliminar toda esta clase de errores, basándose en un mecanismo ya visto: el destructor (véase el capítulo sobre clases y objetos).

## El principio RAII

Un recurso (memoria, archivo, conexión de red...) se adquiera en el **constructor** de un objeto y se libere automáticamente en su **destructor**; cuando el objeto sale del ámbito, el recurso se libera inevitablemente, sin que sea posible olvidarse de esta limpieza:

```cpp
class GestionnaireFichier {
public:
    GestionnaireFichier(const std::string &ruta) {
        archivo.open(ruta);
        if (!archivo.is_open()) {
            throw std::runtime_error("Impossible d'ouvrir : " + ruta); // cf. chapitre sur les exceptions
        }
    }
    ~GestionnaireFichier() { archivo.close(); }   // ¡Se ejecuta automáticamente, incluso en caso de excepción!
private:
    std::ifstream archivo;
};

void traiterFichier() {
    GestionnaireFichier gf("donnees.txt");
    // ... utilizar gf ...
}   // <- Aquí, ~GestionnaireFichier() se ejecuta automáticamente: el archivo se cierra, garantizado
```

> **Nota:** a diferencia de un simple `close()` llamado manualmente al final de una función, RAII garantiza la liberación incluso si una excepción interrumpe la función en pleno desarrollo: el destructor se ejecuta durante el «desenrollado de la pila» (*stack unwinding*) provocado por la excepción, mientras que una llamada manual simplemente se omitiría.

## `new` / `delete`: la versión en C++ de `malloc` / `free`

```cpp
int *p = new int(42);   // asigna e inicializa en una sola operación
delete p;                 // libera

int *matriz = new int[10];   // asigna un array dinámico
delete[] matriz;               // «[]» es obligatorio para liberar un array; de lo contrario, el comportamiento es indefinido.
```

`new` / `delete` sustituyen a `malloc` / `free`, pero presentan exactamente los mismos riesgos (olvido de `delete`, doble `delete`, *uso después de la liberación*, véase el capítulo C sobre la memoria); por eso, en el C++ moderno, rara vez se utilizan **directamente**.

## Los punteros inteligentes (*smart pointers*)

Un puntero inteligente aplica RAII a la propia gestión de la memoria: **es** un objeto cuyo destructor llama automáticamente a `delete` sobre el recurso que posee.

### `unique_ptr` : propiedad exclusiva

```cpp
#include <memory>

std::unique_ptr<int> p = std::make_unique<int>(42);
std::cout << *p;   // 42 -> se desreferencia como un puntero sin tipo

// No hace falta usar «delete»: cuando «p» sale del ámbito, la memoria se libera automáticamente.
```

Un «`unique_ptr`» solo puede tener un propietario; está prohibido copiarlo (error de compilación), solo es posible el «`std::move`», que transfiere la propiedad de un «`unique_ptr`» a otro:

```cpp
std::unique_ptr<int> p1 = std::make_unique<int>(42);
std::unique_ptr<int> p2 = std::move(p1);   // p2 pasa a ser propietario, p1 pasa a ser nullptr
```

### `shared_ptr` : propiedad compartida, con recuento de referencias

```cpp
std::shared_ptr<int> p1 = std::make_shared<int>(42);
std::shared_ptr<int> p2 = p1;   // OK, copia autorizada: p1 y p2 comparten el mismo recurso

// La memoria solo se libera cuando se destruye el ÚLTIMO shared_ptr que hace referencia a ella.
```

Cada `shared_ptr` incrementa un contador de referencias compartido; el recurso solo se libera automáticamente cuando dicho contador llega a cero.

> **Nota:** `shared_ptr` tiene un coste (el contador de referencias, actualizado de forma thread-safe) superior al de `unique_ptr` — debe reservarse para los casos en los que un recurso tenga realmente varios propietarios legítimos, no por defecto.

## Resumen

| | `new` / `delete` brut | `unique_ptr` | `shared_ptr` |
|---|---|---|---|
| Liberación automática | No | Sí | Sí |
| Número de propietarios | N/A | Uno solo | Varios |
| Coste | Mínimo | Prácticamente nulo (sin sobrecoste en la ejecución) | Recuento de referencias (ligero sobrecoste) |

> **Buenas prácticas en C++ moderno:** nunca utilices `new` / `delete` directamente en el código de la aplicación; opta siempre por `unique_ptr` (por defecto) o `shared_ptr` (si realmente es necesario compartir el objeto), para beneficiarte de RAII sin tener que pensar en ello cada vez.
