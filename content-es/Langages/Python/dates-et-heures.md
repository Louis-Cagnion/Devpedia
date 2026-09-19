---
order: 16
---

# El módulo `datetime`

Un ordenador mide el tiempo internamente como un simple número de segundos transcurridos (ver más abajo `time.time()`); el módulo estándar **`datetime`** lo viste como un objeto legible (año, mes, día, hora...), práctico para mostrarlo, compararlo o formatearlo como cadena.

## `datetime.now()`: la fecha y hora actuales

```python
from datetime import datetime

ahora = datetime.now()
print(ahora)  # 2026-09-01 14:32:07.123456 -> un objeto datetime, no una simple cadena

ahora.year, ahora.month, ahora.day      # (2026, 9, 1)
ahora.hour, ahora.minute, ahora.second  # (14, 32, 7)

datetime(2026, 1, 1)  # construye una fecha precisa en lugar de "ahora"
```

## Formatear como cadena: `.strftime()`

```python
# "2026-09-01_143207" -> formato compacto, usable en un nombre de archivo
ahora.strftime("%Y-%m-%d_%H%M%S")
ahora.strftime("%d/%m/%Y")         # "01/09/2026"        -> formato europeo habitual
```

| Código | Significa |
|---|---|
| `%Y` | Año en 4 dígitos |
| `%m` | Mes (01-12) |
| `%d` | Día del mes (01-31) |
| `%H` | Hora (00-23) |
| `%M` | Minuto (00-59) |
| `%S` | Segundo (00-59) |

## Analizar una cadena como fecha: `.strptime()`

```python
# operación INVERSA de strftime, misma tabla de códigos
datetime.strptime("2026-09-01_143207", "%Y-%m-%d_%H%M%S")
```

> **Trampa:** el formato dado a `strptime()` debe coincidir EXACTAMENTE con la cadena recibida (mismos separadores, mismo orden); un formato que no coincide lanza un `ValueError`, no un resultado aproximado.

## Serializar una fecha: `.isoformat()`/`.fromisoformat()`

[JSON](/?c=infrastructure&p=json) no tiene un tipo fecha nativo: una fecha debe convertirse por tanto en cadena para almacenarse o transmitirse, y volver a convertirse al leerla.

```python
from datetime import date

hoy = date(2026, 9, 15)

hoy.isoformat()                     # "2026-09-15" -> formato fijo AAAA-MM-DD
date.fromisoformat("2026-09-15")    # date(2026, 9, 15) -> la operación inversa
```

A diferencia de `strftime()`/`strptime()`, `isoformat()`/`fromisoformat()` no exigen ningún código de formato (`%Y`, `%m`...): el formato es siempre el mismo (AAAA-MM-DD), lo que las hace más simples para este caso concreto, pero inutilizables en cuanto se necesita un formato distinto.

> **Buena práctica:** usar `isoformat()`/`fromisoformat()` para almacenar una fecha en un archivo JSON o una base de datos, en lugar de `strftime()`/`strptime()` con un formato que recordar y hacer coincidir en todos los lugares donde se lea la fecha.

## `datetime.now()` vs `time.time()`

```python
import time

# 1798819927.123456 -> número BRUTO de segundos desde el 1 de enero de 1970 (epoch Unix)
time.time()
datetime.now()   # 2026-09-01 14:32:07.123456 -> objeto con año/mes/día... ya descompuestos
```

`time.time()` sirve para medir una DURACIÓN (diferencia entre dos llamadas); `datetime` sirve en cuanto hay que mostrar, comparar o descomponer una fecha/hora legible. Ver también [`sorted()` sobre cadenas](/?c=langages-de-programmation&s=python&p=listes-et-tuples) para ordenar marcas de tiempo escritas en formato `%Y-%m-%d...` sin pasar por `datetime` en absoluto.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `datetime.now()` da la fecha/hora actual como un objeto descompuesto (año, mes, día...). `.strftime()` la formatea como cadena a partir de códigos (`%Y`, `%m`...), `.strptime()` hace lo inverso. `.isoformat()`/`.fromisoformat()` hacen lo mismo, sin código de formato, para serializar una fecha (ej. en JSON). |
| **Herramientas utilizables** | `datetime.now()`, `datetime(anio, mes, dia)`, `.strftime(formato)`, `.strptime(cadena, formato)`, `.isoformat()`/`date.fromisoformat()`, `time.time()` para una simple duración. |
| **Trampas a evitar** | Un formato `strptime()` que no coincide exactamente con la cadena recibida lanza un `ValueError`, sin resultado aproximado. |
| **Buenas prácticas** | Usar `datetime` para todo lo que deba mostrarse/compararse como una fecha; reservar `time.time()` para una medición de duración bruta. Preferir `isoformat()`/`fromisoformat()` a `strftime()`/`strptime()` para almacenar una fecha (JSON, base de datos). |
