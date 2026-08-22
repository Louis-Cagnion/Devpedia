---
order: 4
---

# Paralelismo: encontrar la restricción real

El paralelismo es la optimización peor utilizada, porque siempre parece aplicable: "tengo 8 núcleos, lancemos 8 workers". En la práctica, un programa nunca va más rápido que su **recurso más restringido**, y añadir workers más allá de ese límite degrada el rendimiento en lugar de mejorarlo.

## Identificar qué limita

Antes de paralelizar, hay que saber qué se está esperando:

| El programa espera… | ¿Paralelismo útil? |
|---|---|
| El procesador (cálculo, compresión, renderizado) | Hasta el número de núcleos, no más allá |
| Un disco | Poco: la cabeza de lectura o la cola de espera satura rápido |
| La red / un servicio remoto | Sí, **si** los destinos son independientes |
| Un lock, una base de datos única | No: el cuello de botella es compartido, solo se lo congestiona |

El caso "red" es el más favorable, porque el programa pasa su tiempo sin hacer nada mientras espera respuestas. Pero lleva una condición decisiva: **la independencia de los destinos**.

## Dos destinos independientes: el paralelismo es gratis

En un programa que consultaba dos servicios distintos uno tras otro, cada uno con su propio límite de tasa, procesarlo en dos procesos (uno por servicio) divide el tiempo total por dos **sin aumentar en ni una sola llamada** la carga vista por cada uno. Es una ganancia sin contrapartida: simplemente se deja de estar inactivo frente al servicio A mientras no se hace nada con el servicio B.

## Varios workers sobre un mismo destino: la ganancia es una transferencia

En cambio, lanzar dos workers sobre el **mismo** servicio duplica el ritmo de peticiones que recibe. El paralelismo no evita un límite de tasa: lo **concentra**. Y si ese límite existe (cuota, protección antiabuso), no se gana tiempo, se compra un riesgo de bloqueo.

Este punto es contraintuitivo: los workers parten del mismo lugar: misma máquina, a menudo misma IP pública. Desde el punto de vista del servicio remoto, no es "varios clientes", es **un cliente el doble de insistente**.

## Por qué se vuelve contraproducente

Más allá de la restricción, cada worker adicional degrada a los demás:

- **Memoria y procesador**: varios navegadores o intérpretes se disputan la máquina. Las páginas se renderizan más lento, así que cada worker se vuelve individualmente más lento.
- **Efecto perverso con las esperas adaptativas**: si las esperas están calibradas sobre el tiempo de respuesta real (ver [Esperar sin perder tiempo](/?c=performance&p=attentes-et-temps-morts)), ralentizar el renderizado **alarga mecánicamente** cada espera. La ganancia por worker se desploma mientras la carga sigue aumentando.
- **Coste fijo de arranque**: lanzar un proceso, un intérprete, un navegador cuesta unos segundos. Sobre un volumen de trabajo pequeño, ese coste anula el beneficio: es exactamente lo que observé: sobre 4 unidades de trabajo, la versión paralela era *más lenta* que la secuencial; la ganancia solo aparecía a partir de varias decenas.

De ahí una progresión típica:

| Workers | Tiempo | Carga por destino | Veredicto |
|---|---|---|---|
| 1 | 33 min | 1× | referencia |
| 2 (1 por destino) | 17 min | 1× | ganancia gratuita |
| 4 (2 por destino) | 8 min | **2×** | riesgo comprado |
| 6 (3 por destino) | ~7 min | **3×** | contraproducente |

El paso de 4 a 6 ilustra el punto: el tiempo casi no baja más pero la carga sigue creciendo linealmente: síntoma de **contención** (varios workers que se disputan un mismo recurso limitado, aquí la máquina misma: procesador, memoria), que anula el beneficio esperado del paralelismo.

## Restricciones prácticas a anticipar

El paralelismo hace aparecer problemas que no existían en secuencial:

- **Recursos exclusivos**: algunas herramientas bloquean sus archivos de trabajo (un perfil de navegador, por ejemplo). Cada worker necesita el suyo propio.
- **Escritura concurrente**: dos procesos que escriben en el mismo archivo de salida lo entrelazan y lo corrompen. Hacer que cada worker escriba en su propio archivo, y luego fusionar, es más simple y más robusto que un lock compartido.
- **Errores silenciosos**: un worker que falla no hace fallar al programa principal. Hay que verificar explícitamente los códigos de retorno **y** que el resultado fusionado esté completo. Sin esa verificación, un informe vacío parece un éxito.

```python
fallos = [nombre for nombre, proc in workers if proc.wait() != 0]
resultados = fusionar(workers)

if not resultados:
    raise SystemExit("Ningun resultado recuperado: no se produjo nada.")
if len(resultados) < esperado:
    advertir(f"{len(resultados)} resultados de {esperado} esperados")
```

## `spawn` vs `fork`: dos formas de iniciar un worker Python

En Python, `multiprocessing.Pool` puede iniciar cada worker de dos formas diferentes, con consecuencias prácticas reales:

| | `fork` | `spawn` |
|---|---|---|
| Principio | El worker copia la memoria del padre tal como está ya (*copy-on-write*) | El worker reinicia un intérprete nuevo, que reimporta el código y hereda el entorno del padre **en el momento de la creación del pool** |
| Plataformas | Linux (comportamiento histórico por defecto) | Windows, macOS (desde Python 3.8), y cada vez más el valor por defecto también en Linux |
| Un objeto ya cargado en el padre (un modelo, por ejemplo) | Inmediatamente disponible en el hijo, sin recarga | Debe recargarse en cada worker, un coste de arranque real |

> **Trampa:** bajo `fork`, un estado del padre incoherente (un lock retenido, un buffer a medio escribir en el momento del fork) se queda congelado tal cual en el hijo, una fuente de bloqueos difíciles de diagnosticar puesto que nada señala la incoherencia en el momento del propio fork. Esta es la razón por la que Python se pasa progresivamente a `spawn` por defecto, incluso en Linux, en ciertos contextos.
>
> **Buena práctica:** bajo `spawn`, una variable de entorno establecida justo antes de la creación del pool sí es heredada por cada worker (el entorno del padre se captura en ese instante preciso); bajo `fork`, aprovechar que un objeto ya cargado en el padre (un modelo de IA, por ejemplo) está inmediatamente disponible en el hijo en lugar de recargarlo innecesariamente en cada worker.

## Una alternativa a menudo mejor: distribuir en el tiempo

Cuando la restricción es una cuota, la solución no siempre es ir más rápido. Dividir el trabajo en lotes repartidos a lo largo del día expone mucho menos que un gran procesamiento de una sola vez, para un resultado idéntico, y no requiere ninguna paralelización. Si la latencia no importa (un procesamiento nocturno, un informe periódico), es la opción más segura.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un programa nunca va más rápido que su recurso más restringido. Paralelizar sobre destinos independientes es una ganancia gratuita; paralelizar sobre un mismo destino concentra la carga en lugar de repartirla. En Python, `fork` copia la memoria del padre tal cual, `spawn` reinicia un intérprete nuevo. |
| **Herramientas utilizables** | Un worker por destino independiente, verificación explícita de los códigos de retorno y del volumen de resultados obtenido. La elección `fork`/`spawn` de `multiprocessing.Pool` según la necesidad de compartir un estado ya cargado. |
| **Trampas a evitar** | Añadir workers más allá de la restricción real (degrada el rendimiento); suponer que un worker que falla silenciosamente hará fallar al programa principal; bajo `fork`, un estado del padre incoherente en el momento del fork se congela tal cual en el hijo. |
| **Buenas prácticas** | Identificar el recurso limitante antes de paralelizar; distribuir el trabajo en el tiempo en lugar de paralelizar cuando la restricción es una cuota y la latencia importa poco; bajo `fork`, aprovechar un objeto ya cargado en el padre en lugar de recargarlo en cada worker. |
