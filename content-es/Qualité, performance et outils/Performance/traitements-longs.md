---
order: 5
---

# Los procesamientos largos

Pasados unos minutos de ejecución, un programa cambia de naturaleza. Ya no es un comando que se lanza y cuyo resultado se ve: es un procesamiento que puede interrumpirse, que hay que poder supervisar, y cuyo fallo cuesta caro. A esta escala, la robustez se convierte en una cuestión de rendimiento: reanudar un trabajo de 20 minutos es una ganancia mucho mayor que arañarle un 10 %.

## Guardar sobre la marcha

Un programa que acumula sus resultados en memoria y solo escribe al final pierde **todo** en caso de corte: caída, red, suspensión de la máquina. Escribir cada resultado en cuanto se obtiene cambia por completo el comportamiento en caso de incidente.

El formato más simple para esto es [**JSON Lines**](https://jsonlines.org): un objeto JSON completo por línea. A diferencia de un array JSON, no necesita cerrarse para seguir siendo legible: un archivo truncado a mitad de camino sigue siendo utilizable hasta su última línea completa.

```python
class EstadoDeAvance:
    def __init__(self, ruta, reanudacion=False):
        self.ruta = Path(f"{ruta}.parcial")
        self.resultados = []
        if reanudacion and self.ruta.exists():
            self.resultados = [json.loads(linea) for linea
                              in self.ruta.read_text(encoding="utf-8").splitlines() if linea.strip()]
        else:
            self.ruta.unlink(missing_ok=True)
        self.hechos = {clave(r) for r in self.resultados}

    def anadir(self, resultado):
        self.resultados.append(resultado)
        self.hechos.add(clave(resultado))
        with self.ruta.open("a", encoding="utf-8") as f:
            f.write(json.dumps(resultado, ensure_ascii=False) + "\n")
```

El bucle principal entonces salta lo que ya está hecho:

```python
restante = [t for t in tareas if not estado.esta_hecho(t)]
```

Dos detalles que marcan la diferencia en el uso:

- **Filtrar antes de contar.** Si se saltan elementos dentro del bucle, los contadores de progreso y la estimación de finalización se vuelven falsos (incluyen trabajo que no costó nada). Calcular primero la lista de lo que queda hace que ambos sean exactos.
- **Separar el estado del entregable.** Este archivo es mecánica interna, no un resultado: darle un nombre explícito (`.parcial`) y eliminarlo al final evita que se lo confunda con la salida. Mantenerlo separado del entregable también evita que una herramienta externa (una hoja de cálculo, por ejemplo) lo reguarde en un formato que rompería la reanudación.

## Leer un archivo grande sobre la marcha en vez de cargarlo todo

Un archivo de pocos kilobytes se carga entero en memoria sin pensarlo. Un archivo de varios cientos de megabytes (una exportación XML de catálogo de productos, por ejemplo) cambia las cosas: cargarlo de un bloque puede bastar para agotar la memoria disponible.

```text
Carga completa (DOM):        archivo entero -> arbol en memoria -> recorrido
                              memoria proporcional al tamano del archivo

Streaming (SAX/XMLReader):   archivo -> leido nodo por nodo -> procesado sobre la marcha
                              memoria casi constante, sea cual sea el tamano del archivo
```

| | Carga completa (DOM, SimpleXML) | Streaming (SAX, `XMLReader`) |
|---|---|---|
| Memoria usada | Proporcional al tamaño del archivo | Casi constante |
| Simplicidad del código | Simple: todo el documento es navegable de una vez | Más verboso: hay que avanzar manualmente en el flujo |
| Adecuado para | Archivos de tamaño razonable (hasta unas decenas de MB) | Archivos voluminosos, donde cargar todo haría fallar el proceso |

```php
<?php
$lector = new XMLReader();
$lector->open('catalogo.xml');

while ($lector->read()) {
    if ($lector->nodeType === XMLReader::ELEMENT && $lector->name === 'producto') {
        $producto = new SimpleXMLElement($lector->readOuterXML());   // un solo <producto> en memoria a la vez
        procesar($producto);
    }
}
$lector->close();
?>
```

`XMLReader` avanza en el archivo un nodo a la vez, sin cargar nunca la totalidad del árbol: cada vez que se encuentra un `<producto>`, solo ese fragmento se convierte momentáneamente en objeto, se procesa, y luego se libera en la siguiente vuelta.

El mismo compromiso existe más allá de PHP: [`xml.etree.ElementTree.iterparse`](https://docs.python.org/3/library/xml.etree.elementtree.html#xml.etree.ElementTree.iterparse) en Python, o la biblioteca [`sax`](https://www.npmjs.com/package/sax) en Node.js.

> **Trampa:** cargar un archivo XML voluminoso con `SimpleXML`/DOM "porque funciona en desarrollo" (un archivo de prueba reducido), sin haberlo probado con un volumen representativo de producción.
>
> **Buena práctica:** en cuanto un archivo pueda superar unas decenas de megabytes en producción, preferir un parser en streaming (`XMLReader` o equivalente) a la carga completa, aunque el código se vuelva un poco más verboso.

## Mostrar el avance

Un procesamiento de 20 minutos sin visualización es indistinguible de un programa bloqueado. Mostrar el avance y una estimación del tiempo restante cuesta unas pocas líneas:

```python
def tiempo_restante(inicio, hechos, total):
    if hechos < 2:                      # aun no hay ritmo medible
        return ""
    restante = (time.monotonic() - inicio) / hechos * (total - hechos)
    return f" ~{int(restante)}s restantes" if restante < 90 else f" ~{round(restante / 60)} min restantes"
```

Use `time.monotonic()` y no `time.time()`: el segundo puede retroceder (sincronización de reloj, cambio de hora) y producir duraciones negativas.

## Nunca tener éxito a medias en silencio

Este es el punto más importante, y el más fácil de fallar. Un procesamiento largo rara vez falla de golpe: falla **parcialmente**. Una página de cada cincuenta no carga, falta un elemento. Si el programa simplemente continúa, produce un resultado incompleto que tiene toda la apariencia de un resultado completo.

El reflejo peligroso es el `break` o el `except` silencioso:

```python
try:
    cargar_lo_siguiente()
except Timeout:
    break              # se sale con datos parciales, sin señalar nada
```

La corrección no es impedir el fallo (es imposible) sino garantizar que sea **visible**. El método más fiable es verificar un **invariante** al final: una propiedad que siempre debe ser verdadera en ese punto del programa, sea cual sea el camino tomado para llegar ahí (aquí: "el número de elementos obtenidos corresponde al número anunciado"), independientemente de la razón del fallo:

```python
if total_anunciado is not None and len(cargados) < total_anunciado:
    marcar_incompleto(f"{len(cargados)} elementos de {total_anunciado} anunciados")
```

Esta verificación captura todos los casos, incluidos los que no se habían previsto (cambio de diseño del sitio, lentitud inusual). Se basa en un principio simple: el programa a menudo sabe **cuántos** debería obtener. Comparar lo obtenido con lo esperado es casi siempre posible, y es lo que distingue un resultado fiable de un resultado plausible.

> En un procesamiento de varios cientos de unidades, un estado explícito del tipo `INCOMPLETO` es más útil que una excepción: preserva los datos ya recopilados a la vez que señala que hay que reanudarlos. Lo inaceptable es el tercer caso: incompleto y clasificado como `OK`.

## Verificar el contenido producido, no el código de retorno

Los dos bugs más serios que encontré en este tipo de programa salían ambos con un **código de retorno 0**: una extracción incompleta clasificada como correcta, y un informe final completamente vacío tras fusionar resultados paralelos. Ningún test de "¿se cae?" los habría detectado.

La lección es directa: para un procesamiento largo y no supervisado, pruebe el **contenido** de la salida (el número de elementos, la presencia de las secciones esperadas), no solo el hecho de que el programa termine.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un procesamiento de varios minutos debe poder reanudarse tras un corte (guardado sobre la marcha), leer un archivo grande sobre la marcha en vez de cargarlo todo, mostrar su avance, y detectar un fallo parcial en lugar de ocultarlo silenciosamente. |
| **Herramientas utilizables** | El formato JSON Lines para un guardado incremental resiliente, un parser en streaming (`XMLReader`, `iterparse`) para un archivo grande, `time.monotonic()` para una estimación de duración fiable, una verificación de invariante al final del procesamiento. |
| **Trampas a evitar** | Un `except`/`break` silencioso que deja un resultado parcial sin señalarlo; verificar solo el código de retorno, no el contenido real producido; cargar un archivo grande enteramente en memoria sin haberlo probado con un volumen representativo. |
| **Buenas prácticas** | Comparar el número de elementos obtenidos con el número esperado; separar el archivo de estado interno (`.parcial`) del entregable final; preferir un parser en streaming en cuanto un archivo pueda superar unas decenas de megabytes. |
