---
order: 3
---

# Regulación europea de la IA: la AI Act

El **reglamento europeo sobre inteligencia artificial** (*AI Act*, reglamento (UE) 2024/1689) es el primer marco jurídico horizontal del mundo dedicado a la IA: en lugar de regular sector por sector, impone obligaciones según el **nivel de riesgo** de un sistema de IA, sea cual sea su ámbito de aplicación. Publicado en el Diario Oficial el 12 de julio de 2024, entró en vigor el 1 de agosto de 2024, pero su aplicación está **escalonada durante varios años**, no es inmediata.

## Una clasificación por nivel de riesgo

| Nivel de riesgo | Ejemplos | Obligación |
|---|---|---|
| **Inaceptable** | Puntuación social por un Estado, manipulación subliminal, reconocimiento facial masivo en tiempo real en el espacio público (con excepciones limitadas para las fuerzas del orden) | Prohibido pura y simplemente |
| **Alto** | Contratación, scoring de crédito, sistemas críticos (energía, transporte), dispositivos médicos, justicia | Evaluación de conformidad, documentación técnica, supervisión humana, gestión de riesgos, trazabilidad |
| **Limitado** | Chatbot, generador de deepfake | Obligación de transparencia (informar al usuario de que interactúa con una IA, señalar un contenido generado) |
| **Mínimo** | Filtro antispam, IA de un videojuego | Ninguna obligación específica |

Un chatbot (ver [Construir un chatbot](/?c=ia&s=applications-llm&p=chatbot)) cae típicamente en la categoría "riesgo limitado": su obligación principal es no dejar nunca que el usuario crea que habla con un humano sin precisarlo.

> **Trampa:** subestimar el nivel de riesgo del propio sistema por optimismo o por desconocimiento: un chatbot que parece inofensivo puede pasar a "riesgo alto" si interviene por ejemplo en una decisión de contratación o de scoring de crédito, dos casos explícitamente listados en ese nivel.
>
> **Buena práctica:** evaluar el nivel de riesgo a partir del uso real del sistema (el ámbito en el que interviene), no solo de su tecnología subyacente: dos chatbots técnicamente idénticos pueden corresponder a dos niveles de riesgo diferentes según su uso.

## El calendario de aplicación

A diferencia de un reglamento que se aplicaría de golpe, la AI Act entra en vigor **por etapas**, cada una añadiendo nuevas obligaciones:

| Fecha | Qué se vuelve aplicable |
|---|---|
| **1 de agosto de 2024** | Entrada en vigor del reglamento (el texto existe jurídicamente, pero la mayoría de las obligaciones aún no son exigibles) |
| **2 de febrero de 2025** | Prohibición de las prácticas de riesgo inaceptable; obligación de cultura de IA (formar al personal que diseña o usa sistemas de IA) |
| **2 de agosto de 2025** | Obligaciones para los modelos de IA de propósito general (GPAI, ver más abajo); implementación de las autoridades de control nacionales y de la Oficina Europea de IA; régimen de sanciones aplicable |
| **2 de agosto de 2026** | Aplicación de la mayor parte del reglamento: obligaciones para los sistemas de riesgo alto (anexo III), obligaciones de transparencia para el riesgo limitado (chatbots, deepfakes) |
| **2 de agosto de 2027** | Plazo adicional para los sistemas de riesgo alto que son componentes de seguridad de productos ya regulados (dispositivos médicos, maquinaria, juguetes...) |

> **Una tensión concreta, aún abierta a día de hoy:** las obligaciones para los sistemas de riesgo alto son legalmente exigibles desde agosto de 2026, pero las **normas técnicas armonizadas** que se supone precisan cómo cumplirlas concretamente (elaboradas por los organismos de normalización [CEN-CENELEC](https://www.cencenelec.eu), grupo JTC 21) todavía se están finalizando. Una empresa puede por tanto encontrarse teniendo que respetar una obligación legal antes de que exista plenamente el manual técnico oficial, una situación a vigilar más que un simple detalle administrativo.

> **Trampa:** suponer que ninguna obligación se aplica mientras no se alcance el plazo de 2026. Las prohibiciones de prácticas de riesgo inaceptable y las obligaciones para los modelos GPAI ya están, en cambio, en vigor desde 2025.
>
> **Buena práctica:** verificar la fecha de aplicación propia de **cada** categoría de obligación concernida (prohibiciones, GPAI, riesgo alto, riesgo limitado), en lugar de retener una sola fecha para el conjunto del reglamento.

## Los modelos de IA de propósito general (GPAI)

Un gran modelo de lenguaje (ver [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)) no está diseñado para un uso único: sirve de base para usos muy variados. La AI Act crea para esta categoría ("*General-Purpose AI*", GPAI) obligaciones específicas, aplicables desde el 2 de agosto de 2025:

- Documentación técnica sobre el entrenamiento y las capacidades del modelo, disponible para las autoridades.
- Respeto del derecho de autor sobre los datos de entrenamiento (debe existir una política de conformidad).
- Transparencia sobre el contenido usado para el entrenamiento (un resumen suficientemente detallado, sin exigir la divulgación completa de los datos).

Los modelos juzgados de **riesgo sistémico** (más allá de un umbral de potencia de cálculo de entrenamiento) llevan obligaciones reforzadas: evaluación contradictoria (*red teaming*), reporte de incidentes graves, ciberseguridad reforzada. Se publicó en 2025 un **Código de buenas prácticas** voluntario para los proveedores de GPAI, para ayudar a anticipar estas obligaciones antes de que la supervisión reglamentaria aumente en intensidad.

> **Trampa:** confundir las obligaciones del **proveedor** de un modelo GPAI (documentación técnica, conformidad con el derecho de autor...) con las de una empresa que solo **usa** ese modelo ya existente (vía una API, por ejemplo): las obligaciones GPAI recaen sobre quien construye y distribuye el modelo, no sobre quien lo usa para construir un producto encima.
>
> **Buena práctica:** identificar claramente el propio rol (proveedor de modelo, o simple usuario de un modelo de terceros) antes de determinar qué obligaciones de la AI Act se aplican realmente a tu caso.

## Supervisión humana: una obligación, no una opción

Para un sistema de riesgo alto, la AI Act impone una supervisión humana efectiva, uniéndose directamente a un principio ya visto para los [agentes](/?c=ia&s=nlp-llm&p=agents): un sistema autónomo nunca debe poder decidir solo una acción con consecuencia real sin que un humano pueda intervenir o detenerlo. Lo que el sentido común técnico ya recomendaba se convierte, para los casos de riesgo alto, en una obligación legal documentada.

## Qué cambia respecto al RGPD

La AI Act **no** reemplaza al [RGPD](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees): se añade a él. La [gobernanza de datos](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) (clasificación, trazabilidad, control de acceso) sigue siendo necesaria independientemente de la AI Act: el RGPD regula el dato personal en sí, la AI Act regula el **sistema de IA** que lo trata: sus dos conjuntos de obligaciones se acumulan en lugar de sustituirse uno al otro.

## Sanciones

Las multas están escalonadas según la gravedad de la infracción, hasta 35 millones de euros o el 7% de la facturación mundial anual para una práctica prohibida (el tope más alto de los dos), un nivel comparable, deliberadamente, al del RGPD.

## Resumen

| | |
|---|---|
| **Para recordar** | La AI Act clasifica los sistemas de IA por nivel de riesgo (inaceptable, alto, limitado, mínimo), con obligaciones crecientes, aplicadas por etapas entre 2024 y 2027. Se añade al RGPD en lugar de reemplazarlo, e impone una supervisión humana efectiva para todo sistema de riesgo alto. |
| **Herramientas utilizables** | El Código de buenas prácticas voluntario para los proveedores de GPAI, publicado en 2025, para anticipar las obligaciones antes del aumento de la supervisión reglamentaria. |
| **Trampas a evitar** | Subestimar el nivel de riesgo del propio sistema según su único uso real. Suponer que ninguna obligación se aplica antes de 2026 cuando algunas ya están en vigor. Confundir las obligaciones de un proveedor de modelo GPAI con las de un simple usuario. |
| **Buenas prácticas** | Evaluar el nivel de riesgo a partir del uso real del sistema, no solo de su tecnología. Verificar la fecha de aplicación propia de cada categoría de obligación. Identificar claramente tu rol (proveedor o usuario) antes de determinar las obligaciones aplicables. |
