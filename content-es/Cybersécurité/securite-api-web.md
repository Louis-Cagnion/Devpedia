---
order: 7
---

# Seguridad de las API web

Una [API web](/?c=infrastructure&p=api-et-http) expone datos y acciones a programas cliente, que pueden ejecutarse en contextos que el servidor no controla (un navegador, una aplicación móvil, otro servidor). Este capítulo cubre las preocupaciones propias de ese contexto; la autenticación por token (JWT, sesiones) ya está detallada en la categoría [Autenticación](/?c=authentification), y los mecanismos genéricos de CSRF/fuerza bruta en [Asegurar tus datos](/?c=langages-de-programmation&s=php&p=securite).

## CORS: autorizar (o no) que un sitio llame a una API desde otro dominio

Por defecto, un navegador aplica la **política de mismo origen** (*same-origin policy*): una página cargada desde `sitio-a.example` no puede leer la respuesta de una solicitud a `api.sitio-b.example`, aunque la solicitud técnicamente salga igual. Esta restricción protege al usuario: sin ella, cualquier sitio visitado podría leer datos de otro sitio donde el usuario tiene sesión iniciada, sin que él lo sepa.

**CORS** (*Cross-Origin Resource Sharing*) es el mecanismo que permite a un servidor autorizar explícitamente a ciertos orígenes a leer sus respuestas, pese a esta restricción por defecto:

```text
Navegador (pagina cargada desde sitio-a.example)
        |
        | solicitud a api.sitio-b.example
        v
   Servidor api.sitio-b.example
        |
        | respuesta + encabezado:
        | Access-Control-Allow-Origin: https://sitio-a.example
        v
Navegador: origen autorizado -> la pagina puede leer la respuesta
```

```http
Access-Control-Allow-Origin: https://sitio-a.example
```

| Configuración | Efecto | Riesgo |
|---|---|---|
| `Access-Control-Allow-Origin: https://sitio-a.example` | Solo ese origen exacto puede leer la respuesta | Ninguno, siempre que la lista se mantenga restringida a orígenes realmente legítimos |
| `Access-Control-Allow-Origin: *` | Cualquier origen puede leer la respuesta | Aceptable para una API pública sin datos sensibles ni acción ligada a una cuenta; peligroso en otro caso |

> **Error común:** responder `Access-Control-Allow-Origin: *` por reflejo para "hacer desaparecer el error de CORS" durante el desarrollo, y luego olvidar restringirlo antes de poner en producción una API que maneja datos de cuenta.
>
> **Buena práctica:** autorizar solo los orígenes concretos que realmente necesitan acceder a la API, nunca `*` en cuanto haya datos sensibles o de un usuario autenticado en juego.

## Autenticar una API: clave o token, según el cliente

| Mecanismo | Adecuado para | Detalle |
|---|---|---|
| Clave de API | Un servicio de terceros, un script, un acceso servidor-a-servidor | Ver [Gestión de secretos](/?c=cybersecurite&p=gestion-des-secrets) para almacenarla correctamente |
| Token (JWT, sesión) | Un usuario humano autenticado | Ver [JWT y tokens](/?c=authentification&s=sessions-et-tokens&p=jwt-et-tokens) y [Sesiones y cookies](/?c=authentification&s=sessions-et-tokens&p=sessions-et-cookies) |
| Delegación OAuth 2.0 | Un acceso concedido por el usuario a una aplicación de terceros, sin compartir su contraseña | Ver [OAuth 2.0 y OpenID Connect](/?c=authentification&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) |

## Limitar la tasa de solicitudes (*rate limiting*)

Sin un límite, una API queda expuesta a dos abusos relacionados pero distintos: la [fuerza bruta](/?c=langages-de-programmation&s=php&p=securite) (adivinar una contraseña o un token probando enormes cantidades de valores) y la simple saturación por un cliente demasiado ávido, intencional o no (un bug del lado del cliente que llama a la API en bucle).

```text
Cliente                         API con rate limiting

solicitud 1  -------------->    aceptada (1/100 este mes)
solicitud 2  -------------->    aceptada (2/100)
...
solicitud 101 ------------->    429 Too Many Requests
                                 (cuota superada, reintentar mas tarde)
```

El código de estado `429 Too Many Requests` (ver los códigos de estado en [Los intercambios de datos: API y HTTP](/?c=infrastructure&p=api-et-http)) señala precisamente este rechazo, distinto de un error de solicitud habitual.

| Estrategia | Principio |
|---|---|
| Por IP | Limita el número de solicitudes desde una misma dirección IP |
| Por cuenta/clave de API | Limita el número de solicitudes para un usuario o clave dados, independientemente de la IP de origen |
| Ventana deslizante | Recalcula la cuota de forma continua en lugar de a intervalos fijos, para evitar que un cliente "vacíe" su cuota justo antes de cada reinicio |

## Nunca exponer más de lo necesario

Una respuesta de API que devuelve un registro interno completo (incluidos campos que el cliente nunca usa: contraseña hasheada, notas internas, identificadores técnicos) amplía innecesariamente lo que un atacante podría obtener si llegara a acceder a esa respuesta sin autorización. Este reflejo coincide con el principio de mínimo privilegio ya visto en [Principios de desarrollo seguro](/?c=cybersecurite&p=principes-de-developpement-securise), aplicado esta vez al dato expuesto en lugar de a un acceso del sistema.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | CORS autoriza explícitamente a ciertos orígenes a leer la respuesta de una API pese a la política de mismo origen del navegador. El rate limiting protege contra la fuerza bruta y la saturación. Una API solo debe exponer los campos que el cliente realmente necesita. |
| **Herramientas utilizables** | Encabezado `Access-Control-Allow-Origin`, código de estado `429 Too Many Requests`, clave de API/JWT/OAuth 2.0 según el tipo de cliente. |
| **Errores a evitar** | `Access-Control-Allow-Origin: *` en una API que maneja datos sensibles; ausencia de límite de tasa; devolver un registro interno completo en una respuesta. |
| **Buenas prácticas** | Restringir CORS a los orígenes realmente legítimos; limitar la tasa por cuenta/clave además de por IP; devolver solo los campos que el cliente realmente necesita. |
