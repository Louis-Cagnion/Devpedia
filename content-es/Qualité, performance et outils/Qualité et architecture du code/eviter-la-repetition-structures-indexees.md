---
order: 3
---

# Evitar la repetición: estructuras indexadas en lugar de código duplicado

Una señal clásica de código que se volverá tedioso de mantener: la misma instrucción, repetida una vez por elemento de un conjunto, con solo uno o dos valores que cambian de una repetición a otra.

## El síntoma

```python
parser.add_argument("--profile-dir", default=str(Path.home() / ".rapport_profil"))
parser.add_argument("--verbose", action="store_true")
parser.add_argument("--format", choices=["csv", "json", "xml", "html"])
parser.add_argument("--output", default="rapports/rapport.txt")
# ... otras diez, cada una en su propia llamada
```

Cada línea se parece, pero añadir una opción, eliminar una, o cambiar un comportamiento común a todas (por ejemplo, validar un tipo) obliga a repetir la misma modificación en cada lugar, y es fácil olvidar una.

## La solución: una estructura de datos, recorrida por código genérico

El principio: describir cada elemento una sola vez, en una estructura de datos (lista, diccionario), y luego escribir **un único** bucle o función que la recorra y aplique el mismo tratamiento a cada uno.

```python
CLI_ARGUMENTS = [
    {"flag": "--profile-dir", "default": str(Path.home() / ".rapport_profil")},
    {"flag": "--verbose", "action": "store_true"},
    {"flag": "--format", "choices": ["csv", "json", "xml", "html"]},
    {"flag": "--output", "default": "rapports/rapport.txt"},
]

for arg in CLI_ARGUMENTS:
    flag = arg.pop("flag")
    parser.add_argument(flag, **arg)
```

Añadir una opción se convierte en una entrada en una lista, no en una nueva línea de código a escribir según el mismo patrón que las anteriores. Un comportamiento común (validación, valor por defecto calculado, transformación) se cambia en un único lugar (el bucle) en lugar de repetirse en cada llamada.

## Un caso más sutil: el dispatch

La misma idea se aplica cuando la repetición recae sobre una condición en lugar de una llamada a función:

```python
# Antes: una rama por caso, a mantener sincronizada con la lista de formatos
if format_name == "csv":
    exporter = export_csv
elif format_name == "json":
    exporter = export_json
elif format_name == "xml":
    exporter = export_xml
elif format_name == "html":
    exporter = export_html

# Después: un diccionario hace de tabla de dispatch
FORMAT_EXPORTERS = {
    "csv": export_csv,
    "json": export_json,
    "xml": export_xml,
    "html": export_html,
}
exporter = FORMAT_EXPORTERS[format_name]
```

El diccionario cumple exactamente el mismo rol que la cadena de `if`/`elif`, pero añadir un formato equivale a añadir una entrada, sin tocar la lógica que selecciona el exportador correcto.

## Dónde detenerse

Esta generalización tiene un costo: una estructura de datos demasiado abstracta para dos o tres casos que no crecerán complica la lectura sin aportar un beneficio real (ver el principio [KISS](https://en.wikipedia.org/wiki/KISS_principle)/[YAGNI](https://martinfowler.com/bliki/Yagni.html)). El umbral de sentido común: en cuanto se escribe la **tercera** repetición de un mismo patrón, es el buen momento para reemplazarla por una estructura indexada; antes, a menudo aún no compensa.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una misma instrucción repetida para cada elemento de un conjunto (opciones CLI, `if`/`elif` por caso) debe apoyarse en una estructura indexada (lista, diccionario) recorrida por código genérico: añadir un elemento se convierte en modificar un dato, no en añadir código. |
| **Herramientas utilizables** | Una lista de diccionarios recorrida en bucle, un diccionario de dispatch en lugar de una cadena `if`/`elif`. |
| **Trampas a evitar** | Generalizar desde la primera o la segunda ocurrencia: una estructura demasiado abstracta para un caso que no crecerá complica la lectura sin beneficio real. |
| **Buenas prácticas** | Esperar la tercera repetición de un mismo patrón antes de reemplazarlo por una estructura indexada. |
