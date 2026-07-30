---
order: 10
---

# Gestión de conexiones

Cuando un usuario navega por un sitio web, el servidor suele necesitar recordarlo de una página a otra, o incluso de una visita a otra: mantener la sesión, recuperar sus preferencias, su cesta de la compra... Para ello, PHP ofrece varias herramientas, cada una con sus propios usos: las **cookies** (almacenadas en el dispositivo del usuario), las **sesiones** (almacenadas en el servidor) y los **tokens de conexión** (para una conexión de larga duración). Este capítulo presenta estas tres herramientas y explica cuándo utilizar una u otra.

## Las cookies
Una **cookie** es un pequeño archivo almacenado por el navegador del usuario, que se envía automáticamente al servidor cada vez que se realiza una solicitud al mismo sitio web. A diferencia de las variables PHP clásicas (que desaparecen al finalizar cada script), una cookie persiste entre varias visitas, incluso si el usuario cierra el navegador.

Las cookies suelen utilizarse para:
- Recordar a un usuario (mantener la sesión abierta, «recordarme»)
- Guardar preferencias (idioma, tema claro/oscuro...)
- Realizar un seguimiento de la cesta de la compra antes de crear una cuenta

### Crear una cookie
```php
<?php
    setcookie("nom_cookie", "valeur", time() + 3600); // caduca en 1 hora
?>
```

`setcookie()` Acepta principalmente tres parámetros:
- El nombre de la cookie
- El valor que se va a almacenar
- La fecha de caducidad (en formato de marca de tiempo Unix — `time()` devuelve la hora actual, por lo que `time() + 3600` significa «dentro de 1 hora»)

> **Nota importante:** la función `setcookie()` debe llamarse **antes** de cualquier contenido HTML (antes de cualquier etiqueta, espacio o salto de línea), ya que modifica los encabezados (*headers*) HTTP de la respuesta. Se trata de la misma lógica que en el caso de la etiqueta de cierre `?>` mencionada anteriormente.

### Leer una cookie
Una vez creada, se puede acceder a una cookie a través de la variable global `$_COOKIE`:

```php
<?php
    if (isset($_COOKIE["nom_cookie"])) {
        echo $_COOKIE["nom_cookie"];
    }
?>
```

> **Nota:** una cookie creada con `setcookie()` solo estará disponible en `$_COOKIE` a partir de **la siguiente recarga** de la página, no inmediatamente en el mismo script.

### Modificar una cookie
No existe una función «update»: para modificar una cookie, basta con volver a crearla con el mismo nombre y un nuevo valor, lo que sobrescribe la anterior:

```php
<?php
    setcookie("nom_cookie", "nouvelle_valeur", time() + 3600);
?>
```

### Eliminar una cookie
Para eliminar una cookie, hay que volver a crearla con una fecha de caducidad **anterior a la actual**:

```php
<?php
    setcookie("nom_cookie", "", time() - 3600);
?>
```

### Proteger una cookie
`setcookie()` Admite opciones adicionales para reforzar la seguridad:

```php
<?php
    setcookie("nom_cookie", "valeur", [
        "expires" => time() + 3600,
        "path" => "/",
        "secure" => true,
        "httponly" => true,
        "samesite" => "Strict"
    ]);
?>
```

- `secure` : la cookie solo se transmite si la conexión es HTTPS.
- `httponly` : impide que JavaScript (`document.cookie`) acceda a la cookie, lo que limita los daños en caso de una vulnerabilidad XSS.
- `samesite` : impide que se envíe la cookie cuando se realiza una solicitud procedente de otro sitio web, lo que protege contra los ataques CSRF.

> **Nota:** nunca almacenes información confidencial (contraseñas, números de tarjetas bancarias...) en una cookie, ni siquiera en una segura. El usuario puede manipular una cookie. Para datos confidenciales en el lado del servidor, es preferible utilizar **sesiones** (`$_SESSION`).

## Las sesiones

Una **sesión** permite almacenar datos **en el servidor**, asociándolos a un visitante concreto. A diferencia de una cookie (que se almacena en el dispositivo del usuario y puede ser modificada por él), los datos de la sesión permanecen en el servidor, por lo que el usuario no tiene forma alguna de leerlos ni modificarlos directamente.

PHP establece la conexión entre el visitante y sus datos mediante un identificador de sesión único, que se envía automáticamente al navegador en forma de cookie (normalmente denominada «`PHPSESSID`»). Por lo tanto, esta cookie no contiene ningún dato sensible: solo un identificador que apunta a los datos reales almacenados en el servidor.

### Iniciar sesión

```php
<?php
    session_start(); // Debe llamarse antes de cualquier visualización de HTML, al igual que setcookie()
?>
```

### Almacenar datos en la sesión

```php
<?php
    session_start();

    $_SESSION["user_id"] = 12;
    $_SESSION["email"] = "jean@example.com";
?>
```

### Leer datos de sesión

```php
<?php
    session_start();

    if (isset($_SESSION["user_id"])) {
        echo "Connecté en tant qu'utilisateur n°" . $_SESSION["user_id"];
    }
?>
```

> **Nota:** Hay que llamar a «`session_start()`» al principio de **cada** página en la que se quiera acceder a «`$_SESSION`»; de lo contrario, PHP no sabrá a qué visitante asociar los datos.

### Eliminar un dato o cerrar la sesión

```php
<?php
    session_start();

    unset($_SESSION["user_id"]); // solo elimina este dato
    session_destroy();           // borra toda la sesión (p. ej., al cerrar sesión)
?>
```

> **Nota:** por defecto, la cookie `PHPSESSID` (y, por lo tanto, la sesión) desaparece al cerrar el navegador o tras un periodo de inactividad por parte del servidor. Para que una conexión dure más tiempo (varios días o semanas), las sesiones clásicas no son suficientes; consulta la sección sobre tokens de conexión más abajo.

## Los tokens de sesión («recordarme»)

Para mantener a un usuario conectado a largo plazo (varios días o semanas), incluso después de cerrar el navegador, ni la cookie clásica (que no es segura para este fin) ni la sesión (demasiado efímera) son suficientes. Por ello, se utiliza un **token de conexión** (*remember token*): una prueba de conexión de larga duración, almacenada tanto en el dispositivo del usuario como en el servidor.

El principio:
- **Nunca** se almacena la contraseña para hacer esto, solo un token aleatorio.
- El token se envía sin cifrar en una cookie al usuario.
- Su versión **cifrada** se almacena en una base de datos, asociada a su cuenta (al igual que una contraseña).

### Crear el token al iniciar sesión

```php
<?php
    $token = bin2hex(random_bytes(32)); // token aleatorio (64 caracteres hexadecimales)
    $tokenHache = hash('sha256', $token);

    // Se almacena $tokenHache en la base de datos, vinculado al usuario (p. ej., columna «remember_token»).

    // Se envía el $token (sin hash) en una cookie segura de larga duración
    setcookie("remember_token", $token, time() + 60 * 60 * 24 * 30, "/", "", true, true);
?>
```

### Volver a iniciar sesión automáticamente

En cada visita, si la sesión está vacía pero existe la cookie «`remember_token`», se comprueba si existe una entrada correspondiente en la base de datos:

```php
<?php
    session_start();

    if (!isset($_SESSION["user_id"]) && isset($_COOKIE["remember_token"])) {
        $tokenHache = hash('sha256', $_COOKIE["remember_token"]);

        // Se busca en la base de datos un usuario cuyo «remember_token» coincida
        $stmt = $pdo->prepare("SELECT * FROM users WHERE remember_token = :token");
        $stmt->execute(['token' => $tokenHache]);
        $user = $stmt->fetch();

        if ($user) {
            $_SESSION["user_id"] = $user["id"]; // vuelve a iniciar sesión del usuario
        }
    }
?>
```

> **Nota:** siempre se compara el **hash** del token recibido con el almacenado en la base de datos, nunca el token sin cifrar —exactamente igual que con una contraseña en `password_hash()` / `password_verify()`. Si se roba la cookie, el ladrón no puede deducir el hash almacenado, pero, sobre todo, se puede revocar este token en cualquier momento eliminándolo de la base de datos (por ejemplo, en caso de cambio de contraseña o de desconexión explícita).

### ¿Cookie, sesión o token de conexión? ¿Cuál elegir?

| | Cookie | Sesión | Token de inicio de sesión |
|---|---|---|---|
| Almacenamiento | Lado del navegador | Lado del servidor | Ambos (token en el dispositivo del usuario, hash en la base de datos) |
| Manipulable por el usuario | Sí | No | El token sí, pero es inútil sin el hash correspondiente en la base |
| Persistencia | Puede durar días o meses | Normalmente hasta que se cierre el navegador | Puede durar días o meses |
| Revocable en cualquier momento | No | Sí (`session_destroy()`) | Sí (eliminación del hash de la base de datos) |
| Uso habitual | Preferencias, idioma, tema | Sesión de usuario (de corta duración), cesta de la compra, datos sensibles | Sesión de usuario (de larga duración), «recordarme» |

## Qué contiene realmente la cookie de sesión

Error frecuente: creer que `$_SESSION` se almacena en la cookie del navegador. En realidad:

- `session_start()` Genera un **identificador aleatorio opaco** (p. ej., `a3f9c1...`), que se envía al cliente en una cookie (por defecto, `PHPSESSID`). Eso es todo lo que contiene la cookie.
- Los datos (`$_SESSION['...'] = ...`) se almacenan **en el servidor** (en un archivo o en una base de datos), asociados a este identificador.
- En cada solicitud posterior, el navegador reenvía la cookie; PHP lee de nuevo el identificador, localiza el almacenamiento del servidor correspondiente y vuelve a cargar `$_SESSION`.

> **Analogía:** un ticket de guardarropa. El número del ticket se genera al azar **en el momento de dejar el abrigo**; no tiene ninguna relación con el abrigo en sí. La relación entre el número y el abrigo solo existe en el registro del empleado (el almacenamiento del servidor), nunca en el número.

### El riesgo de robo de sesión

Si un atacante adivinara o robara el identificador de una sesión ya abierta, heredaría su contenido, pero no podría *elegir* el objetivo: el identificador se genera mediante un CSPRNG (generador aleatorio criptográficamente seguro) con una entropía enorme, comparable a una contraseña de varios cientos de bits. `session_set_cookie_params(['httponly' => true])` añade una protección adicional: impide que el JavaScript de la página lea esta cookie, lo que limita los daños en caso de una vulnerabilidad XSS.

### ¿Por qué no derivar simplemente el identificador a partir del hash de un dato conocido?

Un hash simple (`sha256($identifiant_connu)`) es **determinista y no contiene secretos**: cualquiera puede volver a calcularlo. Si existe un número limitado de valores posibles (por ejemplo, unas treinta cuentas), un atacante ni siquiera necesita realizar un ataque de fuerza bruta en un espacio amplio: basta con que aplique el hash a cada valor posible para obtener todos los identificadores válidos. Un hash por sí solo no añade **ninguna entropía** más allá de la que ya está presente en la entrada.

## Tokenes firmados (HMAC): transmitir datos sin que puedan ser falsificados

El token de conexión mencionado anteriormente es un secreto **opaco** (aleatorio, sin significado), cuya validez se comprueba comparándolo con un hash almacenado en la base de datos. Pero a veces se necesita un token que **contenga información en sí mismo** (por ejemplo, un identificador), sin que sea posible falsificarlo sin acceso al servidor. En ese caso, se utiliza un`hash_hmac()`: un hash calculado con una **clave secreta**, conocida únicamente por el servidor.

```php
<?php
function creerToken(string $donnee, string $secret): string
{
    $encode = base64_encode($donnee);                 // codificada, NO cifrada: legible si se descodifica
    $signature = hash_hmac('sha256', $encode, $secret);
    return $encode . '.' . $signature;
}

function verifierToken(string $token, string $secret): ?string
{
    [$encode, $signature] = explode('.', $token, 2);
    $attendu = hash_hmac('sha256', $encode, $secret);

    if (!hash_equals($attendu, $signature)) {
        return null; // firma no válida -> dato rechazado, aunque parezca correcto
    }
    return base64_decode($encode);
}
?>
```

Si alguien que no conozca `$secret` modifica la parte `$encode`, la firma recalculada durante la verificación ya no coincidirá nunca más: la modificación no se impide físicamente, pero sí **se detecta**.

### Identificador de sesión frente a token firmado: dos necesidades diferentes

| | Identificador de sesión | Token firmado (HMAC) |
|---|---|---|
| ¿Contiene información? | No — clave opaca, sin datos | Sí — los datos están codificados en ella |
| ¿Requiere almacenamiento en un servidor? | Sí: los datos se almacenan en un archivo o base de datos asociado a la clave | No: es autosuficiente y se puede verificar recalculando la firma en cualquier momento |
| Caso de uso típico | Usuario ya identificado, sesión activa | Datos que deben transmitirse de forma verificable sin necesidad de consultar una base de datos (enlace de activación, invitado sin cuenta...) |

> **Nota:** `hash_equals()` en lugar de un simple `===` para comparar dos hash: realiza la comparación en tiempo constante, lo que evita que un atacante deduzca progresivamente el valor correcto midiendo el tiempo de respuesta (ataque por temporización).
