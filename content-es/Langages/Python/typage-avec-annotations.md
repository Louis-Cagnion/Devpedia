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
| **Herramientas utilizables** | El módulo `typing` (`Optional`, `Union`, `List`...), `mypy` para una verificación externa. |
| **Trampas a evitar** | Creer que una anotación impide realmente pasar un valor del tipo incorrecto: nada lo impide en tiempo de ejecución. |
| **Buenas prácticas** | Anotar sistemáticamente un proyecto de tamaño significativo, y ejecutar `mypy` como complemento para detectar incoherencias antes de la ejecución. |
