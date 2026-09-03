---
order: 10
---

# OpenAPI: describir un contrato de API, para humanos y para máquinas

El capítulo sobre [las API y HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) presenta una API como un servidor que responde a solicitudes estructuradas. Pero nada, en una API en sí, dice de antemano qué rutas existen, qué parámetros esperan, ni qué formato de respuesta esperar: esa información debe describirse en algún lugar. **OpenAPI** es el formato estándar (YAML o JSON) más usado para esa descripción: un único archivo que documenta cada endpoint de una API REST, legible tanto por un humano como por herramientas.

## Un contrato, dos usos

```yaml
# openapi.yaml (extracto)
paths:
  /clima:
    get:
      summary: Recupera el clima de una ciudad
      parameters:
        - name: ciudad
          in: query
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Clima encontrado
          content:
            application/json:
              schema:
                type: object
                properties:
                  temperatura: { type: number }
                  condiciones: { type: string }
```

| Uso | Lo que aporta |
|---|---|
| Documentación legible | Una interfaz generada automáticamente (estilo Swagger UI) donde un desarrollador explora las rutas disponibles sin leer el código |
| Generación de herramientas | Un cliente HTTP generado automáticamente en el lenguaje elegido, a partir únicamente de la spec |
| Verificación | La spec puede probarse contra la implementación real, para detectar una diferencia entre lo documentado y lo realmente servido |

El mismo archivo sirve entonces tanto de documentación como de **fuente de verdad verificable**: a diferencia de un comentario de código o una página de wiki, una diferencia entre la spec y el comportamiento real de la API puede detectarse automáticamente.

## El vínculo con los agentes LLM: describir acciones, no solo rutas

El [function calling](/?c=ia&s=nlp-llm&p=agents) permite a un modelo decidir llamar a una herramienta, descrita por un nombre, parámetros y su tipo. Un archivo OpenAPI ya existente proporciona **exactamente** esa descripción para una API REST: en lugar de reescribir a mano cada ruta en el formato que espera el function calling, un agente puede leer directamente el archivo OpenAPI de una API y deducir qué acciones puede llamar.

| | OpenAPI | [MCP](/?c=ia&s=nlp-llm&p=mcp) |
|---|---|---|
| Naturaleza | Un contrato **estático**: un archivo que describe una API REST ya existente | Un **protocolo de ejecución**: un cliente y un servidor que se comunican en vivo |
| Lo que describe | Rutas HTTP clásicas, pensadas originalmente para cualquier cliente (no solo un LLM) | Herramientas, datos y prompts pensados desde el inicio para un cliente que hace funcionar un LLM |
| Origen | Anterior a los LLM, reutilizado para ellos (GPT Actions, function calling) | Diseñado específicamente para estandarizar la integración de un LLM con herramientas externas |

Ambos no se oponen: una integración puede exponer una API REST clásica documentada en OpenAPI, y luego un servidor MCP viene a envolverla para hacerla directamente utilizable por un cliente compatible con MCP, sin reescribir la integración.

> **Trampa:** dejar que un archivo OpenAPI diverja de la implementación real con el tiempo (una ruta agregada sin actualizar la spec, un parámetro renombrado). Un agente que se apoya en esa spec para saber qué llamadas son posibles puede entonces intentar una llamada inválida, o ignorar una acción realmente disponible.
>
> **Buena práctica:** generar la spec OpenAPI directamente desde el código (anotaciones, decoradores según el framework) en lugar de mantenerla a mano en paralelo, o probarla automáticamente contra la implementación real (test de contrato) para detectar cualquier desviación en cuanto aparezca.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | OpenAPI describe, en un único archivo (YAML/JSON), las rutas de una API REST: parámetros, formatos de respuesta. Sirve tanto de documentación legible como de contrato verificable. Cada vez más reutilizado para describir a un agente LLM qué acciones puede llamar. |
| **Herramientas utilizables** | Una interfaz de documentación generada (estilo Swagger UI), un cliente HTTP generado desde la spec, un test de contrato que compara la spec con la implementación real. |
| **Trampas a evitar** | Dejar que la spec diverja de la implementación real sin detectarlo. |
| **Buenas prácticas** | Generar la spec desde el código en lugar de mantenerla manualmente en paralelo; probarla automáticamente contra la API real. |
