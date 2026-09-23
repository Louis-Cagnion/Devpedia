---
order: 12
---

# Llamar al modelo: API, SDK, errores tipados y reintentos

Los capítulos anteriores describen qué se envía (el [estado y las preguntas](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles)) y qué se recibe (las [respuestas tipadas](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul)). Este último capítulo cubre el transporte: cómo circulan realmente estos intercambios por la red, apoyándose en las nociones ya planteadas en [API y HTTP](/?c=infrastructure&p=api-et-http) (método, código de estado, autenticación).

## Un único punto de entrada

Toda la API cabe en un solo endpoint [HTTP](/?c=infrastructure&p=api-et-http):

```text
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <clave_api>

{ "state": ..., "model": "jev-latest", "questions": { ... } }
```

La respuesta devuelve el modelo utilizado, un mapa de respuestas (una por pregunta planteada) y un recuento de tokens consumidos.

## SDK clientes para evitar escribir estas peticiones a mano

Dos bibliotecas oficiales (Python, JavaScript/TypeScript) encapsulan esta llamada HTTP, gestionan los reintentos automáticamente y exponen las primitivas [Choice/Score/Noul](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul) como clases en lugar de objetos JSON brutos que construir a mano:

```python
from typesafe_sdk import TypeSafeClient, Choice

with TypeSafeClient() as client:                    # lee TYPESAFE_API_KEY del entorno
    resultado = client.system_one(
        state="Me cobraron dos veces, ayudenme.",
        questions={"facturacion": Choice(instructions="...", criteria={...})},
    )
    print(resultado.answers["facturacion"].choice)
```

Sin SDK oficial para un lenguaje dado, la API HTTP sigue siendo directamente utilizable: los SDK son solo una comodidad, nunca un paso obligatorio.

## Excepciones tipadas, una por código de estado

En lugar de un único tipo de error genérico que inspeccionar, el SDK define una excepción distinta por [código de estado HTTP](/?c=infrastructure&p=api-et-http), heredando todas de una excepción común: un patrón reutilizable para cualquier biblioteca cliente de API, no específico de este proveedor.

| Excepción | Código HTTP | Causa |
|---|---|---|
| `AuthenticationError` | 401 | Clave API inválida o ausente |
| `PermissionDeniedError` | 403 | Acceso denegado al recurso solicitado |
| `NotFoundError` | 404 | Recurso inexistente |
| `BadRequestError` | 400 | Petición mal formada |
| `UnprocessableEntityError` | 422 | La petición está bien formada pero es rechazada tras la validación del servidor |
| `RateLimitError` | 429 | Demasiadas peticiones; lleva un tiempo de espera recomendado (`retry_after_ms`) |
| `InternalServerError` | 5xx | Error del lado del servidor |
| `APIConnectionError` | (ninguno) | La petición nunca alcanzó el servidor (red caída, DNS...) |
| `APITimeoutError` | (ninguno) | Se superó el plazo máximo configurado antes de cualquier respuesta |

Capturar la excepción común (`TypeSafeError`) basta para cubrir todos los casos; capturar una excepción precisa permite una reacción diferenciada (reautenticar en 401, ralentizar en 429).

## Reintentar automáticamente, pero no de cualquier manera

El SDK reintenta automáticamente ciertos errores, nunca todos: un error 400 (petición mal formada) nunca se vuelve válido repitiéndolo tal cual, mientras que un error 429 (demasiadas peticiones) o 503 (servidor temporalmente indisponible) puede tener éxito en el siguiente intento. La documentación oficial no publica valores por defecto precisos para esta política; el ejemplo siguiente ilustra los parámetros configurables, no valores impuestos:

```python
# max_retries     : numero de intentos adicionales tras la llamada inicial
# backoff_initial : retardo antes del primer reintento
# backoff_max     : tope del retardo, incluso tras varios fallos
# jitter          : variacion aleatoria anadida al retardo, para evitar que
#                    varios clientes reintenten todos en el mismo instante
retry = RetryPolicy(
    max_retries=3,
    backoff_initial=0.5,
    backoff_max=5.0,
    jitter=0.25,
    http_statuses={429, 500, 502, 503, 504},
)
```

Cuando el servidor proporciona una cabecera `Retry-After`, el cliente la usa con prioridad sobre su propio cálculo de retardo: el servidor conoce mejor que el cliente la duración real de su propia sobrecarga.

> **Trampa:** reintentar un error 400 o 401 en bucle, esperando que finalmente pase. Estos errores señalan un problema en la petición misma (mal formada, mal autenticada), nunca resuelto por la simple repetición.
>
> **Buena práctica:** reintentar solo los errores realmente transitorios (red, sobrecarga temporal, límite de tasa), con un retardo creciente y una parte de aleatoriedad (jitter), respetando la cabecera `Retry-After` del servidor cuando se proporciona.

## Designar el modelo: alias estable o versión fijada

El modelo Jev ilustra una tarificación específica de esta familia de modelos: facturado únicamente sobre los tokens de **entrada** (el texto del estado y las preguntas), alrededor de 0,042 $/millón de tokens según el anuncio del proveedor, nunca sobre la salida, coherente con el hecho de que la salida siempre es una estructura tipada corta, nunca un texto generado de peso variable.

| | Valor |
|---|---|
| Alias por defecto | `jev-latest` (apunta siempre a la última versión) |
| Versión fijada (ejemplo) | `jev-1.13.0` (nunca cambia de comportamiento) |
| Entradas aceptadas | Solo texto (cadena, objeto o array JSON) |

> **Trampa:** fijar `jev-latest` en producción sin supervisión. Un alias que apunta a "la última versión" puede cambiar de comportamiento sin previo aviso al actualizar el proveedor.
>
> **Buena práctica:** fijar una versión precisa (`jev-1.13.0`) para un sistema en producción cuyo comportamiento deba permanecer estable, y pasar a `jev-latest` solo en un entorno de prueba donde un cambio de comportamiento sea aceptable en cualquier momento.

## Lo que hay que recordar

| | |
|---|---|
| **A recordar** | Un único endpoint HTTP autenticado por clave portadora, SDK Python/JS opcionales que lo encapsulan, una excepción tipada por código de estado (patrón reutilizable para cualquier API cliente), un reintento automático limitado a errores transitorios con retardo creciente y respeto de `Retry-After`. |
| **Herramientas utilizables** | La API REST directamente, o los SDK Python/JavaScript oficiales; una política de reintento configurable. |
| **Trampas a evitar** | Reintentar un error de petición mal formada (400) o de autenticación (401) en bucle. |
| **Buenas prácticas** | Reintentar solo los errores transitorios (red, 429, 5xx), con retardo creciente, aleatoriedad (jitter), y prioridad a la cabecera `Retry-After` del servidor. |
