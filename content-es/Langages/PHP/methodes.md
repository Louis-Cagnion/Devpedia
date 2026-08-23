---
order: 6
---

# Las funciones y métodos más útiles

## ¿Qué es una función / método?

Una **función** es un bloque de código reutilizable, que tiene un nombre y que puede recibir información (unos *parámetros*) para realizar una acción o devolver un resultado (un *valor de retorno*).

```php
<?php
    // función clásica
    function suma($a, $b) {
        return $a + $b;
    }

    echo suma(2, 3); // muestra 5

    // función flecha
    $doble = fn($n) => $n * 2;

    echo $doble(5); // muestra 10
?>
```
> **Nota:** a diferencia de [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), donde una función flecha puede escribirse con llaves y un `return` (`(n) => { return n * 2; }`), PHP solo permite la forma corta con una única expresión, sin llaves ni `return` (`fn($n) => $n * 2;`).

Un **método** es exactamente lo mismo que una función, con una sola diferencia: se define **dentro de una clase**, y se usa sobre un objeto (ver [La programación orientada a objetos](/?c=langages-de-programmation&s=php&p=poo)).

```php
<?php
    class Calculadora {
        public function suma($a, $b) {
            return $a + $b;
        }
    }

    $calc = new Calculadora();
    echo $calc->suma(2, 3); // muestra 5
?>
```

En resumen: **función** = autónoma, se invoca directamente por su nombre. **Método** = pertenece a un objeto, se invoca vía `->` (o `::` para un método estático).

## Tipar los parámetros y el retorno de una función

PHP tiene tipado dinámico por defecto, pero acepta anotaciones de tipo en los parámetros y en el valor de retorno. A diferencia de un lenguaje compilado, estos tipos no se comprueban antes de la ejecución: se comprueban **en tiempo de ejecución**, en cada llamada.

```php
<?php
function calcularDescuento(float $precio, int $porcentaje): float
{
    return $precio - ($precio * $porcentaje / 100);
}

calcularDescuento(100, 10);    // OK -> 90.0
calcularDescuento("cien", 10); // TypeError: "cien" no es un float
?>
```

## Tipos anulables (`?Tipo`)

Una función declarada `: array` (sin `?`) **no** permite `null` como valor de retorno: intentarlo provoca un `TypeError` en tiempo de ejecución. Para permitir explícitamente `null` además del tipo declarado, se antepone un `?` al tipo:

```php
<?php
function encontrarUsuario(int $id): ?array
{
    if ($id <= 0) {
        return null; // OK: ?array permite explícitamente null
    }
    return ['id' => $id, 'nombre' => 'Dupont'];
}
?>
```

> **Nota:** `?array` es una declaración de contrato, no una simple costumbre de escritura: es el equivalente en PHP de [`std::optional<T>`](https://en.cppreference.com/w/cpp/utility/optional) en [C++](/?c=langages-de-programmation&s=cpp&p=cpp) moderno o de [`Optional[T]`](/?c=langages-de-programmation&s=python&p=typage-avec-annotations) en [Python](/?c=langages-de-programmation&s=python&p=python): la función puede devolver ese tipo concreto, O `null`, nada más.

## Suprimir un warning esperado con `@`

Muchas funciones nativas de PHP devuelven `false` en caso de fallo en lugar de lanzar una excepción (un estilo cercano al de [C](/?c=langages-de-programmation&s=c&p=c), donde `fopen()` devuelve un puntero nulo y establece `errno`). Cuando ese fallo ya está previsto y gestionado por el resto del código, el operador `@` colocado delante de la llamada suprime el warning que PHP emitiría en otro caso:

```php
<?php
$mtime = @filemtime('archivo_que_puede_no_existir.txt');
$version = $mtime ? "v{$mtime}" : 'v-desconocida';
?>
```

> **Nota:** `@` oculta el warning, no cambia en nada el comportamiento de la función en sí (`filemtime()` sigue devolviendo `false` si el archivo no existe). Hay que reservarlo para los casos en que el fallo está realmente previsto y comprobado justo después: usarlo en todas partes ocultaría también errores reales.

PHP ofrece una enorme cantidad de funciones nativas ya listas para usar, clasificadas a continuación por categoría.

## Funciones sobre cadenas de caracteres

```php
<?php
    strlen("Hello");                 // 5 -> longitud de la cadena
    strtoupper("Hello");             // "HELLO" -> pone en mayúsculas
    strtolower("Hello");             // "hello" -> pone en minúsculas
    str_replace("a", "o", "Hello");  // "Hello" -> reemplaza una subcadena
    trim("  Hello  ");               // "Hello" -> quita los espacios al inicio/final
    substr("Hello", 1, 3);           // "ell" -> extrae una parte de la cadena
    explode(",", "a,b,c");           // ["a", "b", "c"] -> divide una cadena en array
    implode(",", ["a", "b"]);        // "a,b" -> une un array en una cadena
    str_contains("Hello", "ell");    // true -> comprueba si una cadena contiene otra
?>
```

## Funciones sobre arrays (`array`)

```php
<?php
    count([1, 2, 3]);                      // 3 -> número de elementos
    $tab[] = "valor";                      // añade un elemento al final (preferido a array_push() para un solo elemento)
    array_pop($tab);                       // retira y devuelve el último elemento
    array_merge($tab1, $tab2);             // fusiona dos arrays
    in_array("manzana", $frutas);          // true/false -> comprueba la presencia de un valor
    array_search("manzana", $frutas);      // devuelve la clave/el índice encontrado
    sort($tab);                            // ordena un array (valores)
    array_map(fn($n) => $n * 2, $tab);     // aplica una función a cada elemento
    array_filter($tab, fn($n) => $n > 0);  // filtra los elementos según una condición
?>
```
## Funciones sobre arrays asociativos

```php
<?php
    $persona = ["nombre" => "Dupont", "edad" => 25];

    array_keys($persona);                    // ["nombre", "edad"] -> devuelve todas las claves
    array_values($persona);                  // ["Dupont", 25] -> devuelve todos los valores
    array_key_exists("nombre", $persona);    // true/false -> comprueba que una clave existe
    unset($persona["edad"]);                 // retira una clave (y su valor) del array
    ksort($persona);                         // ordena el array según las claves
    asort($persona);                         // ordena el array según los valores (conservando las claves)
    array_combine(["a", "b"], [1, 2]);       // ["a" => 1, "b" => 2] -> crea un array asociativo a partir de 2 arrays
    array_flip($persona);                    // invierte claves y valores
?>
```

> **Nota:** `array_key_exists()` comprueba que una clave existe, incluso si su valor es `null`. `isset($persona["nombre"])` devuelve `false` en ese caso, porque además comprueba que el valor no sea `null`.
Ej.:
```php
<?php
    $persona = ["nombre" => "Dupont", "edad" => null];

    array_key_exists("edad", $persona);  // true
    isset($persona["edad"]);             // false
?>
```

## Funciones matemáticas

```php
<?php
    abs(-5);          // 5 -> valor absoluto
    round(3.456, 2);  // 3.46 -> redondea
    rand(1, 10);      // genera un número aleatorio entre 1 y 10
    max(1, 5, 3);     // 5 -> valor máximo
    min(1, 5, 3);     // 1 -> valor mínimo
?>
```

## Funciones de comprobación de tipo

```php
<?php
    is_string($var);  // true/false
    is_int($var);     // true/false
    is_array($var);   // true/false
    is_null($var);    // true/false
    empty($var);      // true si está vacío, null, o no definido
    isset($var);      // true si la variable existe y no es null
?>
```

> **Nota:** encontrarás la lista completa de las funciones nativas de PHP en la documentación oficial: [php.net/manual/es/funcref.php](https://www.php.net/manual/es/funcref.php). Para añadir un **solo** elemento, `$tab[] = "valor";` también es preferido a `array_push($tab, "valor")`: mismo resultado, sin el coste de una llamada a función: `array_push()` solo resulta realmente útil para añadir varios elementos en una sola llamada (`array_push($tab, "a", "b", "c")`).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una función es un bloque de código reutilizable; un método es una función definida dentro de una clase, invocada vía `->`/`::`. PHP comprueba los tipos anotados en tiempo de ejecución, no en compilación. |
| **Herramientas utilizables** | Funciones nativas sobre cadenas, arrays, arrays asociativos, matemáticas, comprobación de tipo; `?Tipo` para un tipo anulable. |
| **Trampas a evitar** | Usar `@` para ocultar sistemáticamente los warnings: hay que reservarlo para fallos realmente previstos y comprobados justo después. |
| **Buenas prácticas** | Tipar los parámetros y el retorno de una función en cuanto sea posible; usar `$tab[] = valor` en lugar de `array_push()` para un solo elemento. |
