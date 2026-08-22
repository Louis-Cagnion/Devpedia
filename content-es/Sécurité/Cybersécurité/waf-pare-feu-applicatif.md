---
order: 8
---

# El WAF: filtrar el tráfico antes de que llegue a la aplicación

Un **WAF** (*Web Application Firewall*, cortafuegos de aplicaciones web) inspecciona cada petición HTTP antes de que llegue a la aplicación, y bloquea las que corresponden a un patrón de ataque conocido (un intento de [inyección SQL](/?c=cybersecurite&p=types-de-failles), un script XSS deslizado en un parámetro). No inspecciona el contenido de red en bruto como un cortafuegos de red clásico, sino específicamente la estructura de una petición [HTTP](/?c=infrastructure&p=api-et-http): método, cabeceras, cuerpo, parámetros.

## Una capa más, no un sustituto del código seguro

```text
Cliente -> [ WAF ] -> Aplicacion

Peticion normal:         dejada pasar
Peticion con inyeccion:  bloqueada antes de llegar a la aplicacion
```

Un WAF se intercala entre el cliente y la aplicación, casi siempre como un reverse proxy dedicado o un módulo integrado en el servidor web. Filtra **antes** de que la petición llegue al código de la aplicación, lo que lo hace útil incluso contra una vulnerabilidad todavía no corregida en ese código.

> **Error común:** considerar un WAF como un sustituto de un código de aplicación seguro (ver [Principios de desarrollo seguro](/?c=cybersecurite&p=principes-de-developpement-securise)). Un WAF filtra por **patrón**: una variante de ataque suficientemente distinta de sus reglas conocidas (codificación inusual, técnica reciente) puede pasar sin activarlo, mientras que una validación de entrada correcta del lado de la aplicación bloquearía la falla en sí, sea cual sea la forma del ataque.
>
> **Buena práctica:** tratar el WAF como una capa de defensa adicional (*defense in depth*), que reduce la superficie de ataque explotable en la práctica, nunca como la única protección frente a las fallas listadas en el [OWASP Top 10](/?c=cybersecurite&p=owasp-top-10).

## ModSecurity y los conjuntos de reglas

**ModSecurity** es el WAF de código abierto más extendido, desplegable como módulo de servidor web (Apache, Nginx) o como reverse proxy independiente. No incluye ninguna regla por defecto: sus reglas suelen provenir del **Core Rule Set** (CRS) de OWASP, un conjunto de patrones ya escritos y mantenidos para las familias de fallas más comunes.

```text
# Regla simplificada, en el espiritu del CRS: bloquear un patron de inyeccion SQL clasico
SecRule ARGS "@detectSQLi" \
    "id:942100,deny,status:403,msg:'Intento de inyeccion SQL detectado'"
```

| Elemento de la regla | Función |
|---|---|
| `ARGS` | Objetivo: todos los parámetros de la petición (query string, cuerpo del formulario) |
| `@detectSQLi` | Operador: detección de patrón de inyección SQL, proporcionada por el motor del CRS |
| `deny,status:403` | Acción: bloquear la petición con un código `403 Forbidden` |

## El compromiso: falsos positivos frente a falsos negativos

Un conjunto de reglas demasiado estricto a veces bloquea peticiones legítimas (un comentario de usuario que contiene, por coincidencia, una cadena parecida a código SQL); un conjunto demasiado permisivo deja pasar ataques reales. La mayoría de los despliegues de WAF pasan por un **modo de aprendizaje** (*detection only*, que registra sin bloquear) antes de activar el bloqueo, para ajustar las reglas al tráfico real de la aplicación sin romper un uso legítimo justo al entrar en producción.

> **Error común:** activar el bloqueo de inmediato en producción, sin una fase de observación previa. Una regla demasiado agresiva puede bloquear una parte del tráfico legítimo sin que nadie lo note hasta que los usuarios afectados se quejen.
>
> **Buena práctica:** empezar en modo solo registro, analizar los falsos positivos sobre tráfico real, y activar el bloqueo únicamente una vez ajustadas las reglas a la aplicación en cuestión.

## Lo que el WAF no cubre

El WAF filtra el tráfico HTTP entrante; no protege ni los secretos de la aplicación (clave de API, contraseña de base de datos — ver [Gestión de secretos](/?c=cybersecurite&p=gestion-des-secrets) para ese aspecto, distinto del filtrado de red), ni una dependencia vulnerable ya instalada (ver [Seguridad de las dependencias](/?c=cybersecurite&p=securite-des-dependances)), ni una mala configuración del lado del servidor. Cada una de estas capas de seguridad responde a una amenaza diferente; ninguna sustituye a las demás.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un WAF inspecciona cada petición HTTP y bloquea las que corresponden a un patrón de ataque conocido, antes de que lleguen a la aplicación. ModSecurity, combinado con el Core Rule Set de OWASP, es el despliegue de código abierto más habitual. Es una capa de defensa adicional, no un sustituto del código de aplicación seguro. |
| **Herramientas utilizables** | ModSecurity con el OWASP Core Rule Set, un modo solo registro para ajustar las reglas antes de activar el bloqueo. |
| **Errores a evitar** | Considerar un WAF como suficiente por sí solo frente a las fallas de la aplicación. Activar el bloqueo en producción sin una fase de observación previa. |
| **Buenas prácticas** | Tratar el WAF como una capa de defensa en profundidad, complementaria a un código seguro. Empezar en modo solo detección antes de activar el bloqueo. |
