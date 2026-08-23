---
order: 7
---

# Incluir funciones

Para insertar funciones PHP en código [HTML](/?c=langages-de-balisage&s=html&p=html), podemos usar la estructura del lenguaje *include*:

```php
<?php
    // incluye un archivo que contiene las funciones que necesitamos
    include("bienvenida.php");
    include("insectos.php");
    /*
    variantes de declaración:
    include "bienvenida.php";
    include "insectos.php";
    */
?>

<main>
    <!-- función desde bienvenida.php -->
    <h1><?php echo bienvenidaAlSitioWeb(); ?></h1>

    <!-- función desde insectos.php -->
    <p><?php echo mostrarParteInsecto(); ?></p>
</main>
```

> **Nota:** `include` es una [estructura del lenguaje](/?c=langages-de-programmation&s=php&p=structures-de-langage), no una función clásica.

## `require` y `require_once`

`include` y `require` hacen lo mismo (insertar el contenido de un archivo PHP en el lugar donde se escribe la instrucción), pero reaccionan de forma diferente si el archivo no existe:

| | Archivo no encontrado |
|---|---|
| `include` | Warning, el script continúa |
| `require` | Error fatal, el script se detiene |

`require_once` añade una garantía adicional: el archivo solo se carga **una vez**, aunque se llame a `require_once` varias veces sobre él (útil para evitar redefinir dos veces la misma clase/función):

```php
<?php
require_once "config.php";  // cargado
require_once "config.php";  // ignorado silenciosamente, ya cargado
?>
```

## Un archivo puede terminar con un simple `return`

Un archivo PHP no necesita contener una `class` o una `function`: puede limitarse a un `return [...]`, y el valor sube directamente hasta el lugar donde se carga el archivo:

```php
<?php
// parametros.php
return [
    'nombre_sitio' => 'Mi Tienda',
    'moneda'       => 'EUR',
];
?>
```

```php
<?php
$parametros = require "parametros.php";
echo $parametros['nombre_sitio']; // "Mi Tienda"
?>
```

Este patrón suele servir como archivo de configuración/datos simple, sin necesidad de una base de datos.

## `__DIR__`

`__DIR__` es una constante que representa el directorio **del archivo donde aparece**, no un "directorio del proyecto" global. Dos archivos en carpetas diferentes no tienen por tanto el mismo `__DIR__`:

```php
<?php
// en /app/pages/inicio.php
require __DIR__ . '/../config.php'; // siempre correcto, sea cual sea el lugar desde donde se lanza el script
?>
```

> **Nota:** construir las rutas con `__DIR__ . '/ruta/relativa'` en lugar de una ruta fija evita errores según el contexto de ejecución (servidor integrado, Apache, línea de comandos...), que no tienen necesariamente la misma "carpeta actual".

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `include`/`require` insertan el contenido de un archivo PHP en el lugar donde se escribe la instrucción. `require` detiene el script si el archivo no se encuentra, `include` se conforma con un warning. `require_once` solo carga el archivo una vez. |
| **Herramientas utilizables** | `require_once`, `__DIR__`, un archivo que termina en `return [...]` como mini-config. |
| **Trampas a evitar** | Usar `include` para un archivo indispensable para el funcionamiento (una clase central): un archivo ausente continúa silenciosamente con solo un warning. |
| **Buenas prácticas** | Usar `require_once` para los archivos de clases/funciones, `__DIR__` para construir rutas independientes del contexto de ejecución. |
