---
order: 7
---

# RAII y los punteros inteligentes

En C (véase [La gestión de la memoria](/?c=langages-de-programmation&s=c&p=memoire)), cada `malloc()` debe ir seguido de un `free()` manual: si se olvida una sola vez, se produce una fuga de memoria; si se llama dos veces, un fallo del sistema. **RAII** (*Resource Acquisition Is Initialization*) es el principio central de C++ para eliminar toda esta clase de errores, apoyándose en un mecanismo ya visto: el destructor (véase [Clases y objetos](/?c=langages-de-programmation&s=cpp&p=classes-et-objets)).

## El principio RAII

Un recurso (memoria, archivo, conexión de red...) se adquiere en el **constructor** de un objeto y se libera automáticamente en su **destructor**; cuando el objeto sale del ámbito, el recurso se libera obligatoriamente, sin que sea posible olvidar esta limpieza:

```cpp
class GestorArchivo {
public:
    GestorArchivo(const std::string &ruta) {
        archivo.open(ruta);
        if (!archivo.is_open()) {
            throw std::runtime_error("No se pudo abrir: " + ruta); // véase el capítulo sobre excepciones
        }
    }
    ~GestorArchivo() { archivo.close(); }   // se ejecuta automáticamente, ¡incluso en caso de excepción!
private:
    std::ifstream archivo;
};

void procesarArchivo() {
    GestorArchivo ga("datos.txt");
    // ... usar ga ...
}   // <- aquí, ~GestorArchivo() se ejecuta automáticamente: el archivo se cierra, garantizado
```

> **Nota:** a diferencia de un simple `close()` llamado manualmente al final de una función, RAII garantiza la liberación incluso si una excepción interrumpe la función a mitad de camino: el destructor se ejecuta durante el "desenrollado de la pila" (*stack unwinding*) provocado por la excepción, mientras que una llamada manual simplemente se saltaría.

## `new`/`delete`: la versión en C++ de `malloc`/`free`

```cpp
int *p = new int(42);  // asigna E inicializa en una sola operación
delete p;              // libera

int *matriz = new int[10];  // asigna un array dinámico
delete[] matriz;            // "[]" obligatorio para liberar un array, si no, comportamiento indefinido
```

`new`/`delete` sustituyen a `malloc`/`free`, pero presentan exactamente los mismos riesgos (olvido de `delete`, doble `delete`, *use-after-free*, véase [La gestión de la memoria](/?c=langages-de-programmation&s=c&p=memoire) en C): por eso, en C++ moderno, rara vez se usan **directamente**.

## Los punteros inteligentes (*smart pointers*)

Un puntero inteligente aplica RAII a la propia gestión de la memoria: **es** un objeto cuyo destructor llama automáticamente a `delete` sobre el recurso que posee.

### `unique_ptr`: propiedad exclusiva

```cpp
#include <memory>

std::unique_ptr<int> p = std::make_unique<int>(42);
std::cout << *p;   // 42 -> se desreferencia como un puntero bruto

// NO hace falta delete: cuando p sale del ámbito, la memoria se libera automáticamente
```

Un `unique_ptr` solo puede tener un **único** propietario: copiarlo está prohibido (error de compilación); solo es posible el desplazamiento (`std::move`), que transfiere la propiedad de un `unique_ptr` a otro:

```cpp
std::unique_ptr<int> p1 = std::make_unique<int>(42);
std::unique_ptr<int> p2 = std::move(p1);   // p2 pasa a ser el propietario, p1 pasa a ser nullptr
```

### `shared_ptr`: propiedad compartida, con recuento de referencias

```cpp
std::shared_ptr<int> p1 = std::make_shared<int>(42);
std::shared_ptr<int> p2 = p1;   // OK, copia permitida: p1 Y p2 comparten el mismo recurso

// la memoria solo se libera cuando se destruye el ÚLTIMO shared_ptr que la referencia
```

Cada `shared_ptr` incrementa un contador de referencias compartido; el recurso solo se libera automáticamente cuando dicho contador llega a cero.

> **Nota:** `shared_ptr` tiene un coste (el contador de referencias, actualizado de forma **thread-safe**: sin riesgo de [race condition](/?c=langages-de-programmation&s=c&p=threads) si varios hilos lo modifican a la vez) superior al de `unique_ptr`: hay que reservarlo para los casos en los que un recurso tenga realmente varios propietarios legítimos, no por defecto.

## Resumen

| | `new`/`delete` puro | `unique_ptr` | `shared_ptr` |
|---|---|---|---|
| Liberación automática | No | Sí | Sí |
| Número de propietarios | N/D | Uno solo | Varios |
| Coste | Mínimo | Prácticamente nulo (sin sobrecoste en la ejecución) | Recuento de referencias (ligero sobrecoste) |

> **Buena práctica en C++ moderno:** nunca uses `new`/`delete` directamente en el código de la aplicación; prefiere siempre `unique_ptr` (por defecto) o `shared_ptr` (si realmente es necesario compartir), para beneficiarte de RAII sin tener que pensar en ello cada vez.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | RAII vincula la adquisición de un recurso al constructor y su liberación al destructor: el recurso se libera obligatoriamente en cuanto el objeto sale del ámbito, incluso en caso de excepción. `unique_ptr`/`shared_ptr` aplican este principio a la memoria. |
| **Herramientas utilizables** | `unique_ptr` (propiedad exclusiva), `shared_ptr` (propiedad compartida, recuento de referencias), `std::move`. |
| **Trampas a evitar** | Usar `new`/`delete` directamente en código de aplicación moderno: los mismos riesgos que `malloc`/`free` (fuga, doble liberación, use-after-free). |
| **Buenas prácticas** | Preferir siempre `unique_ptr` por defecto, y `shared_ptr` solo si realmente es necesario compartir. |
