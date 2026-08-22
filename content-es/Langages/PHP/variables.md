---
order: 2
---

# Las variables

Como recordatorio, [una variable es una caja etiquetada que contiene un valor](/?c=bases-de-l-informatique&p=la-variable), lo que sigue cubre únicamente lo que es específico de PHP.

## Las variables clásicas
Para declarar una variable en PHP, hay que anteponer un `$` al nombre de la variable. PHP tiene tipado débil: no indicas el tipo, se deduce automáticamente según el valor asignado.

```php
<?php
    // Entero (int)
    $nb = 2;

    // Número de coma flotante (float)
    $pi = 3.14;

    // Cadena de caracteres (string)
    $str = "Hello world";
    $str = 'Hello world';

    // Booleano (bool)
    $bool = false;

    // Valor nulo (null)
    $null = null;

    // Array indexado (array)
    $frutas = ["manzana", "plátano", "cereza"];
    $frutas = array("manzana", "plátano", "cereza");

    // Array asociativo (array)
    $persona = ["nombre" => "Dupont", "edad" => 25];
    $persona = array("nombre" => "Dupont", "edad" => 25);

    // Objeto (object)
    $fecha = new DateTime();
?>
```

> **Nota:** puedes comprobar el tipo de una variable con la función `var_dump($variable);` o `gettype($variable);`.

A continuación, para comparar o manipular tus variables entre sí, necesitarás varios operadores diferentes:

```php
<?php
    $nb1 = 3;
    $nb2 = 6;
    $result = 0;

    // *** operadores ***
    // suma
    $result = $nb1 + $nb2;
    $nb1 += $nb2;
    // resta
    $result = $nb1 - $nb2;
    $nb1 -= $nb2;
    // multiplicación
    $result = $nb1 * $nb2;
    $nb1 *= $nb2;
    // potencia
    $result = $nb1 ** $nb2;
    $nb1 **= $nb2;
    // división
    $result = $nb1 / $nb2;
    $nb1 /= $nb2;
    // módulo
    $result = $nb1 % $nb2;
    $nb1 %= $nb2;
    // +1
    ++$result;
    $result++;
    // -1
    --$result;
    $result--;


    // *** operadores lógicos ***
    // Y
    $result = $nb1 && $nb2;
    // O
    $result = $nb1 || $nb2;
    // O exclusivo
    $result = $nb1 xor $nb2;
    // negar
    $result = !true;

    // *** operadores de comparación ***
    // iguales
    $result = $nb1 == $nb2;
    // idénticos
    $result = $nb1 === $nb2;
    // diferente
    $result = $nb1 != $nb2;
    $result = $nb1 <> $nb2;
    // no idénticos
    $result = $nb1 !== $nb2;
    // inferior
    $result = $nb1 < $nb2;
    // superior
    $result = $nb1 > $nb2;
    // inferior o igual
    $result = $nb1 <= $nb2;
    // superior o igual
    $result = $nb1 >= $nb2;
?>
```

> **Nota:** `==`/`!=` convierten los tipos antes de comparar, lo que puede dar resultados sorprendentes según los valores comparados (fuente de errores históricos muy conocidos en PHP). `===`/`!==` exigen el mismo tipo Y el mismo valor: hay que priorizarlos sistemáticamente, sobre todo para comparar cadenas de caracteres.

Si quieres concatenar cadenas de caracteres, tienes 2 métodos:

```php
<?php
    $str1 = "Hello";
    $str2 = "world";

    echo "El tema del día es: {$str1} {$str2}";
    echo 'El tema del día es: ' . $str1 . ' ' . $str2;

    // ambos resultados dan "El tema del día es: Hello world".
?>
```

## Las variables globales
Las siguientes variables permiten recuperar los elementos de un formulario según su método de envío (`GET` o `POST`):

```php
<?php
    $_GET['nombre_del_campo'];
    $_POST['nombre_del_campo'];

    // nombre_del_campo = atributo 'name' en las etiquetas HTML
?>
```

Cuando se usa el método `GET`, los datos del formulario son visibles directamente en la URL, en forma de *query string* (ej: `?nombre=Juan&edad=25`).

El método `POST` se usa sobre todo para enviar datos sensibles (contraseñas, información personal...), ya que no se muestran en la URL y no tienen el límite de tamaño que puede tener una URL.

> **Nota:** `GET` y `POST` no sirven para proteger datos: siguen siendo visibles a través de las herramientas de desarrollo del navegador o por interceptación de red si el sitio no usa HTTPS. Para datos realmente sensibles (contraseñas...), también hay que pensar en el cifrado y en HTTPS.

## Las superglobales

`$_GET` y `$_POST` forman parte de una familia más amplia de arrays asociativos, llamados **superglobales**, que PHP rellena automáticamente desde el inicio de la ejecución, accesibles desde cualquier función o método, sin necesidad de importar nada:

| Superglobal | Contenido |
|---|---|
| `$_GET` / `$_POST` | Datos enviados por un formulario |
| `$_SERVER` | Información sobre la solicitud y el servidor (URL solicitada, método HTTP...) |
| `$_SESSION` | Datos almacenados del lado del servidor para el usuario actual (requiere `session_start()`) |
| `$_COOKIE` | Cookies enviadas por el navegador |

> **Nota:** a diferencia de una variable clásica (ámbito local, invisible en una función sin pasarla como parámetro), las superglobales son visibles **en todas partes**, exactamente como una constante, pero contienen datos que cambian en cada solicitud, no ajustes fijos.

## Constantes con `define()`

`define('NOMBRE', valor)` crea una **constante global**, también accesible desde cualquier archivo, función o método:

```php
<?php
define('TASA_IVA', 0.20);

function precioConIva(float $precioSinIva): float
{
    return $precioSinIva * (1 + TASA_IVA); // visible aquí sin necesidad de importar nada
}
?>
```

> **Nota:** una `$variable` clásica, en cambio, sigue siendo local aunque el archivo que la declara se haya cargado con `require`: no es automáticamente visible dentro de una función o un método definido en otro archivo. Por eso los archivos de configuración suelen usar `define()` en lugar de simples variables: eso garantiza que el ajuste siga siendo legible en cualquier parte del proyecto.

## Acceder a una clave de array que no existe

Leer una clave de array totalmente ausente dispara un **warning** ("Undefined array key"), no un crash, pero sí una señal de error que no hay que ignorar:

```php
<?php
$persona = ["nombre" => "Dupont"];

echo $persona["edad"]; // Warning: Undefined array key "edad"
?>
```

`isset()` y `empty()` son construcciones especiales del lenguaje que toleran la ausencia total de la clave, sin disparar este warning:

```php
<?php
if (!empty($persona["edad"])) {
    echo $persona["edad"];
}
// equivale a: la clave existe Y su valor no es ni vacío, ni null, ni false, ni 0...
?>
```

> **Nota:** `empty($x)` devuelve `true` si la variable/clave no existe en absoluto, O si contiene un valor "vacío" (`''`, `0`, `null`, `false`, array vacío...). Es distinto de `array_key_exists()` (ver [Las funciones y métodos más útiles](/?c=langages-de-programmation&s=php&p=methodes)), que solo comprueba la existencia de la clave, incluso si su valor es `null`.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una variable PHP se declara con `$`, sin tipo explícito (tipado débil). Las superglobales (`$_GET`, `$_POST`, `$_SERVER`...) son visibles en todas partes, prerellenadas por PHP. |
| **Herramientas utilizables** | `var_dump`/`gettype` para inspeccionar un tipo, `isset()`/`empty()` para probar una clave sin warning, `define()` para una constante global. |
| **Trampas a evitar** | Comparar con `==` en vez de `===` (conversiones de tipo sorprendentes); leer una clave de array ausente sin `isset()`/`empty()` (dispara un warning). |
| **Buenas prácticas** | Usar `===`/`!==` por defecto; comprobar `isset()`/`empty()` antes de leer una clave que podría no existir. |
