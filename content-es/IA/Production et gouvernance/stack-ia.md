---
order: 16
---

# El stack de IA: las capas de una aplicación en producción

Los capítulos anteriores cubren cada uno un mecanismo: [entrenar una red neuronal](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient), [dar herramientas a un modelo](/?c=ia&s=nlp-llm&p=agents), [aumentarlo con datos externos](/?c=ia&s=nlp-llm&p=rag), [supervisarlo en producción](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)... Este capítulo no añade ninguno: muestra cómo estas piezas se apilan realmente en una aplicación, y nombra las categorías de herramientas concretas que existen en cada nivel, un vocabulario que ningún otro capítulo cubre, porque no concierne al funcionamiento de un mecanismo sino al panorama de las herramientas que lo implementan.

**Stack de IA**: el conjunto de capas, cada una con un papel distinto, que deben ensamblarse para transformar un modelo de lenguaje en una aplicación utilizable, desde el cálculo bruto hasta lo que ve el usuario final.

## Las capas, de abajo a arriba

```text
Aplicacion         -> chatbot, asistente en linea de comandos...
      |                (ver Construir un chatbot, El asistente de
      |                 IA agentico en terminal)
Orquestacion       -> encadenamiento de prompts, bucle de agente
      |                (ver Agentes)
Observabilidad     -> logs, costes, evaluacion de las respuestas
      |                (ver Monitorizacion y gestion operativa)
Datos              -> base vectorial, documentos fuente (RAG)
      |                (ver RAG)
Modelo             -> API alojada O modelo autoalojado
      |
Calculo / cloud    -> GPU, alquiler bajo demanda
                       (ver CPU vs GPU, Que es el cloud)
```

Cada capa se apoya en la de abajo, y un problema en una capa baja (una GPU insuficiente, una API de modelo caída) repercute en todas las capas de arriba, incluso si su propio código no tiene ningún defecto.

| Capa | Papel | Ya cubierto en otro sitio |
|---|---|---|
| Cálculo / cloud | Proporcionar la potencia de cálculo bruta | [CPU vs GPU](/?c=infrastructure&p=cpu-vs-gpu), [El cloud](/?c=infrastructure&p=le-cloud) |
| Modelo | Producir una respuesta a partir de un prompt | [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm), [LLM en producción](/?c=ia&s=nlp-llm&p=llm-en-production) |
| Datos | Proporcionar al modelo una información que no tiene en memoria | [RAG](/?c=ia&s=nlp-llm&p=rag) |
| Orquestación | Decidir qué llamar, en qué orden | [Agentes](/?c=ia&s=nlp-llm&p=agents) |
| Observabilidad | Saber qué pasó, cuánto costó | [Monitorización y gestión operativa](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm) |
| Aplicación | Exponer todo esto a un usuario final | [Construir un chatbot](/?c=ia&s=applications-llm&p=chatbot), [El asistente de IA agéntico en terminal](/?c=ia&s=applications-llm&p=assistant-agentique-terminal) |

Las secciones siguientes detallan las tres capas cuyo solo *mecanismo* (no el *panorama de herramientas*) se ha visto en otro sitio.

## La capa modelo: API alojada o modelo autoalojado

Usar un LLM supone elegir entre dos formas radicalmente diferentes de acceder a él:

| | API alojada | Modelo autoalojado |
|---|---|---|
| Principio | Un proveedor aloja el modelo, se le llama por [API](/?c=infrastructure&p=api-et-http) | Se ejecuta uno mismo un modelo de pesos abiertos en su propio hardware (o [cloud](/?c=infrastructure&p=le-cloud) alquilado) |
| Coste | Pagado por uso (por token), ninguna inversión en hardware | Coste fijo (GPU poseídas o alquiladas continuamente), rentable solo a alto volumen |
| Control de los datos | El dato transita por un tercero (ver la [gobernanza de datos](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) | El dato nunca sale de la infraestructura de la empresa |
| Mantenimiento | A cargo del proveedor | A cargo de la empresa (actualizaciones, escalado, disponibilidad) |
| Calidad disponible | Acceso a los modelos más potentes del mercado | Limitada a lo que el hardware disponible puede ejecutar |

> **Trampa:** elegir el autoalojamiento únicamente para ahorrar en el coste por token, sin contar el coste fijo del hardware ni el tiempo de ingeniería necesario para igualar la fiabilidad de un servicio gestionado: la ecuación solo se vuelve favorable a un volumen de uso suficiente.
>
> **Buena práctica:** calcular ambas opciones sobre el volumen de uso real previsto (no un uso hipotético), y reevaluar esta elección si ese volumen cambia significativamente: el cambio nunca es definitivo.

## La capa datos: la base vectorial

El capítulo [RAG](/?c=ia&s=nlp-llm&p=rag) explica el mecanismo (división, indexación, búsqueda por similitud) sin nombrar una herramienta precisa. En la práctica, la etapa de indexación se apoya en una de estas dos familias:

| | Base vectorial dedicada | Extensión de una base existente |
|---|---|---|
| Principio | Un sistema diseñado únicamente para almacenar y buscar embeddings ([Pinecone](https://www.pinecone.io), [Weaviate](https://weaviate.io), [Milvus](https://milvus.io)...) | Una extensión añadida a una base ya existente (ej. [`pgvector`](https://github.com/pgvector/pgvector) para PostgreSQL) |
| Ventaja | Optimizada para la búsqueda por similitud a gran escala | Ninguna infraestructura nueva que operar si la base existente basta en volumen |
| Inconveniente | Un sistema adicional que operar y proteger | Menos rendimiento que una base dedicada más allá de cierto volumen |

La elección sigue la misma lógica que en cualquier otro sitio en arquitectura: una extensión basta mientras el volumen de documentos siga siendo modesto; una base dedicada se justifica cuando la búsqueda por similitud se convierte ella misma en un cuello de botella.

## La capa orquestación: escribir el bucle uno mismo, o apoyarse en un framework

El capítulo [Agentes](/?c=ia&s=nlp-llm&p=agents) describe el bucle reflexión/acción y los patrones de coordinación multi-agente en general, sin decir cómo se implementan concretamente. Dos enfoques:

| | Escribir el bucle uno mismo | Framework de orquestación |
|---|---|---|
| Principio | Codificar directamente las llamadas al modelo, a las herramientas, y el bucle que las encadena | Apoyarse en una biblioteca ([LangChain](https://www.langchain.com), [LlamaIndex](https://www.llamaindex.ai)...) que ya proporciona estos bloques |
| Ventaja | Control total, ninguna dependencia externa, más simple de depurar línea por línea | Interfaz común hacia varios proveedores de modelos, gestión de la memoria de conversación y del encadenamiento ya resueltas |
| Inconveniente | Cada bloque (reintentos, gestión de la memoria, formato de las herramientas) hay que reescribirlo | Una capa de abstracción adicional que entender, a veces más pesada que la necesidad real |

> **Trampa:** adoptar un framework de orquestación completo para una necesidad que se resume en una sola llamada a herramienta, el mismo error que sobreingenierizar cualquier otro sistema antes de necesitarlo.
>
> **Buena práctica:** empezar por el bucle más simple que responda a la necesidad real, e introducir un framework solo cuando la coordinación (varias herramientas, varios agentes, gestión fina de la memoria) supere lo que un código escrito a mano puede mantener razonablemente.

## La trampa transversal: un acoplamiento oculto entre capas

Cada capa parece independiente: hasta que un cambio en una rompe el funcionamiento de otra sin error visible. El ejemplo ya visto en [RAG](/?c=ia&s=nlp-llm&p=rag): cambiar de modelo de embedding (capa modelo) invalida silenciosamente una base vectorial existente (capa datos), ya que los dos modelos no comparten el mismo espacio vectorial.

> **Trampa:** modificar una capa de forma aislada y probar solo esa capa, suponiendo que las demás no tienen ninguna razón para verse afectadas.
>
> **Buena práctica:** tras todo cambio de componente en una capa (modelo, base vectorial, framework de orquestación), volver a ejecutar un test de integración de extremo a extremo, no solo un test aislado de la capa modificada.

## Resumen

| | |
|---|---|
| **Para recordar** | Una aplicación de IA se ensambla en capas distintas (cálculo, modelo, datos, orquestación, observabilidad, aplicación), cada una cubierta mecánicamente en otro sitio del sitio. La elección API alojada vs autoalojado, base vectorial dedicada vs extensión, y bucle codificado a mano vs framework de orquestación son decisiones de arquitectura propias de cada capa. |
| **Herramientas utilizables** | Una API de modelo alojada para empezar sin infraestructura. Una extensión como `pgvector` para un volumen de documentos modesto, una base vectorial dedicada más allá. Un framework de orquestación una vez que la coordinación sea demasiado compleja para código escrito a mano. |
| **Trampas a evitar** | Elegir el autoalojamiento solo por el coste por token sin contar el coste fijo. Adoptar un framework completo para una necesidad trivial. Modificar una capa sin volver a probar la integración de extremo a extremo. |
| **Buenas prácticas** | Calcular ambas opciones de alojamiento sobre el volumen real previsto. Empezar por el bucle más simple antes de introducir un framework. Volver a ejecutar un test de integración de extremo a extremo tras todo cambio de componente. |
