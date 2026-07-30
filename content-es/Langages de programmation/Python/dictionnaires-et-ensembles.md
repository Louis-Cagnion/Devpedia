---
order: 5
---

# Los diccionarios y los conjuntos

El **diccionario** (`dict`) asocia claves a valores, exactamente igual que un array asociativo en PHP. El conjunto (`set`) almacena valores únicos, sin orden ni duplicados. Ambas estructuras se basan internamente en una **tabla hash** (véase el capítulo dedicado a ello, apartado C); esto es lo que permite que `dico["clave"]` o `"valor" in ensemble` funcionen de forma casi instantánea, incluso con colecciones muy grandes.

## Los diccionarios

```python
persona = {"nom": "Dupont", "age": 25}

persona["nom"]          # «Dupont»
persona["email"] = "jean@exemple.com"  # Añade una nueva clave
persona["age"] = 26      # modifica una clave existente
del persona["age"]         # elimina una clave

persona.get("telephone")           # Ninguna si la clave no existe (sin error)
persona.get("telephone", "inconnu") # «desconocido» -> valor por defecto si no se especifica

"nom" in persona            # True -> comprueba si existe una CLAVE (no un valor)
```

> **Nota:** `persona["telephone"]` (acceso directo mediante corchetes) genera un error «`KeyError`» si la clave no existe, a diferencia de `.get()`, que devuelve «`None`» (o un valor por defecto proporcionado) sin que se produzca ningún fallo. Es preferible utilizar `.get()` siempre que la ausencia de la clave sea un caso normal, no un error.

### Explorar un diccionario

```python
for clave in persona:
    print(clave)                      # solo recorre las claves

for clave, valor in persona.items():
    print(f"{clave} : {valor}")       # recorre las claves y los valores de forma conjunta

for valor in persona.values():
    print(valor)                    # solo recorre los valores
```

### Significado según el diccionario

```python
carres = {x: x ** 2 for x in range(5)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}
```

## Los conjuntos (`set`)

```python
frutas = {"pomme", "banane", "cerise"}

frutas.add("kiwi")        # añade un elemento
frutas.remove("banane")    # elimina un elemento (se produce un error si no existe)
frutas.discard("mangue")    # elimina un elemento, SIN generar error si no existe

"pomme" in frutas   # True -> comprobación de pertenencia casi instantánea (tabla hash)
```

### Operaciones con conjuntos

```python
a = {1, 2, 3}
b = {2, 3, 4}

a | b   # {1, 2, 3, 4} -> unión
a & b   # {2, 3}       -> intersección
a - b   # {1}           -> diferencia (en a, no en b)
a ^ b   # {1, 4}        -> diferencia simétrica (en uno O en el otro, pero no en ambos)
```

> **Nota:** un «`set`» elimina automáticamente los duplicados — «`set([1, 2, 2, 3, 3, 3])`» da como resultado «`{1, 2, 3}`». Es una forma muy habitual de deduplicar rápidamente una lista en Python: `list(set(ma_liste))`.

### Visión general

```python
carres_uniques = {x ** 2 for x in [-2, -1, 0, 1, 2]}
# {0, 1, 4} -> (-2)**2 y 2**2 dan ambos 4, por lo que se eliminan automáticamente los duplicados
```

Consulta también el capítulo sobre tablas hash (apartado C) para saber qué ocurre realmente en la memoria detrás de `dict` y `set`.
