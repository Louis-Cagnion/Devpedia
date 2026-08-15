---
order: 14
---

# Protege tus datos

Cuando recuperas datos que vienen del usuario (formularios, URL, cookies...), siempre hay que considerarlos **poco fiables**, aunque parezcan correctos. Un visitante malintencionado puede enviar cualquier cosa: código HTML, JavaScript, o consultas SQL malformadas. PHP ofrece varias funciones para filtrar, validar y escapar estos datos.

Este capítulo cubre primero las protecciones directamente accionables en PHP (validación, XSS, inyección SQL, contraseñas), y luego sitúa estas protecciones en un panorama más amplio de las familias de ataques que puede sufrir una aplicación web: algunas se defienden a nivel de código de la aplicación, otras a nivel de red o de infraestructura.

## `filter_input()`

Permite recuperar **y** validar/filtrar al mismo tiempo un dato procedente de `$_GET`, `$_POST`, etc.:

```php
<?php
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    $edad = filter_input(INPUT_GET, 'edad', FILTER_VALIDATE_INT);

    if ($email === false) {
        echo "Email inválido.";
    }
?>
```

Si el dato no se ajusta al filtro solicitado, `filter_input()` devuelve `false`. Si el campo no existe en absoluto, devuelve `null`.

Algunos filtros habituales:

```php
<?php
    FILTER_VALIDATE_EMAIL;   // comprueba un formato de email
    FILTER_VALIDATE_INT;     // comprueba un número entero
    FILTER_VALIDATE_FLOAT;   // comprueba un número decimal
    FILTER_VALIDATE_URL;     // comprueba una URL
    FILTER_SANITIZE_STRING;  // limpia una cadena (obsoleto desde PHP 8.1)
?>
```

## `htmlspecialchars()`: protegerse de las fallas XSS

Si muestras un dato de usuario en la página (ej: un comentario, un nombre de usuario), un visitante podría inyectar código HTML/JavaScript malicioso. Es una falla llamada **XSS** (*Cross-Site Scripting*).

```php
<?php
    $comentario = "<script>alert('hackeado');</script>";

    echo htmlspecialchars($comentario);
    // muestra el texto tal cual, sin ejecutar el script
?>
```

`htmlspecialchars()` convierte los caracteres especiales (`<`, `>`, `"`, `'`) en entidades HTML, lo que impide que el navegador interprete el contenido como código.

> **Nota:** muestra siempre los datos de usuario con `htmlspecialchars()`, salvo que tengas una razón concreta para no hacerlo.

## Protegerse de las inyecciones SQL

Si insertas directamente un dato de usuario en una consulta SQL, un visitante puede manipular la consulta para acceder a datos que no debería ver, o incluso eliminarlos. Es una **inyección SQL**, ya detallada con el mecanismo de las consultas preparadas PDO en el capítulo [SQL](/?c=domain-specific-languages-dsl&p=sql): la protección en PHP sigue siendo exactamente la misma, nunca concatenar un dato de usuario en el texto de la consulta.

```php
<?php
    // ❌ Peligroso: el dato se inserta directamente en la consulta
    $consulta = "SELECT * FROM users WHERE email = '" . $_POST['email'] . "'";

    // ✅ Seguro: el dato pasa por un marcador de posición, nunca interpretado como SQL
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute(['email' => $_POST['email']]);
?>
```

## `password_hash()` y `password_verify()`: almacenar contraseñas

Una contraseña **nunca** debe almacenarse en texto plano en una base de datos. PHP ofrece funciones nativas para hashearla de forma segura:

```php
<?php
    // Se hashea la contraseña
    $user['password'] = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // Se guarda el hash en base de datos (no la contraseña en texto plano)
    $stmt = $pdo->prepare("INSERT INTO users (email, password) VALUES (:email, :password)");
    $stmt->execute([
        'email' => $_POST['email'],
        'password' => $user['password'],
    ]);

    // Se recupera el hash almacenado en base, a partir del email introducido
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute(['email' => $_POST['email']]);
    $user = $stmt->fetch();

    // Se compara la contraseña introducida con el hash recuperado de la base
    if (password_verify($_POST['password'], $user['password'])) {
        echo "Conexión correcta.";
    } else {
        echo "Contraseña incorrecta.";
    }
?>
```

`password_hash()` genera un hash diferente en cada llamada (incluso con la misma contraseña), gracias a una "sal" (*salt*) integrada automáticamente. Es por tanto imposible volver a la contraseña original a partir del hash.

Esta sal no se pierde: se incluye directamente en el hash generado, por ejemplo:

```text
2y $10 N9qo8uLOickgx2ZMRZoMye IjZAgcfl7p92ldGxad68LJZdL17lhWy
```

- `$2y$` → el algoritmo usado ([bcrypt](https://en.wikipedia.org/wiki/Bcrypt))
- `$10$` → el coste (la dificultad del cálculo)
- Los 22 caracteres siguientes → la sal usada para este hash preciso
- El resto → el resultado del hasheo, calculado con esta sal

Por eso `password_verify($_POST['password'], $user['password'])` funciona a pesar de todo: lee la sal ya presente en `$user['password']`, hashea `$_POST['password']` con **esa misma sal**, y luego compara el resultado obtenido con el resto de `$user['password']` usando el mismo algoritmo y coste. Por esta razón siempre se usa `password_verify()` para comparar, y nunca un nuevo `password_hash()` comparado directamente con el hash almacenado: este último daría siempre un resultado diferente, incluso con la contraseña correcta.

### Comparar hashes: la trampa del `==`

Una razón adicional para nunca comparar un hash uno mismo: la **comparación débil** de PHP (ver el capítulo [Condiciones](/?c=langages-de-programmation&s=php&p=conditions)) convierte las cadenas numéricas en números antes de compararlas.

Y PHP interpreta una cadena como `"0e123456"` en notación científica: `0` elevado a una potencia, por tanto **cero**. Dos hashes totalmente diferentes que empiecen por `0e` seguido de cifras se convierten entonces ambos en `0`, y se consideran iguales:

```php
<?php
    var_dump("0e123456" == "0e999999");   // ¡true!  0 == 0
    var_dump("0e123456" === "0e999999");  // false, como se esperaba
?>
```

Esto no es teórico: esta falla (*magic hash*) permitió eludir autenticaciones reales, proporcionando una contraseña cuyo hash [MD5](https://en.wikipedia.org/wiki/MD5) o [SHA-1](https://en.wikipedia.org/wiki/SHA-1) cae en esta forma. Bastaba con que el código comparara con `==`.

Tres protecciones, acumulables:

- usar `password_verify()`, que no hace ninguna conversión de tipo;
- para comparar dos cadenas sensibles, usar `hash_equals()`, que compara en **tiempo constante** y además evita los ataques de temporización;
- nunca comparar datos sensibles con `==`.

```php
if (hash_equals($token_esperado, $token_recibido)) { /* ... */ }
```

## CSRF: Cross-Site Request Forgery

Un sitio malicioso hace ejecutar, sin que el usuario lo sepa, una acción en otro sitio donde este ya está autenticado, apoyándose en el hecho de que el navegador reenvía automáticamente las cookies de sesión a ese sitio, sea cual sea la página de origen de la petición.

```html
<!-- en un sitio tercero, trampeado -->
<img src="https://banco.example/transferencia?monto=1000&hacia=atacante">
```

Si la víctima está conectada a su banco en el mismo navegador, esta petición sale con sus cookies de sesión válidas, sin que haya hecho clic en nada en `banco.example` mismo. Esto solo es posible porque la acción se dispara con una simple petición `GET`/`POST` sin más verificación que la presencia de una cookie de sesión válida.

**Protección: un token CSRF**, un valor aleatorio generado del lado del servidor, almacenado en sesión, y exigido en cada formulario/petición sensible:

```php
<?php
session_start();

// al generar el formulario
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
?>
<form action="/transferencia" method="POST">
    <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
    <!-- ... resto del formulario ... -->
</form>
```

```php
<?php
// al recibir el formulario
session_start();

$tokenRecibido = $_POST['csrf_token'] ?? '';
if (!hash_equals($_SESSION['csrf_token'] ?? '', $tokenRecibido)) {
    http_response_code(403);
    exit('Petición rechazada (token CSRF inválido).');
}
// procesamiento normal...
?>
```

Un sitio tercero no tiene ningún medio de conocer este token (está almacenado en sesión, nunca accesible desde otro dominio): no puede por tanto colarlo en su petición trampeada. `hash_equals()` en lugar de un `===` clásico, por la misma razón que en la verificación de un token firmado (ver [Gestión de conexiones](/?c=langages-de-programmation&s=php&p=connexions)): una comparación en tiempo constante, que evita un ataque por temporización.

> **Nota:** el atributo de cookie `samesite` (ver [Gestión de conexiones](/?c=langages-de-programmation&s=php&p=connexions)) aporta una protección complementaria a nivel del propio navegador, pero un token CSRF de la aplicación sigue siendo la protección de referencia, independiente del navegador usado.

## Panorama de las demás familias de ataques

Las protecciones anteriores cubren el código de la aplicación PHP en sí. Otros ataques apuntan a la red, la infraestructura, o al usuario directamente: conocerlos permite saber *dónde* se sitúa una protección dada, y qué no cubre.

### Ataques de red

Tres siglas aparecen en todo lo que sigue:

- **SSL** (*Secure Sockets Layer*) y su sucesor **TLS** (*Transport Layer Security*): los protocolos que cifran una conexión de red y permiten al cliente verificar la identidad del servidor vía un **certificado**. SSL está obsoleto desde hace tiempo, pero el nombre se quedó en el uso corriente: cuando se dice "certificado SSL", en la práctica se trata de TLS.
- **HTTPS**: simplemente HTTP transportado dentro de una conexión cifrada por TLS. Nada más cambia del lado del protocolo de aplicación.
- **DNS** (*Domain Name System*): el directorio que traduce un nombre de dominio en dirección IP. Es un paso indispensable antes de cualquier conexión, y por tanto un objetivo.

- **Man-in-the-middle (MITM)**: el atacante se interpone entre el cliente y el servidor legítimo, y retransmite (o altera) la conversación sin que ninguna de las dos partes se dé cuenta. El cifrado solo (TLS) no basta para impedirlo: un atacante puede cifrar *su propia* conversación con el cliente, mientras cifra otra conversación con el servidor real. **Protección:** la verificación del certificado SSL/TLS presentado por el servidor (`verify_peer`/`verify_peer_name`, ver [Realizar llamadas HTTP de forma nativa](/?c=langages-de-programmation&s=php&p=http)): sin ella, un certificado forjado por el atacante se aceptaría sin problema.
- **DNS spoofing / cache poisoning**: el atacante corrompe la resolución DNS para que un nombre de dominio legítimo apunte a su propia IP. La verificación de certificado sigue siendo una protección incluso si el DNS está comprometido, porque no depende de la resolución DNS sino de la identidad criptográfica presentada por el servidor.
- **Sniffing (escucha pasiva)**: simple lectura del tráfico de red no cifrado. No requiere ninguna interacción activa con el tráfico: solo observarlo, por ejemplo en una red Wi-Fi pública no controlada. **Protección:** HTTPS en todas partes, sin excepción para un dato considerado "no tan sensible".

### Session hijacking (robo de sesión)

Robar el identificador de sesión de un usuario (la cookie, ver [Gestión de conexiones](/?c=langages-de-programmation&s=php&p=connexions)) para suplantar su identidad sin conocer su contraseña. Un atacante que obtuviera ese identificador (por XSS: lectura de la cookie en JS, de ahí el interés de `httponly`; por sniffing en una conexión no cifrada; o por robo físico del dispositivo) puede literalmente hacerse pasar por la víctima mientras la sesión siga siendo válida.

### Brute force (fuerza bruta)

Probar un gran número de combinaciones (contraseñas, tokens, identificadores) hasta encontrar una válida. `password_verify()` (ver más arriba) protege contra la lectura directa de una contraseña en base de datos, pero no contra un atacante que probara miles de contraseñas en el propio formulario de conexión. **Protección típica:** limitar el número de intentos por unidad de tiempo (*rate limiting*), por IP, por cuenta, o ambos, con un retraso o un bloqueo temporal tras un umbral de fallos.

### DDoS: Distributed Denial of Service

Saturar un servidor (o un recurso de red) con peticiones, desde numerosas fuentes simultáneas, para hacerlo indisponible a los usuarios legítimos. Diferente de la fuerza bruta: el objetivo no es adivinar un valor, sino agotar un recurso (ancho de banda, CPU, conexiones abiertas). Rara vez se protege a nivel de código de la aplicación solo: más bien vía la infraestructura (cortafuegos, CDN, limitación de tráfico antes del servidor).

### Phishing

Hacer creer a la víctima que interactúa con un sitio/servicio legítimo para sonsacarle información (credenciales, datos bancarios), típicamente vía un nombre de dominio visualmente parecido al real (*typosquatting*) y un certificado SSL válido, pero emitido para ese dominio falso. Un certificado válido demuestra la identidad **del dominio llamado**, no que ese dominio sea de confianza: un matiz que explica por qué el candado del navegador por sí solo nunca garantiza que un sitio sea legítimo.

### SSRF: Server-Side Request Forgery

Forzar a un servidor a efectuar, por cuenta de un atacante, una petición HTTP hacia un destino que normalmente no debería alcanzar, típicamente un recurso interno de la red (panel de administración, metadatos cloud, servicio interno no expuesto públicamente).

```php
<?php
// peligroso si $_GET['url'] puede apuntar a una dirección interna (ej: http://169.254.169.254/, http://localhost:6379/...)
$respuesta = file_get_contents($_GET['url']);
?>
```

Todo código que construye una URL/host de destino a partir de una entrada influenciada, incluso indirectamente, por el usuario (ver [Realizar llamadas HTTP de forma nativa](/?c=langages-de-programmation&s=php&p=http)) es candidato a una auditoría SSRF. **Protección:** validar el host objetivo contra una lista blanca explícita en lugar de confiar en una URL arbitraria proporcionada por el cliente.

## Resumen

| Riesgo | Defensa principal |
|---|---|
| Dato mal formado (email, número...) | `filter_input()` |
| Inyección de HTML/JS (XSS) | `htmlspecialchars()` |
| Inyección SQL | Consultas preparadas (PDO) |
| Contraseña en texto plano | `password_hash()` / `password_verify()` |
| CSRF | Token CSRF en sesión, verificado vía `hash_equals()` |
| MITM / DNS spoofing | Verificación de certificado SSL (`verify_peer`/`verify_peer_name`) |
| Sniffing | HTTPS sistemático |
| Session hijacking | Cookie `httponly`/`secure`, identificador de sesión de alta entropía |
| Brute force | Limitación del número de intentos (*rate limiting*) |
| SSRF | Lista blanca de hosts/URLs autorizados |

> **Nota:** ninguna de estas protecciones sustituye a HTTPS, que cifra los datos intercambiados entre el navegador y el servidor.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Todo dato de usuario es poco fiable por defecto. Las principales fallas de aplicación (XSS, inyección SQL, CSRF) se neutralizan con mecanismos dedicados (`htmlspecialchars`, consultas preparadas, token CSRF): otros ataques apuntan a la red o la infraestructura, fuera del código de aplicación solo. |
| **Herramientas utilizables** | `filter_input()`, `htmlspecialchars()`, PDO (consultas preparadas), `password_hash`/`password_verify`, `hash_equals()`. |
| **Trampas a evitar** | Comparar dos hashes con `==` (falla *magic hash*); concatenar un dato de usuario directamente en una consulta SQL. |
| **Buenas prácticas** | Validar/escapar siempre un dato de usuario según su uso (visualización, SQL, comparación); HTTPS sistemático, sin excepción para un dato considerado "no tan sensible". |
