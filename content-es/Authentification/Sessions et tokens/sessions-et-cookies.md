---
order: 1
---

# Sesiones y cookies

El capítulo sobre [las API y HTTP](/?c=infrastructure&p=api-et-http) presenta cómo un cliente envía una petición y recibe una respuesta. Lo que aún no dice: HTTP es un protocolo **sin estado** (*stateless*), cada petición se trata independientemente de las anteriores, como si el servidor tuviera una amnesia total entre dos peticiones. Sin un mecanismo adicional, un sitio tendría que pedir de nuevo el usuario y la contraseña en cada página nueva.

```text
Peticion 1 : POST /login (email + contrasena)   -> el servidor verifica, responde "conexion exitosa"
Peticion 2 : GET /perfil                         -> el servidor no sabe NADA de la peticion 1:
                                                     para el, es un visitante anonimo
```

## La solución: un identificador que el cliente reenvía en cada petición

Tras una conexión exitosa, el servidor crea una **sesión**: un espacio de almacenamiento guardado de su lado, asociado a ese visitante concreto (su identificador de usuario, sus permisos...). A cambio, entrega al cliente un **identificador de sesión**, un valor único que el cliente reenviará luego en cada petición, para que el servidor sepa a qué sesión referirse:

```text
Cliente                                     Servidor
-------                                     --------
POST /login (email + contrasena)      ->    verifica, crea una sesion,
                                             responde con el identificador
                                       <-    Set-Cookie: session_id=a8f3d9...

GET /perfil
Cookie: session_id=a8f3d9...          ->    recupera la sesion a8f3d9...,
                                             sabe que es este usuario
                                       <-    responde con su perfil
```

## La cookie: lo que transporta el identificador

Una **cookie** es un pequeño dato que el servidor pide al navegador que conserve, y que este reenvía automáticamente en cada petición hacia el mismo sitio: es el vehículo más común para transportar el identificador de sesión de una petición a otra, sin que el desarrollador tenga que ocuparse manualmente en cada llamada.

Este capítulo permanece deliberadamente independiente del lenguaje utilizado: ver [Gestión de conexiones](/?c=langages-de-programmation&s=php&p=connexions) para la implementación concreta en PHP (`setcookie()`, `$_SESSION`, el identificador `PHPSESSID` generado automáticamente).

## Por qué el identificador de sesión debe ser imprevisible

Si un atacante pudiera adivinar un identificador de sesión válido (por ejemplo un simple contador: `1`, `2`, `3`...), obtendría acceso a la cuenta correspondiente sin conocer ni el email ni la contraseña de la víctima. El identificador de sesión es un caso de uso citado directamente en el capítulo sobre [pseudoaleatoriedad y generadores](/?c=representation-des-donnees&p=aleatoire-et-generateurs): debe generarse con un generador aleatorio **criptográfico**, nunca con un simple contador o un generador clásico.

## El robo de sesión: el riesgo real del día a día

Incluso con un identificador perfectamente imprevisible, un atacante que logra **robar** la cookie de un usuario ya conectado (red no cifrada, [falla XSS](/?c=langages-de-programmation&s=php&p=securite#htmlspecialchars-protegerse-de-las-fallas-xss) que lee `document.cookie`, dispositivo compartido mal protegido) obtiene un acceso completo e inmediato a la cuenta, sin necesitar nunca la contraseña: es el **robo de sesión** (*session hijacking*).

| Riesgo | Qué permite a un atacante |
|---|---|
| Identificador de sesión previsible | Adivinar un identificador válido sin robar nada |
| Robo de la cookie de sesión | Reutilizar un identificador ya válido, sin adivinarlo ni conocer la contraseña |

> **Trampa:** suponer que un identificador de sesión imprevisible basta para asegurar una sesión. Un identificador imprevisible impide *adivinarlo*, pero no protege contra el hecho de *robarlo* una vez que existe.
>
> **Buena práctica:** transmitir la cookie de sesión únicamente en HTTPS, prohibir su acceso a JavaScript, y limitar su envío a las peticiones que realmente provienen del sitio (ver las opciones `secure`/`httponly`/`samesite` detalladas en [Gestión de conexiones](/?c=langages-de-programmation&s=php&p=connexions)).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | HTTP no tiene estado: sin un mecanismo adicional, el servidor no recuerda nada entre dos peticiones. Una sesión (del lado del servidor) asociada a un identificador transmitido vía una cookie resuelve este problema: el cliente reenvía el identificador en cada petición, el servidor recupera la sesión correspondiente. |
| **Herramientas utilizables** | Un generador aleatorio criptográfico para el identificador de sesión; las opciones `secure`/`httponly`/`samesite` de una cookie para limitar el riesgo de robo. |
| **Trampas a evitar** | Un identificador de sesión previsible (contador, valor adivinable). Creer que un identificador imprevisible basta, sin protegerse contra el robo de la cookie en sí. |
| **Buenas prácticas** | Generar el identificador de sesión con un CSPRNG. Asegurar la cookie de sesión (solo HTTPS, inaccesible a JavaScript, limitada a las peticiones del sitio). |
