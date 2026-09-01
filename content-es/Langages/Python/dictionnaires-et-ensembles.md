---
order: 5
---

# Los diccionarios y los conjuntos

El **diccionario** (`dict`) asocia claves a valores, exactamente igual que un array asociativo en [PHP](/?c=langages-de-programmation&s=php&p=php). El **conjunto** (`set`) almacena valores únicos, sin orden ni duplicados. Ambas estructuras se apoyan internamente en una [tabla hash](/?c=langages-de-programmation&s=c&p=tables-de-hachage): esto es lo que permite que `dico["clave"]` o `"valor" in conjunto` sean casi instantáneos, incluso sobre una colección muy grande.

## Los diccionarios

```python
persona = {"nombre": "Dupont", "edad": 25}

persona["nombre"]                       # "Dupont"
persona["email"] = "juan@ejemplo.com"   # añade una nueva clave
persona["edad"] = 26                    # modifica una clave existente
del persona["edad"]                     # elimina una clave

persona.get("telefono")             # None si la clave no existe (sin error)
persona.get("telefono", "desconocido")  # "desconocido" -> valor por defecto si está ausente

"nombre" in persona           # True -> prueba la presencia de una CLAVE (no de un valor)
```

> **Nota:** `persona["telefono"]` (acceso directo por corchetes) lanza un `KeyError` si la clave no existe; a diferencia de `.get()`, que devuelve `None` (o un valor por defecto proporcionado) sin fallar nunca. Preferir `.get()` en cuanto la ausencia de la clave sea un caso normal, no un error.

### Por qué una clave de dict debe ser hachable

```python
cache = {}
cache[("sitio_a", 42)] = "tienda A"  # un TUPLE como clave: funciona, un tuple es inmutable, por tanto hachable

cache[["sitio_a", 42]] = "tienda A"  # TypeError: unhashable type: 'list' -> una lista es mutable, nunca hachable
```

Una clave de diccionario debe ser **hachable** (un número fijo, calculado de una vez por todas, que permite localizarla instantáneamente en la tabla hash subyacente): por tanto debe ser **inmutable** (`str`, número, `tuple`), nunca `list`/`dict`, que pueden cambiar de contenido después y invalidarían ese número. Un `tuple` de varios valores sirve habitualmente como **clave compuesta**: `(sitio, id)` distingue dos entradas que compartieran el mismo `id` en dos sitios diferentes, algo que ninguno de los dos valores por separado permitiría.

### Recorrer un diccionario

```python
for clave in persona:
    print(clave)                      # recorre únicamente las claves

for clave, valor in persona.items():
    print(f"{clave}: {valor}")        # recorre claves Y valores juntos

for valor in persona.values():
    print(valor)                      # recorre únicamente los valores
```

### Comprensión de diccionario

```python
cuadrados = {x: x ** 2 for x in range(5)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}
```

### `setdefault()`: construir un dict de listas en una línea

```python
tiendas_por_sitio = {}

for sitio, id_tienda in pares:
    if sitio not in tiendas_por_sitio:  # sin setdefault: esta comprobación manual es necesaria...
        tiendas_por_sitio[sitio] = []
    tiendas_por_sitio[sitio].append(id_tienda)

# equivalente en una sola línea:
tiendas_por_sitio.setdefault(sitio, []).append(id_tienda)
```

`dict.setdefault(clave, valor_por_defecto)` devuelve el valor de `clave` si ya existe (sin tocarlo), o lo inserta con `valor_por_defecto` Y LUEGO lo devuelve si aún no existe. Encadenado con `.append()`, este patrón agrupa elementos por categoría (aquí, la lista de tiendas por sitio) sin comprobar nunca explícitamente si la clave ya existe.

## Los conjuntos (`set`)

```python
frutas = {"manzana", "platano", "cereza"}

frutas.add("kiwi")       # añade un elemento
frutas.remove("platano")  # elimina un elemento (error si está ausente)
frutas.discard("mango")   # elimina un elemento, SIN error si está ausente

"manzana" in frutas   # True -> prueba de pertenencia casi instantánea (tabla hash)
```

### Operaciones de conjuntos

```python
a = {1, 2, 3}
b = {2, 3, 4}

a | b  # {1, 2, 3, 4} -> unión
a & b  # {2, 3}       -> intersección
a - b  # {1}           -> diferencia (en a, no en b)
a ^ b  # {1, 4}        -> diferencia simétrica (en uno U otro, no en ambos)
```

> **Nota:** un `set` elimina automáticamente los duplicados: `set([1, 2, 2, 3, 3, 3])` da `{1, 2, 3}`. Es una forma muy habitual de deduplicar rápidamente una lista en Python: `list(set(mi_lista))`.

### Comprensión de conjunto

```python
cuadrados_unicos = {x ** 2 for x in [-2, -1, 0, 1, 2]}
# {0, 1, 4} -> (-2)**2 y 2**2 valen ambos 4, por tanto deduplicados automáticamente
```

Ver también [Las tablas de hash](/?c=langages-de-programmation&s=c&p=tables-de-hachage) para lo que ocurre realmente en memoria detrás de `dict` y `set`.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un `dict` asocia claves a valores, un `set` almacena valores únicos sin orden; ambos se apoyan en una tabla hash, por tanto casi instantáneos en acceso/prueba. |
| **Herramientas utilizables** | `.get()` (sin error), comprensiones de dict/set, operaciones de conjuntos (`\|`, `&`, `-`, `^`). |
| **Trampas a evitar** | Acceder a una clave ausente por corchetes (`dico["x"]`) en lugar de por `.get()`: eso lanza un `KeyError`. |
| **Buenas prácticas** | Usar `.get()` en cuanto la ausencia de una clave sea un caso normal, no un error; `list(set(mi_lista))` para deduplicar rápidamente. |
