---
order: 8
---

# MCP (Model Context Protocol): estandarizar las herramientas de un agente

El [function calling](/?c=ia&s=nlp-llm&p=agents) describe *cómo* un modelo llama a una herramienta (una descripción JSON, una decisión del modelo, una ejecución del lado del código), pero no *cómo* esa herramienta llega hasta la aplicación que hace funcionar el modelo. Sin una convención común, cada aplicación que quiere dar acceso a un mismo servicio (por ejemplo GitHub) tiene que reescribir su propia integración: su propio código para listar los repositorios, crear una issue, etc. **MCP** (*Model Context Protocol*) es un protocolo estandarizado que resuelve este segundo problema: exponer herramientas una sola vez, de forma reutilizable por cualquier aplicación compatible.

> **Analogía:** antes del USB, cada periférico (ratón, impresora, disco duro) tenía su propio conector y necesitaba un controlador escrito a medida para cada ordenador. USB estandarizó el conector y el protocolo: un periférico compatible con USB funciona con cualquier ordenador compatible con USB, sin integración específica. MCP cumple el mismo papel entre una herramienta (GitHub, una base de datos, un sistema de archivos) y una aplicación que usa un LLM.

## Cliente y servidor MCP

MCP retoma el vocabulario cliente/servidor ya visto para [HTTP](/?c=infrastructure&p=api-et-http), con roles distintos:

| Rol | Quién es | Ejemplo |
|---|---|---|
| **Servidor MCP** | Expone un servicio concreto (herramientas, datos) siguiendo el protocolo MCP | Un servidor MCP de GitHub, un servidor MCP para una base de datos local |
| **Cliente MCP** | La aplicación que hace funcionar el modelo y se conecta a uno o varios servidores MCP | Un IDE, un asistente de línea de comandos, una aplicación de chat |

```text
Aplicacion (cliente MCP)  <-- protocolo MCP -->  Servidor MCP de GitHub
       |                                          |
   ejecuta el modelo                             sabe comunicarse
                                                  con la API de GitHub
```

El mismo servidor MCP de GitHub funciona, sin ninguna modificación, con cualquier aplicación compatible con MCP: es el servidor el que lleva la integración con GitHub, una sola vez, no cada aplicación que lo usa.

## Tres tipos de recursos expuestos

Un servidor MCP puede ofrecer tres cosas distintas, no solo herramientas:

| Tipo | Rol | Ejemplo |
|---|---|---|
| **Tools** | Funciones que el modelo puede decidir llamar (el [function calling](/?c=ia&s=nlp-llm&p=agents) habitual) | `create_issue`, `list_pull_requests` |
| **Resources** | Datos que el cliente puede leer y dar como contexto al modelo, sin llamada decidida por el propio modelo | El contenido de un archivo, el esquema de una base de datos |
| **Prompts** | Plantillas de prompt reutilizables, proporcionadas por el servidor en lugar de escritas a mano en cada aplicación | Una plantilla "resume esta pull request" lista para usar |

## Transporte: local o remoto

Un cliente MCP se comunica con un servidor MCP por uno de estos dos canales:

| Transporte | Principio | Caso de uso típico |
|---|---|---|
| `stdio` | El servidor funciona como un proceso local, comunicación por entrada/salida estándar | Una herramienta que accede al sistema de archivos local |
| HTTP / SSE | El servidor funciona de forma remota, comunicación en red | Un servicio compartido entre varios usuarios o máquinas |

> **Trampa:** conectar un cliente a un servidor MCP concediéndole más permisos de los necesarios (un servidor "archivos" que puede escribir en todo el disco en lugar de en una carpeta concreta), el mismo riesgo que el acceso a un parámetro libre en function calling.
>
> **Buena práctica:** limitar cada servidor MCP al perímetro estrictamente necesario (una carpeta concreta, una base de solo lectura), y exigir una confirmación humana antes de toda acción con consecuencia real, exactamente como para un [agente](/?c=ia&s=nlp-llm&p=agents) clásico.

## Resumen

| | |
|---|---|
| **Para recordar** | MCP estandariza la forma en que una herramienta (tool), un dato (resource) o una plantilla de prompt se expone a una aplicación que hace funcionar un LLM, para que un mismo servidor MCP sea reutilizable por cualquier cliente compatible, sin integración reescrita cada vez. |
| **Herramientas utilizables** | Un servidor MCP por servicio a integrar (GitHub, base de datos, sistema de archivos...); transporte `stdio` en local, HTTP/SSE en remoto. |
| **Trampas a evitar** | Conceder a un servidor MCP más permisos que el perímetro realmente necesario. |
| **Buenas prácticas** | Limitar cada servidor MCP al perímetro estrictamente requerido; exigir una confirmación humana antes de toda acción con consecuencia real. |
