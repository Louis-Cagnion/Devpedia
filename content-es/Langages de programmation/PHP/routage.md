---
order: 12
---

# Enrutamiento sin framework (front controller)

Sin un framework (Laravel, Symfony...), PHP no ofrece ningún enrutador integrado comparable a Express (`app.get('/ruta', callback)`). Un proyecto de «PHP puro» debe organizar por sí mismo la correspondencia entre una URL solicitada y el código que se debe ejecutar.

## El controlador frontal y la tabla de distribución

Un patrón habitual consiste en hacer pasar **todas** las solicitudes por un único punto de entrada (a menudo `índice.php`), que consulta una tabla asociativa «ruta → archivo»:

```php
<?php
$routes = [
    'accueil' => '/pages/accueil.php',
    'contact' => '/pages/contact.php',
];

$uri  = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$file = $routes[$uri] ?? null;

if ($file && file_exists(__DIR__ . $file)) {
    require __DIR__ . $file; // El «handler» es un archivo ejecutable, no una función que se invoca.
} else {
    http_response_code(404);
    echo "Page introuvable";
}
?>
```

Diferencia clave con un enrutador JS (Express): cada ruta apunta a una **ruta de archivo**, no a una función. No hay que llamar a ninguna función de devolución de llamada: el propio archivo genera la respuesta HTTP (`echo`, `header()`...) leyendo directamente las superglobales.

- `$_SERVER['REQUEST_URI']` Contiene la ruta **y** la cadena de consulta pegadas (`/contact?ref=pub`). `parse_url(..., PHP_URL_PATH)` extrae únicamente la ruta, descartando la cadena de consulta.
- `trim(..., '/')` Elimina los caracteres «`/`» al principio y al final, para que «`'contact'`» coincida con la clave de la matriz «`$routes`» (sin la barra inicial).

## El modelo «sistema de archivos = URL»

En un servidor PHP clásico (sin configuración especial), **se puede acceder a cualquier archivo que se encuentre físicamente en el directorio raíz web a través de su ruta URL**: si se ejecuta un `.php`, se sirve un archivo estático tal cual. Esto es lo contrario de Express/Node, donde una ruta solo existe si se declara explícitamente: en el PHP «a la antigua», **todo es accesible por defecto, salvo lo que se bloquee explícitamente**.

Consecuencia práctica: un directorio que contenga clases o datos sensibles (identificadores de conexión a una base de datos, claves de API...) debe **bloquearse explícitamente**, aunque ninguna ruta lo mencione en el código de la aplicación; de lo contrario, nada impide que un visitante escriba directamente la ruta en el navegador.

## El contrato del servidor de desarrollo integrado (`php -S`)

`php -S host:port routeur.php` No tiene las capacidades de un servidor web real (no hay archivo «`.htaccess`», ni configuración de Apache/nginx). El archivo pasado como argumento se ejecuta en **cada** solicitud y controla el comportamiento a través de su valor de «`return`»:

- `return false;` → «No he hecho nada, gestiona tú mismo esta solicitud como de costumbre» (el servidor servirá entonces el archivo físico solicitado si existe; de lo contrario, devolverá un error 404).
- `return true;` → «Ya me he encargado yo mismo de esta solicitud (respuesta ya generada), no hagas nada más».

```php
<?php
// router.php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1) Bloques explícitos primero
$dossiersBloques = ['/data/', '/src/'];
foreach ($dossiersBloques as $carpeta) {
    if (str_starts_with($uri, $carpeta)) {
        http_response_code(403);
        echo 'Accès interdit.';
        return true; // Ya se ha respondido, no hay que hacer nada más.
    }
}

// 2) archivo estático existente -> dejar que el servidor lo sirva por sí mismo
if (is_file(__DIR__ . $uri)) {
    return false;
}

// 3) en caso contrario, distribución de aplicaciones
require __DIR__ . '/index.php';
return true;
?>
```

> **Nota:** el orden de los bloques es importante. Si la comprobación «`is_file()`» se colocara **antes** **de** los bloqueos, una solicitud sobre un archivo sensible pero físicamente presente (p. ej., `/data/config.php`) superaría esta comprobación con «`true`» y devolvería «`false`», lo que permitiría que el servidor integrado **ejecutara** ese archivo directamente, sin pasar por las protecciones.

> **Nota (seguridad):** `$uri` proviene directamente de la consulta (`$_SERVER['REQUEST_URI']`); sin normalización, un valor que contenga subdirectorios (`/../../etc/passwd`) podría hacer que `is_file(__DIR__ . $uri)` se escapara a la raíz web. En la práctica, hay que resolver la ruta real (p. ej., `realpath()`) y comprobar que se mantiene dentro de `__DIR__` antes de servirla, en lugar de confiar en `$uri` tal cual.

## Redirigir y detener la ejecución

`header('Location: ...')` solo añade información a la respuesta HTTP; no interrumpe el script. Si no se incluye un «`exit`» justo después, el código siguiente sigue ejecutándose (y generando contenido) incluso tras una redirección:

```php
<?php
if (!$utilisateurConnecte) {
    header('Location: /connexion');
    exit; // Imprescindible: sin esto, el resto del script se ejecuta de todos modos.
}
?>
```
