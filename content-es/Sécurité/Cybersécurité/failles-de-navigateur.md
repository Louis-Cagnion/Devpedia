---
order: 14
---

# Fallos del lado del navegador

Algunos ataques no explotan ningún fallo de código en el sentido clásico (inyección, control de acceso): desvían comportamientos por defecto del propio navegador, o aprovechan la ausencia de una instrucción explícita que el servidor debería haberle dado. Este capítulo cubre los más habituales.

## Clickjacking: hacer clic en algo distinto de lo que se ve

Un sitio atacante puede cargar TU sitio en un `iframe` invisible (opacidad casi nula), superpuesto con precisión sobre un botón falso atractivo que se muestra encima. La víctima cree hacer clic en el botón falso; en realidad hace clic en un botón real de tu sitio, escondido debajo.

```text
Página del atacante (lo que ve la víctima):
  ┌─────────────────────────┐
  │   "¡Gana un regalo!"    │   <- lo que la víctima CREE pulsar
  │    [ Haz clic aquí ]    │
  └─────────────────────────┘

Realidad superpuesta (invisible):
  ┌─────────────────────────┐
  │  iframe de tu sitio     │   <- lo que recibe REALMENTE el clic
  │  [Confirmar el pago]    │      (botón sensible, colocado justo
  └─────────────────────────┘       debajo del botón falso visible)
```

| | |
|---|---|
| **Trampa** | No indicar nada al navegador sobre si tu sitio puede o no mostrarse en un `iframe`: por defecto, cualquier sitio puede hacerlo |
| **Buena práctica** | Enviar la cabecera `Content-Security-Policy: frame-ancestors 'none'` (o `'self'` si tu propio sitio necesita enmarcarse a sí mismo) en toda página que desencadene una acción sensible, para que el navegador se niegue sin más a mostrarla en un iframe en otro sitio |

## Open redirect: una redirección desviada para phishing

Un parámetro de redirección (`?next=`, `?redirect=`, usado a menudo para "volver a la página solicitada tras iniciar sesión") que acepta cualquier URL externa convierte tu propio dominio, normalmente de confianza, en un trampolín hacia un sitio de phishing.

```text
Enlace enviado por el atacante, con el dominio REAL del sitio de confianza:
  https://sitio-de-confianza.example/login?next=https://sitio-pirata.example/formulario-falso

La víctima ve "sitio-de-confianza.example" en su navegador (tranquilizador),
hace clic, inicia sesión normalmente... y luego es redirigida al sitio pirata
justo después, en un dominio que ya no mira en ese momento
```

> **Trampa:** validar el parámetro de redirección comprobando solo que PARECE una URL (presencia de `http`), sin comprobar su dominio.
>
> **Buena práctica:** aceptar solo una ruta relativa interna del sitio (`/perfil`, nunca una URL completa) para este tipo de parámetro, o comprobar explícitamente el dominio contra una lista blanca si una redirección externa es realmente necesaria.

## Reverse tabnabbing: la página abierta toma el control de la pestaña de origen

Un enlace `target="_blank"` (apertura en una pestaña nueva) da por defecto a la página abierta acceso a `window.opener`, una referencia a la pestaña de ORIGEN. Una página maliciosa abierta así puede entonces redirigir en silencio esa pestaña de origen (que sigue abierta detrás, fuera de la vista inmediata de la víctima) hacia una página de inicio de sesión falsa.

```javascript
// En la página abierta con target="_blank", sin defensa del sitio de origen:
window.opener.location = "https://sitio-pirata.example/pagina-login-falsa";
// La pestaña de ORIGEN (la que la víctima sigue creyendo que es el sitio real)
// acaba redirigida, sin que la víctima haya hecho clic en nada dentro de ella
```

> **Trampa:** usar `target="_blank"` en un enlace hacia un contenido externo (generado por un usuario, o hacia un sitio de terceros) sin restringir este acceso.
>
> **Buena práctica:** añadir sistemáticamente `rel="noopener noreferrer"` a todo `target="_blank"`, sobre todo cuando la URL procede de un dato externo. `noopener` corta el acceso a `window.opener`; `noreferrer` impide además que el sitio abierto sepa de dónde viene el clic.

## HTTP Parameter Pollution: el mismo parámetro enviado dos veces

Nada impide que una petición HTTP lleve dos veces el mismo nombre de parámetro (`?id=1&id=2`). El problema: cada capa que procesa esta petición (servidor web, framework, código de la aplicación) puede elegir una convención DISTINTA para resolver ese duplicado (quedarse con el primero, con el último, fusionarlos en un array), sin que esté necesariamente documentado ni sea coherente entre ellas.

| Capa | Comportamiento posible ante `?id=1&id=2` |
|---|---|
| Una capa de validación | Solo mira el PRIMER `id` (`1`) y lo considera válido |
| El código de negocio que procesa realmente la petición | Usa el ÚLTIMO `id` (`2`) |

Si el atacante conoce esta divergencia, puede hacer que la capa de control valide un parámetro inofensivo mientras el código de negocio ACTÚA sobre un segundo parámetro nunca verificado.

> **Buena práctica:** no suponer nunca que un parámetro aparece una sola vez en una petición; comprobar explícitamente, en el framework usado, qué convención se aplica en caso de duplicado, y asegurarse de que la capa de validación y la de ejecución usan el MISMO valor.

## Cabeceras de seguridad ausentes

Varias cabeceras de respuesta HTTP, ausentes por defecto, indican explícitamente al navegador cómo comportarse de forma defensiva con esta página. [CORS](/?c=securite&s=cybersecurite&p=securite-api-web) ya se trata por separado; estas son las demás:

| Cabecera | Lo que impide |
|---|---|
| `Content-Security-Policy: frame-ancestors` | El clickjacking (visto más arriba) |
| `X-Content-Type-Options: nosniff` | El navegador adivina (*sniff*) a veces el tipo de un archivo servido en lugar de fiarse del `Content-Type` declarado; un archivo subido por un usuario e interpretado como HTML/JS ejecutable en lugar del tipo inofensivo declarado puede entonces ejecutarse |
| `Strict-Transport-Security` | El navegador fuerza toda conexión futura a este dominio en HTTPS, aunque un enlace apunte explícitamente a HTTP |
| `Referrer-Policy: strict-origin-when-cross-origin` (o `no-referrer`) | La fuga de la dirección de la página en la cabecera `Referer` enviada a otros sitios: con este valor, otro sitio solo recibe el nombre de dominio, nunca la ruta ni los parámetros |

> **Buena práctica:** configurar estas cabeceras a nivel del servidor web o del framework para todo el sitio, en lugar de caso por caso en cada ruta.

> **Trampa:** incluso con esta política (aplicada por defecto por los navegadores recientes, pero no por los antiguos), un dato sensible colocado en la dirección (`?email=...`, `?token=...`) sigue visible en el historial del navegador, los registros del servidor y el `Referer` enviado a los recursos del mismo sitio: es la debilidad [CWE-598](https://cwe.mitre.org/data/definitions/598.html). Un dato sensible se envía en el cuerpo de una petición `POST`, nunca en la URL.

## Formularios en un dispositivo compartido: `autocomplete="off"`

Un navegador memoriza lo que se escribe en los campos de un formulario y lo vuelve a proponer en la siguiente entrada (nombre, teléfono, correo...). En un equipo personal es práctico; en un **dispositivo compartido** (terminal de autoservicio, quiosco, puesto de recepción), el siguiente usuario ve los datos personales del anterior.

```html
<input type="email" name="email" autocomplete="off">   <!-- ninguna sugerencia memorizada -->
```

| Situación | Ajuste |
|---|---|
| Equipo personal | Dejar el autocompletado: ayuda al usuario |
| Terminal o dispositivo compartido | `autocomplete="off"` en cada campo de datos personales, y borrar los datos del navegador entre dos sesiones (lo más seguro: un perfil de navegación privada relanzado para cada usuario) |

> **Trampa:** los navegadores pueden ignorar `autocomplete="off"` en los campos de inicio de sesión (usuario, contraseña), para que su gestor de contraseñas siga funcionando. En un terminal, no confiar nunca solo en este atributo.

## Almacenamiento de un token en el cliente: `localStorage` frente a cookie `HttpOnly`

[Sesiones y cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies) explica por qué una cookie `HttpOnly` protege el identificador de sesión de una lectura por JavaScript. Una aplicación que gestiona ella misma un token (JWT, clave de API en el cliente) puede elegir dónde guardarlo en el navegador, con propiedades opuestas:

| | Cookie `HttpOnly` | `localStorage`/`sessionStorage` |
|---|---|---|
| Legible por un script JavaScript de la página | No | Sí |
| Robable mediante un fallo [XSS](/?c=securite&s=cybersecurite&p=xss-en-detail) en otra parte del sitio | No (la cookie sigue siendo invisible para el script inyectado) | Sí (basta con `localStorage.getItem(...)`) |
| Enviado automáticamente en cada petición al dominio | Sí | No (hay que añadirlo a mano en cada llamada) |
| Práctico para una API llamada desde otro dominio | Más complejo (restricciones entre dominios en las cookies) | Más sencillo |

> **Trampa:** guardar un token sensible en `localStorage` por comodidad de implementación, sin haber medido que un solo fallo XSS en otra parte del sitio basta entonces para robarlo por completo.
>
> **Buena práctica:** preferir una cookie `HttpOnly` para todo token cuyo robo tendría un impacto significativo, y reservar `localStorage` a los datos cuya exposición no supone un riesgo real ni siquiera en caso de XSS.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Varios ataques explotan comportamientos por defecto del navegador en lugar de un fallo de código: visualización en iframe sin restricción (clickjacking), redirección hacia un dominio externo no verificado (open redirect), acceso a `window.opener` desde un `target="_blank"` (reverse tabnabbing), tratamiento incoherente de un parámetro duplicado (HPP), cabeceras de seguridad ausentes, o elección del almacenamiento de un token en el cliente. |
| **Herramientas utilizables** | `Content-Security-Policy: frame-ancestors`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, `rel="noopener noreferrer"`, `autocomplete="off"` en un dispositivo compartido. |
| **Trampas a evitar** | No restringir la visualización en iframe. Aceptar cualquier URL completa como destino de redirección. `target="_blank"` sin `rel="noopener noreferrer"`. Suponer que un parámetro HTTP aparece una sola vez. Guardar un token sensible en `localStorage` sin medir el riesgo XSS. |
| **Buenas prácticas** | Configurar las cabeceras de seguridad pertinentes para todo el sitio. Aceptar solo una ruta relativa interna para una redirección tras el inicio de sesión. Sistematizar `rel="noopener noreferrer"`. Comprobar la convención del framework ante un parámetro duplicado. Preferir una cookie `HttpOnly` para un token sensible. |
