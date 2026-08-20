---
order: 3
---

# El formato JSON

Una [API](/?c=infrastructure&p=api-et-http) responde con datos; hace falta todavía un formato común para escribirlos, que el programa que los recibe pueda entender sin ambigüedad. **JSON** (*JavaScript Object Notation*) es el formato más usado para esto: un texto estructurado, legible tanto por un humano como por un programa.

## Los tipos de valores en JSON

| Tipo | Ejemplo | Observación |
|---|---|---|
| Texto (*string*) | `"Lyon"` | Siempre entre comillas dobles |
| Número | `18`, `3.14` | Nunca entre comillas |
| Booleano | `true`, `false` | |
| Valor ausente | `null` | "Ningún valor", no es lo mismo que un texto vacío `""` o un `0` |
| Lista (*array*) | `[1, 2, 3]` | Una secuencia ordenada de valores |
| Objeto | `{"clave": valor}` | Un conjunto de pares clave/valor |

Texto, número y booleano son los mismos tipos básicos ya vistos en [la variable](/?c=bases-de-l-informatique&p=la-variable); JSON añade la lista y el objeto, para representar datos compuestos por varios valores.

## Un ejemplo concreto

```json
{
  "ciudad": "Lyon",
  "temperatura": 18,
  "nublado": true,
  "previsiones": [19, 21, 17],
  "estacion": null
}
```

Un objeto (delimitado por `{ }`) asocia cada clave (`"ciudad"`, `"temperatura"`...) a un valor: aquí un texto, un número, un booleano, una lista de números, y un valor ausente.

## Objetos y listas pueden anidarse

Nada impide que una lista contenga objetos, o que un objeto contenga una lista; es incluso la estructura más común para datos reales:

```json
{
  "clientes": [
    {"nombre": "Dupont", "edad": 34},
    {"nombre": "Martin", "edad": 28}
  ]
}
```

Aquí, `clientes` es una lista de dos objetos, cada uno con sus propias claves `nombre` y `edad`.

> **Trampa:** perder el hilo del anidamiento en un JSON profundamente anidado (objetos en listas en objetos...) y acceder al valor equivocado, en particular escrito o releído a mano.
>
> **Buena práctica:** usar una herramienta que formatee y coloree el JSON (la mayoría de los editores de código lo hacen nativamente) para detectar visualmente qué llave o qué corchete corresponde a cuál, en lugar de releerlo como texto plano.

## JSON no acepta cualquier cosa

A diferencia de muchos formatos de configuración, JSON es estricto: sin comentarios, sin coma después del último elemento de una lista o un objeto, y las claves deben ir entre comillas **dobles** (nunca simples).

```json
{
  "nombre": "Juan",
  "edad": 30,   <- una coma aqui, despues del ultimo elemento, es un error de sintaxis
}
```

> **Trampa:** añadir un comentario (`// ...`) o una coma final por costumbre de otro lenguaje. Un JSON inválido por esta razón falla explícitamente al analizarlo (el programa que intenta leerlo lanza un error), nunca se interpreta "más o menos".
>
> **Buena práctica:** validar un JSON escrito a mano con una herramienta dedicada (linter, validador en línea, o simplemente el editor de código) antes de usarlo, en lugar de descubrir el error de sintaxis una vez lanzado el programa.

## Convertir entre JSON y un programa

Un texto JSON sigue siendo una simple cadena de caracteres mientras no haya sido **analizado** (*parsed*): transformado en una estructura de datos que el lenguaje puede manipular directamente (acceder a una clave, recorrer una lista...). La operación inversa (reconvertir una estructura de datos en texto JSON) se llama **generación** o **serialización**:

```text
texto_json = '{"ciudad": "Lyon", "temperatura": 18}'

dato = analizar_json(texto_json)     // texto -> estructura nativa del lenguaje
dato.temperatura                     // 18, utilizable como un número normal

nuevo_texto = generar_json(dato)     // estructura -> texto JSON de nuevo
```

> **Trampa:** intentar extraer un valor directamente del texto bruto (búsqueda de un patrón, división de cadena) en lugar de analizar el JSON correctamente: un valor que contiene por coincidencia la misma secuencia de caracteres que la clave buscada en otra parte del texto puede falsear el resultado.
>
> **Buena práctica:** pasar siempre por una función de análisis JSON dedicada (presente nativamente en casi todos los lenguajes) en lugar de tratar el JSON como texto ordinario.

## Resumen

| | |
|---|---|
| **Para recordar** | JSON representa datos estructurados en texto, con objetos (clave/valor) y listas, que pueden anidarse libremente. Es el formato más común para los intercambios vía una API. |
| **Herramientas utilizables** | Un editor de código (resaltado de sintaxis, formato automático); un validador JSON en línea; la función de análisis JSON nativa del lenguaje usado. |
| **Trampas a evitar** | Añadir un comentario o una coma después del último elemento (sintaxis inválida). Manipular JSON como texto plano en lugar de analizarlo. |
| **Buenas prácticas** | Validar un JSON escrito a mano antes de usarlo. Pasar siempre por una función de análisis dedicada para extraer un valor de él. |
