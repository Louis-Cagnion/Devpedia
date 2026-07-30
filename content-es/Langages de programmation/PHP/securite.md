---
order: 13
---

# Protege tus datos

Cuando se recogen datos del usuario (formularios, URL, cookies...), siempre hay que considerarlos **poco fiables**, aunque parezcan correctos. Un visitante malintencionado puede enviar cualquier cosa: código HTML, JavaScript o consultas SQL malformadas. PHP ofrece varias funciones para filtrar, validar y escapar estos datos.

## `filter_input()`

Permite recuperar **y** validar/filtrar al mismo tiempo datos procedentes de `$_GET`, `$_POST`, etc.:

```php
<?php
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    $edad = filter_input(INPUT_GET, 'age', FILTER_VALIDATE_INT);

    if ($email === false) {
        echo "Email invalide.";
    }
?>
```

Si los datos no se ajustan al filtro solicitado, `filter_input()` devuelve `false`. Si el campo no existe, devuelve `null`.

Algunos filtros habituales:

```php
<?php
    FILTER_VALIDATE_EMAIL;    // comprueba el formato de un correo electrónico
    FILTER_VALIDATE_INT;      // Comprueba si un número es entero
    FILTER_VALIDATE_FLOAT;    // Comprueba un número decimal
    FILTER_VALIDATE_URL;      // comprueba una URL
    FILTER_SANITIZE_STRING;   // Limpia una cadena (obsoleto desde PHP 8.1)
?>
```

## `htmlspecialchars()` — cómo protegerse de las vulnerabilidades XSS

Si muestras datos de un usuario en la página (por ejemplo, un comentario o un nombre de usuario), un visitante podría inyectar código HTML o JavaScript malicioso. Se trata de una vulnerabilidad denominada **XSS** (*Cross-Site Scripting*).

```php
<?php
    $commentaire = "<script>alert('piraté');</script>";

    echo htmlspecialchars($commentaire);
    // muestra el texto tal cual, sin ejecutar el script
?>
```

`htmlspecialchars()` Convierte los caracteres especiales (`<`, `>`, `"`, `'`) en entidades HTML, lo que evita que el navegador interprete el contenido como código.

> **Nota:** muestra siempre los datos de usuario con «`htmlspecialchars()`», salvo que tengas una razón concreta para no hacerlo.

## Cómo protegerse de las inyecciones SQL

Si se introduce directamente un dato de usuario en una consulta SQL, un visitante puede manipular la consulta para acceder a datos que no debería ver, o incluso eliminarlos. Esto se conoce como **inyección SQL**.

```php
<?php
    // ❌ Peligroso: los datos se insertan directamente en la consulta
    $consulta = "SELECT * FROM users WHERE email = '" . $_POST['email'] . "'";
?>
```

La solución consiste en utilizar **consultas preparadas**, a través de PDO (*PHP Data Objects*, la herramienta integrada en PHP para comunicarse con una base de datos), que separan la consulta SQL de los datos:

```php
<?php
    // Conexión a la base de datos (tipo, dirección, nombre de la base de datos, nombre de usuario, contraseña)
    $pdo = new PDO('mysql:host=localhost;dbname=mabase', 'utilisateur', 'motdepasse');

    // Preparación de la consulta: «:email» es un marcador de posición, aún no es un valor real
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");

    // Ejecución de la consulta con el valor real enviado por el usuario
    $stmt->execute(['email' => $_POST['email']]);

    // Obtención del resultado en forma de tabla PHP
    $user = $stmt->fetch();
?>
```

Con este método, los datos enviados por el usuario a través de `$_POST` nunca se interpretan como código SQL, independientemente de su contenido. Siempre se considerarán como un valor de la consulta.

## `password_hash()` y `password_verify()` — guardar contraseñas

Una contraseña **nunca** debe almacenarse sin cifrar en una base de datos. PHP proporciona funciones nativas para cifrarla de forma segura:

```php
<?php
    // Se aplica un algoritmo hash a la contraseña
    $user['password'] = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // Se almacena el hash en la base de datos (no la contraseña en claro).
    $stmt = $pdo->prepare("INSERT INTO users (email, password) VALUES (:email, :password)");
    $stmt->execute([
        'email' => $_POST['email'],
        'password' => $user['password'],
    ]);

    // Se recupera el hash almacenado en la base de datos a partir de la dirección de correo electrónico introducida.
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute(['email' => $_POST['email']]);
    $user = $stmt->fetch();

    // Se compara la contraseña introducida con el hash obtenido de la base de datos
    if (password_verify($_POST['password'], $user['password'])) {
        echo "Connexion réussie.";
    } else {
        echo "Mot de passe incorrect.";
    }
?>
```

`password_hash()` Genera un hash diferente en cada llamada (incluso con la misma contraseña), gracias a una «sal» (*salt*) integrada automáticamente. Por lo tanto, es imposible recuperar la contraseña original a partir del hash.

Esta clave no se pierde: se incluye directamente en el hash generado, por ejemplo:

```
2y $10 N9qo8uLOickgx2ZMRZoMye IjZAgcfl7p92ldGxad68LJZdL17lhWy
```

- `$2y$` → el algoritmo utilizado (bcrypt)
- `$10$` → el coste (la dificultad del cálculo)
- Los 22 caracteres siguientes → la clave utilizada para este hash concreto
- El resto → el resultado del hash, calculado con esta sal

Por eso `password_verify($_POST['password'], $user['password'])` funciona a pesar de todo: lee la clave ya presente en `$user['password']`, aplica un hash a `$_POST['password']` con **esa misma clave** y, a continuación, compara el resultado obtenido con el resto de `$user['password']` utilizando el mismo algoritmo y el mismo coste. Por este motivo, siempre se utiliza `password_verify()` para la comparación, y nunca un nuevo `password_hash()` comparado directamente con el hash almacenado —este último siempre daría un resultado diferente, incluso con la contraseña correcta—.

## Resumen

| Riesgo | Función / método |
|---|---|
| Datos con formato incorrecto (correo electrónico, número...) | `filter_input()` |
| Inyección de HTML/JS (XSS) | `htmlspecialchars()` |
| Inyección SQL | Consultas preparadas (PDO) |
| Contraseña sin cifrar | `password_hash()` / `password_verify()` |

> **Nota:** ninguna de estas medidas de seguridad sustituye al protocolo HTTPS, que cifra los datos intercambiados entre el navegador y el servidor.
