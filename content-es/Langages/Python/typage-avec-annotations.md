---
order: 11
---

# El tipado con anotaciones

Python sigue siendo **de tipado dinámico** incluso con anotaciones de tipo: a diferencia de [PHP](/?c=langages-de-programmation&s=php&p=php) (ver [Las funciones y métodos más útiles](/?c=langages-de-programmation&s=php&p=methodes)), donde un tipo declarado se comprueba y se aplica **en tiempo de ejecución**, las anotaciones Python son solo indicaciones **opcionales**, nunca comprobadas por el intérprete mismo.

## Anotar variables y funciones

```python
edad: int = 25
nombre: str = "Juan"

def suma(a: int, b: int) -> int:
    return a + b

suma("dos", "tres")   # NINGÚN error al lanzarlo: Python ejecuta igualmente, sin comprobar los tipos
```

> **Nota:** a diferencia de PHP donde `function f(int $x): int` lanza un `TypeError` si se pasa algo que no sea un entero, las anotaciones Python son pura documentación para un humano (o una herramienta externa): el intérprete no las hace respetar en ningún momento.

## Tipos compuestos con el módulo `typing`

```python
from typing import Optional, List, Dict, Union

def encontrar_usuario(id: int) -> Optional[dict]:   # dict O None
    if id <= 0:
        return None
    return {"id": id, "nombre": "Dupont"}

def procesar_notas(notas: List[int]) -> float:      # lista de enteros
    return sum(notas) / len(notas)

def config() -> Dict[str, Union[str, int]]:         # dict cuyos valores son str O int
    return {"nombre": "app", "version": 2}
```

> **Nota:** desde Python 3.9+, `list[int]`/`dict[str, int]` (los tipos nativos directamente, en minúsculas) reemplazan a `List[int]`/`Dict[str, int]` del módulo `typing` para estos casos simples; `typing` sigue siendo necesario para construcciones como `Optional`/`Union`.

## Sintaxis moderna `X | None` (Python 3.10+)

Desde Python 3.10 ([PEP 604](https://peps.python.org/pep-0604/)), el operador `|` entre dos tipos reemplaza a `Optional`/`Union` del módulo `typing`, directamente sobre los tipos mismos, sin import adicional:

```python
def encontrar_usuario(id: int) -> dict | None:   # reemplaza Optional[dict]
    if id <= 0:
        return None
    return {"id": id, "nombre": "Dupont"}

def config() -> dict[str, str | int]:            # reemplaza Dict[str, Union[str, int]]
    return {"nombre": "app", "version": 2}
```

| Sintaxis antigua (`typing`) | Sintaxis moderna (3.10+) |
|---|---|
| `Optional[dict]` | `dict \| None` |
| `Union[str, int]` | `str \| int` |
| `Optional[Union[str, int]]` | `str \| int \| None` |

> **Nota:** esta sintaxis no reemplaza todo `typing`: construcciones como `Callable`, `TypeVar` o `Generic` siguen siendo necesarias. Solo cubre los casos hasta ahora tratados por `Optional`/`Union`.

## Alias de tipo: nombrar una unión para reutilizarla

```python
ConfigValue = str | int | float  # alias de tipo, a nivel de módulo

def config() -> dict[str, ConfigValue]:
    return {"nombre": "app", "version": 2, "ratio": 1.5}

def validar(valor: ConfigValue) -> bool:
    return valor is not None
```

Una unión larga y repetida en varias firmas puede asignarse una sola vez, a nivel de módulo, a una variable nombrada en PascalCase (o con prefijo `_` si es privada al archivo): este **alias de tipo** se reutiliza después como un tipo cualquiera (`dict[str, ConfigValue]`), sin repetir `str | int | float` en cada función que lo maneja.

## Forward reference y `TYPE_CHECKING`

Una **forward reference** es una anotación de tipo escrita entre comillas, que referencia un tipo aún no definido en ese punto del archivo (una clase que se referencia a sí misma, o un import que crearía un ciclo):

```python
class Nodo:
    def __init__(self, valor: int, siguiente: "Nodo | None" = None):
        self.valor = valor
        self.siguiente = siguiente   # "Nodo" todavía no existe mientras su propia definición no termina
```

> **Trampa:** sin las comillas (`siguiente: Nodo | None`), Python lanza un `NameError` inmediato al leer el archivo: las anotaciones de una función se evalúan tan pronto como se define, no solo las lee una herramienta externa como `mypy`. Las comillas la convierten en simple texto, resuelto solo cuando una herramienta lo necesita.

El bloque `if TYPE_CHECKING:` cubre la misma necesidad entre dos archivos: importar un tipo solo para la anotación, sin provocar un import circular al arrancar el programa:

```python
from typing import TYPE_CHECKING

if TYPE_CHECKING:   # nunca verdadero en tiempo de ejecución: lo lee solo mypy y el editor
    from otro_modulo import OtraClase

def procesar(objeto: "OtraClase") -> None:
    ...
```

| | `import` normal | `if TYPE_CHECKING:` |
|---|---|---|
| Ejecutado al arrancar el programa | Sí | No |
| Leído por `mypy` / el editor | Sí | Sí |
| Riesgo de import circular | Sí, si ambos archivos se importan mutuamente | No |

## `mypy`: hacer respetar las anotaciones a pesar de todo

Como Python nunca aplica sus propias anotaciones, una herramienta externa como `mypy` analiza el código **antes** de la ejecución y señala las incoherencias de tipo, un poco como lo haría un compilador para un lenguaje de tipado estático:

```bash
pip install mypy
mypy mi_script.py
# mi_script.py:5: error: Argument 1 to "suma" has incompatible type "str"; expected "int"
```

## Por qué anotar a pesar de todo

- Documentación directamente legible en el código, sin depender de comentarios actualizados manualmente.
- Mejor autocompletado y detección de errores en el editor ([VS Code](https://code.visualstudio.com), [PyCharm](https://www.jetbrains.com/pycharm/)...), incluso antes de lanzar `mypy` o el programa.
- Base indispensable para proyectos Python de gran tamaño, donde la ausencia de verificación de tipo puede hacer arriesgadas las refactorizaciones sin esta ayuda.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Las anotaciones de tipo Python (`x: int`, `-> str`) son puramente documentales: nunca comprobadas por el intérprete, a diferencia de un lenguaje de tipado estático o incluso de PHP. |
| **Herramientas utilizables** | El módulo `typing` (`Optional`, `Union`, `List`, `TYPE_CHECKING`...), la sintaxis `X \| None` (3.10+), los alias de tipo para nombrar una unión reutilizada, `mypy` para una verificación externa. |
| **Trampas a evitar** | Creer que una anotación impide realmente pasar un valor del tipo incorrecto: nada lo impide en tiempo de ejecución. Olvidar las comillas de una forward reference (`NameError` inmediato). |
| **Buenas prácticas** | Anotar sistemáticamente un proyecto de tamaño significativo, y ejecutar `mypy` como complemento para detectar incoherencias antes de la ejecución. Usar `if TYPE_CHECKING:` para evitar un import circular causado por una sola anotación de tipo. |
