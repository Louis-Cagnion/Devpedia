---
order: 6
---

# Genericidad: depender de la estructura en lugar de valores fijos

Un código que funciona hoy puede sin embargo ser frágil si depende de valores propios de un caso particular (un identificador preciso, un nombre de formato, un valor que solo existe en el conjunto de datos actual) en lugar de la **forma** general de los datos que recibe. El síntoma no aparece de inmediato: el código se rompe silenciosamente, o debe modificarse a mano, en cuanto los datos cambian o provienen de una fuente diferente.

## El síntoma

```python
def extensions_for(format_name):
    if format_name == "csv":
        return [".csv"]
    elif format_name == "json":
        return [".json"]
    elif format_name == "html":
        return [".html", ".htm"]
    elif format_name == "htm":
        return [".html", ".htm"]
    elif format_name == "xml":
        return [".xml"]
```

Esta función no depende de ninguna estructura: codifica, de forma fija, un conocimiento que ya existe en otro lugar del código (qué extensiones de archivo corresponden a qué formato). Añadir un formato supone acordarse de venir a completar esta lista, además de cualquier otra lista similar en otro lugar: un problema de [fuente única de verdad](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite) que aquí se trata en la raíz, derivando el comportamiento de la estructura de los datos en lugar de valores citados uno por uno.

## La versión genérica

Si la información "qué extensiones para qué formato" ya está presente en un registro centralizado (ver el capítulo sobre la [fuente única de verdad](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite)), la función ya no necesita conocer ningún formato por su nombre:

```python
def extensions_for(format_name):
    return FORMAT_REGISTRY[format_name]["extensions"]
```

Un nuevo formato ya no exige ninguna modificación de `extensions_for`: basta con añadir su entrada al registro, porque la función lee la **estructura** del registro en lugar de reaccionar a valores que conoce de antemano.

## Reconocer la señal

La señal de alerta es un `if`/`elif`/`switch` cuya cada rama comprueba un valor preciso (un identificador, un nombre) que ya existe, de una forma u otra, en un dato o una estructura accesible en otro lugar del programa. Si esta estructura ya existe, duplicarla en forma de ramas condicionales es una señal de que debería consultarse directamente. Si aún no existe, a menudo es la señal de que hay que crearla.

## El límite: no generalizar un caso que seguirá siendo único

Este principio no justifica construir una estructura genérica para un caso que, por naturaleza, nunca tendrá más que un solo valor: un tratamiento realmente específico de un único formato no necesita un mecanismo de configuración generalizado, eso sería sobreingeniería ([YAGNI](https://martinfowler.com/bliki/Yagni.html)). La genericidad se justifica cuando el número de casos está destinado a variar; se vuelve un costo innecesario cuando estructuralmente no varía.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un código que comprueba valores precisos (`if format_name == "csv"`) en lugar de leer la estructura de los datos ya disponibles se rompe silenciosamente en cuanto los datos cambian o provienen de otra parte. |
| **Herramientas utilizables** | Derivar un comportamiento de un registro ya centralizado, en lugar de duplicar su conocimiento en forma de ramas condicionales. |
| **Trampas a evitar** | Un `if`/`elif` cuya cada rama comprueba un valor ya presente en una estructura accesible en otro lugar: señal de que debería consultarse directamente. |
| **Buenas prácticas** | Hacer que el código dependa de la forma de los datos en lugar de valores particulares, en cuanto el número de casos esté destinado a variar. |
