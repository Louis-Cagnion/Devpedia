---
order: 12
---

# Las dataclasses

Una clase [ordinaria](/?c=langages-de-programmation&s=python&p=poo) cuyo papel se limita a agrupar unos cuantos valores (un punto, un registro, el resultado de un cálculo) obliga de todos modos a escribir `__init__`, a menudo `__repr__` y `__eq__`, a mano, para un resultado puramente mecánico: recopiar cada parámetro en `self`, mostrar los valores, comparar campo por campo. El decorador `@dataclass` (módulo `dataclasses`, nativo desde Python 3.7) genera este código automáticamente a partir de las [anotaciones de tipo](/?c=langages-de-programmation&s=python&p=typage-avec-annotations) de los campos.

## Antes/después: el mismo `Punto` que en el capítulo POO

```python
# Versión clásica (ver La programación orientada a objetos)
class Punto:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Punto({self.x}, {self.y})"

    def __eq__(self, otro):
        return self.x == otro.x and self.y == otro.y
```

```python
# Versión dataclass: equivalente, sin escribir __init__/__repr__/__eq__ a mano
from dataclasses import dataclass

@dataclass
class Punto:
    x: int
    y: int

p1 = Punto(1, 2)
p2 = Punto(1, 2)

print(p1)        # Punto(x=1, y=2)  -> __repr__ generado automáticamente
print(p1 == p2)  # True             -> __eq__ generado automáticamente, comparación campo por campo
```

Cada línea `x: int` declara a la vez un campo **y** su tipo: `@dataclass` lee estas anotaciones para construir `__init__(self, x, y)` automáticamente, en el orden en que se declaran los campos.

| Generado automáticamente | Papel |
|---|---|
| `__init__` | Un parámetro por campo declarado, en orden |
| `__repr__` | Visualización legible: `NombreClase(campo1=valor1, campo2=valor2...)` |
| `__eq__` | Compara dos instancias campo por campo |

> **Nota:** `@dataclass` **no** genera `__lt__`/`__gt__` (comparación de orden, para ordenar instancias) por defecto: añade `@dataclass(order=True)` si las instancias deben poder ordenarse entre sí (el orden de comparación sigue entonces el de los campos, de izquierda a derecha).

## `frozen=True`: instancias inmutables

Un caso de uso muy habitual: representar el resultado fijo de un cálculo o una extracción (un registro leído desde un archivo, una línea de resultado), que no tiene ninguna razón de cambiar una vez creado. `frozen=True` prohíbe cualquier modificación tras la construcción:

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class BloqueTexto:
    pagina: int
    texto: str

bloque = BloqueTexto(pagina=1, texto="Hola")
bloque.texto = "Modificado"   # FrozenInstanceError: imposible modificar un campo tras la creación
```

Una dataclass `frozen=True` se vuelve además **hasheable** (usable como clave de `dict` o elemento de un `set`) en cuanto todos sus campos lo son ellos mismos, a diferencia de una dataclass ordinaria (mutable, por tanto no hasheable por defecto): una consecuencia directa del mismo principio por el que [una tupla es hasheable pero una lista no lo es](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles).

> **Trampa:** `frozen=True` protege los campos en sí contra una reasignación, pero no el **contenido** de un campo mutable. Un campo `frozen` que contiene una lista sigue siendo una lista ordinaria: su referencia no puede cambiar, pero su contenido sí.

```python
@dataclass(frozen=True)
class Grupo:
    miembros: list

g = Grupo(miembros=["Alice"])
g.miembros = ["Bob"]      # FrozenInstanceError: el campo en sí está protegido
g.miembros.append("Bob")  # funciona sin error: la LISTA, en cambio, sigue siendo mutable
```

> **Buena práctica:** para una inmutabilidad realmente completa, usar tipos ellos mismos inmutables para los campos (una [tupla](/?c=langages-de-programmation&s=python&p=listes-et-tuples) en lugar de una lista), no solo `frozen=True` sobre la clase englobante.

## Valores por defecto: `field(default_factory=...)`

Una dataclass sigue sujeta a la misma [trampa de los valores por defecto mutables](/?c=langages-de-programmation&s=python&p=fonctions) que una función ordinaria: `@dataclass` la detecta incluso en la definición de la clase y se niega a arrancar en lugar de dejar que se instale un bug silencioso:

```python
from dataclasses import dataclass, field

@dataclass
class Carrito:
    articulos: list = []   # ValueError lanzada en la definición de la clase: lista mutable prohibida como defecto directo

@dataclass
class Carrito:
    articulos: list = field(default_factory=list)   # correcto: una NUEVA lista en cada instancia

p1 = Carrito()
p2 = Carrito()
p1.articulos.append("manzana")
print(p2.articulos)   # [] -> bien independiente de p1, a diferencia de la trampa de las funciones
```

`field(default_factory=funcion)` llama a `funcion()` (aquí `list`, por tanto `list()`) en cada nueva instancia en lugar de una sola vez en la definición de la clase: eso es lo que evita el compartimiento involuntario.

## Cuándo basta una dataclass, cuándo se impone una clase clásica

| | Dataclass | Clase clásica |
|---|---|---|
| Papel principal | Agrupar datos, con poca o ninguna lógica propia | Encapsular un comportamiento rico, invariantes a respetar |
| `__init__`/`__repr__`/`__eq__` | Generados automáticamente | Escritos a mano (o personalizados explícitamente) |
| Añadir un método | Siempre posible, una dataclass sigue siendo una clase ordinaria | Caso de uso normal |

Una dataclass sigue siendo una clase Python de pleno derecho: nada impide añadirle métodos, `@property`, o hacerla heredar de otra clase, exactamente igual que para una clase declarada de forma clásica.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `@dataclass` genera `__init__`/`__repr__`/`__eq__` a partir de los campos anotados de una clase, evitando ese código repetitivo para una clase que solo agrupa datos. `frozen=True` vuelve las instancias inmutables (y hasheables). |
| **Herramientas utilizables** | `@dataclass`, `@dataclass(frozen=True)`, `@dataclass(order=True)` para el orden, `field(default_factory=...)` para un valor por defecto mutable. |
| **Trampas a evitar** | Creer que `frozen=True` protege también el contenido de un campo mutable (una lista sigue siendo modificable). Dar directamente una lista/dict como valor por defecto de un campo. |
| **Buenas prácticas** | Usar un tipo él mismo inmutable (tupla) para una congelación realmente completa. Pasar siempre por `field(default_factory=...)` para un valor por defecto mutable. Reservar la dataclass a las clases mayoritariamente portadoras de datos. |
