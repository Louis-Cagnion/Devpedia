---
order: 13
---

# Módulos, pip y entornos virtuales

Un proyecto Python rara vez se queda mucho tiempo en un solo archivo: este capítulo cubre cómo organizar código en varios archivos (módulos), instalar bibliotecas externas (`pip`), y aislar las dependencias de un proyecto a otro (entornos virtuales).

## Importar un módulo

```python
# archivo calculos.py
def suma(a, b):
    return a + b
```

```python
# archivo main.py
import calculos

print(calculos.suma(2, 3))   # 5, acceso vía el nombre del módulo

from calculos import suma     # importa directamente la función, sin prefijo
print(suma(2, 3))

import calculos as c          # renombra el módulo importado
print(c.suma(2, 3))
```

## `if __name__ == "__main__":`

Cada archivo Python tiene una variable especial `__name__`: vale `"__main__"` únicamente si el archivo se **ejecuta directamente**, y el nombre del módulo si se **importa** desde otro archivo.

```python
# calculos.py
def suma(a, b):
    return a + b

if __name__ == "__main__":
    print("Prueba rápida:", suma(2, 3))   # se ejecuta SOLO si se lanza "python calculos.py" directamente
```

> **Nota:** este resguardo permite que un archivo sirva a la vez de módulo reutilizable (importado sin ejecutar nada inesperado) y de script autónomo (probable directamente), sin que ambos usos interfieran.

## `pip`: instalar bibliotecas externas

```bash
pip install requests          # instala una biblioteca
pip install requests==2.31.0  # instala una versión precisa
pip uninstall requests        # desinstala
pip list                      # lista las bibliotecas instaladas
```

## `requirements.txt`: fijar las dependencias de un proyecto

```text
requests==2.31.0
numpy==1.26.0
```

```bash
pip freeze > requirements.txt    # genera este archivo desde el entorno actual
pip install -r requirements.txt  # reinstala exactamente las mismas versiones en otro lugar
```

## Los entornos virtuales

Sin aislamiento, `pip install` instala las bibliotecas **globalmente** en la máquina: dos proyectos que necesitan versiones diferentes de una misma biblioteca entran entonces en conflicto. Un **entorno virtual** crea una instalación Python aislada, propia de un proyecto:

```bash
python -m venv .venv       # crea un entorno virtual en la carpeta .venv

source .venv/bin/activate  # activa el entorno (Linux/macOS)
.venv\Scripts\activate     # activa el entorno (Windows)

pip install requests       # instala ÚNICAMENTE en este entorno, no globalmente

deactivate                 # sale del entorno virtual
```

> **Nota:** una vez activado, `pip install` y `python` apuntan a los ejecutables **del entorno virtual**, no a los instalados globalmente en el sistema: esto es lo que garantiza el aislamiento. La carpeta `.venv/` nunca debe versionarse con [Git](/?c=git&p=git) (ver [El archivo .gitignore](/?c=git&p=gitignore)): se regenera por completo a partir de `requirements.txt`.

## Organizar un proyecto en paquete

```text
mi_proyecto/
├── mi_paquete/
│   ├── __init__.py     # hace la carpeta importable como un paquete
│   ├── calculos.py
│   └── utils.py
└── main.py
```

```python
from mi_paquete import calculos
from mi_paquete.utils import una_funcion
```

Un simple archivo `__init__.py` (aunque esté vacío) basta para convertir una carpeta en un **paquete** importable, que agrupa varios módulos bajo un mismo espacio de nombres.

> **Nota:** desde Python 3.3, `__init__.py` ya no es obligatorio para que una carpeta sea importable: sin él, Python la trata como un **namespace package** ([PEP 420](https://peps.python.org/pep-0420/)). La diferencia es visible en la práctica: en un paquete clásico (con `__init__.py`), `mi_paquete.__file__` apunta a ese archivo; en un namespace package, `__file__` vale `None` y `__path__` se convierte en un objeto especial en lugar de una simple lista. Una carpeta sin `__init__.py` sigue siendo importable, pero no se comporta exactamente como un paquete clásico para todo el código que inspecciona estos atributos.

## `pyproject.toml`: el packaging moderno

`requirements.txt` fija versiones, pero no describe el proyecto en sí (su nombre, cómo instalarlo, sus metadatos): `pyproject.toml` centraliza esta descripción en un formato estándar, reconocido por las herramientas de packaging modernas (`setuptools`, `poetry`...):

```toml
[project]
name = "mi-proyecto"
version = "0.1.0"
dependencies = ["requests==2.31.0"]

[tool.setuptools.packages.find]
where = ["."]
```

`[tool.setuptools.packages.find]` detecta automáticamente los paquetes clásicos (con `__init__.py`); un proyecto que se apoya en namespace packages debe usar `find_namespace_packages` en su lugar, sin lo cual las carpetas sin `__init__.py` se ignoran silenciosamente durante la instalación.

```bash
pip install -e .   # instalación "editable"
```

La instalación **editable** (`pip install -e .`) instala el proyecto sin copiar sus archivos al entorno virtual: en su lugar crea un archivo `.pth` que apunta a la carpeta fuente. Modificar el código fuente surte efecto inmediatamente, sin reinstalación, lo que hace que este comando sea indispensable en desarrollo activo de una biblioteca.

## El Python "portable" (*embeddable*) y el archivo `._pth`

Una instalación Python clásica añade automáticamente la carpeta del script lanzado a `sys.path` (la lista de carpetas donde `import` busca un módulo). El **Python embebido** (distribución ZIP mínima de [python.org](https://docs.python.org/3/using/windows.html#the-embeddable-package), sin necesitar derechos de administrador, usada por ejemplo para distribuir una herramienta sin depender de una instalación del sistema) funciona de forma diferente:

```text
python-3.12.0-embed-amd64/
├── python.exe
├── python312.zip     # la biblioteca estándar, comprimida
├── python312._pth    # la lista CONGELADA de carpetas de sys.path
└── mi_script.py
```

```text
# python312._pth
python312.zip
.
#import site          # comentado: site-packages desactivado, instalación más ligera
```

El archivo `._pth` **congela** por completo `sys.path` a esta lista: a diferencia de una instalación clásica, la carpeta del script lanzado NO se añade automáticamente.

```python
# mi_script.py, ubicado en la misma carpeta
import sys
sys.path.insert(0, ".")  # sin esto, un paquete vecino no listado en ._pth queda ilocalizable

import mi_paquete
```

> **Trampa:** un proyecto que funciona sin problema con una instalación Python clásica puede fallar con `ModuleNotFoundError` una vez desplegado en un Python embebido, por falta de este `sys.path.insert(0, ...)` manual antes de importar cualquier paquete vecino.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `import` carga un módulo; `if __name__ == "__main__":` distingue ejecución directa e import. `pip` instala bibliotecas, un entorno virtual aísla las dependencias de un proyecto. `pyproject.toml` describe el proyecto en sí, más allá de las versiones fijadas por `requirements.txt`. |
| **Herramientas utilizables** | `pip install`/`freeze`, `requirements.txt`, `python -m venv`, `__init__.py` para un paquete clásico, `pyproject.toml` y `pip install -e .` para el packaging moderno. |
| **Trampas a evitar** | Instalar bibliotecas globalmente en lugar de en un entorno virtual: conflictos de versiones entre proyectos. Olvidar `find_namespace_packages` para un proyecto sin `__init__.py`, que hace que estas carpetas se ignoren silenciosamente durante la instalación. |
| **Buenas prácticas** | Trabajar siempre en un entorno virtual por proyecto; versionar `requirements.txt`, nunca `.venv/`. Usar `pip install -e .` en desarrollo activo de una biblioteca. |
