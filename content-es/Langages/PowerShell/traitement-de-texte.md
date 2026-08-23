---
order: 10
---

# Procesamiento de texto y objetos

Donde [Bash](/?c=shells&s=bash&p=bash) se apoya en [herramientas de texto especializadas](/?c=shells&s=bash&p=traitement-de-texte) (`grep`, `sed`, `awk`), PowerShell hace el mismo trabajo con cmdlets genéricas que filtran, transforman y seleccionan **objetos**: el texto es solo un caso particular, aquel donde el objeto manipulado es una cadena.

## `Select-String`: buscar texto (equivalente de `grep`)

```powershell
Select-String "error" archivo.log                   # muestra las líneas que contienen "error"
Select-String -CaseSensitive "Error" archivo.log    # sensible a mayúsculas (lo contrario del defecto)
Select-String -NotMatch "error" archivo.log         # inverso: líneas que NO contienen "error"
Select-String "TODO" -Path .\* -Recurse             # búsqueda recursiva en todos los archivos de una carpeta
Select-String "error" archivo.log | Measure-Object  # cuenta las líneas coincidentes
Select-String -Pattern "error|warning" archivo.log  # patrón = una verdadera regex .NET por defecto
```

> **Nota:** contrariamente a `grep` donde hay que agregar `-E` para activar las regex extendidas, `Select-String` interpreta su patrón como una regex **por defecto**: usar `-SimpleMatch` para volver a una búsqueda de texto literal, lo contrario de la convención de Bash.

Cada resultado es un objeto con propiedades explotables directamente, en lugar de una simple línea de texto para volver a analizar:

```powershell
Select-String "error" archivo.log | Select-Object LineNumber, Line
```

## `-replace`: buscar y reemplazar (equivalente de `sed`)

```powershell
(Get-Content archivo.txt) -replace "viejo", "nuevo"                              # reemplaza todas las ocurrencias por línea
(Get-Content archivo.txt) -replace "viejo", "nuevo" | Set-Content archivo.txt    # modifica el archivo
```

> **Nota:** `-replace` reemplaza **todas** las ocurrencias por defecto (lo contrario de `sed 's///'` sin `g`, que solo reemplaza la primera): no hay que agregar ninguna bandera equivalente a la `g` de `sed`, ese comportamiento es el que rige por defecto.

Para procesar solo ciertas líneas (equivalente de una dirección `sed '2,4s///'`), se filtra explícitamente por índice:

```powershell
(Get-Content archivo.txt)[1..3] -replace "viejo", "nuevo"   # líneas 2 a 4 (índice base 0)
```

## `ConvertFrom-Csv`, `ConvertFrom-Json`: procesar datos estructurados (equivalente de `awk`)

Donde `awk` divide manualmente una línea en campos (`$1`, `$2`...), PowerShell convierte directamente un formato estructurado en objetos tipados:

```powershell
Import-Csv datos.csv | Select-Object Nombre, Edad    # columnas accesibles por su nombre, no por posición
Get-Content datos.json | ConvertFrom-Json | Select-Object -ExpandProperty usuario
```

Para un texto no estructurado cercano al uso de `awk` (división por espacios), `-split` sigue disponible:

```powershell
("Juan Perez 25" -split " ")[0]     # Juan -> primer campo
```

## `Sort-Object` y `Get-Unique`/`-Unique`: ordenar y deduplicar

```powershell
Get-Content archivo.txt | Sort-Object                                   # orden alfabético
Get-Content numeros.txt | Sort-Object { [int]$_ }                       # orden numérico explícito
Get-Content archivo.txt | Sort-Object -Descending                       # orden descendente
Get-Content archivo.txt | Sort-Object -Unique                           # ordena Y deduplica en un solo paso
Get-Content archivo.txt | Group-Object | Sort-Object Count -Descending  # cuenta las ocurrencias
```

> **Nota:** contrariamente a `uniq` en Bash (que solo detecta duplicados **adyacentes**, de ahí la obligación de ordenar antes), `Sort-Object -Unique` y `Group-Object` funcionan sobre el conjunto de la colección, sin importar el orden inicial: no hace falta ordenar previamente para deduplicar correctamente.

## `Measure-Object`: contar (equivalente de `wc`)

```powershell
(Get-Content archivo.txt | Measure-Object -Line).Lines            # número de líneas
(Get-Content archivo.txt | Measure-Object -Word).Words            # número de palabras
(Get-Content archivo.txt | Measure-Object -Character).Characters  # número de caracteres
```

## Combinar estas herramientas

```powershell
Select-String "404" access.log |
    ForEach-Object { ($_.Line -split " ")[0] } |
    Group-Object |
    Sort-Object Count -Descending
# 1) conserva las líneas de error 404
# 2) extrae la dirección IP (1er campo de cada línea)
# 3) agrupa las IP idénticas
# 4) ordena por número de ocurrencias descendente -> las IP más frecuentes primero
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | PowerShell trata el texto como un caso particular de objeto: `Select-String` (grep), `-replace` (sed), `ConvertFrom-Csv`/`Json` (awk sobre datos estructurados) manipulan objetos tipados, no solo líneas. |
| **Herramientas utilizables** | `Select-String`, `-replace`, `-split`, `Sort-Object -Unique`, `Group-Object`, `Measure-Object`. |
| **Trampas a evitar** | Olvidar que `Select-String` interpreta su patrón como una regex por defecto (a diferencia de `grep`, que exige `-E`). |
| **Buenas prácticas** | Usar `Sort-Object -Unique`/`Group-Object` en lugar de un ordenamiento manual seguido de una deduplicación: funcionan sobre toda la colección, sin orden previo requerido. |
