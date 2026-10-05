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
# en cada ejecución: se vuelve a procesar las 50 000 líneas del archivo
for linea in todo_el_archivo:
    resultados.append(procesar(linea))
```

```python
# solo se vuelve a procesar lo llegado desde el último pase
ultima_marca_temporal = leer_marca_de_progreso()
lineas_nuevas = [l for l in todo_el_archivo if l.marca_temporal > ultima_marca_temporal]

for linea in lineas_nuevas:
    resultados.append(procesar(linea))

escribir_marca_de_progreso(
    lineas_nuevas[-1].marca_temporal if lineas_nuevas else ultima_marca_temporal,
)
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
# solo se redibujan los rectangulos marcados como "sucios" (modificados desde el último tick)
def dibujar_frame(pantalla, escena, zonas_modificadas):
    for zona in zonas_modificadas:
        for x, y in zona.pixeles():
            pantalla.definir_pixel(x, y, escena.color_en(x, y))
```

Es la lógica del **dirty rectangle** (rectángulo sucio): la escena señala ella misma qué zonas han cambiado desde el último renderizado, y solo esas se redibujan. En un decorado 90 % estático, esto reduce el coste de cada frame a una fracción del de un renderizado completo, para un resultado visualmente idéntico.

## Reparar el resultado anterior en lugar de recalcularlo todo

Un solucionador repite la misma prueba cientos de miles de veces, sobre datos que apenas cambian de una prueba a la siguiente. Ejemplo: la restricción «todas distintas» se comprueba con un [emparejamiento bipartito](/?c=fondamentaux&s=algorithmes&p=couplage-biparti-et-theoreme-de-hall) tras cada retirada de un valor posible. Rehacer el emparejamiento desde cero reempieza todo el trabajo aunque haya desaparecido una sola arista.

La idea es **conservar el emparejamiento anterior** y reparar solo lo que el cambio ha roto:

| La arista retirada | Qué se hace |
|---|---|
| No estaba en el emparejamiento | Nada: el emparejamiento sigue siendo válido |
| Estaba en el emparejamiento | Una sola casilla pierde su valor: una sola búsqueda de camino para recolocarla |

```c
// Retira el valor v de la casilla c y luego repara el emparejamiento en lugar de rehacerlo
int tras_retirada(int c, int v)
{
    dom[c][v] = 0;
    if (dueno[v] == c) {         // la arista retirada servía al emparejamiento
        dueno[v] = -1;
        valor_de[c] = -1;
        memset(vista, 0, sizeof vista);
        buscar(c);               // una sola casilla que recolocar
    }
    for (int k = 0; k < N; k++)  // una casilla sin valor: ya no hay emparejamiento completo
        if (valor_de[k] < 0)
            return 0;
    return 1;
}
```

`valor_de[c]` memoriza el valor de cada casilla (el `buscar()` del capítulo sobre el emparejamiento lo actualiza a la vez que `dueno`). Cuando se vuelve a poner el valor retirado, las casillas que se quedaron sin valor lo intentan de nuevo: sin eso, el emparejamiento conservado se quedaría demasiado pequeño para siempre.

Medido con 200 000 retiradas sucesivas, 40 casillas, 40 valores, aceptando cada casilla el 12 % de los valores:

| | Recalcularlo todo | Reparar |
|---|---|---|
| Casillas examinadas por las búsquedas | 61 566 318 | 832 601 (74 veces menos) |
| Tiempo | alrededor de 1 s | unas decenas de ms |
| Respuestas «¿emparejamiento completo?» | 198 112 sí | 198 112 sí, **idénticas prueba a prueba** (0 diferencias) |

**Misma respuesta, no necesariamente el mismo emparejamiento.** Existen varios emparejamientos completos: el emparejamiento reparado difiere del que da un cálculo completo en 1 972 casos de 1 973 comparados. La respuesta sí/no es la misma; pero si el resto del programa depende del propio emparejamiento (una explicación, un orden, un resultado que debe reproducirse idéntico de una ejecución a otra), se **vuelve al cálculo completo** para producir ese resultado canónico, y se conserva la versión reparada para todas las pruebas que solo necesitan la respuesta. En el solucionador de la investigación rush01, esta combinación redujo el tiempo total un 6,2 %.

> **Trampa:** reparar un estado que ya no es válido. El invariante «el emparejamiento actual es válido para los datos actuales» debe restablecerse tras **cada** tipo de cambio (retirada, reposición, vuelta atrás de una búsqueda): un caso olvidado da una respuesta errónea, sin error.
>
> **Buena práctica:** conservar el cálculo completo como referencia en una prueba y comparar las respuestas prueba a prueba (aquí 0 diferencias sobre 200 000) antes de medir el tiempo.

## Recorrer solo los elementos marcados: el bitmap

Cuando solo ha cambiado una pequeña parte de los elementos y se han marcado (como los «rectángulos sucios» anteriores), recorrer un array de indicadores de un byte por elemento cuesta una lectura por elemento, marcado o no. Un **bitmap** guarda un indicador por bit: una palabra de 64 bits contiene 64 (ver [el filtro por bitmap](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd)), y `__builtin_ctzll` da directamente la posición del siguiente bit a 1 ([funciones integradas](/?c=langages&s=c&p=operateurs-binaires)). Las palabras vacías cuestan una sola lectura.

```c
for (uint32_t w = 0; w < N / 64; w++)
    for (uint64_t m = bitmap[w]; m; m &= m - 1)  // bits restantes de la palabra
        procesar(w * 64 + __builtin_ctzll(m));   // índice del bit a 1 más bajo
```

`m &= m - 1` borra el bit a 1 más bajo: el bucle se detiene cuando la palabra queda vacía, y `__builtin_ctzll` nunca se llama con 0 (su resultado sería indefinido).

Medido con 1 M de elementos, 200 recorridos, mediana de 7 rondas alternas, mismas sumas comprobadas (Intel Core Ultra 5 228V bajo WSL, gcc 13.3 en `-O2`):

| Proporción de elementos marcados | Array de bytes | Bitmap | Diferencia |
|---|---|---|---|
| 0,1 % | 84 ms | 2,9 ms | −97 % |
| 1 % | 63 ms | 16 ms | −74 % |
| 10 % | 67 ms | 44 ms | −35 % |
| 50 % | 68 ms | 130 ms | **+91 %** |

La ganancia depende de la **densidad** de las marcas: con la mitad marcada, el bitmap es casi el doble de lento, porque cada marca cuesta más que un byte leído en secuencia. En el solucionador de la investigación rush01, este recorrido solo ganó un 2 % del tiempo total: solo el programa real dice lo que vale la optimización (ver [Medir antes de optimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)).

> **Trampa:** adoptar el bitmap porque es más compacto o más rápido en el caso disperso, sin medir la densidad real de las marcas del programa.
>
> **Buena práctica:** medir la proporción de elementos marcados en el programa real antes de elegir; el bitmap vale para marcas escasas.

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

## Escritura atómica: nunca una lectura a medio escribir

Una caché memoizada en memoria (sección anterior) desaparece al detenerse el proceso; una **caché de archivo** sobrevive a un reinicio, pero introduce un riesgo nuevo: un lector concurrente puede abrir el archivo de caché **mientras se está escribiendo**.

```python
# Riesgo: un lector concurrente puede leer este archivo a medio escribir
with open("cache.json", "w") as f:
    json.dump(resultado, f)   # si el proceso se interrumpe aquí, el archivo queda corrupto
```

```python
# Escritura atomica: escribir en un archivo temporal, luego renombrarlo
import os

ruta_tmp = "cache.json.tmp"
with open(ruta_tmp, "w") as f:
    json.dump(resultado, f)
os.replace(ruta_tmp, "cache.json")   # rename(): atomico a nivel del sistema de archivos
```

`os.replace()` (como `rename()` en la mayoría de lenguajes) es **atómico** a nivel del sistema de archivos: en todo momento, `cache.json` apunta a la versión antigua completa o a la nueva versión completa, nunca a un estado intermedio. Ningún lector concurrente puede entonces ver jamás un archivo a medio escribir, a diferencia de una escritura directa interrumpida en el camino.

> **Trampa:** escribir directamente en el archivo de caché final, asumiendo que una interrupción (caída, corte) es lo bastante rara como para ignorarla. Un archivo de caché corrupto puede luego hacer fallar a todos los lectores siguientes, mucho después del incidente inicial.
>
> **Buena práctica:** escribir siempre en un archivo temporal y luego renombrarlo al nombre final, para cualquier archivo leído por otro proceso mientras pueda ser reescrito.

## Stale-while-revalidate: responder de inmediato, recalcular por detrás

La memoización vista arriba tiene un defecto a gran escala: si la caché está vacía u obsoleta, la solicitud que dispara el recálculo **espera** ese recálculo antes de responder. El patrón **stale-while-revalidate** (tomado del encabezado HTTP [`Cache-Control: stale-while-revalidate`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cache-Control#stale-while-revalidate)) cambia esta regla: responder **inmediatamente** con el valor en caché, aunque esté obsoleto, y solo recalcular en segundo plano.

```text
Cache clasica (bloqueante):         Stale-while-revalidate:

solicitud -> cache obsoleta?        solicitud -> cache obsoleta?
              |  si                                |  si
              v                                    v
        recalcula (espera)                  responde con el valor obsoleto
              |                              Y dispara un recalculo en segundo plano
              v                                    |
          responde                           (la proxima llamada recibe el
                                              valor fresco)
```

```python
bloqueo_recalculo = threading.Lock()

def valor_con_cache(clave):
    entrada = cache.get(clave)
    if entrada is None:
        # la primera llamada: no hay otra opción que esperar
        return recalcular_y_guardar(clave)

    if entrada.esta_obsoleta() and bloqueo_recalculo.acquire(blocking=False):
        threading.Thread(target=lambda: recalcular_y_guardar(clave, bloqueo_recalculo)).start()

    return entrada.valor   # responde inmediatamente, obsoleto o no
```

El bloqueo anti-concurrencia (`bloqueo_recalculo`) evita que un recálculo costoso se relance N veces en paralelo mientras ya está en curso para la misma clave: solo el primer hilo en adquirirlo dispara realmente el recálculo, los demás siguen sirviendo el valor obsoleto mientras tanto.

> **Trampa:** aplicar stale-while-revalidate sin bloqueo anti-concurrencia, en una clave sometida a muchas solicitudes simultáneas: cada solicitud que detecta la caché obsoleta relanza su propio recálculo costoso, lo que puede anular todo el beneficio (o incluso agravar la carga frente a una caché bloqueante clásica).
>
> **Buena práctica:** nunca dejar que una caché obsoleta haga esperar al usuario para un simple refresco; reservar la espera solo para la primera llamada, sin ningún valor en caché.

## Streaming HTTP progresivo: cuando el cálculo es inevitable

Todas las técnicas anteriores evitan un recálculo evitable. Esta se aplica al caso contrario: un cálculo realmente **inevitable** (importar un archivo grande, llamar a un servicio externo lento) que ninguna caché puede acortar. La única palanca que queda es cómo percibe el usuario la espera.

Por defecto, un servidor PHP mantiene en memoria todo lo que un script produce con `echo`, y solo lo envía al navegador una vez que el script termina (o su búfer se llena): el usuario ve una página en blanco hasta el final, aunque el script ya haya producido un resultado útil desde hace tiempo.

```php
<?php
ini_set('output_buffering', 'off');   // desactiva el almacenamiento en búfer de la salida
ini_set('implicit_flush', true);      // fuerza el envio inmediato tras cada echo
while (ob_get_level() > 0) {
    ob_end_flush();                   // vacía también cualquier búfer ya abierto por PHP mismo
}

foreach ($filasAImportar as $fila) {
    importarFila($fila);
    echo "Fila importada: {$fila->id}<br>\n";
    flush();                          // envía este echo al navegador de inmediato
}
```

Cada `echo` seguido de `flush()` se envía al navegador de inmediato, sin esperar a que termine el script: el usuario ve una consola que se llena en tiempo real, como los logs de una terminal, en lugar de una página en blanco seguida de un resultado final de una vez.

> **Nota:** este mecanismo es el inverso de [`fastcgi_finish_request()`](/?c=langages&s=php&p=php-fpm): ahí, la conexión se cierra de inmediato y el trabajo sigue oculto por detrás; aquí, la conexión permanece abierta durante todo el cálculo, que es justo lo que permite enviar cada fragmento del resultado a medida que está disponible.

> **Trampa:** este streaming se rompe en cuanto un servidor intermedio (proxy, balanceador de carga, Nginx en modo `fastcgi_buffering`) vuelve a poner su propio búfer: revisar la configuración de toda la cadena de red, no solo la de PHP.

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
| **Para recordar** | Nunca recalcular un resultado que nada ha podido cambiar desde su último cálculo: memoización, reprocesamiento incremental o dirty rectangle aplican todos la misma idea a escalas diferentes. Una caché de archivo añade dos técnicas: la escritura atómica (nunca una lectura a medio escribir) y el stale-while-revalidate (responder rápido, recalcular por detrás). Cuando el cálculo es inevitable (nada que meter en caché), el streaming HTTP progresivo es la única palanca que queda para mejorar la espera percibida. Reparar el resultado anterior (un emparejamiento conservado, una sola casilla que recolocar) da la misma respuesta que el cálculo completo con una fracción del trabajo; un bitmap solo recorre los elementos marcados, pero únicamente si las marcas son escasas. |
| **Herramientas utilizables** | Una caché en memoria por entrada (memoización), una marca de progreso para solo reprocesar lo nuevo, una comparación "ligera" antes de una verificación costosa, `rename()`/`os.replace()` para una escritura atómica, un bloqueo anti-concurrencia para un recálculo en segundo plano, `flush()`/`ob_end_flush()` para un streaming HTTP progresivo. |
| **Trampas a evitar** | Memoizar sin identificar qué invalidaría el resultado: una caché nunca invalidada se convierte en una fuente de datos obsoletos. Escribir directamente en un archivo de caché leído por otros procesos. Aplicar stale-while-revalidate sin bloqueo anti-concurrencia. Hacer streaming de una respuesta HTTP sin comprobar que ningún proxy intermedio vuelve a poner su propio búfer. Reparar un estado cuyo invariante no se restablece tras cada tipo de cambio. Creer que el resultado reparado es idéntico al resultado canónico del cálculo completo. Adoptar un bitmap sin medir la densidad de las marcas (con la mitad marcada: +91 %). |
| **Buenas prácticas** | Siempre definir la condición de invalidación antes de memoizar; distinguir un recálculo evitable (este principio) de una pausa voluntaria de protección (a conservar); escribir un archivo de caché mediante un archivo temporal renombrado; solo hacer esperar al usuario en la primera llamada sin caché; hacer streaming de la respuesta HTTP en cuanto un cálculo largo e inevitable produce resultados progresivamente. Comparar el resultado reparado con el cálculo completo prueba a prueba y volver al cálculo completo cuando importa el resultado exacto; medir la densidad real de las marcas antes de elegir un bitmap. |
