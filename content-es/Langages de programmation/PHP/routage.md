---
order: 13
---

# Enrutamiento sin framework (front controller)

Sin framework ([Laravel](https://laravel.com), [Symfony](https://symfony.com)...), PHP no ofrece ningún enrutador integrado comparable a [Express](https://expressjs.com) (`app.get('/ruta', callback)`). Un proyecto "PHP puro" debe organizar por sí mismo la correspondencia entre una URL solicitada y el código a ejecutar.

## El front controller y la tabla de dispatch

Un patrón habitual consiste en hacer pasar **todas** las peticiones por un único punto de entrada (a menudo `index.php`), que consulta un array asociativo "ruta → archivo":

```php
<?php
$routes = [
    'inicio'  => '/pages/inicio.php',
    'contacto' => '/pages/contacto.php',
];

$uri  = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$file = $routes[$uri] ?? null;

if ($file && file_exists(__DIR__ . $file)) {
    require __DIR__ . $file; // el "handler" es un archivo ejecutado, no una función invocada
} else {
    http_response_code(404);
    echo "Página no encontrada";
}
?>
```

Diferencia clave con un enrutador JS (Express): cada ruta apunta a una **ruta de archivo**, no a una función. No hay callback que llamar: el archivo mismo produce la respuesta HTTP (`echo`, `header()`...) leyendo directamente las superglobales.

- `$_SERVER['REQUEST_URI']` contiene la ruta **y** la query string pegadas (`/contacto?ref=pub`). `parse_url(..., PHP_URL_PATH)` extrae únicamente la ruta, descartando la query string.
- `trim(..., '/')` retira las `/` de inicio/final, para que `'contacto'` corresponda a la clave del array `$routes` (sin barra inicial).

## El modelo "filesystem = URLs"

En un servidor PHP clásico (sin configuración particular), **todo archivo físicamente presente bajo la raíz web es accesible vía su ruta en URL**: un `.php` se ejecuta ahí, un archivo estático se sirve tal cual. Es lo contrario de Express/[Node](https://nodejs.org), donde una ruta solo existe si se declara explícitamente: en PHP "a la antigua", **todo es accesible por defecto, salvo lo que se bloquee explícitamente**.

Consecuencia concreta: una carpeta que contenga clases o datos sensibles (credenciales de conexión a una base de datos, claves de API...) debe **bloquearse explícitamente**, aunque ninguna ruta la referencie nunca en el código de la aplicación: si no, nada impide que un visitante escriba directamente su ruta en el navegador.

## El contrato del servidor de desarrollo integrado (`php -S`)

`php -S host:puerto enrutador.php` no tiene las capacidades de un servidor web real (sin archivo `.htaccess`, sin configuración Apache/nginx). El archivo pasado como argumento se ejecuta en **cada** petición, y controla el comportamiento vía su valor de `return`:

- `return false;` → "no he hecho nada, sirve tú mismo esta petición normalmente" (el servidor sirve entonces el archivo físico solicitado si existe, si no 404).
- `return true;` → "ya he gestionado yo mismo esta petición (respuesta ya generada), no hagas nada más".

```php
<?php
// enrutador.php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1) bloqueos explícitos primero
$carpetasBloqueadas = ['/data/', '/src/'];
foreach ($carpetasBloqueadas as $carpeta) {
    if (str_starts_with($uri, $carpeta)) {
        http_response_code(403);
        echo 'Acceso denegado.';
        return true; // ya respondido, no hacer nada más
    }
}

// 2) archivo estático existente -> dejar que el servidor lo sirva él mismo
if (is_file(__DIR__ . $uri)) {
    return false;
}

// 3) si no, dispatch de la aplicación
require __DIR__ . '/index.php';
return true;
?>
```

> **Nota:** el orden de los bloques importa. Si la prueba `is_file()` se colocara **antes** de los bloqueos, una petición sobre un archivo sensible pero físicamente presente (ej. `/data/config.php`) pasaría esta prueba con `true` y devolvería `false`, dejando que el servidor integrado **ejecute** ese archivo directamente, sin pasar por las protecciones.

> **Nota (seguridad):** `$uri` viene directamente de la petición (`$_SERVER['REQUEST_URI']`): sin normalización, un valor que contenga subidas de directorio (`/../../etc/passwd`) podría hacer que `is_file(__DIR__ . $uri)` escape de la raíz web. En la práctica, hay que resolver la ruta real (ej. `realpath()`) y comprobar que permanece dentro de `__DIR__` antes de servirla, en lugar de confiar en `$uri` tal cual.

## Redirigir y detener la ejecución

`header('Location: ...')` solo añade información a la respuesta HTTP: no interrumpe el script. Sin `exit` justo después, el código siguiente sigue ejecutándose (y produciendo contenido) incluso tras una redirección:

```php
<?php
if (!$usuarioConectado) {
    header('Location: /conexion');
    exit; // indispensable: sin esto, el resto del script se ejecuta de todos modos
}
?>
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Sin framework, un front controller único recibe todas las peticiones y hace dispatch vía una tabla "ruta → archivo". Por defecto, todo archivo físico bajo la raíz web es accesible: lo contrario de un enrutador JS donde nada existe sin declaración explícita. |
| **Herramientas utilizables** | `parse_url()`, `$_SERVER['REQUEST_URI']`, `php -S` para un servidor de desarrollo. |
| **Trampas a evitar** | Comprobar la existencia de un archivo antes de verificar las carpetas bloqueadas (orden invertido = protección eludida); redirigir sin `exit` justo después. |
| **Buenas prácticas** | Bloquear explícitamente toda carpeta sensible antes de servir un archivo físico; hacer siempre `exit` inmediatamente después de un `header('Location: ...')`. |
