---
order: 7
---

# Incluir funciones

Para insertar funciones PHP en código HTML, podemos utilizar la estructura de lenguaje *«include*»:

```php
<?php
    // Incluye un archivo con las funciones que se necesitan.
    include("bienvenue.php");
    include("insectes.php");
    /*
    variantes de déclaration:
    include "bienvenue.php";
    include "insectes.php";
    */
?>

<main>
    <!-- fonction depuis bienvenue.php -->
    <h1><?php echo bienvenueSurLeSiteWeb(); ?></h1>

    <!-- fonction depuis insectes.php -->
    <p><?php echo afficherPartieInsecte(); ?></p>
</main>
```

> **Nota:** consulta «estructuras de lenguajes» si no sabes qué es esto.

## `require` y `require_once`

`include` y `require` hacen lo mismo (insertar el contenido de un archivo PHP en el lugar donde se escribe la instrucción), pero reaccionan de forma diferente si el archivo no existe:

| | Archivo no encontrado |
|---|---|
| `include` | Atención, el script continúa |
| `require` | Error fatal, el script se detiene |

`require_once` Añade una garantía adicional: el archivo solo se carga una **vez**, aunque se llame varias veces a `require_once` sobre él (útil para evitar redefinir dos veces la misma clase o función):

```php
<?php
require_once "config.php"; // a cargo de
require_once "config.php"; // Se ignora sin aviso, ya está cargado
?>
```

## Un archivo puede terminar con un simple «`return`».

Un archivo PHP no tiene por qué contener una instrucción «`class`» o «`function`»: puede limitarse a un «`return [...]`», y el valor se devuelve directamente al lugar desde donde se carga el archivo:

```php
<?php
// parametres.php
return [
    'nom_site' => 'Ma Boutique',
    'devise'   => 'EUR',
];
?>
```

```php
<?php
$parametres = require "parametres.php";
echo $parametres['nom_site']; // «Mi tienda»
?>
```

Este patrón suele utilizarse como un sencillo archivo de configuración o de datos, sin necesidad de una base de datos.

## `__DIR__`

`__DIR__` es una constante que representa el directorio **del archivo en el que aparece**, no un «directorio del proyecto» global. Por lo tanto, dos archivos situados en carpetas diferentes no tienen el mismo `__DIR__`:

```php
<?php
// en /app/pages/accueil.php
require __DIR__ . '/../config.php'; // siempre correcto, independientemente del lugar desde el que se ejecute el script
?>
```

> **Nota:** crear las rutas con `__DIR__ . '/ruta/relatif'` en lugar de una ruta fija evita errores según el contexto de ejecución (servidor integrado, Apache, línea de comandos...), que no tienen necesariamente la misma «carpeta actual».
