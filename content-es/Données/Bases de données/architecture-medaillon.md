---
order: 2
---

# La arquitectura medallón

El capítulo [El modelo en estrella](/?c=bases-de-donnees&p=modeles-en-etoile) supone que los datos ya están limpios: cada fila de `hecho_ventas` tiene un `id_producto` que sí existe en `dim_producto`, ningún valor está duplicado, ningún campo está vacío por error. En la práctica, los datos brutos que llegan de un sitio web, un sensor o una exportación de otro software rara vez están en ese estado. La **arquitectura medallón** (*medallion architecture*) organiza el camino entre "dato bruto" y "dato listo para el análisis" en tres etapas nombradas según las medallas olímpicas: **bronce**, **plata** y **oro**.

## El problema: transformar sin volver a empezar todo cada vez

Sin etapas intermedias, un pipeline típico lee la fuente, limpia, agrega y escribe el resultado final de una sola vez. Si una regla de limpieza estaba equivocada, o si un nuevo análisis necesita los datos en una etapa menos transformada, hay que releerlo todo desde la fuente y rehacerlo todo. La arquitectura medallón conserva una copia en cada etapa, para volver a empezar solo el trabajo realmente afectado por una corrección.

```text
Fuente (sitio web, sensor, exportacion...)
        |
        v
   [ BRONCE ]  copia bruta, tal como se recibio
        |
        v
   [  PLATA ]  limpia, deduplicada, un esquema estable
        |
        v
   [   ORO  ]  agregada, organizada para un analisis preciso
        |
        v
Panel / informe
```

## Bronce: la copia bruta

La capa **bronce** es una copia fiel de lo que se recibió de la fuente, sin ninguna transformación: mismos nombres de columnas que la exportación original, mismos valores (incluidos los errores), y nunca se elimina ni corrige nada ahí. Sirve de red de seguridad: si una regla de limpieza aplicada más tarde resulta ser errónea, siempre se puede volver a partir del bronce en lugar de volver a pedir el dato a la fuente (que puede haber cambiado, o ya no estar disponible).

```text
Exportacion bruta recibida del sitio web (una fila por clic, tal como la produce el servidor):

id;producto;cant;fecha
1;Teclado;2;2025-03-01
2;;1;2025-03-01           -> producto vacio: error dejado tal cual
2;Raton;1;2025-03-01      -> id 2 duplicado: dejado tal cual
```

> **Trampa:** corregir o filtrar los datos desde su llegada al bronce. Una vez eliminado el error o el duplicado, se pierde la información "esto es exactamente lo que la fuente envió en ese instante", y un análisis que necesite saberlo (encontrar el origen de un bug de exportación, por ejemplo) ya no tiene nada que examinar.
>
> **Buena práctica:** escribir el bronce solo en modo añadir (*append-only*): cada nueva llegada se añade, nunca reemplaza ni modifica lo que ya existe.

## Plata: limpia y fiable

La capa **plata** aplica las reglas de limpieza: filas duplicadas eliminadas, campos vacíos descartados o completados según una regla explícita, tipos de columna corregidos (una fecha almacenada como texto se convierte en una fecha real), nombres de columna armonizados si varias fuentes diferentes alimentan la misma tabla. El resultado tiene un esquema estable sobre el que otros procesamientos pueden apoyarse sin sorpresas.

```sql
-- a partir del bronce de arriba
INSERT INTO plata_ventas (id_venta, producto, cantidad, fecha_venta)
SELECT id, producto, cant, CAST(fecha AS DATE)
FROM bronce_ventas
WHERE producto IS NOT NULL AND producto != ''   -- descarta las filas sin producto
QUALIFY ROW_NUMBER() OVER (
    PARTITION BY id ORDER BY fecha DESC
) = 1;                                          -- conserva solo una fila por id duplicado
```

> **Trampa:** adivinar una regla de limpieza en lugar de documentarla explícitamente. Si "fila sin producto descartada" no está escrito en ningún sitio, la próxima persona que retome el pipeline no sabe si la ausencia de esas filas en plata es deliberada o un bug.
>
> **Buena práctica:** hacer trazable cada regla de limpieza (comentario en el código de transformación, o tabla separada que registra las filas descartadas y por qué), para poder responder a "¿por qué desapareció esta fila?" meses después.

## Oro: lista para un análisis preciso

La capa **oro** agrega y modela los datos plata para un uso de negocio preciso: ventas totales por región, tasa de cancelación mensual, etc. Es típicamente aquí donde se encuentra el [modelo en estrella](/?c=bases-de-donnees&p=modeles-en-etoile): una tabla de hechos y sus dimensiones, listas para ser consultadas directamente por un panel, sin que necesite conocer las etapas de limpieza pasadas.

```sql
-- tabla "oro": ventas agregadas por producto y por mes, a partir de la plata
INSERT INTO oro_ventas_mensuales (producto, mes, total_cantidad, total_importe)
SELECT producto, DATE_TRUNC('month', fecha_venta), SUM(cantidad), SUM(cantidad * precio)
FROM plata_ventas
JOIN plata_productos USING (producto)
GROUP BY producto, DATE_TRUNC('month', fecha_venta);
```

> **Trampa:** crear una tabla oro por panel en lugar de por necesidad de negocio compartida, lo que multiplica las tablas casi idénticas (una para cada nuevo informe) y hace que cada pequeña corrección deba rehacerse en todas partes.
>
> **Buena práctica:** diseñar cada tabla oro para una necesidad de negocio reutilizable (ej. "ventas por mes", explotable por varios paneles), no para una sola pantalla precisa.

## Visión de conjunto

| | Bronce | Plata | Oro |
|---|---|---|---|
| Contenido | Copia bruta, tal como se recibió | Limpia, deduplicada, tipada | Agregada, orientada a necesidad de negocio |
| Esquema | El de la fuente (puede variar) | Estable y armonizado | Estable, pensado para el análisis |
| ¿Modificable? | Nunca (solo añadir) | Reescrita si cambia la regla de limpieza | Reescrita si cambia la necesidad de negocio |
| Quién la consulta | El propio pipeline | Otros pipelines, raramente un humano | Paneles, informes, analistas |

## Error frecuente: dejar que un panel lea el bronce o la plata

Nada impide técnicamente que una herramienta de reporting se conecte directamente al bronce o a la plata en lugar de al oro.

> **Trampa:** conectar un panel a la plata (o al bronce) porque "el dato que necesito ya está ahí". El panel acaba entonces rehaciendo él mismo la agregación de negocio, duplicada en cada herramienta que hace lo mismo, y una corrección de regla de negocio debe repercutirse en todas partes en lugar de en un solo sitio.
>
> **Buena práctica:** reservar el oro como único punto de entrada para todo lo que consume el dato fuera del propio pipeline; si falta una necesidad de negocio, crear o extender una tabla oro en lugar de bordear por la plata.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La arquitectura medallón divide un pipeline de datos en tres copias sucesivas: bronce (bruta, intacta), plata (limpia, esquema estable), oro (agregada para una necesidad de negocio precisa, a menudo modelada en [estrella](/?c=bases-de-donnees&p=modeles-en-etoile)). |
| **Herramientas utilizables** | Consultas [SQL](/?c=domain-specific-languages-dsl&p=sql) de transformación (`INSERT ... SELECT`, dedup por `ROW_NUMBER()`, agregación por `GROUP BY`) para hacer pasar una tabla de una capa a la siguiente. |
| **Trampas a evitar** | Corregir o filtrar desde el bronce; aplicar una regla de limpieza no documentada; crear una tabla oro por panel; conectar una herramienta de reporting directamente al bronce o a la plata. |
| **Buenas prácticas** | Bronce solo en modo añadir; reglas de limpieza trazables; tablas oro pensadas por necesidad de negocio reutilizable; el oro como único punto de entrada para los consumidores externos al pipeline. |
