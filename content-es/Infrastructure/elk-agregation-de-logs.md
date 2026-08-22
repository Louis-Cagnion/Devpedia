---
order: 7
---

# ELK: centralizar y consultar los logs de una infraestructura

Un **log** es un evento fechado (una petición recibida, un error ocurrido, una conexión establecida), distinto de una **métrica**, que mide una cantidad en el tiempo (tasa de uso de la CPU, número de peticiones por segundo). En una sola máquina, un `grep` en un archivo de log basta; en cuanto varios servidores o contenedores generan cada uno sus propios logs, hace falta una forma de reunirlos y consultarlos todos juntos.

## El problema: logs dispersos en cada máquina

```text
Sin centralizacion:                  Con centralizacion:

Servidor A: logs locales             Servidor A -\
Servidor B: logs locales                         Elasticsearch (busqueda indexada)
Servidor C: logs locales             Servidor B -/       |
                                      Servidor C -/     Kibana (interfaz de busqueda)

-> conectarse a cada maquina         -> una sola busqueda, en todos los logs a la vez
   para buscar un error
```

Encontrar un error preciso implica, sin centralización, conectarse a cada máquina una por una y buscar en cada archivo por separado: una operación que no escala más allá de unos pocos servidores.

## ELK: tres herramientas, una cadena

**ELK** (Elasticsearch, Logstash, Kibana) designa la pila más extendida para esta necesidad, donde cada letra cubre una etapa distinta:

| Herramienta | Papel |
|---|---|
| **Elasticsearch** | Motor de búsqueda y almacenamiento: indexa cada log recibido para hacerlo inmediatamente buscable, incluso entre millones de entradas |
| **Logstash** (o un agente más ligero, tipo Filebeat) | Recolecta los logs en la fuente (archivo, flujo de red), les da formato, y los transmite a Elasticsearch |
| **Kibana** | Interfaz web para buscar, filtrar y visualizar los logs indexados (tableros de control, gráficos de frecuencia de un tipo de evento) |

```text
Servidor/contenedor -> agente de recoleccion (Logstash/Filebeat) -> Elasticsearch -> Kibana
      (genera el log)      (recolecta, da formato)                  (indexa)      (busca, visualiza)
```

## Logs y métricas: dos naturalezas de datos, dos herramientas

| | Métrica | Log |
|---|---|---|
| Naturaleza | Un número, muestreado a intervalos regulares | Un evento fechado, con su contexto completo |
| Ejemplo | 72 % de uso de CPU a las 14:03 | "Error 500 en `/pedido/1234` a las 14:03:27, usuario 42" |
| Pregunta típica | "¿Cómo evoluciona este valor en el tiempo?" | "¿Qué pasó exactamente en ese momento?" |
| Herramienta típica | Prometheus/Grafana y equivalentes | ELK y equivalentes |

Ambas siguen siendo complementarias más que competidoras: una métrica alerta de que existe un problema (una tasa de error que sube), un log detalla lo que realmente ocurrió para diagnosticarlo.

## Estructurar los logs para que sean realmente utilizables

Un log escrito como una simple frase libre (`"Error al procesar el pedido 1234"`) sigue siendo difícil de filtrar con precisión una vez acumulados millones de líneas. Un log **estructurado**, casi siempre en JSON, separa cada información en su propio campo:

```json
{"timestamp": "2026-08-20T14:03:27Z", "nivel": "error", "service": "commandes", "id_commande": 1234, "mensaje": "Echec du paiement"}
```

> **Trampa:** registrar en texto libre sin estructurar, y descubrir en producción que es imposible filtrar con precisión por servicio, nivel de gravedad o identificador sin recurrir a expresiones regulares frágiles sobre el texto del mensaje.
>
> **Buena práctica:** estructurar cada log desde su emisión (un campo por información: marca de tiempo, nivel, servicio, identificadores relevantes), para que la búsqueda en Kibana filtre sobre campos exactos en lugar de texto libre.

## Resumen

| | |
|---|---|
| **Para recordar** | ELK (Elasticsearch, Logstash, Kibana) centraliza los logs de varias máquinas para hacerlos buscables en un solo lugar: Logstash recolecta y da formato, Elasticsearch indexa, Kibana permite buscar y visualizar. Los logs (eventos fechados) y las métricas (números en el tiempo) responden a preguntas diferentes y suelen usar herramientas diferentes. |
| **Herramientas utilizables** | Logstash o Filebeat para la recolección, Elasticsearch para la indexación y la búsqueda, Kibana para la interfaz de búsqueda y los tableros de control. |
| **Trampas a evitar** | Registrar en texto libre sin estructurar, lo que hace imposible el filtrado preciso a gran escala. |
| **Buenas prácticas** | Estructurar cada log en campos distintos (marca de tiempo, nivel, servicio, identificadores) desde su emisión, para una búsqueda precisa en la herramienta de centralización. |
