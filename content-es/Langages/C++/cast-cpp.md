---
order: 11
---

# Los cast en C++

Convertir un valor de un tipo a otro se llama un **cast**. En C existe una única sintaxis: `(tipo)valor`. C++ propone cuatro distintas, cada una reservada a una intención precisa: esta precisión permite al compilador (y a un futuro lector del código) saber de inmediato qué tipo de conversión está en juego, en lugar de tener que adivinarlo.

## ¿Por qué no simplemente `(tipo)valor`?

El cast al estilo C efectúa **silenciosamente** cualquier conversión solicitada, incluso las más arriesgadas (quitar un `const`, reinterpretar bytes, descender en una jerarquía de clases sin verificación), sin distinción visible entre una conversión inocua y una conversión peligrosa:

```cpp
int entero = 65;
char letra = (char)entero;           // conversion numerica inocua
const char *texto = "hola";
char *modificable = (char *)texto;   // quita un "const": mucho mas arriesgado, pero sintaxis identica
```

Los cuatro cast de C++ hacen esta distinción explícita, y sobre todo **localizable**: `grep -r "reinterpret_cast"` encuentra de inmediato todos los puntos de riesgo de un proyecto, algo que un cast al estilo C no permite.

## `static_cast`: las conversiones conocidas en la compilación

`static_cast` cubre las conversiones "normales", cuya validez puede verificar el compilador sin información adicional en tiempo de ejecución: conversiones numéricas, conversión explícita a un tipo para el que existe un constructor, o subida (*upcast*) en una [jerarquía de clases](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme) (de una clase derivada a su clase base).

```cpp
double precio = 19.99;
int redondeado = static_cast<int>(precio); // conversion numerica explicita

Derivada derivada;
Base *base = static_cast<Base *>(&derivada); // upcast: siempre valido
```

## `dynamic_cast`: el descenso seguro en una jerarquía

Descender (*downcast*) de una clase base a una clase derivada es arriesgado: el puntero de base puede, en realidad, apuntar a cualquier clase derivada de la jerarquía, no forzosamente a la buscada. `dynamic_cast` verifica esto **en tiempo de ejecución**, gracias al [RTTI](https://en.cppreference.com/w/cpp/language/rtti) (*Run-Time Type Information*, la información de tipo conservada por las clases polimórficas):

```cpp
Base *base = obtenerUnObjeto(); // devuelve un puntero a un tipo derivado desconocido en la compilacion

Derivada *derivada = dynamic_cast<Derivada *>(base);
if (derivada != nullptr) {
    // el cast tuvo exito: "base" apuntaba realmente a una "Derivada"
} else {
    // el cast fallo: "base" apuntaba a otro tipo derivado
}
```

> **Nota:** `dynamic_cast` exige que la clase base contenga al menos una función `virtual` (véase [Herencia y polimorfismo](/?c=langages-de-programmation&s=cpp&p=heritage-et-polymorphisme)): sin ella, no hay ninguna información de tipo disponible en tiempo de ejecución, y el compilador rechaza la compilación.

| Destino del `dynamic_cast` | En caso de fallo |
|---|---|
| Un puntero (`Derivada *`) | Devuelve `nullptr` |
| Una referencia (`Derivada &`) | Lanza una [excepción](/?c=langages-de-programmation&s=cpp&p=exceptions) `std::bad_cast` |

## `const_cast`: añadir o quitar un `const`

`const_cast` es el único de los cuatro que **nunca** cambia el tipo subyacente ni la representación binaria del valor: solo añade o quita la calificación `const`.

```cpp
void apiAntigua(char *cadena); // funcion externa que nunca modifica "cadena", pero no lo declara

void llamar(const char *texto)
{
    apiAntigua(const_cast<char *>(texto)); // quita el "const" para satisfacer la firma
}
```

> **Trampa:** usar `const_cast` para modificar un dato que estaba **realmente** declarado `const` en origen (y no simplemente pasado a través de una firma de función mal declarada): el comportamiento es entonces indefinido. `const_cast` solo se justifica para sortear una API externa imprecisa, nunca para modificar una constante real.

## `reinterpret_cast`: reinterpretar los bytes en bruto

`reinterpret_cast` es el más peligroso de los cuatro: reinterpreta la representación binaria de un valor como si fuera de otro tipo, sin ninguna verificación ni conversión real de los datos (a diferencia de `static_cast`, que convierte un valor numérico real).

```cpp
int valor = 42;
int *punteroInt = &valor;

uintptr_t direccionBruta = reinterpret_cast<uintptr_t>(punteroInt); // el puntero, visto como un simple entero
```

Reservado a casos de bajo nivel (manipulación de punteros en bruto, interfaz con hardware, serialización binaria): un uso fuera de este contexto es casi siempre señal de un problema de diseño en otra parte.

## Vista de conjunto

| Cast | Verificado en | Uso típico |
|---|---|---|
| `static_cast` | La compilación | Conversiones numéricas, upcast en una jerarquía |
| `dynamic_cast` | La ejecución | Downcast seguro en una jerarquía polimórfica |
| `const_cast` | Ni una ni otra (sin verificación) | Añadir/quitar `const` para una API externa |
| `reinterpret_cast` | Ni una ni otra (sin verificación) | Reinterpretación de bajo nivel de la representación binaria |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | C++ sustituye el cast único de C por 4 cast distintos, cada uno reservado a una intención precisa y localizable en el código. |
| **Herramientas utilizables** | `static_cast` (conversiones seguras), `dynamic_cast` (downcast verificado), `const_cast` (const), `reinterpret_cast` (bajo nivel). |
| **Trampas a evitar** | Usar `const_cast` para modificar un valor realmente `const` (comportamiento indefinido); usar `reinterpret_cast` fuera de un contexto de bajo nivel justificado. |
| **Buenas prácticas** | Verificar siempre el resultado de un `dynamic_cast` sobre un puntero (`nullptr` posible); preferir el cast más restrictivo posible en lugar de `reinterpret_cast` por comodidad. |
