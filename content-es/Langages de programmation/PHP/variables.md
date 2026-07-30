---
order: 2
---

# Las variables

## Las variables clásicas
Para declarar una variable en PHP, hay que anteponer un «`$`» al nombre de la variable. PHP es un lenguaje de tipado débil: no es necesario indicar el tipo, ya que se deduce automáticamente en función del valor asignado.

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

    // Matriz (array)
    $frutas = ["pomme", "banane", "cerise"];
    $frutas = array("pomme", "banane", "cerise");

    // Matriz (array)
    $persona = ["nom" => "Dupont", "age" => 25];
    $persona = array("nom" => "Dupont", "age" => 25);

    // Objeto (object)
    $date = new DateTime();
?>
```

> **Nota:** puedes comprobar el tipo de una variable con la función `var_dump($variable);` o `gettype($variable);`.

A continuación, para comparar o manipular tus variables entre sí, tendrás que utilizar varios operadores diferentes:

```php
<?php
    $nb1 = 3;
    $nb2 = 6;
    $result = 0;

    // *** operadores ***
    // adición
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
    // modulo
    $result = $nb1 % $nb2;
    $nb1 %= $nb2;
    // +1
    ++$result;
    $result++;
    // -1
    --$result;
    $result--;


    // *** Operadores lógicos ***
    // Y
    $result = $nb1 && $nb2;
    // O
    $result = $nb1 || $nb2;
    // O exclusivo
    $result = $nb1 xor $nb2;
    // oponer
    $result = !true;

    // *** Operadores de comparación ***
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
    // menor o igual que
    $result = $nb1 <= $nb2;
    // mayor o igual que
    $result = $nb1 >= $nb2;
?>
```

> **Nota:** `==` / `!=` convierten los tipos antes de realizar la comparación, lo que puede dar lugar a resultados inesperados dependiendo de los valores comparados (fuente de errores históricos muy conocidos en PHP). `===` / `!==` exigen el mismo tipo Y el mismo valor; se recomienda utilizarlas siempre, especialmente para comparar cadenas de caracteres.

Si quieres concatenar cadenas de caracteres, tienes dos métodos:

```php
<?php
    $str1 = "Hello";
    $str2 = "world";

    echo "Le thème du jour est : {$str1} {$str2}";
    echo 'Le thème du jour est : ' . $str1 . ' ' . $str2;

    // Ambos resultados dan «El tema del día es: Hello world».
?>
```

## Las variables globales
Las variables que se indican a continuación permiten recuperar los elementos de un formulario en función de su método de envío (`GET` o `POST`):

```php
<?php
    $_GET['nom_du_champ'];
    $_POST['nom_du_champ'];

    // nombre_del_campo = atributo «name» en las etiquetas HTML
?>
```

Cuando se utiliza el método `GET`, los datos del formulario se ven directamente en la URL, en forma de *cadena de consulta* (p. ej.: `?número=Jean&edad=25`).

El método «`POST`» se utiliza sobre todo para enviar datos confidenciales (contraseñas, información personal...), ya que estos no aparecen en la URL y no tienen el límite de tamaño que puede tener una URL.

> **Nota:** `GET` y `POST` no sirven para proteger los datos; estos siguen siendo visibles a través de las herramientas de desarrollo del navegador o mediante la interceptación de la red si el sitio web no utiliza HTTPS. Para datos realmente sensibles (contraseñas...), también hay que tener en cuenta el cifrado y el uso de HTTPS.

## Las variables superglobales

`$_GET` y `$_POST` forman parte de una familia más amplia de tablas asociativas, denominadas **«superglobales»**, que PHP rellena automáticamente desde el inicio de la ejecución —accesibles desde cualquier función o método, sin necesidad de importar nada—:

| Superglobal | Contenido |
|---|---|
| `$_GET` / `$_POST` | Datos enviados mediante un formulario |
| `$_SERVER` | Información sobre la solicitud y el servidor (URL solicitada, método HTTP...) |
| `$_SESSION` | Datos almacenados en el servidor para el usuario actual (requiere `session_start()`) |
| `$_COOKIE` | Cookies enviadas por el navegador |

> **Nota:** a diferencia de una variable clásica (de ámbito local, invisible en una función si no se pasa como parámetro), las superglobales son visibles **en todas partes**, exactamente igual que una constante, pero contienen datos que cambian con cada solicitud, no ajustes fijos.

## Constantes con `define()`

`define('NÚMERO', valor)` Crea una **constante global**, a la que también se puede acceder desde cualquier archivo, función o método:

```php
<?php
define('TVA_TAUX', 0.20);

function prixTTC(float $prixHT): float
{
    return $prixHT * (1 + TVA_TAUX); // Se puede consultar aquí sin necesidad de importar nada.
}
?>
```

> **Nota:** una «`$variable`» clásica, por su parte, sigue siendo local aunque el archivo que la declara se haya cargado con «`require`»; no es visible automáticamente dentro de una función o un método definido en otro archivo. Por eso, los archivos de configuración suelen utilizar `define()` en lugar de simples variables: esto garantiza que la configuración sea legible en cualquier parte del proyecto.

## Acceder a una clave de tabla que no existe

Si se intenta leer una clave de un array que no existe, se genera una **advertencia** («Undefined array key»); no se trata de un fallo del sistema, sino de un mensaje de error que no debe ignorarse:

```php
<?php
$persona = ["nom" => "Dupont"];

echo $persona["age"]; // Advertencia: clave de matriz no definida «age»
?>
```

`isset()` y `empty()` son construcciones especiales del lenguaje que admiten la ausencia total de la clave, sin que se active esta advertencia:

```php
<?php
if (!empty($persona["age"])) {
    echo $persona["age"];
}
// equivalente a: la clave existe Y su valor no es ni vacío, ni nulo, ni falso, ni 0...
?>
```

> **Nota:** `empty($x)` devuelve `true` si la variable/clave no existe en absoluto, O si contiene un valor «vacío» (`''`, `0`, `null`, `false`, matriz vacía...). Esto difiere de `array_key_exists()` (véase el capítulo sobre funciones), que solo comprueba la existencia de la clave, incluso si su valor es `null`.
