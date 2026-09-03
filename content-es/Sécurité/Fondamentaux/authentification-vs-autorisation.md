---
order: 1
---

# Autenticación vs autorización

> **Analogía:** una tarjeta de identificación de empresa. En la entrada, el guardia verifica que la foto de la tarjeta corresponde a tu cara: eso es la **autenticación**, probar quién eres. Una vez dentro, esa misma tarjeta determina qué puertas se te abren al pasar (oficina, sala de servidores, terraza): eso es la **autorización**, lo que tienes derecho a hacer una vez identificado. Los dos mecanismos trabajan juntos, pero son dos verificaciones distintas, hechas en momentos diferentes.

Esta confusión es tan frecuente que merece plantearse antes que todo lo demás: este capítulo sienta las definiciones sobre las que se apoyan todos los demás capítulos de esta categoría.

## Autenticación: probar quién eres

La **autenticación** es el proceso que verifica que una persona (o un programa) es realmente quien dice ser. Probar la propia identidad siempre se apoya en al menos uno de estos tres tipos de prueba, llamados **factores de autenticación**:

| Factor | Qué es | Ejemplo |
|---|---|---|
| Algo que sabes | Una información secreta memorizada | Una contraseña, un código PIN |
| Algo que tienes | Un objeto físico o digital en tu posesión | Un teléfono que recibe un código, una llave USB de seguridad |
| Algo que eres | Una característica biológica propia de ti | Una huella digital, el reconocimiento facial |

```text
Usuario                               Servidor
-------                                --------
introduce usuario + contrasena  ->    verifica la correspondencia
                                       con lo registrado
                                  <-   autentica (o rechaza)
```

La mayoría de los sistemas hoy dependen de un solo factor (la contraseña): una elección práctica, pero frágil, ya que un único secreto comprometido basta para usurpar la identidad completa. Otros capítulos de esta categoría detallan cómo almacenar correctamente ese secreto, y cómo combinar varios factores para reducir este riesgo.

## Autorización: lo que tienes derecho a hacer

Una vez verificada la identidad, la **autorización** determina a qué recursos o acciones tiene acceso esa identidad. Dos empleados de una misma empresa pueden autenticarse con el mismo éxito en el mismo sistema, sin por ello tener los mismos derechos una vez conectados:

```text
Empleado A (autenticado) -> rol "contabilidad"   -> puede ver los salarios
Empleado B (autenticado) -> rol "desarrollo"     -> NO puede ver los salarios
```

La autenticación responde a la pregunta *"¿quién eres?"*, una sola vez por conexión. La autorización responde a *"¿tienes derecho a hacer esto exactamente?"*, potencialmente en cada acción, y puede cambiar sin que la persona necesite volver a autenticarse (un cambio de rol, por ejemplo).

## Una ilustración concreta: los códigos HTTP 401 y 403

El capítulo sobre [las API y HTTP](/?c=infrastructure&p=api-et-http) presenta el código de estado como el número que indica si una petición tuvo éxito, y si no, por qué. Dos códigos precisos ilustran exactamente la distinción planteada más arriba:

| Código | Nombre oficial | Significa en realidad |
|---|---|---|
| `401` | *Unauthorized* | Autenticación faltante o inválida: el servidor no sabe quién eres |
| `403` | *Forbidden* | Autenticación exitosa, pero autorización denegada: el servidor sabe quién eres, y rechaza |

> **Trampa:** fiarse del nombre oficial `Unauthorized` del código `401` y pensar que señala un problema de autorización. Históricamente mal nombrado, en realidad señala una autenticación faltante o inválida: es `403` el que cubre el verdadero rechazo de autorización, una vez la identidad ya establecida.
>
> **Buena práctica:** ante un error de acceso, verificar primero de qué código se trata antes de buscar la causa: un `401` se corrige proporcionando o renovando credenciales válidas, un `403` nunca se corrige de esa forma ya que la identidad ya fue aceptada, solo el rol o los permisos deben cambiar.

## Un mecanismo simple: la autenticación HTTP Basic

**HTTP Basic** es un mecanismo de autenticación soportado por el propio protocolo HTTP, en lugar de por la aplicación: es el navegador el que muestra su propia ventana emergente de conexión (no un formulario de conexión diseñado por el sitio), y las credenciales viajan en un encabezado `Authorization` en cada solicitud.

```text
Cliente                                 Servidor
-------                                 --------
solicitud sin encabezado Authorization -> 401, encabezado "WWW-Authenticate: Basic"
(el navegador muestra su ventana emergente)
solicitud con encabezado
"Authorization: Basic dXNlcjpwYXNz"   -> 200, si las credenciales son validas
```

El encabezado transmitido no es más que `usuario:contraseña` codificado en **Base64** (`dXNlcjpwYXNz` decodifica a `user:pass`).

> **Trampa:** creer que la codificación Base64 protege las credenciales de alguna forma. Base64 **no es ni un hash ni un cifrado** (ver la distinción planteada en [Criptografía aplicada](/?c=authentification&s=cybersecurite&p=cryptographie-appliquee)): es solo una representación, decodificable instantáneamente por quien intercepte la solicitud, sin ninguna clave necesaria.
>
> **Buena práctica:** usar HTTP Basic únicamente a través de una conexión HTTPS sistemática, nunca en claro: sin HTTPS, las credenciales circulan literalmente en claro por la red.

Otra diferencia con los mecanismos ya cubiertos ([sesiones/cookies](/?c=authentification&s=sessions-et-tokens&p=sessions-et-cookies), [JWT](/?c=authentification&s=sessions-et-tokens&p=jwt-et-tokens)): HTTP Basic no tiene una noción propia de cierre de sesión del lado del servidor. El navegador retiene las credenciales para el dominio mientras la pestaña siga abierta, y las reenvía automáticamente en cada solicitud siguiente; no existe un equivalente directo a eliminar una cookie de sesión o a la expiración de un JWT.

## Por qué distinguir bien ambos importa en la práctica

Confundir los dos mecanismos lleva a corregir el problema equivocado: reiniciar la contraseña de un usuario que recibe un `403` no cambia nada, ya que su identidad ya era válida, el problema viene de sus derechos. A la inversa, modificar los permisos de una cuenta que recibe un `401` no sirve de nada mientras la autenticación misma falle.

> **Trampa:** tratar todo error de acceso como un problema de credenciales por reflejo, sin verificar si la autenticación realmente falló o si es la autorización la que rechaza.
>
> **Buena práctica:** identificar siempre cuál de los dos mecanismos está en juego antes de actuar, apoyándose en el código de estado devuelto (`401` vs `403`) cuando la verificación se hace vía una API.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La autenticación prueba quién eres (mediante uno o varios factores: saber, tener, ser); la autorización determina qué tienes derecho a hacer una vez identificado. Dos mecanismos distintos, a menudo confundidos. HTTP Basic es un mecanismo de autenticación simple soportado por el propio HTTP, a reservar para una conexión HTTPS sistemática. |
| **Herramientas utilizables** | Los códigos HTTP `401` (autenticación) y `403` (autorización) para diagnosticar con precisión cuál de los dos mecanismos falla; el encabezado `Authorization: Basic` para una autenticación HTTP simple. |
| **Trampas a evitar** | Fiarse del nombre `Unauthorized` del código `401`, que en realidad señala un problema de autenticación, no de autorización. Corregir el mecanismo equivocado (reiniciar una contraseña ante un `403`, por ejemplo). Creer que la codificación Base64 de HTTP Basic protege las credenciales. |
| **Buenas prácticas** | Identificar siempre cuál de los dos mecanismos está en juego antes de actuar. Apoyarse en el código de estado devuelto por una API para decidir rápidamente. Usar HTTP Basic solo a través de HTTPS, nunca en claro. |
