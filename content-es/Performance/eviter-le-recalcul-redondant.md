---
order: 7
---

# Evitar el recálculo redundante

Un principio más general se esconde detrás de [esperar una condición en lugar de una duración](/?c=performance&p=attentes-et-temps-morts): **nunca recalcular un resultado que nada ha podido cambiar desde su último cálculo**. Mientras que el capítulo anterior trataba sobre la espera (del tiempo que pasa), este trata sobre el cálculo (del procesador y la memoria que trabajan): la misma pereza disciplinada, aplicada a otro tipo de coste.

## Memoizar el resultado de una función

El caso más directo: una función costosa, llamada varias veces con los mismos argumentos, que rehace el mismo trabajo en cada llamada.

```python
def calificacion_crediticia(id_cliente):
    # consulta pesada: agrega el historial, calcula un puntaje
    return calcular_puntaje(recuperar_historial(id_cliente))

# llamada 3 veces para el mismo cliente en el mismo procesamiento
for pedido in pedidos_del_cliente:
    if calificacion_crediticia(id_cliente) < umbral:
        rechazar(pedido)
```

Nada cambia `id_cliente` ni su historial entre estas tres llamadas: la segunda y la tercera recalculan exactamente lo que la primera ya produjo.

```python
_cache_calificaciones = {}

def calificacion_crediticia(id_cliente):
    if id_cliente not in _cache_calificaciones:
        _cache_calificaciones[id_cliente] = calcular_puntaje(recuperar_historial(id_cliente))
    return _cache_calificaciones[id_cliente]
```

La **memoización** guarda en memoria el resultado para una entrada dada y lo reutiliza mientras nada pueda invalidarlo. La condición que la hace correcta no es "es más rápido", es "la entrada no ha cambiado": exactamente el mismo invariante que el del banner de cookies ya tratado en el capítulo anterior, aplicado aquí a un valor en lugar de a un estado de visualización.

> Una memoización sin invalidación es un bug en suspenso: si `id_cliente` puede ver su historial modificado durante el procesamiento (un pago que llega entre dos pedidos), la caché devuelve una respuesta obsoleta. Memoizar es, primero, identificar qué volvería obsoleto el resultado, antes de decidir conservarlo.

## Recalcular solo lo que ha cambiado

El mismo principio se aplica a la escala de un procesamiento entero, no solo de una llamada de función. Si solo una parte de los datos ha cambiado desde el último pase, volver a procesar todo equivale a rehacer todo el trabajo ya validado para modificar solo un fragmento.

```python
# en cada ejecucion: se vuelve a procesar las 50 000 lineas del archivo
for linea in todo_el_archivo:
    resultados.append(procesar(linea))
```

```python
# solo se vuelve a procesar lo llegado desde el ultimo pase
ultima_marca_temporal = leer_marca_de_progreso()
lineas_nuevas = [l for l in todo_el_archivo if l.marca_temporal > ultima_marca_temporal]

for linea in lineas_nuevas:
    resultados.append(procesar(linea))

escribir_marca_de_progreso(lineas_nuevas[-1].marca_temporal if lineas_nuevas else ultima_marca_temporal)
```

El coste del procesamiento se vuelve proporcional a lo que **cambió**, no al tamaño total de los datos: una ganancia que se acentúa a medida que el volumen ya procesado crece frente al volumen realmente nuevo.

## El ejemplo del videojuego 2D: solo redibujar lo que se mueve

Un juego 2D que gestiona él mismo su memoria de visualización (un array de píxeles o de tiles en memoria, sin delegar a un motor de renderizado que ya optimiza esto) ilustra bien el principio a la escala de una imagen completa.

```python
# en cada tick: se redibuja toda la imagen, aunque solo un personaje se haya movido
def dibujar_frame(pantalla, escena):
    for x in range(pantalla.ancho):
        for y in range(pantalla.alto):
            pantalla.definir_pixel(x, y, escena.color_en(x, y))
```

Si un tick solo mueve un personaje unos pocos píxeles, el resto del decorado es idéntico píxel por píxel al frame anterior: recalcularlo no cambia nada el resultado, solo el tiempo empleado en obtenerlo.

```python
# solo se redibujan los rectangulos marcados como "sucios" (modificados desde el ultimo tick)
def dibujar_frame(pantalla, escena, zonas_modificadas):
    for zona in zonas_modificadas:
        for x, y in zona.pixeles():
            pantalla.definir_pixel(x, y, escena.color_en(x, y))
```

Es la lógica del **dirty rectangle** (rectángulo sucio): la escena señala ella misma qué zonas han cambiado desde el último renderizado, y solo esas se redibujan. En un decorado 90 % estático, esto reduce el coste de cada frame a una fracción del de un renderizado completo, para un resultado visualmente idéntico.

## Un ejemplo tomado de un scraper: no confirmar lo que ya está probado

Un scraper de anuncios clasificados comparaba dos anuncios para saber si describían el mismo vehículo (duplicado) o dos vehículos diferentes. La verificación completa abría la página detallada de cada anuncio para comparar una decena de características (kilometraje, opciones, historial de mantenimiento): una llamada de red y un tiempo de renderizado nada desdeñables.

```python
def son_potencialmente_duplicados(anuncio_a, anuncio_b):
    # todo ya esta disponible en las tarjetas de la pagina de resultados
    return (
        anuncio_a.marca == anuncio_b.marca
        and anuncio_a.modelo == anuncio_b.modelo
        and abs(anuncio_a.precio - anuncio_b.precio) < 200
    )

def son_duplicados(anuncio_a, anuncio_b):
    if not son_potencialmente_duplicados(anuncio_a, anuncio_b):
        return False    # ya decidido: marca o modelo diferente, o precio demasiado distinto
    detalle_a = abrir_pagina_anuncio(anuncio_a)
    detalle_b = abrir_pagina_anuncio(anuncio_b)
    return comparar_especificaciones(detalle_a, detalle_b)
```

En cuanto la comparación "ligera" (los campos ya presentes en la tarjeta de resultados) establece que dos anuncios son diferentes, la pregunta ya está **resuelta**: abrir las dos páginas detalladas para confirmarlo solo recalcularía, a precio alto, un resultado que el dato barato ya produjo. La verificación costosa solo se ejecuta en el caso ambiguo, aquel donde el dato ligero no basta para decidir.

> No confundir con una optimización de la **latencia de red**. Aquí, lo que se evita es un trabajo redundante del lado CPU/lógica (recalcular una respuesta ya conocida), no un retraso de E/S. Las pausas voluntarias entre peticiones (límite de tasa, cortesía hacia un servidor remoto) o la espera de una animación de interfaz no forman parte de este principio: siguen siendo necesarias incluso cuando no hay ningún recálculo en juego, y eliminarlas expone a un bloqueo, no a una simple lentitud. Es exactamente la distinción planteada al final de [Esperar sin perder tiempo](/?c=performance&p=attentes-et-temps-morts): un retraso de protección no es un desperdicio a eliminar.

## Resumen comparativo

| Situación | Sin el principio | Con el principio |
|---|---|---|
| Función pura llamada varias veces con la misma entrada | Recalcula en cada llamada | Memoiza el resultado, invalida si la entrada cambia |
| Procesamiento periódico sobre datos en gran parte estables | Vuelve a procesar todo en cada pase | Solo procesa lo que cambió desde la marca de progreso |
| Renderizado de un frame de juego | Redibuja toda la pantalla en cada tick | Solo redibuja las zonas marcadas como modificadas |
| Comparación de dos registros | Abre sistemáticamente el detalle costoso | Se detiene en cuanto un dato ligero ya decidió |

En los cuatro casos, la ganancia no viene de un cálculo hecho más rápido, sino de un cálculo **que no tuvo lugar** porque nada podía cambiar su resultado.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Nunca recalcular un resultado que nada ha podido cambiar desde su último cálculo: memoización, reprocesamiento incremental o dirty rectangle aplican todos la misma idea a escalas diferentes. |
| **Herramientas utilizables** | Una caché en memoria por entrada (memoización), una marca de progreso para solo reprocesar lo nuevo, una comparación "ligera" antes de una verificación costosa. |
| **Trampas a evitar** | Memoizar sin identificar qué invalidaría el resultado: una caché nunca invalidada se convierte en una fuente de datos obsoletos. |
| **Buenas prácticas** | Siempre definir la condición de invalidación antes de memoizar; distinguir un recálculo evitable (este principio) de una pausa voluntaria de protección (a conservar). |
