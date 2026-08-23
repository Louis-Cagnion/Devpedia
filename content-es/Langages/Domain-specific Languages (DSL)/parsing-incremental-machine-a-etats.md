---
order: 3
---

# Parsing incremental por máquina de estados

[La regex](/?c=domain-specific-languages-dsl&p=regex) encuentra patrones en texto, pero sigue siendo ciega a una **estructura anidada** (una etiqueta abierta en algún sitio, cerrada mucho más lejos, con otras etiquetas en medio): no es para eso para lo que está hecha. La solución más conocida para un formato marcado como [HTML](/?c=langages-de-balisage&s=html&p=html) (o su primo más genérico [**XML**](https://www.w3.org/XML/), *Extensible Markup Language*, que sigue las mismas reglas de etiquetas anidadas pero sin vocabulario de etiquetas predefinido) es construir un **árbol** completo en memoria, el [DOM](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements), y luego recorrerlo. Existe una tercera vía, más ligera: el **parsing incremental**, que trata el texto sobre la marcha, un evento a la vez, sin construir nunca una estructura completa.

## Tres formas de leer un formato marcado

| | Regex | Árbol (DOM) | Parsing incremental |
|---|---|---|---|
| Principio | Buscar un patrón de texto | Construir toda la estructura en memoria, luego recorrerla | Recibir un evento por cada etiqueta encontrada (apertura, texto, cierre), sobre la marcha de la lectura |
| Memoria usada | Mínima | Proporcional al tamaño del documento entero | Mínima: nada se almacena nunca más allá de lo que el código elige conservar |
| ¿Entiende el anidamiento? | No | Sí, nativamente (es un árbol) | No nativamente: es el código llamador quien debe reconstruirlo él mismo |
| Adecuado para | Una búsqueda/un reemplazo puntual | Un documento que cabe cómodamente en memoria, a consultar en varios sentidos | Un documento muy grande, o una estructura simple que no vale la pena cargar entera |

Un parser incremental nunca conoce "todo el documento": solo sabe lo que ocurre **ahora**, más lo que el código ha elegido explícitamente memorizar desde el principio. Esta restricción es lo que le da su nombre de **máquina de estados**: el programa debe mantener él mismo un estado ("¿estoy actualmente dentro de una fila de tabla? ¿de una celda?"), actualizado en cada evento recibido.

## `HTMLParser`: un ejemplo concreto en [Python](/?c=langages&s=python&p=python)

El módulo estándar `html.parser` proporciona `HTMLParser`, una clase de la que heredar: tres métodos, llamados automáticamente en cada etiqueta o fragmento de texto encontrado durante la lectura.

```python
from html.parser import HTMLParser

class MiParser(HTMLParser):
    def handle_starttag(self, tag, attrs):
        print(f"Apertura: <{tag}> con atributos {attrs}")

    def handle_endtag(self, tag):
        print(f"Cierre: </{tag}>")

    def handle_data(self, data):
        if data.strip():
            print(f"Texto: {data.strip()!r}")

parser = MiParser()
parser.feed("<p>Hola <b>a todos</b></p>")
```

```text
Apertura: <p> con atributos []
Texto: 'Hola'
Apertura: <b> con atributos [('class', None)]
Texto: 'a todos'
Cierre: </b>
Cierre: </p>
```

`feed()` puede llamarse varias veces con trozos sucesivos del documento (útil para un flujo recibido poco a poco, por ejemplo desde la red): el parser no necesita conocer nada de antemano sobre lo que sigue.

> **Nota:** `HTMLParser` no verifica **ninguna** coherencia de estructura. Un `</p>` sin `<p>` correspondiente, o una etiqueta nunca cerrada, no provoca ningún error: cada `handle_*` simplemente se llama cuando se encuentra la etiqueta correspondiente, sin juicio sobre la validez del documento. Es al código llamador a quien corresponde decidir qué hacer con un evento inesperado.

## Reconstruir una estructura: mantener el estado uno mismo

`HTMLParser` transmite eventos, pero nunca devuelve "la fila de una tabla" o "la celda actual": estas nociones solo existen construyendo variables de instancia actualizadas en cada evento, exactamente como hace un proyecto real que reconstruye una tabla HTML (`<table>`/`<tr>`/`<td>`) en una cuadrícula de celdas:

```python
class ParserTabla(HTMLParser):
    def __init__(self):
        super().__init__()
        self.filas = []            # todas las filas completas, una vez cerradas
        self._fila_actual = None   # None = "no estoy actualmente dentro de un <tr>"
        self._celda_actual = None

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self._fila_actual = []
        elif tag in ("td", "th"):
            self._celda_actual = []

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self._celda_actual is not None:
            texto = "".join(self._celda_actual).strip()
            self._fila_actual.append(texto)
            self._celda_actual = None
        elif tag == "tr" and self._fila_actual is not None:
            self.filas.append(self._fila_actual)
            self._fila_actual = None

    def handle_data(self, data):
        if self._celda_actual is not None:
            self._celda_actual.append(data)
```

- `self._fila_actual` y `self._celda_actual` son el **estado** de esta máquina de estados: su valor (`None` o una lista en curso de llenado) determina cómo interpretar el próximo evento recibido.
- `handle_data` puede llamarse **varias veces** para un mismo texto (el módulo HTML subyacente a veces divide el texto en varios fragmentos, por ejemplo alrededor de una entidad como `&amp;`): por eso `_celda_actual` acumula en una **lista** (`.append`), en lugar de sobrescribir una simple variable en cada llamada.

> **Trampa:** sobrescribir el estado acumulado en lugar de extenderlo (`self._celda_actual = data` en lugar de `self._celda_actual.append(data)`). Si el texto de una celda llega en varios fragmentos, solo sobreviviría el último fragmento, sin error visible: solo una celda truncada en el resultado final.
>
> **Buena práctica:** acumular siempre (`append`/concatenación) el texto recibido por `handle_data`, nunca reemplazarlo, mientras no se alcance la etiqueta de cierre correspondiente.

## El caso difícil: las fusiones (`rowspan`) que atraviesan varias filas

Reconstruir la posición exacta (fila, columna) de cada celda se vuelve claramente más delicado en cuanto una celda tiene un `rowspan`: "ocupa" su columna en las filas **siguientes**, que aún no se han leído en el momento en que se conoce esta información.

```text
Eventos recibidos en orden:              Cuadrícula reconstruida:
<tr><td rowspan="2">A</td><td>B</td></tr>   Fila 0: [A (col 0), B (col 1)]
<tr><td>C</td></tr>                          Fila 1: [A aún ocupa col 0, C (col 1)]
```

En la fila 1, el único evento recibido es `<td>C</td>`: nada, en ese evento aislado, dice en qué columna debe caer `C`. Hace falta que el código recuerde, desde la fila anterior, que la columna 0 todavía está "tomada" por la celda `A` durante una vuelta más:

```python
columnas_ocupadas = {}  # {índice de columna: número de filas restantes ocupadas por una fusión}

def colocar_celda(columna_inicio, rowspan, columnas_ocupadas):
    columna = columna_inicio
    while columnas_ocupadas.get(columna, 0) > 0:  # esta columna todavía está tomada por una fusión anterior
        columna += 1                              # -> desplazar hacia la primera columna realmente libre
    if rowspan > 1:
        columnas_ocupadas[columna] = rowspan
    return columna
```

Antes de tratar cada nueva fila, cada contador de `columnas_ocupadas` aún activo debe decrementarse en uno (una fila más acaba de ser "consumida" por la fusión), y retirarse una vez llegado a cero.

> **Trampa:** colocar una celda en su posición bruta (0, 1, 2...) sin consultar las fusiones aún activas heredadas de las filas anteriores. La celda siguiente acaba entonces en la columna equivocada, un desfase que se propaga silenciosamente hasta el final de la fila, sin que ningún error lo señale.
>
> **Buena práctica:** mantener explícitamente, columna por columna, el número de filas restantes que una fusión vertical aún debe ocupar, y hacer "saltar" esas columnas antes de colocar cada nueva celda de una fila.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un parser incremental (`HTMLParser`) entrega un evento por cada etiqueta/texto encontrado, sin construir nunca una estructura completa: es al código a quien corresponde mantener su propio estado (una máquina de estados) para reconstruir el sentido, fila por fila, celda por celda. |
| **Herramientas utilizables** | `html.parser.HTMLParser` (`handle_starttag`/`handle_endtag`/`handle_data`), un diccionario de columnas ocupadas para seguir las fusiones (`rowspan`) que atraviesan varias filas. |
| **Trampas a evitar** | Sobrescribir un texto acumulado en lugar de extenderlo entre varias llamadas a `handle_data`. Colocar una celda sin tener en cuenta las fusiones activas heredadas de las filas anteriores. |
| **Buenas prácticas** | Acumular siempre el texto recibido hasta la etiqueta de cierre. Seguir explícitamente, columna por columna, las fusiones verticales aún activas antes de colocar una nueva celda. |
