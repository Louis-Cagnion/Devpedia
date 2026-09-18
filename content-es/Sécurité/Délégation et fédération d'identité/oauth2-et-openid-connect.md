---
order: 1
---

# OAuth 2.0 y OpenID Connect

El botón "Iniciar sesión con Google" (o GitHub, Facebook...) está en todas partes en la web. Nunca pide la contraseña de Google a la aplicación que lo muestra: este capítulo explica cómo.

## El problema: dar acceso sin dar la contraseña

Una mala solución, practicada históricamente, consiste en dar directamente la contraseña de Google a una aplicación externa para que acceda a ciertos datos (los contactos, por ejemplo). Dos problemas concretos:

- la aplicación obtiene un acceso **total** a la cuenta de Google, cuando solo necesita los contactos;
- revocar ese acceso requiere cambiar la contraseña de Google misma, lo que desconecta de paso a todas las demás aplicaciones legítimas.

**OAuth 2.0** responde a este problema: un protocolo que permite a una aplicación externa obtener un acceso limitado y revocable a un recurso, sin conocer nunca la contraseña de la cuenta en cuestión.

## Los actores de un intercambio OAuth

| Rol | Quién es concretamente |
|---|---|
| Propietario del recurso | El usuario (su cuenta de Google, sus contactos) |
| Cliente | La aplicación externa que solicita el acceso |
| Servidor de autorización | El servicio que autentica al usuario y emite los accesos (Google, GitHub...) |
| Servidor de recursos | La API que posee el dato protegido (la API de Contactos de Google, por ejemplo) |

## El desarrollo simplificado

```text
1. El usuario hace clic en "Iniciar sesion con Google" en la aplicacion externa
2. La aplicacion externa redirige al usuario hacia Google
3. El usuario se conecta EN GOOGLE (nunca en la aplicacion externa)
4. Google pide al usuario su consentimiento: "Esta aplicacion quiere
   acceder a tus contactos, ¿autorizar?"
5. Si acepta, Google redirige hacia la aplicacion externa con un codigo temporal
6. La aplicacion externa intercambia ese codigo por un token de acceso
   (intercambio directo entre servidores, con su propio secreto)
7. La aplicacion externa usa ese token para llamar a la API de Google
   en nombre del usuario
```

La aplicación externa nunca ve la contraseña: solo Google la recibe, en el paso 3.

## El token de acceso: alcance limitado y revocable

El **token de acceso** (*access token*) obtenido en el paso 6 tiene un **alcance** (*scope*) preciso: "lectura de contactos", por ejemplo, nunca un acceso total a la cuenta. También puede revocarse en cualquier momento, independientemente de la contraseña:

| | Compartir directamente la contraseña | OAuth 2.0 |
|---|---|---|
| Alcance del acceso | Total, sin límite posible | Limitado a lo explícitamente otorgado |
| Revocación | Cambia la contraseña en todas partes, incluidos los usos legítimos | Revoca únicamente ese token preciso |
| ¿Transita la contraseña hacia el tercero? | Sí | Nunca |

## Otro flujo: *Client Credentials*, sin usuario

El desarrollo visto arriba (*Authorization Code*) supone un usuario presente, que se conecta y da su consentimiento. Otro caso, igual de común, no implica ningún usuario: un servicio que debe llamar a una API **por cuenta propia**, por ejemplo un servidor que recupera cada noche estadísticas desde la API de una herramienta de reporting.

```text
1. El servicio A se autentica directamente ante el servidor de autorizacion
   con su identificador de cliente + su secreto de cliente (client_id/client_secret)
2. El servidor de autorizacion verifica esas credenciales y devuelve un token de acceso
   -- sin redirigir nunca a nadie, sin pantalla de consentimiento
3. El servicio A usa ese token para llamar a la API en nombre de si mismo,
   no en nombre de un usuario
```

Este flujo se llama **Client Credentials** (*credenciales del cliente*). A diferencia de *Authorization Code*, no hay redirección, ni pantalla de consentimiento, ni usuario final implicado en ninguna etapa: solo el `client_id`/`client_secret` del servicio que llama demuestra su identidad.

| | *Authorization Code* (visto arriba) | *Client Credentials* |
|---|---|---|
| Quién se conecta | Un usuario final | Nadie: el servicio se autentica a sí mismo |
| Redirección del navegador | Sí (pasos 2-5) | Ninguna |
| Token obtenido en nombre de | El usuario | El propio servicio |
| Caso de uso típico | "Iniciar sesión con Google" | Un servidor que llama a una API externa para su propio procesamiento (importación, sincronización programada...) |

> **Trampa:** usar *Client Credentials* cuando la acción en realidad debe atribuirse a un usuario concreto (ej: "¿qué usuario solicitó esta exportación?"). Este flujo no transporta ninguna identidad de usuario: toda acción realizada con este token es indistinguible de una acción del propio servicio.
>
> **Buena práctica:** reservar *Client Credentials* para llamadas servidor-a-servidor que explícitamente no necesitan ninguna noción de usuario; en cuanto una acción deba rastrearse hasta una persona concreta, volver a un flujo con usuario (*Authorization Code*).

## Un tercer flujo: la cuenta de servicio, sin secreto compartido

*Client Credentials* prueba la identidad de un servicio con un secreto compartido (`client_id`/`client_secret`), enviado por la red en cada autenticación. Una **cuenta de servicio** (*service account*, ofrecida por Google Cloud y otros proveedores) prueba lo mismo de otra forma: mediante una clave privada que nunca sale de la máquina que la usa.

```text
1. El servicio A posee una clave privada RSA (nunca transmitida por la red),
   asociada a una cuenta de servicio registrada en el proveedor
2. El servicio A firma el mismo un token JWT con esa clave privada,
   atestando su propia identidad (JWT Bearer Assertion, RFC 7523)
3. El servicio A envia ese JWT firmado al servidor de autorizacion, que verifica
   la firma con la clave PUBLICA correspondiente (nunca la clave privada)
4. El servidor de autorizacion devuelve un token de acceso normal, usado
   despues igual que en Client Credentials
```

| | *Client Credentials* | Cuenta de servicio (JWT autofirmado) |
|---|---|---|
| Prueba de identidad | Un secreto compartido, enviado en cada llamada | Una firma, calculada con una clave privada que nunca viaja |
| Si el secreto/la clave se filtra | El secreto compartido debe reemplazarse en todos los sitios donde se usa | Solo hay que revocar la clave privada comprometida, y nunca fue interceptada en tránsito |

> **Buena práctica:** preferir una cuenta de servicio a *Client Credentials* cuando el proveedor la ofrezca: ningún secreto se transmite nunca por la red, solo una firma verificable.

## OAuth no prueba una identidad: el rol de OpenID Connect

OAuth 2.0 fue diseñado para la **autorización** (acceder a un recurso), no para la **autenticación** (ver [Autenticación vs autorización](/?c=authentification&s=fondamentaux&p=authentification-vs-autorisation)). Obtener un token de acceso a los contactos de alguien no prueba formalmente quién se conectó: una aplicación que usara ese solo token para "reconocer" a un usuario desvía OAuth de su objetivo inicial.

**OpenID Connect** (OIDC) añade una capa de identidad encima de OAuth 2.0, pensada específicamente para la autenticación: además del token de acceso, el servidor de autorización emite un **token de identidad** (*ID token*), que es un [JWT](/?c=authentification&s=sessions-et-tokens&p=jwt-et-tokens) estandarizado que contiene la identidad verificada del usuario (su identificador, su email...). Es este token de identidad, y no el token de acceso, el que usa realmente el botón "Iniciar sesión con Google".

> **Trampa:** usar un token de acceso OAuth en bruto para autenticar a un usuario, suponiendo que su obtención prueba su identidad. Un token de acceso solo prueba que se autorizó un acceso, no quién se conectó: ese es el rol del token de identidad de OpenID Connect.
>
> **Buena práctica:** usar OpenID Connect (y su token de identidad) en cuanto la necesidad sea saber *quién* se conecta, y reservar OAuth 2.0 solo para los casos donde la necesidad es únicamente acceder a un recurso en nombre del usuario.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | OAuth 2.0 permite a una aplicación externa obtener un acceso limitado y revocable a un recurso, sin conocer nunca la contraseña de la cuenta. *Client Credentials* obtiene un token sin ningún usuario, para un servicio que actúa por cuenta propia; una cuenta de servicio hace lo mismo sin secreto compartido, mediante una clave privada que nunca viaja. OpenID Connect añade encima un token de identidad (un JWT) específicamente diseñado para la autenticación, algo que OAuth solo no proporciona. |
| **Herramientas utilizables** | Una biblioteca OAuth/OIDC del lenguaje utilizado en lugar de una implementación manual del protocolo. |
| **Trampas a evitar** | Compartir directamente una contraseña con una aplicación externa. Usar un token de acceso OAuth para autenticar a un usuario. Usar *Client Credentials* para una acción que debe atribuirse a un usuario concreto. |
| **Buenas prácticas** | Limitar siempre el alcance (*scope*) solicitado a lo estrictamente necesario. Usar OpenID Connect cuando la necesidad sea probar una identidad, no solo acceder a un recurso. Reservar *Client Credentials* para llamadas servidor-a-servidor sin ninguna noción de usuario. |
