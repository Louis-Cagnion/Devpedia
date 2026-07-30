---
order: 12
---

# Módulos, pip y entornos virtuales

Un proyecto en Python rara vez se limita a un solo archivo durante mucho tiempo: este capítulo explica cómo organizar el código en varios archivos (módulos), instalar bibliotecas externas (`pip`) y aislar las dependencias de un proyecto a otro (entornos virtuales).

## Importar un módulo

```python
# archivo calculs.py
def addition(a, b):
    return a + b
```

```python
# archivo main.py
import calculs

print(calculs.addition(2, 3))   # 5. Acceso mediante el nombre del módulo

from calculs import addition     # importa directamente la función, sin prefijo
print(addition(2, 3))

import calculs as c               # cambia el nombre del módulo importado
print(c.addition(2, 3))
```

## `if __name__ == "__main__":`

Cada archivo de Python tiene una variable especial`__name__`: su valor es `"__main__"` únicamente si el archivo se **ejecuta directamente**, y el nombre del módulo si se **importa** desde otro archivo.

```python
# calculos.py
def addition(a, b):
    return a + b

if __name__ == "__main__":
    print("Test rapide :", addition(2, 3))   # SOLO se ejecuta si se ejecuta directamente «python calculs.py»
```

> **Nota:** esta medida de seguridad permite que un archivo sirva tanto como módulo reutilizable (que se importa sin ejecutar nada inesperado) como script autónomo (que se puede probar directamente), sin que ambos usos interfieran entre sí.

## `pip` : instalar bibliotecas externas

```bash
pip install requests           # instala una biblioteca
pip install requests==2.31.0    # instala una versión concreta
pip uninstall requests          # desinstalar
pip list                         # Enumera las bibliotecas instaladas
```

## `requirements.txt` : fijar las dependencias de un proyecto

```
requests==2.31.0
numpy==1.26.0
```

```bash
pip freeze > requirements.txt    # Genera este archivo desde el entorno actual
pip install -r requirements.txt   # Reinstala exactamente las mismas versiones en otro lugar.
```

## Los entornos virtuales

Sin aislamiento, `pip install` instala las bibliotecas **de forma global** en el equipo, por lo que dos proyectos que necesiten versiones diferentes de una misma biblioteca entrarán en conflicto. Un **entorno virtual** crea una instalación de Python aislada, específica para cada proyecto:

```bash
python -m venv .venv          # crea un entorno virtual en la carpeta .venv

fuente .venv/bin/activate       # Activa el entorno (Linux/macOS)
.venv\Scripts\activate           # Activa el entorno (Windows)

pip install requests             # Se instala ÚNICAMENTE en este entorno, no de forma global.

deactivate                        # salir del entorno virtual
```

> **Nota:** una vez activados, `pip install` y `python` apuntan a los ejecutables **del entorno virtual**, no a los instalados globalmente en el sistema; esto es lo que garantiza el aislamiento. La carpeta `.venv/` nunca debe incluirse en el control de versiones con Git (véase el capítulo `.gitignore`): se regenera por completo a partir de `requirements.txt`.

## Organizar un proyecto en paquetes

```
mon_projet/
├── mon_package/
│   ├── __init__.py     # rend le dossier importable comme un package
│   ├── calculs.py
│   └── utils.py
└── main.py
```

```python
from mon_package import calculs
from mon_package.utils import une_fonction
```

Basta con un simple archivo «`__init__.py`» (aunque esté vacío) para convertir una carpeta en un **paquete** importable, que agrupa varios módulos bajo un mismo espacio de nombres.
