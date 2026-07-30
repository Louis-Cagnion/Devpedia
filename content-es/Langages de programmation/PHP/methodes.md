---
order: 6
---

# Las funciones y métodos más útiles

## ¿Qué es una función o un método?

Una **función** es un bloque de código reutilizable, que tiene un nombre y que puede recibir información (*parámetros*) para realizar una acción o devolver un resultado (un *valor de retorno*).

```php
<?php
    // función clásica
    function addition($a, $b) {
        return $a + $b;
    }

    echo addition(2, 3); // página 5

    // función flechada
    $double = fn($n) => $n * 2;

    echo $double(5); // página 10
?>
```
> **Nota:** a diferencia de JavaScript, donde una función con flecha se puede escribir con llaves y un «`return`» (`(n) => { return n * 2; }`), PHP solo permite la forma corta con una única expresión, sin llaves ni «`return`» (`fn($n) => $n * 2;`).

Un **método** es exactamente lo mismo que una función, con una sola diferencia: se define **dentro de una clase** y se utiliza sobre un objeto (véanse los capítulos sobre clases y programación orientada a objetos).

```php
<?php
    class Calculatrice {
        public function addition($a, $b) {
            return $a + $b;
        }
    }

    $calc = new Calculatrice();
    echo $calc->addition(2, 3); // página 5
?>
```

En resumen: **función** = autónoma, se invoca directamente por su nombre. **Método** = pertenece a un objeto, se invoca mediante `->` (o `::` en el caso de un método estático).

## Especificar los tipos de los parámetros y el valor devuelto de una función

PHP es un lenguaje de tipado dinámico por defecto, pero admite anotaciones de tipo en los parámetros y en el valor de retorno. A diferencia de un lenguaje compilado, estos tipos no se comprueban antes de la ejecución, sino que se comprueban **en el momento de la ejecución**, en cada llamada.

```php
<?php
function calculerRemise(float $precio, int $pourcentage): float
{
    return $precio - ($precio * $pourcentage / 100);
}

calculerRemise(100, 10);      // OK -> 90,0
calculerRemise("cent", 10);   // TypeError: «cent» no es un número flotante
?>
```

## Tipos nulos (`?Type`)

Una función declarada como «`: array`» (sin «`?`») **no** permite «`null`» como valor de retorno; intentarlo provoca un «`TypeError`» durante la ejecución. Para permitir explícitamente «`null`» además del tipo declarado, se antepone el tipo de un «`?`»:

```php
<?php
function trouverUtilisateur(int $id): ?array
{
    if ($id <= 0) {
        return null; // OK: ?array permite explícitamente el valor null
    }
    return ['id' => $id, 'nom' => 'Dupont'];
}
?>
```

> **Nota:** «`?array`» es una declaración de contrato, no una simple convención de escritura; es el equivalente en PHP a «`std::optional<T>`» en C++ moderno o a «`Optional[T]`» en Python: la función puede devolver este tipo concreto, O «`null`», y nada más.

## Eliminar una advertencia esperada con «`@`»

Muchas funciones nativas de PHP devuelven «`false`» en caso de fallo, en lugar de lanzar una excepción (un estilo similar al de C, donde «`fopen()`» devuelve un puntero nulo y establece «`errno`»). Cuando este error ya está previsto y se gestiona más adelante en el código, el operador «`@`» situado delante de la llamada suprime la advertencia que PHP emitiría de otro modo:

```php
<?php
$mtime = @filemtime('fichier_qui_peut_ne_pas_exister.txt');
$version = $mtime ? "v{$mtime}" : 'v-inconnue';
?>
```

> **Nota:** «`@`» oculta el aviso, pero no modifica el comportamiento de la propia función (`filemtime()` sigue devolviendo «`false`» si el archivo no existe). Debe utilizarse únicamente en los casos en los que el error se prevea realmente y se compruebe inmediatamente después; utilizarlo en todas partes también ocultaría errores reales.

PHP ofrece una gran cantidad de funciones nativas listas para usar, clasificadas a continuación por categorías.

## Funciones sobre cadenas de caracteres

```php
<?php
    strlen("Hello");           // 5 -> longitud de la cadena
    strtoupper("Hello");       // «HELLO» -> lo pone en mayúsculas
    strtolower("Hello");       // «hello» -> lo convierte a minúsculas
    str_replace("a", "o", "Hello"); // «Hello» -> sustituye una subcadena
    trim("  Hello  ");         // «Hello» -> elimina los espacios al principio y al final
    substr("Hello", 1, 3);     // «ell» -> extrae una parte de una cadena
    explode(",", "a,b,c");     // ["a", "b", "c"] -> divide una cadena en una matriz
    implode(",", ["a", "b"]);  // «a,b» -> ensambla una matriz en cadena
    str_contains("Hello", "ell"); // true -> comprueba si una cadena contiene otra
?>
```

## Funciones sobre matrices (`array`)

```php
<?php
    count([1, 2, 3]);                  // 3 -> número de elementos
    $tab[] = "valeur";                  // Añade un elemento al final (preferible a `array_push()` para un solo elemento).
    array_pop($tab);                   // extrae y devuelve el último elemento
    array_merge($tab1, $tab2);         // combina dos tablas
    in_array("pomme", $frutas);        // true/false -> comprueba si hay un valor
    array_search("pomme", $frutas);    // devuelve la clave o el índice encontrado
    sort($tab);                        // ordena un array (valores)
    array_map(fn($n) => $n * 2, $tab); // Aplica una función a cada elemento
    array_filter($tab, fn($n) => $n > 0); // filtra los elementos según una condición
?>
```
## Funciones sobre matrices asociativas

```php
<?php
    $persona = ["nom" => "Dupont", "age" => 25];

    array_keys($persona);             // ["nombre", "edad"] -> devuelve todas las claves
    array_values($persona);           // ["Dupont", 25] -> devuelve todos los valores
    array_key_exists("nom", $persona); // true/false -> comprueba si existe una clave
    unset($persona["age"]);            // elimina una clave (y su valor) de la matriz
    ksort($persona);                   // ordena el array según las claves
    asort($persona);                   // ordena el array según los valores (conservando las claves)
    array_combine(["a", "b"], [1, 2]);  // ["a" => 1, "b" => 2] -> crea un array asociativo a partir de dos arrays
    array_flip($persona);              // inversión de claves y valores
?>
```

> **Nota:** `array_key_exists()` comprueba si existe una clave, incluso si su valor es `null`. `isset($persona["número"])` devuelve `false` en este caso, ya que comprueba además que el valor no sea `null`.
Ej.:
```php
<?php
    $persona = ["nom" => "Dupont", "age" => null];

    array_key_exists("age", $persona); // true
    isset($persona["age"]);             // false
?>
```

## Funciones matemáticas

```php
<?php
    abs(-5);        // 5 -> valor absoluto
    round(3.456, 2); // 3,46 -> redondea
    rand(1, 10);     // Genera un número aleatorio entre 1 y 10
    max(1, 5, 3);    // 5 -> valor máximo
    min(1, 5, 3);    // 1 -> valor mínimo
?>
```

## Funciones de verificación de tipos

```php
<?php
    is_string($var);  // verdadero/falso
    is_int($var);      // verdadero/falso
    is_array($var);    // verdadero/falso
    is_null($var);     // verdadero/falso
    empty($var);       // true si está vacío, es nulo o no está definido
    isset($var);        // true si la variable existe y no es nula
?>
```

> **Nota:** encontrarás la lista completa de funciones nativas de PHP en la documentación oficial: [php.net/manual/fr/funcref.php](https://www.php.net/manual/fr/funcref.php). Para añadir un **solo** elemento, también es preferible utilizar «`$tab[] = "valor";`» en lugar de «`array_push($tab, "valor")`»: el resultado es el mismo, pero sin el coste de una llamada a una función; «`array_push()`» solo resulta realmente útil para añadir varios elementos en una sola llamada (`array_push($tab, "a", "b", "c")`).
