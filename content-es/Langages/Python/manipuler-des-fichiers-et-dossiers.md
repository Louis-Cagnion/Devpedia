---
order: 15
---

# Manipular archivos y carpetas con `pathlib`

[La gestión de errores](/?c=langages-de-programmation&s=python&p=gestion-des-erreurs) ya abre un archivo con `open("datos.txt")`, una simple ruta escrita como cadena de caracteres. El módulo estándar **`pathlib`** representa una ruta como un objeto real, manipulable y portable entre sistemas operativos, sin concatenar nunca cadenas a mano.

## `pathlib.Path`: representar una ruta como un objeto

```python
from pathlib import Path

# "/" construye la ruta, PORTABLE (\ en Windows, / en el resto)
carpeta = Path("informes") / "2026" / "agosto.txt"
print(carpeta)                                      # informes/2026/agosto.txt

carpeta.exists()   # True/False -> ¿existe realmente el archivo/carpeta en el disco?
carpeta.is_file()  # True/False
carpeta.is_dir()   # True/False
```

> **Nota:** el operador `/` está sobrecargado aquí (ver [Métodos reflejados](/?c=langages-de-programmation&s=python&p=poo)): `Path.__truediv__` construye una NUEVA ruta añadiendo un segmento, sin tocar nunca la ruta de origen.

> **Equivalencia:** un objeto `Path` también expone `.open()` como MÉTODO, estrictamente equivalente a la función nativa `open()` (mismos argumentos: modo, `encoding`...): `carpeta.open("a", encoding="utf-8")` evita volver a pasar por `open(str(carpeta), "a", encoding="utf-8")` una vez que ya se tiene un `Path` a mano.

## Crear una carpeta: `.mkdir()`

```python
carpeta = Path("informes") / "2026"

# FileNotFoundError si "informes" no existe aún (el padre)
carpeta.mkdir()
# crea también los padres que falten -> ya no hay FileNotFoundError
carpeta.mkdir(parents=True)
# FileExistsError si la carpeta ya existe (sin parents=True)
carpeta.mkdir(exist_ok=True)
# ambos combinados: NUNCA se queja, crea lo que falte
carpeta.mkdir(parents=True, exist_ok=True)
```

`parents=True, exist_ok=True` es el patrón idiomático «crear la carpeta si hace falta»: reemplaza un `if not carpeta.exists(): carpeta.mkdir()` explícito por una sola línea que nunca falla, exista ya la carpeta o no. Uso habitual: crear la carpeta padre de un archivo justo antes de abrirlo en escritura.

```python
ruta_archivo = Path("informes") / "2026" / "agosto.txt"

# crea "informes/2026" antes de escribir el archivo
ruta_archivo.parent.mkdir(parents=True, exist_ok=True)
with ruta_archivo.open("w", encoding="utf-8") as f:
    f.write("terminado")
```

> **Trampa:** olvidar `exist_ok=True` hace que un script relanzado una segunda vez falle sobre una carpeta ya creada en el primer paso (`FileExistsError`), un caso frecuente para una carpeta de salida recreada en cada ejecución.

## Leer/escribir un archivo entero en una línea: `.write_text()`/`.read_text()`

```python
ruta_archivo.write_text("terminado", encoding="utf-8")
# equivale a:
with ruta_archivo.open("w", encoding="utf-8") as f:
    f.write("terminado")

contenido = ruta_archivo.read_text(encoding="utf-8")
# equivale a:
with ruta_archivo.open(encoding="utf-8") as f:
    contenido = f.read()
```

`write_text()`/`read_text()` abren, escriben (o leen) todo el contenido, y cierran el archivo en una sola llamada, sin bloque `with` explícito: práctico para un archivo entero procesado de una vez, no línea por línea o en flujo.

> **Trampa:** usar `write_text()`/`read_text()` en un archivo voluminoso o procesado línea por línea (ver más abajo): estos métodos cargan todo el contenido en memoria de una vez, mientras que un bloque `with` clásico permite iterar sobre las líneas sin cargarlo todo a la vez.

## Descomponer una ruta: `.name`, `.stem`, `.suffix`

```python
informe = Path("informe.txt")

informe.name    # "informe.txt" -> nombre completo del archivo
informe.stem    # "informe"     -> nombre SIN la extensión
informe.suffix  # ".txt"        -> la extensión, con el punto

# Path("borrador.txt") -> reemplaza el nombre entero
informe.with_name("borrador.txt")
# Path("informe.csv")   -> reemplaza solo la extensión
informe.with_suffix(".csv")
# Path("informe.peugeot.txt") -> inserta una palabra en medio
informe.with_name(f"{informe.stem}.peugeot{informe.suffix}")
```

> **Trampa:** `.with_name()` reemplaza el ÚLTIMO segmento de la ruta (el nombre del archivo), a diferencia de `/` que AÑADE uno nuevo: `Path("a/b") / "c"` da `a/b/c`, `Path("a/b").with_name("c")` da `a/c`.

## Eliminar un archivo: `.unlink()`

```python
ruta_archivo.unlink()                 # FileNotFoundError si el archivo ya no existe
ruta_archivo.unlink(missing_ok=True)  # nunca falla, incluso si el archivo ya está ausente
```

`.unlink()` elimina un ARCHIVO, nunca una carpeta (ver `.rmdir()`/`shutil.rmtree()` más abajo para eso). `missing_ok=True` evita un `FileNotFoundError` si el archivo ya fue eliminado: la misma lógica «idempotente, nunca falla si el estado buscado ya está alcanzado» que `exist_ok=True` en `.mkdir()`.

## Eliminar una carpeta no vacía: `shutil.rmtree()`

```python
# OSError si la carpeta no está vacía -> pathlib se niega deliberadamente a eliminar contenido
carpeta.rmdir()

import shutil
# elimina la carpeta Y todo su contenido, recursivamente
shutil.rmtree(carpeta)
# cualquier error (archivo bloqueado...) se ignora, en silencio
shutil.rmtree(carpeta, ignore_errors=True)
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
        # {"nombre": "Juan", "apellido": "Perez", "edad": "25"} -> un DICT, por nombre de
        # columna
        print(fila)
        print(fila["nombre"])    # "Juan" -> acceso por nombre, más legible que por índice
```

`csv.reader` devuelve cada fila como una lista posicional; `csv.DictReader` transforma cada fila en un diccionario a partir de la línea de encabezado (ver [hachabilidad y claves de dict](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles)), más legible y más robusto ante un reordenamiento de columnas. `delimiter=";"` (habitual en Francia) reemplaza la coma por defecto. En escritura, `csv.writer`/`csv.DictWriter` siguen la misma lógica inversa.

> **Nota:** `newline=""` en `open()` está recomendado por la documentación del módulo `csv`: sin él, los saltos de línea en medio de un valor entre comillas pueden interpretarse mal según el sistema operativo.

## Leer y escribir JSON

Un CSV estructura datos en tabla (filas/columnas); el módulo estándar [`json`](https://docs.python.org/3/library/json.html) estructura datos arborescentes (dicts y listas anidados) en texto, legible por cualquier lenguaje, no solo Python.

```python
import json

usuario = {"nombre": "Léa", "notas": [15, 12, 18]}   # un dict Python "normal"

# '{"nombre": "Léa", "notas": [15, 12, 18]}' -> texto JSON
texto = json.dumps(usuario, ensure_ascii=False)
# objeto Python, redecodificado desde el texto (== usuario)
objeto = json.loads(texto)
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
    # AÑADE una línea, sin tocar el resto del archivo
    f.write(json.dumps({"id": 1, "status": "ok"}, ensure_ascii=False) + "\n")
```

```python
with open("estados.jsonl", encoding="utf-8") as f:
    for linea in f:
        # cada línea se decodifica independientemente de las demás
        entrada = json.loads(linea)
        print(entrada["id"])
```

### Releer solo lo añadido desde la última lectura: `.seek()`/`.tell()`

Un archivo de log crece mientras otro proceso lo alimenta continuamente. Releerlo entero a intervalos regulares para extraer solo las líneas nuevas desperdicia tiempo en un archivo cada vez más voluminoso; recordar la posición ya leída permite releer solo lo escrito desde entonces.

```python
posicion = 0

def leer_lineas_nuevas(ruta):
    global posicion
    with open(ruta, encoding="utf-8") as f:
        f.seek(posicion)              # retoma donde se detuvo la lectura anterior
        lineas_nuevas = f.readlines()
        posicion = f.tell()           # memoriza la posición alcanzada, para la próxima llamada
    return lineas_nuevas
```

`.tell()` devuelve la posición actual del cursor de lectura (en bytes desde el inicio del archivo); `.seek(posicion)` recoloca ahí el cursor antes de leer. Al recordar `posicion` entre llamadas, cada pasada relee solo los bytes escritos desde la anterior, nunca el archivo entero.

> **Nota:** este es el mecanismo subyacente de `tail -f` en [Bash](/?c=shells&s=bash&p=redirections-et-pipes) o `Get-Content -Wait` en [PowerShell](/?c=shells&s=powershell&p=powershell): estos comandos siguen ellos mismos un archivo que crece releyendo solo su contenido añadido, nunca desde el principio.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `pathlib.Path` representa una ruta como un objeto manipulable (`/` para construir, `.stem`/`.suffix`/`.with_name()` para descomponer, `.open()` equivalente a `open()`, `.mkdir()` para crear una carpeta). `shutil.rmtree()` elimina una carpeta no vacía, lo que `Path.rmdir()` rechaza. `csv.DictReader` lee un CSV en dicts nombrados por encabezado, `csv.reader` en listas posicionales. `json.dumps`/`loads` convierten objeto Python y texto JSON en ambos sentidos; el formato JSON Lines (una línea = un objeto) permite añadir entradas sin reescribir todo el archivo. `.seek()`/`.tell()` permiten releer solo lo que un archivo en crecimiento recibió desde la última lectura. |
| **Herramientas utilizables** | `Path()`, `.exists()`/`.is_file()`/`.is_dir()`/`.open()`/`.mkdir()`/`.unlink()`, `.write_text()`/`.read_text()`, `.with_name()`/`.with_suffix()`, `shutil.rmtree()`/`.copy()`/`.move()`, `csv.reader`/`DictReader`/`writer`/`DictWriter`, `json.dumps`/`loads`/`dump`/`load`, `.seek()`/`.tell()`. |
| **Trampas a evitar** | `.with_name()` reemplaza el último segmento de la ruta donde `/` añade uno nuevo. `.mkdir()` sin `exist_ok=True` falla si la carpeta ya existe. `.write_text()`/`.read_text()` en un archivo voluminoso que debería procesarse línea por línea. `shutil.rmtree(ignore_errors=True)` hace silencioso un fallo. Olvidar `newline=""` con `csv` puede romper valores multilínea entre comillas. Olvidar `ensure_ascii=False` hace ilegibles los acentos en el JSON producido (sin romper `json.loads()`). Releer un archivo de log entero en cada pasada en lugar de recordar la posición ya leída. |
| **Buenas prácticas** | Usar `carpeta.mkdir(parents=True, exist_ok=True)` (o `ruta_archivo.parent.mkdir(...)`) en lugar de un `if not carpeta.exists(): ...` antes de escribir un archivo. Comprobar `carpeta.exists()` tras un `rmtree(ignore_errors=True)` en lugar de suponer el éxito. Preferir `DictReader`/`DictWriter` a un acceso por índice en cuanto un CSV tenga encabezados. Usar JSON Lines para un archivo de estado que crece durante la ejecución, un archivo JSON clásico para un objeto fijo. Memorizar la posición (`.tell()`) tras cada lectura de un archivo en crecimiento, para recolocar ahí el cursor (`.seek()`) en la siguiente pasada. |
