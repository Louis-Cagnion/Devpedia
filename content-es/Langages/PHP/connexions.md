---
order: 11
---

# Gestión de conexiones

Cuando un usuario navega por un sitio web, el servidor suele necesitar recordarlo de una página a otra, o incluso de una visita a otra: mantener la sesión, recuperar sus preferencias, su carrito... Para eso, PHP ofrece varias herramientas, cada una con sus propios usos: las **cookies** (almacenadas en el dispositivo del usuario), las **sesiones** (almacenadas en el servidor) y los **tokens de conexión** (para una conexión de larga duración). Este capítulo presenta estas tres herramientas y explica cuándo usar una u otra.

## Las cookies
Una **cookie** es un pequeño dato almacenado por el navegador del usuario, enviado automáticamente al servidor en cada solicitud hacia el mismo sitio. A diferencia de las variables PHP clásicas (que desaparecen al final de cada script), una cookie persiste entre varias visitas, incluso si el usuario cierra su navegador.

Las cookies sirven típicamente para:
- Recordar a un usuario (mantener la sesión iniciada, "recordarme")
- Guardar preferencias (idioma, tema claro/oscuro...)
- Seguir un carrito de compra antes de crear una cuenta

### Crear una cookie
```php
<?php
    setcookie("nombre_cookie", "valor", time() + 3600); // caduca en 1h
?>
```

`setcookie()` acepta principalmente 3 parámetros:
- El nombre de la cookie
- El valor a almacenar
- La fecha de caducidad (en timestamp Unix; `time()` devuelve la hora actual, así que `time() + 3600` significa "dentro de 1h")

> **Nota importante:** `setcookie()` debe llamarse **antes** de cualquier salida [HTML](/?c=langages-de-balisage&s=html&p=html) (antes de la mínima etiqueta, espacio o salto de línea), porque modifica las cabeceras (*headers*) HTTP de la respuesta. Es la misma lógica que para la etiqueta de cierre `?>` mencionada más arriba.

### Leer una cookie
Una vez creada, una cookie es accesible vía la variable global `$_COOKIE`:

```php
<?php
    if (isset($_COOKIE["nombre_cookie"])) {
        echo $_COOKIE["nombre_cookie"];
    }
?>
```

> **Nota:** una cookie creada con `setcookie()` solo está disponible en `$_COOKIE` a partir de la **siguiente recarga** de la página, no inmediatamente en el mismo script.

### Modificar una cookie
No existe una función "update": para modificar una cookie, simplemente se recrea con el mismo nombre y un nuevo valor, lo que sobrescribe la anterior:

```php
<?php
    setcookie("nombre_cookie", "nuevo_valor", time() + 3600);
?>
```

### Eliminar una cookie
Para eliminar una cookie, se recrea con una fecha de caducidad **en el pasado**:

```php
<?php
    setcookie("nombre_cookie", "", time() - 3600);
?>
```

### Proteger una cookie
`setcookie()` acepta opciones adicionales para reforzar la seguridad:

```php
<?php
    setcookie("nombre_cookie", "valor", [
        "expires" => time() + 3600,
        "path" => "/",
        "secure" => true,
        "httponly" => true,
        "samesite" => "Strict"
    ]);
?>
```

- `secure`: la cookie solo se transmite si la conexión es HTTPS.
- `httponly`: impide que [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) (`document.cookie`) acceda a la cookie, lo que limita los daños en caso de un fallo XSS.
- `samesite`: impide que la cookie se envíe en una solicitud proveniente de otro sitio, lo que protege contra los ataques CSRF.

> **Nota:** nunca almacenes información sensible (contraseña, número de tarjeta bancaria...) en una cookie, ni siquiera segura. Una cookie sigue siendo manipulable por el propio usuario. Para datos sensibles del lado del servidor, prefiere las **sesiones** (`$_SESSION`).

## Las sesiones

Una **sesión** permite almacenar datos **del lado del servidor**, asociándolos a un visitante concreto. A diferencia de una cookie (almacenada en el usuario y modificable por él), el dato de sesión permanece en el servidor: el usuario no tiene por tanto ningún medio de leerlo o modificarlo directamente.

PHP hace el enlace entre el visitante y sus datos gracias a un identificador de sesión único, enviado automáticamente al navegador en forma de cookie (generalmente llamada `PHPSESSID`). Esta cookie no contiene por tanto ningún dato sensible: solo un identificador, que apunta a los datos reales almacenados en el servidor.

### Iniciar una sesión

```php
<?php
    session_start(); // debe llamarse antes de cualquier salida HTML, como setcookie()
?>
```

### Almacenar un dato en sesión

```php
<?php
    session_start();

    $_SESSION["user_id"] = 12;
    $_SESSION["email"] = "juan@example.com";
?>
```

### Leer un dato de sesión

```php
<?php
    session_start();

    if (isset($_SESSION["user_id"])) {
        echo "Conectado como usuario nº" . $_SESSION["user_id"];
    }
?>
```

> **Nota:** `session_start()` debe llamarse al principio de **cada** página donde quieras acceder a `$_SESSION`, si no PHP no sabe a qué visitante asociar los datos.

### Eliminar un dato o destruir la sesión

```php
<?php
    session_start();

    unset($_SESSION["user_id"]);  // elimina únicamente este dato
    session_destroy();            // destruye toda la sesión (ej: al desconectarse)
?>
```

> **Nota:** por defecto, la cookie `PHPSESSID` (y por tanto la sesión) desaparece al cerrar el navegador, o tras un periodo de inactividad del lado del servidor. Para hacer durar una conexión más tiempo (varios días/semanas), las sesiones clásicas no bastan: ver la parte sobre los tokens de conexión más abajo.

## Los tokens de conexión ("recordarme")

Para mantener a un usuario conectado a largo plazo (varios días/semanas), incluso después de cerrar el navegador, ni la cookie clásica (no segura para esto) ni la sesión (demasiado efímera) bastan. Se usa entonces un **token de conexión** (*remember token*): una prueba de conexión de larga duración, almacenada a la vez en el usuario y en el servidor.

El principio:
- **Nunca** se almacena la contraseña para hacer esto: únicamente un token aleatorio.
- El token se envía en texto plano en una cookie al usuario.
- Su versión **hasheada** se almacena en base de datos, asociada a su cuenta (como para una contraseña).

### Crear el token al conectarse

```php
<?php
    $token = bin2hex(random_bytes(32)); // token aleatorio (64 caracteres hexadecimales)
    $tokenHash = hash('sha256', $token);

    // se almacena $tokenHash en base de datos, ligado al usuario (ej: columna "remember_token")

    // se envía $token (sin hashear) en una cookie segura, de larga duración
    setcookie("remember_token", $token, time() + 60 * 60 * 24 * 30, "/", "", true, true);
?>
```

### Reconectar automáticamente al usuario

En cada visita, si la sesión está vacía pero la cookie `remember_token` existe, se verifica su correspondencia en base de datos:

```php
<?php
    session_start();

    if (!isset($_SESSION["user_id"]) && isset($_COOKIE["remember_token"])) {
        $tokenHash = hash('sha256', $_COOKIE["remember_token"]);

        // se busca en base de datos un usuario cuyo remember_token corresponda
        $stmt = $pdo->prepare("SELECT * FROM users WHERE remember_token = :token");
        $stmt->execute(['token' => $tokenHash]);
        $user = $stmt->fetch();

        if ($user) {
            $_SESSION["user_id"] = $user["id"]; // reconecta al usuario
        }
    }
?>
```

> **Nota:** siempre se compara el **hash** del token recibido con el almacenado en base de datos, nunca el token en texto plano: exactamente como para una contraseña con `password_hash()`/`password_verify()`. Si roban la cookie, el ladrón no puede deducir de ahí el hash almacenado, pero sobre todo, se puede revocar ese token en cualquier momento eliminándolo de la base de datos (ej: en caso de cambio de contraseña o desconexión explícita).

### Cookie, sesión o token de conexión: ¿cuál elegir?

| | Cookie | Sesión | Token de conexión |
|---|---|---|---|
| Almacenamiento | Lado navegador | Lado servidor | Ambos (token en el usuario, hash en base de datos) |
| Manipulable por el usuario | Sí | No | El token sí, pero inútil sin el hash correspondiente en base de datos |
| Persistencia | Puede durar días/meses | Generalmente hasta el cierre del navegador | Puede durar días/meses |
| Revocable en cualquier momento | No | Sí (`session_destroy()`) | Sí (eliminación del hash en base de datos) |
| Uso típico | Preferencias, idioma, tema | Conexión de usuario (corta duración), carrito, datos sensibles | Conexión de usuario (larga duración), "recordarme" |

## Lo que realmente contiene la cookie de sesión

Error frecuente: creer que `$_SESSION` está almacenado en la cookie del navegador. En realidad:

- `session_start()` genera un **identificador aleatorio opaco** (ej. `a3f9c1...`), enviado al cliente en una cookie (`PHPSESSID` por defecto). Eso es todo lo que contiene la cookie.
- Los datos (`$_SESSION['...'] = ...`) se escriben **del lado del servidor** (archivo o base de datos), asociados a ese identificador.
- En cada solicitud siguiente, el navegador reenvía la cookie; PHP relee el identificador, encuentra el almacenamiento del servidor correspondiente, recarga `$_SESSION`.

> **Analogía:** un tique de guardarropa. El número en el tique se saca al azar **en el momento de dejar el abrigo**: no tiene ninguna relación con el abrigo en sí. El vínculo número ↔ abrigo solo existe en el registro del empleado (el almacenamiento del servidor), nunca en el número.

### El riesgo del robo de sesión

Si un atacante adivinara o robara el identificador de una sesión ya abierta, heredaría su contenido, pero no puede *elegir* el objetivo: el identificador se genera con un CSPRNG (generador aleatorio criptográficamente seguro) con una entropía enorme, comparable a una contraseña de varios cientos de bits. `session_set_cookie_params(['httponly' => true])` añade una protección complementaria: impide que el JavaScript de la página lea esta cookie, lo que limita los daños en caso de un fallo XSS.

### ¿Por qué no derivar simplemente el identificador con un hash de un dato conocido?

Un hash simple (`sha256($identificador_conocido)`) es **determinista y sin secreto**: cualquiera puede recalcularlo. Si existe un número limitado de valores posibles (ej. una treintena de cuentas), un atacante ni siquiera necesita hacer fuerza bruta sobre un espacio grande: le basta con hashear cada valor posible para obtener todos los identificadores válidos. Un hash solo no añade **ninguna entropía** más allá de la ya presente en la entrada.

## Tokens firmados (HMAC): llevar un dato permaneciendo infalsificable

El token de conexión visto más arriba es un secreto **opaco** (aleatorio, sin significado), verificado por correspondencia con un hash almacenado en base de datos. Pero a veces se necesita un token que **lleve él mismo una información** (ej. un identificador), permaneciendo imposible de falsificar sin acceso al servidor. Se usa entonces `hash_hmac()`: un hash calculado con una **clave secreta**, conocida únicamente por el servidor.

```php
<?php
function crearToken(string $dato, string $secreto): string
{
    $codificado = base64_encode($dato);                    // codificado, NO cifrado: legible si se decodifica
    $firma = hash_hmac('sha256', $codificado, $secreto);
    return $codificado . '.' . $firma;
}

function verificarToken(string $token, string $secreto): ?string
{
    [$codificado, $firma] = explode('.', $token, 2);
    $esperado = hash_hmac('sha256', $codificado, $secreto);

    if (!hash_equals($esperado, $firma)) {
        return null; // firma inválida -> dato rechazado, aunque parezca correcto
    }
    return base64_decode($codificado);
}
?>
```

Si la parte `$codificado` es modificada por alguien que no conoce `$secreto`, la firma recalculada en la verificación ya nunca coincidirá: la modificación no se impide físicamente, pero **se detecta**.

### Identificador de sesión vs token firmado: dos necesidades diferentes

| | Identificador de sesión | Token firmado (HMAC) |
|---|---|---|
| ¿Contiene la información? | No: clave opaca, ningún dato | Sí: el dato está codificado dentro |
| ¿Necesita almacenamiento en servidor? | Sí: el dato vive en un archivo/base de datos asociado a la clave | No: autosuficiente, verificable recalculando la firma en cualquier momento |
| Caso de uso típico | Usuario ya identificado, sesión en curso | Dato a transmitir de forma verificable sin base de datos que consultar (enlace de activación, invitado sin cuenta...) |

> **Nota:** `hash_equals()` en lugar de un simple `===` para comparar dos hashes: compara en tiempo constante, lo que evita que un atacante deduzca progresivamente el valor correcto midiendo el tiempo de respuesta (ataque por temporización).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una cookie se almacena del lado navegador (manipulable por el usuario), una sesión del lado servidor (identificador opaco enviado vía cookie). Un token de conexión combina ambos para una conexión de larga duración. |
| **Herramientas utilizables** | `setcookie()`, `$_SESSION`/`session_start()`, `hash_hmac()`/`hash_equals()` para un token firmado. |
| **Trampas a evitar** | Almacenar un dato sensible en una cookie; comparar dos hashes con `==`/`===` en lugar de `hash_equals()`. |
| **Buenas prácticas** | `httponly`/`secure`/`samesite` en toda cookie de sesión; comparar el hash de un token recibido, nunca el token en texto plano. |
