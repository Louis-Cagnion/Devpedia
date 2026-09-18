---
order: 5
---

# Leer un libro Excel (.xlsx) por script

Un archivo **.xlsx** (libro de Excel) no es una simple cuadrícula de valores: cada celda que contiene una fórmula (`=A1+B1`) almacena a la vez esa **fórmula** y su **último valor calculado**, guardado en caché por Excel en el último guardado. Una biblioteca que lee este archivo debe elegir cuál de los dos devuelve.

## [`openpyxl`](https://openpyxl.readthedocs.io): fórmula por defecto, valor en caché con `data_only`

```python
import openpyxl

libro = openpyxl.load_workbook("informe.xlsx")
hoja = libro.active   # la hoja activa por defecto, la ultima abierta en Excel

for fila in hoja.iter_rows(min_row=2, values_only=True):
    print(fila)   # devuelve la CADENA DE FORMULA ("=A1+B1"), no el resultado calculado
```

```python
libro = openpyxl.load_workbook("informe.xlsx", data_only=True)
hoja = libro.active

for fila in hoja.iter_rows(min_row=2, values_only=True):
    print(fila)   # ahora devuelve el VALOR EN CACHE, no la formula
```

| | Sin `data_only` (por defecto) | Con `data_only=True` |
|---|---|---|
| Celda sin fórmula | El valor en sí | El valor en sí (idéntico) |
| Celda con fórmula | La cadena de fórmula (`"=A1+B1"`) | El último valor calculado, guardado en caché por Excel |

> **Trampa:** `data_only=True` NUNCA recalcula una fórmula por sí mismo: `openpyxl` es un simple lector del archivo tal como está almacenado en disco, nunca un motor de cálculo. Si el archivo nunca se volvió a abrir/guardar en Excel después de un cambio que afecta a una fórmula, el valor en caché puede estar ausente (`None`, fórmula nunca evaluada) o desactualizado (refleja un cálculo antiguo).
>
> **Buena práctica:** si la frescura del resultado calculado es crítica, asegurarse de que el archivo se haya recalculado/vuelto a guardar realmente en Excel (o una herramienta equivalente) antes de leerlo con `data_only=True`; en su defecto, recalcular uno mismo el valor en el script a partir de los datos brutos en lugar de confiar en la caché.

## Acceder a una hoja concreta entre varias

```python
libro = openpyxl.load_workbook("informe.xlsx", data_only=True)
print(libro.sheetnames)              # lista de los nombres de hoja del libro
hoja = libro["Ventas 2025"]          # acceder a una hoja concreta por su nombre
```

Un libro puede contener varias hojas (tantas pestañas como en Excel); `libro.active` solo devuelve la que estaba abierta en último lugar al guardar, no necesariamente la primera ni la deseada.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un `.xlsx` almacena a la vez la fórmula de una celda y su último valor calculado en caché. `openpyxl` devuelve la fórmula por defecto, el valor en caché con `data_only=True`; nunca recalcula nada por sí mismo. |
| **Herramientas utilizables** | `openpyxl.load_workbook(ruta, data_only=True)`, `libro.sheetnames`, `libro["Nombre de hoja"]`, `hoja.iter_rows(min_row=..., values_only=True)`. |
| **Trampas a evitar** | Suponer que `data_only=True` recalcula una fórmula modificada desde el último guardado en Excel. Acceder a `libro.active` suponiendo que es la primera hoja. |
| **Buenas prácticas** | Verificar que el archivo se haya vuelto a guardar en Excel tras cualquier cambio de fórmula, antes de leer su valor en caché. Acceder a una hoja por su nombre explícito en lugar de por `active` en cuanto el libro contenga varias. |
