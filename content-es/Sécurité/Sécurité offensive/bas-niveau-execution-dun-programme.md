---
order: 1
---

# Cómo se ejecuta realmente un programa

Escribir una función, llamar a otra función, declarar una variable: son gestos familiares en cualquier lenguaje. Este capítulo mira lo que ocurre realmente, una vez compilado el código, en el procesador y la memoria del ordenador. Es la base indispensable para entender cómo un fallo de seguridad de bajo nivel (tratado en los capítulos siguientes) se vuelve explotable.

## El procesador solo trabaja con registros

Un **registro** es un pequeño espacio de almacenamiento integrado directamente en el procesador, con un acceso mucho más rápido que la RAM. Un procesador x86-64 (la arquitectura más habitual en PC) expone varios, cada uno con un papel habitual:

| Registro | Papel habitual |
|---|---|
| `rip` | Dirección de la **siguiente instrucción** a ejecutar (*instruction pointer*) |
| `rsp` | Dirección de la **cima de la pila** (*stack pointer*), detallada más abajo |
| `rbp` | Dirección de **referencia de la función en curso** (*base pointer*), para localizar sus variables locales |
| `rax`, `rbx`, `rcx`, ... | Registros generales: cálculos, valores temporales, valor de retorno de una función (`rax`) |

Un programa compilado no es, en el fondo, más que una larga secuencia de instrucciones muy simples («copia este valor en este registro», «suma estos dos registros», «salta a esta dirección si esta condición es verdadera») que `rip` recorre una por una.

## La pila (stack): dónde viven las llamadas a función

La **pila** (*stack*) es una zona de memoria que almacena, para cada función en ejecución, todo lo que necesita: sus variables locales y la dirección a la que volver una vez terminada. Cada llamada a función apila un nuevo bloque, llamado **frame**, en la cima de la pila; cada retorno de función lo desapila.

```text
llamarA() llama a llamarB(), que a su vez llama a llamarC():

Cima de la pila (rsp)  -->  [ Frame de C: variables locales de C, direccion de retorno a B ]
                             [ Frame de B: variables locales de B, direccion de retorno a A ]
                             [ Frame de A: variables locales de A, direccion de retorno a main ]
Fondo de la pila             [ ... ]
```

La **dirección de retorno**, guardada automáticamente en cada llamada, es lo que permite al programa saber dónde retomar la ejecución una vez terminada la función: es precisamente ese valor el que una corrupción de memoria (capítulo siguiente) puede intentar sobrescribir.

## El montón (heap): la memoria asignada bajo demanda

A diferencia de la pila, que se llena y se vacía automáticamente al ritmo de las llamadas a función, el **montón** (*heap*) es una zona de memoria que el programa reserva y libera explícitamente, cuando lo necesita (ej.: `malloc`/`free` en C), para un dato cuya vida útil no corresponde a ninguna llamada a función concreta (ej.: el contenido de un archivo cargado en memoria, usado mucho después de la función que lo leyó).

| | Pila (stack) | Montón (heap) |
|---|---|---|
| Gestión | Automática, ligada a las llamadas a función | Manual o semiautomática (asignación/liberación explícitas) |
| Velocidad | Muy rápida (basta con desplazar `rsp`) | Más lenta (el sistema debe encontrar un hueco libre) |
| Vida útil de un dato | Lo que dura la función que lo creó | Hasta su liberación explícita, con independencia de la función |
| Error típico | Escribir más allá del espacio reservado (véase corrupción de memoria) | Usar un dato ya liberado (*use-after-free*) |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un programa compilado no es más que una secuencia de instrucciones que `rip` recorre, manipulando registros. La pila almacena automáticamente las variables locales y la dirección de retorno de cada llamada a función; el montón almacena un dato asignado y liberado explícitamente, con una vida útil independiente de una llamada a función concreta. |
| **Herramientas utilizables** | Un depurador (tratado en el capítulo de ingeniería inversa) para observar registros y pila en directo durante la ejecución. |
| **Errores a evitar** | Confundir la pila (rápida, automática, tamaño limitado) con el montón (flexible, gestión manual): la elección equivocada, o un error en su gestión, abre la puerta a los fallos del capítulo siguiente. |
| **Buenas prácticas** | Tener siempre presente que la dirección de retorno guardada en la pila es un dato como cualquier otro en memoria: si un programa puede llegar a sobrescribirla, puede ser secuestrado. |
