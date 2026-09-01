---
order: 15
---

# Manipular archivos y carpetas con `pathlib`

[La gestión de errores](/?c=langages-de-programmation&s=python&p=gestion-des-erreurs) ya abre un archivo con `open("datos.txt")`, una simple ruta escrita como cadena de caracteres. El módulo estándar **`pathlib`** representa una ruta como un objeto real, manipulable y portable entre sistemas operativos, sin concatenar nunca cadenas a mano.

## `pathlib.Path`: representar una ruta como un objeto

```python
from pathlib import Path

carpeta = Path("informes") / "2026" / "agosto.txt"  # "/" construye la ruta, PORTABLE (\ en Windows, / en el resto)
print(carpeta)                                      # informes/2026/agosto.txt

carpeta.exists()   # True/False -> ¿existe realmente el archivo/carpeta en el disco?
carpeta.is_file()  # True/False
carpeta.is_dir()   # True/False
```

> **Nota:** el operador `/` está sobrecargado aquí (ver [Métodos reflejados](/?c=langages-de-programmation&s=python&p=poo)): `Path.__truediv__` construye una NUEVA ruta añadiendo un segmento, sin tocar nunca la ruta de origen.

> **Equivalencia:** un objeto `Path` también expone `.open()` como MÉTODO, estrictamente equivalente a la función nativa `open()` (mismos argumentos: modo, `encoding`...): `carpeta.open("a", encoding="utf-8")` evita volver a pasar por `open(str(carpeta), "a", encoding="utf-8")` una vez que ya se tiene un `Path` a mano.

## Descomponer una ruta: `.name`, `.stem`, `.suffix`

```python
informe = Path("informe.txt")

informe.name    # "informe.txt" -> nombre completo del archivo
informe.stem    # "informe"     -> nombre SIN la extensión
informe.suffix  # ".txt"        -> la extensión, con el punto

informe.with_name("borrador.txt")                              # Path("borrador.txt") -> reemplaza el nombre entero
informe.with_suffix(".csv")                                     # Path("informe.csv")   -> reemplaza solo la extensión
informe.with_name(f"{informe.stem}.peugeot{informe.suffix}")   # Path("informe.peugeot.txt") -> inserta una palabra en medio
```

> **Trampa:** `.with_name()` reemplaza el ÚLTIMO segmento de la ruta (el nombre del archivo), a diferencia de `/` que AÑADE uno nuevo: `Path("a/b") / "c"` da `a/b/c`, `Path("a/b").with_name("c")` da `a/c`.

## Eliminar una carpeta no vacía: `shutil.rmtree()`

```python
carpeta.rmdir()  # OSError si la carpeta no está vacía -> pathlib se niega deliberadamente a eliminar contenido

import shutil
shutil.rmtree(carpeta)                      # elimina la carpeta Y todo su contenido, recursivamente
shutil.rmtree(carpeta, ignore_errors=True)  # cualquier error (archivo bloqueado...) se ignora, en silencio
```

`shutil` («*shell utilities*», módulo estándar) proporciona operaciones de archivos de más alto nivel que `pathlib`. `shutil.rmtree()` equivale a `rm -rf` en [Bash](/?c=shells&s=bash&p=redirections-et-pipes) o `Remove-Item -Recurse` en [PowerShell](/?c=shells&s=powershell&p=powershell); `shutil.copy()`/`shutil.move()` cubren la copia y el desplazamiento.

> **Trampa:** `ignore_errors=True` hace que un fallo de eliminación sea totalmente silencioso: la carpeta puede permanecer en su sitio sin que ninguna excepción lo señale. Usarlo solo si quien llama vuelve a comprobar después (ej. `carpeta.exists()`) en lugar de suponer que la eliminación tuvo éxito.

## Leer y escribir un archivo CSV

```python
import csv

with open("contactos.csv", newline="", encoding="utf-8") as f:
    lector = csv.reader(f, delimiter=",")
    for fila in lector:
        print(fila)  # ["Juan", "Perez", "25"] -> una simple LISTA, por posición
```

```python
with open("contactos.csv", newline="", encoding="utf-8") as f:
    lector = csv.DictReader(f, delimiter=",")  # usa la primera línea como encabezados
    for fila in lector:
        print(fila)              # {"nombre": "Juan", "apellido": "Perez", "edad": "25"} -> un DICT, por nombre de columna
        print(fila["nombre"])    # "Juan" -> acceso por nombre, más legible que por índice
```

`csv.reader` devuelve cada fila como una lista posicional; `csv.DictReader` transforma cada fila en un diccionario a partir de la línea de encabezado (ver [hachabilidad y claves de dict](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles)), más legible y más robusto ante un reordenamiento de columnas. `delimiter=";"` (habitual en Francia) reemplaza la coma por defecto. En escritura, `csv.writer`/`csv.DictWriter` siguen la misma lógica inversa.

> **Nota:** `newline=""` en `open()` está recomendado por la documentación del módulo `csv`: sin él, los saltos de línea en medio de un valor entre comillas pueden interpretarse mal según el sistema operativo.

## Leer y escribir JSON

Un CSV estructura datos en tabla (filas/columnas); el módulo estándar [`json`](https://docs.python.org/3/library/json.html) estructura datos arborescentes (dicts y listas anidados) en texto, legible por cualquier lenguaje, no solo Python.

```python
import json

usuario = {"nombre": "Léa", "notas": [15, 12, 18]}   # un dict Python "normal"

texto = json.dumps(usuario, ensure_ascii=False)      # '{"nombre": "Léa", "notas": [15, 12, 18]}' -> texto JSON
objeto = json.loads(texto)                           # objeto Python, redecodificado desde el texto (== usuario)
```

| Función | Entrada | Salida |
|---|---|---|
| `json.dumps(obj)` | objeto Python (dict, list...) | texto JSON (`str`) |
| `json.loads(texto)` | texto JSON (`str`) | objeto Python |
| `json.dump(obj, archivo)` | objeto Python + archivo ya abierto | nada: escribe directamente en `archivo` |
| `json.load(archivo)` | archivo ya abierto | objeto Python, leído directamente |

> **Nota:** sin `ensure_ascii=False` (comportamiento por defecto), un carácter acentuado como «é» se escapa en una notación Unicode `\uXXXX` ilegible en el texto JSON producido (`XXXX` siendo su código hexadecimal). `ensure_ascii=False` lo mantiene tal cual; `json.loads()` decodifica ambas formas de manera idéntica.

### El formato «JSON Lines»: añadir entradas sin reescribir todo el archivo

Un archivo JSON clásico contiene un único objeto o array raíz: añadir una entrada obliga a releer todo el archivo, modificarlo en memoria, y luego reescribirlo entero. El formato **JSON Lines** (extensión `.jsonl`) evita este problema: cada LÍNEA del archivo es un objeto JSON completo e independiente, práctico para un archivo que crece a lo largo de la ejecución de un programa (ej. seguimiento del progreso de una tarea).

```python
with open("estados.jsonl", "a", encoding="utf-8") as f:
    f.write(json.dumps({"id": 1, "status": "ok"}, ensure_ascii=False) + "\n")   # AÑADE una línea, sin tocar el resto del archivo
```

```python
with open("estados.jsonl", encoding="utf-8") as f:
    for linea in f:
        entrada = json.loads(linea)   # cada línea se decodifica independientemente de las demás
        print(entrada["id"])
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `pathlib.Path` representa una ruta como un objeto manipulable (`/` para construir, `.stem`/`.suffix`/`.with_name()` para descomponer, `.open()` equivalente a `open()`). `shutil.rmtree()` elimina una carpeta no vacía, lo que `Path.rmdir()` rechaza. `csv.DictReader` lee un CSV en dicts nombrados por encabezado, `csv.reader` en listas posicionales. `json.dumps`/`loads` convierten objeto Python y texto JSON en ambos sentidos; el formato JSON Lines (una línea = un objeto) permite añadir entradas sin reescribir todo el archivo. |
| **Herramientas utilizables** | `Path()`, `.exists()`/`.is_file()`/`.is_dir()`/`.open()`, `.with_name()`/`.with_suffix()`, `shutil.rmtree()`/`.copy()`/`.move()`, `csv.reader`/`DictReader`/`writer`/`DictWriter`, `json.dumps`/`loads`/`dump`/`load`. |
| **Trampas a evitar** | `.with_name()` reemplaza el último segmento de la ruta donde `/` añade uno nuevo. `shutil.rmtree(ignore_errors=True)` hace silencioso un fallo. Olvidar `newline=""` con `csv` puede romper valores multilínea entre comillas. Olvidar `ensure_ascii=False` hace ilegibles los acentos en el JSON producido (sin romper `json.loads()`). |
| **Buenas prácticas** | Comprobar `carpeta.exists()` tras un `rmtree(ignore_errors=True)` en lugar de suponer el éxito. Preferir `DictReader`/`DictWriter` a un acceso por índice en cuanto un CSV tenga encabezados. Usar JSON Lines para un archivo de estado que crece durante la ejecución, un archivo JSON clásico para un objeto fijo. |
