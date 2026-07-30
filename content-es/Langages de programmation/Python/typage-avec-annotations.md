---
order: 11
---

# Tipado con anotaciones

Python sigue siendo **un lenguaje de tipado dinámico** incluso con anotaciones de tipo: a diferencia de PHP (véase el capítulo sobre funciones tipadas en PHP), donde un tipo declarado se comprueba y se aplica **en tiempo de ejecución**, las anotaciones de Python son solo indicaciones **opcionales**, que el intérprete nunca comprueba por sí mismo.

## Anotar variables y funciones

```python
edad: int = 25
número: str = "Jean"

def addition(a: int, b: int) -> int:
    return a + b

addition("deux", "trois")   # NINGÚN error al iniciar: Python se ejecuta de todos modos, sin comprobar los tipos
```

> **Nota:** a diferencia de PHP, donde `function f(int $x): int` genera un error de «`TypeError`» si se pasa algo que no sea un entero, las anotaciones de Python son mera documentación para un ser humano (o una herramienta externa); el intérprete no las tiene en cuenta en ningún momento.

## Tipos compuestos con el módulo «`typing`»

```python
from typing import Optional, List, Dict, Union

def trouver_utilisateur(id: int) -> Optional[dict]:   # dict O None
    if id <= 0:
        return None
    return {"id": id, "nom": "Dupont"}

def traiter_notes(notes: List[int]) -> float:          # lista de números enteros
    return sum(notes) / len(notes)

def config() -> Dict[str, Union[str, int]]:            # dict cuyos valores son str o int
    return {"nom": "app", "version": 2}
```

> **Nota:** a partir de Python 3.9+, `list[int]` / `dict[str, int]` (los tipos nativos directamente, en minúsculas) sustituyen a `List[int]` / `Dict[str, int]` del módulo `typing` para estos casos sencillos; `typing` sigue siendo necesario para construcciones como `Optional` / `Union`.

## `mypy` : garantizar que se respeten las anotaciones en cualquier caso

Dado que Python nunca aplica sus propias anotaciones, una herramienta externa como `mypy` analiza el código **antes** **de** su ejecución y señala las incoherencias de tipo, de forma similar a como lo haría un compilador para un lenguaje de tipado estático:

```bash
pip install mypy
mypy mon_script.py
# mon_script.py:5: error: El argumento 1 de «addition» tiene un tipo incompatible «str»; se esperaba «int»
```

## ¿Por qué añadir anotaciones a pesar de todo?

- Documentación que se puede leer directamente en el código, sin depender de comentarios que haya que actualizar manualmente.
- Mejor autocompletado y detección de errores en el editor (VS Code, PyCharm...), incluso antes de abrir `mypy` o el programa.
- Fundamental para proyectos de Python de gran envergadura, en los que la ausencia de verificación de tipos puede hacer que las refactorizaciones resulten arriesgadas sin esta ayuda.
