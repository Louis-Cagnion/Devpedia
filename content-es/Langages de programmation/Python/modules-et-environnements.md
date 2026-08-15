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

> **Nota:** una vez activado, `pip install` y `python` apuntan a los ejecutables **del entorno virtual**, no a los instalados globalmente en el sistema: esto es lo que garantiza el aislamiento. La carpeta `.venv/` nunca debe versionarse con Git (ver [El archivo .gitignore](/?c=git&p=gitignore)): se regenera por completo a partir de `requirements.txt`.

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

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `import` carga un módulo; `if __name__ == "__main__":` distingue ejecución directa e import. `pip` instala bibliotecas, un entorno virtual aísla las dependencias de un proyecto. |
| **Herramientas utilizables** | `pip install`/`freeze`, `requirements.txt`, `python -m venv`, `__init__.py` para un paquete. |
| **Trampas a evitar** | Instalar bibliotecas globalmente en lugar de en un entorno virtual: conflictos de versiones entre proyectos. |
| **Buenas prácticas** | Trabajar siempre en un entorno virtual por proyecto; versionar `requirements.txt`, nunca `.venv/`. |
