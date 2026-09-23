---
order: 4
---

# La confianza calibrada: actuar, dudar o escalar

Las respuestas Choice y Score ([capítulo anterior](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul)) llevan un campo `confidence` distinto de la respuesta en sí. Este capítulo explica qué mide esta cifra, y cómo debe usarla el código para decidir entre actuar automáticamente o escalar a un humano.

## Lo que mide la confianza

La confianza se deduce de la **forma de la distribución de probabilidades** devuelta por una pregunta Choice o Score: una distribución concentrada en una sola respuesta señala una confianza alta, una distribución repartida entre varias respuestas señala una confianza baja.

```text
Distribucion concentrada (confianza alta)      Distribucion repartida (confianza baja)
devoluciones: 0.95  #################          devoluciones: 0.40  ########
envio:        0.03  #                           envio:        0.35  #######
facturacion:  0.02  #                           facturacion:  0.25  #####
```

Para una pregunta de tres opciones, la documentación del proveedor da una fórmula aproximada:

```python
# confianza aproximada para 3 opciones, a partir de la probabilidad mas alta
probabilidad_mas_alta = 0.95
confianza = (3 * probabilidad_mas_alta - 1) / 2
# -> (3*0.95 - 1) / 2 = 0.925
```

Una distribución perfectamente plana (cada opción en igualdad) da una confianza cercana a 0; una distribución que concentra todo su peso en una sola opción da una confianza cercana a 1.

Para una pregunta **Noul**, no existe un campo `confidence` separado: la probabilidad devuelta juega ambos papeles a la vez (la respuesta Y su grado de certeza), como se vio en el [capítulo sobre las primitivas](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul#noul-verificar-una-afirmacion-binaria).

## Tres umbrales, tres comportamientos

En la práctica, una confianza se traduce en código en tres zonas de decisión, cada una asociada a un comportamiento distinto:

| Zona | Comportamiento |
|---|---|
| Confianza alta | Actuar automáticamente, sin intervención humana |
| Confianza media | Proceder con prudencia (ej: pedir confirmación al usuario antes de actuar) |
| Confianza baja | Escalar a un humano en lugar de arriesgar una decisión automática |

Estos umbrales nunca son universales: dependen del **riesgo asociado a la acción**. Una operación destructiva o irreversible exige un umbral más alto que una simple lectura.

```python
def decidir(respuesta_choice, accion_de_bajo_riesgo: bool):
    if accion_de_bajo_riesgo:
        umbral_accion_directa = 0.60
    else:
        umbral_accion_directa = 0.85

    if respuesta_choice.confidence >= umbral_accion_directa:
        return "ejecutar"
    if respuesta_choice.confidence >= 0.40:
        return "pedir_confirmacion"
    return "escalar_a_humano"
```

## Ejemplo: una interfaz bancaria por voz

Una misma acción (una transferencia) puede tener umbrales distintos según su monto o su estado:

| Acción | Riesgo | Umbral de confianza requerido |
|---|---|---|
| Consultar un saldo | Bajo (solo lectura) | 0,60 basta para responder directamente |
| Transferencia ya aprobada, monto bajo | Moderado | 0,85 para ejecutar automáticamente |
| Transferencia, confianza moderada | Alto si hay error | Pedir confirmación antes de ejecutar |

> **Trampa:** fijar un umbral único para todas las acciones de un sistema, sin distinguir una simple consulta de una acción irreversible.
>
> **Buena práctica:** calibrar los umbrales por acción según su riesgo real, empezando con umbrales conservadores (más exigentes) y ajustándolos después a partir de los resultados observados en producción, en lugar de adivinar un valor definitivo desde el principio.

## Lo que hay que recordar

| | |
|---|---|
| **A recordar** | La confianza deriva de la forma de la distribución de probabilidades (concentrada = confiada, repartida = incierta) para Choice y Score; para Noul, la probabilidad sola hace ese papel. Tres zonas de decisión (actuar, confirmar, escalar) se aplican según umbrales que dependen del riesgo de la acción, no de un valor universal. |
| **Herramientas utilizables** | El campo `confidence` de las respuestas Choice/Score; umbrales programados en código, distintos por acción. |
| **Trampas a evitar** | Un umbral único aplicado a todas las acciones, sin tener en cuenta su riesgo respectivo. |
| **Buenas prácticas** | Umbrales más altos para las acciones irreversibles o de alto riesgo. Empezar con umbrales conservadores, y luego ajustarlos según los resultados observados en producción. |
