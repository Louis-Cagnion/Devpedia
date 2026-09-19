---
order: 18
---

# Las regex en Python: el módulo `re`

A diferencia de [JavaScript](/?c=langages&s=javascript&p=regex), Python no tiene una sintaxis literal para las regex (sin `/patron/`): el módulo `re` de la biblioteca estándar proporciona todas las funciones y métodos necesarios. La sintaxis del patrón en sí (clases de caracteres, cuantificadores, grupos, anclas) es exactamente la misma que la vista en [La regex](/?c=langages&s=domain-specific-languages-dsl&p=regex) -- este capítulo cubre únicamente la API de Python: cómo compilar un patrón, ejecutarlo y recuperar su resultado.

## Compilar un patrón: `re.compile()`

```python
import re

patron = re.compile(r"\d{4}-\d{2}-\d{2}")   # precompila el patrón, reutilizable
```

> **Nota:** el prefijo `r"..."` (cadena cruda, *raw string*) evita que Python interprete `\d` como una secuencia de escape inválida: indispensable en cuanto un patrón contiene una barra invertida.

`re.compile(patron)` convierte una cadena en un objeto `Pattern`, reutilizable para varias búsquedas sin reinterpretar el patrón cada vez -- más eficiente que una llamada directa como `re.match(patron, texto)` si el mismo patrón se usa varias veces.

## Buscar una coincidencia

| Método | Busca | Devuelve |
|---|---|---|
| `patron.match(texto)` | Una coincidencia solo al INICIO de la cadena | Un `Match`, o `None` |
| `patron.search(texto)` | La primera coincidencia en cualquier parte de la cadena | Un `Match`, o `None` |
| `patron.fullmatch(texto)` | Una coincidencia con la cadena COMPLETA | Un `Match`, o `None` |
| `patron.findall(texto)` | Todas las coincidencias | Una lista de cadenas (o tuplas si hay varios grupos) |
| `patron.finditer(texto)` | Todas las coincidencias | Un iterador de objetos `Match` |

```python
patron = re.compile(r"\d{4}-\d{2}-\d{2}")

patron.match("2024-06-15 es una fecha")      # coincide: empieza con el patrón
patron.match("El 2024-06-15 es una fecha")   # None -> NO empieza con el patrón

patron.search("El 2024-06-15 es una fecha")  # coincide, en cualquier parte de la cadena
```

> **Trampa:** confundir `match()` (solo al inicio de la cadena) y `search()` (en cualquier parte). Una regex que no encuentra nada con `match()` puede perfectamente coincidir con `search()`, simplemente porque la coincidencia no está al principio de la cadena.
>
> **Buena práctica:** usar `search()` por defecto en cuanto la coincidencia pueda estar en cualquier parte del texto; reservar `match()` para cuando deba empezar obligatoriamente la cadena.

## El objeto `Match`

```python
resultado = patron.search("El 2024-06-15 es una fecha")

resultado.group(0)   # "2024-06-15" -> la coincidencia completa
resultado[0]         # equivalente, notación abreviada
resultado.start()    # 3 -> indice de inicio en la cadena
resultado.end()      # 13 -> indice de fin
```

`resultado.group(0)` (o `resultado[0]`) siempre devuelve la coincidencia completa, tenga el patrón grupos o no. Si no se encuentra ninguna coincidencia, `search()`/`match()` devuelven `None`: llamar a `.group()` sobre eso lanza un `AttributeError` ("NoneType no tiene atributo group").

> **Trampa:** llamar a `.group()` sin comprobar antes que el resultado no sea `None`. Comprobar siempre el resultado antes de usarlo:
>
> ```python
> resultado = patron.search(texto)
> if resultado:
>     print(resultado.group(0))
> ```

## Los grupos de captura

```python
patron = re.compile(r"(\d{4})-(\d{2})-(\d{2})")
resultado = patron.search("2024-06-15")

resultado.group(1)   # "2024" (año)
resultado.group(2)   # "06" (mes)
resultado.group(3)   # "15" (día)
resultado.groups()   # ("2024", "06", "15") -> todos los grupos en una tupla
```

## Los grupos con nombre: `(?P<nombre>...)`

Más allá de dos o tres grupos, ubicarse por posición (`group(1)`, `group(2)`...) se vuelve rápidamente poco legible y frágil: insertar un nuevo grupo en medio del patrón desplaza la numeración de todos los siguientes. Un **grupo con nombre** asocia una etiqueta al grupo, independiente de su posición:

```python
patron = re.compile(r"(?P<anio>\d{4})-(?P<mes>\d{2})-(?P<dia>\d{2})")
resultado = patron.search("2024-06-15")

resultado.group("anio")   # "2024"
resultado["anio"]         # equivalente, notación abreviada
resultado.groupdict()     # {"anio": "2024", "mes": "06", "día": "15"}
```

> **Buena práctica:** nombrar los grupos en cuanto un patrón tenga varios -- `resultado["anio"]` sigue siendo correcto aunque se añada o quite un grupo en otra parte del patrón, a diferencia de `resultado.group(2)`, cuyo número depende de la posición.

## Reemplazar con `re.sub()`

```python
texto = "El 2024-06-15 es una fecha"

re.sub(r"\d{4}-\d{2}-\d{2}", "DD/MM/AAAA", texto)
# "El DD/MM/AAAA es una fecha"

# reutilizar un grupo capturado en el reemplazo, con \1, \2...
re.sub(r"(\d{4})-(\d{2})-(\d{2})", r"\3/\2/\1", texto)
# "El 15/06/2024 es una fecha"
```

Ver también [La regex](/?c=langages&s=domain-specific-languages-dsl&p=regex) para la sintaxis general de los patrones (clases de caracteres, cuantificadores, anclas, aserciones), común a todos los lenguajes.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Python no tiene sintaxis literal de regex: el módulo `re` proporciona `compile()`, `match()`/`search()`/`findall()`/`finditer()`, y un objeto `Match` para recuperar el resultado. Los grupos con nombre (`(?P<nombre>...)`) hacen que el acceso a los grupos capturados sea independiente de su posición. |
| **Herramientas utilizables** | `re.compile()`, `patron.match()`/`search()`/`fullmatch()`/`findall()`/`finditer()`, `match.group()`/`groups()`/`groupdict()`, `re.sub()`. |
| **Trampas a evitar** | Confundir `match()` (solo inicio de cadena) y `search()` (en cualquier parte). Llamar a `.group()` sobre un resultado `None` sin comprobarlo antes. |
| **Buenas prácticas** | Precompilar un patrón reutilizado varias veces con `re.compile()`. Nombrar los grupos en cuanto un patrón tenga varios. Comprobar siempre que un resultado de búsqueda no sea `None` antes de llamar a `.group()`. |
