---
order: 9
---

# Robustez de un tratamiento por lotes

Un **tratamiento por lotes** (*batch*) es un programa que procesa una larga lista de elementos en una sola ejecución: 10 000 archivos que convertir, 300 páginas web que leer, todas las filas de una tabla que recalcular. A menudo se ejecuta sin nadie delante de la pantalla, por ejemplo lanzado cada noche por una [tarea programada](/?c=langages&s=bash&p=automatisation-cron). Tres situaciones lo ponen en apuros: una interrupción a mitad de camino, un recurso que se cae y un resultado vacío que se confunde con un error. Este capítulo da una herramienta para cada una; los ejemplos están en [Python](/?c=langages&s=python&p=gestion-des-erreurs).

## Reanudar tras una interrupción: el punto de control

Sin precauciones, un tratamiento de 3 horas interrumpido a las 2 h 50 (corte de red, reinicio de la máquina) tiene que volver a empezar. Un **punto de control** (*checkpoint*) lo evita: después de cada elemento procesado, el programa anota en un archivo de estado lo que ya está hecho; relanzado con una opción como `--resume`, se salta esos elementos.

| | Sin punto de control | Con punto de control |
|---|---|---|
| Interrupción al 95 % | Hay que rehacerlo todo | Solo se procesa el 5 % restante |
| Coste | Ninguno | Una escritura de archivo por elemento |

```python
import json
import os

ARCHIVO_ESTADO = "estado.json"             # archivo que memoriza los elementos ya procesados

def cargar_estado():
    if not os.path.exists(ARCHIVO_ESTADO): # primera ejecución: todavía no hay nada hecho
        return set()
    with open(ARCHIVO_ESTADO, encoding="utf-8") as f:
        return set(json.load(f))           # lista JSON releída como conjunto

def guardar_estado(hechos):
    temporal = ARCHIVO_ESTADO + ".tmp"
    with open(temporal, "w", encoding="utf-8") as f:
        json.dump(sorted(hechos), f)       # escribe primero un archivo aparte...
    os.replace(temporal, ARCHIVO_ESTADO)   # ...y luego lo coloca de una sola vez

hechos = cargar_estado()
for elemento in elementos:
    if elemento in hechos:
        continue                           # ya procesado en una ejecución anterior
    procesar(elemento)                     # el trabajo real, resultado guardado aquí
    hechos.add(elemento)
    guardar_estado(hechos)                 # marcado como hecho solo una vez guardado
```

El archivo de estado está en formato [JSON](/?c=infrastructure-devops&s=infrastructure&p=json); la lectura y escritura de archivos se detallan en [manipular archivos](/?c=langages&s=python&p=manipuler-des-fichiers-et-dossiers).

> **Trampa:** escribir directamente en `estado.json`. Un corte durante la escritura deja un archivo a medio escribir, ilegible al relanzar: se pierde todo el seguimiento. [`os.replace`](https://docs.python.org/3/library/os.html#os.replace) reemplaza el archivo en una sola operación, así que siempre se encuentra o bien la versión antigua completa, o bien la nueva.
>
> **Trampa:** marcar un elemento como hecho antes de haber guardado su resultado. Un corte entre ambos, y el elemento se considera procesado mientras su resultado no existe en ninguna parte.
>
> **Buena práctica:** hacer **idempotente** el procesamiento de un elemento (hacerlo dos veces da el mismo resultado que una): si el corte ocurre justo después de `procesar()` pero antes de `guardar_estado()`, el elemento simplemente se vuelve a procesar sin daño.

## Dejar de solicitar un recurso caído: el disyuntor

Cuando un recurso (un sitio web, una base de datos) deja de responder, reintentar cada elemento uno por uno desperdicia tiempo y puede agravar la caída. Un **disyuntor** (*circuit breaker*) corta las llamadas a ese recurso tras varios fallos consecutivos, como un disyuntor eléctrico corta la corriente tras una sobrecarga ([CircuitBreaker, Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html); [Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)).

```text
            N fallos consecutivos
 CERRADO ─────────────────────────▶  ABIERTO
 (llamadas                           (llamadas rechazadas
  normales) ◀──── éxito ─────┐        sin intentarlo)
                              │           │
                        SEMIABIERTO ◀─────┘ tras un plazo
                        (una sola llamada de prueba)
```

| Estado | Comportamiento | Pasa a |
|---|---|---|
| **Cerrado** | Las llamadas pasan con normalidad; se cuentan los fallos consecutivos | Abierto, al N-ésimo fallo seguido |
| **Abierto** | Las llamadas se rechazan de inmediato, sin contactar con el recurso | Semiabierto, tras un plazo |
| **Semiabierto** | Se permite una sola llamada de prueba | Cerrado si funciona, abierto si falla |

En un tratamiento por lotes, a menudo basta una versión sencilla: tras 3 fallos seguidos en un mismo sitio, se abandonan sus elementos restantes en esta ejecución y se señala.

```python
UMBRAL = 3                              # fallos consecutivos antes de cortar
fallos = {}                             # sitio -> número de fallos seguidos
cortados = set()                        # sitios abandonados en esta ejecución

for pagina in paginas:
    if pagina.sitio in cortados:
        continue                        # disyuntor abierto: ni siquiera se intenta
    try:
        leer(pagina)
        fallos[pagina.sitio] = 0        # un éxito pone el contador a cero
    except ErrorDeLectura:
        fallos[pagina.sitio] = fallos.get(pagina.sitio, 0) + 1
        if fallos[pagina.sitio] >= UMBRAL:
            cortados.add(pagina.sitio)  # 3 fallos seguidos: se corta este sitio
```

El disyuntor complementa el **backoff exponencial** (esperar cada vez más entre dos intentos de una misma llamada, ver [el SDK y la API](/?c=ia&s=modeles-de-decision-structuree&p=sdk-et-api)): el backoff espacia los intentos de una llamada, el disyuntor deja de llamar a un recurso claramente caído.

> **Trampa:** reintentar indefinidamente un recurso caído: el tratamiento no termina nunca, o muy tarde, para un resultado nulo.
>
> **Buena práctica:** señalar siempre un recurso cortado en el informe final, para que se trate en la siguiente ejecución en lugar de olvidarlo.

## Distinguir «resultado vacío» y «fallo de lectura»

Una página que no se ha podido leer y una página que realmente no contiene nada dan las dos «0 elementos». Confundirlas falsea el resultado en ambos sentidos:

| Situación real | Si se cuenta «0» sin distinguir | Consecuencia |
|---|---|---|
| La tienda realmente no tiene ningún anuncio | Correcto | Alerta de negocio legítima |
| La página no se ha podido leer (bloqueo, caída) | Mismo «0» | Falsa alerta de negocio, y el verdadero problema técnico pasa desapercibido |

La solución consiste en devolver un **estado explícito** con cada resultado, aquí con una [dataclass](/?c=langages&s=python&p=dataclasses):

```python
from dataclasses import dataclass, field

@dataclass
class Resultado:
    estado: str                           # "ok" o "fallo_lectura"
    anuncios: list = field(default_factory=list)

def contar(pagina):
    try:
        return Resultado("ok", extraer_anuncios(pagina))
    except ErrorDeLectura:
        return Resultado("fallo_lectura") # nunca confundido con una lista vacía
```

| Estado | Número de anuncios | Tratamiento en el informe |
|---|---|---|
| `ok` | al menos 1 | Resultado normal |
| `ok` | 0 | Estado de negocio (tienda vacía) |
| `fallo_lectura` | desconocido | Incidente técnico, contado aparte, nunca como «0» |

> **Buena práctica:** contar por separado los elementos vacíos y los fallos en el informe final, y no disparar una alerta bloqueante más que para lo que realmente lo exige (ver [control bloqueante o alerta no bloqueante](/?c=infrastructure-devops&s=ci-cd&p=yaml-pipelines-azure) en un pipeline).

## Validar el reemplazo antes de destruir lo antiguo

Un proceso que **reemplaza** un estado existente (reconstruir un índice de búsqueda, regenerar un archivo de caché) debe validar los datos nuevos **antes** de tocar los antiguos. En el orden inverso, un reemplazo fallido cambia un estado válido por uno vacío o roto, a menudo con un mensaje de éxito engañoso.

| Orden | Si la lectura falla |
|---|---|
| Vaciar el índice y luego llenarlo | El índice queda vacío: las búsquedas ya no encuentran nada y nada señala la avería |
| Leer y validar, luego reemplazar | El índice antiguo sigue en su sitio y el fallo se señala |

```python
def reemplazar_indice(indice, leer):
    """Reemplaza el contenido de indice por leer(); no destruye nada si la lectura falla."""
    nuevo = leer()                    # None: fallo de lectura; []: resultado vacío legítimo
    if nuevo is None:
        return "fallo: índice conservado"
    indice.clear()                    # destrucción DESPUÉS de la validación, nunca antes
    indice.extend(nuevo)
    return f"{len(nuevo)} documento(s)"
```

La prueba `nuevo is None` solo funciona si la lectura distingue bien un fallo de un resultado vacío (ver [la sección anterior](#distinguir-resultado-vacio-y-fallo-de-lectura)). Para un archivo, la misma idea da la escritura atómica vista más arriba: escribir la nueva versión al lado y luego renombrarla en lugar de la antigua.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un punto de control permite reanudar un tratamiento interrumpido; un disyuntor deja de llamar a un recurso caído; un estado explícito distingue un resultado vacío de un fallo de lectura. |
| **Herramientas utilizables** | Un archivo de estado JSON escrito mediante un archivo temporal y `os.replace`; un contador de fallos consecutivos por recurso; una dataclass con un campo `estado`. |
| **Trampas a evitar** | Escribir el archivo de estado directamente; marcar un elemento como hecho antes de guardar su resultado; reintentar indefinidamente un recurso caído; contar un fallo de lectura como «0». |
| **Buenas prácticas** | Un procesamiento idempotente por elemento; señalar cada recurso cortado en el informe; contar por separado vacíos y fallos; validar un dato nuevo antes de destruir el que reemplaza. |
