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

## Funciones anónimas: capturar una variable con `use`

Una **función anónima** (también llamada *closure*) es una función sin nombre: se guarda en una variable o se pasa directamente a otra función. **No** ve las variables del código que la rodea. Para usar una, hay que listarla en `use (...)`, de una de estas dos formas:

| Escritura | Lo que recibe la función | Si la función la modifica... |
|---|---|---|
| `function () use ($x)` | una **copia** de `$x`, hecha en el momento en que se crea la función | solo cambia la copia |
| `function () use (&$x)` | la variable `$x` **en sí** (una *referencia*) | `$x` cambia también fuera |
| `fn() => ...` (función flecha, ver más arriba) | una copia automática de cada variable usada | imposible: una sola expresión, ninguna instrucción |

Analogía: `use ($x)` entrega una fotocopia de un documento (se puede garabatear encima, el original queda intacto); `use (&$x)` presta el original.

```php
<?php
$contador = 0;

$porValor = function () use ($contador) {       // recibe una copia de $contador (0)
    $contador++;                                 // incrementa solo la copia
    return $contador;                            // devuelve la copia: 1
};

$porReferencia = function () use (&$contador) { // recibe la verdadera variable $contador
    $contador++;                                 // incrementa el original
    return $contador;
};

echo $porValor(), " ", $contador, "\n";       // muestra "1 0": el original no se movió
echo $porReferencia(), " ", $contador, "\n";  // muestra "1 1"
echo $porReferencia(), " ", $contador, "\n";  // muestra "2 2"
?>
```

**Trampa: la copia se hace al crear la función, no al llamarla.**

```php
<?php
$x = 10;
$leer = function () use ($x) { return $x; };  // copia de $x hecha AQUÍ, vale 10
$x = 99;                                      // demasiado tarde: la copia no sigue
echo $leer();                                 // muestra 10, no 99
?>
```

El mismo `&` sirve también para un **parámetro**: sin él, una función recibe una copia de lo que se le pasa (incluso un array); con él, modifica directamente la variable de quien llama.

```php
<?php
function agregarUno(array &$tab): void {  // &: la función recibe el array de quien llama
    $tab[] = 1;                           // agrega un elemento a ESE array
}

$lista = [];
agregarUno($lista);
echo count($lista);                       // muestra 1 (sin el &, mostraría 0)
?>
```

### El tipo `callable`: aceptar «algo que se puede llamar»

Un parámetro tipado `callable` acepta cualquier valor que PHP sepa llamar como una función:

| Valor pasado | Ejemplo |
|---|---|
| Función anónima o flecha | `fn($n) => $n * 2` |
| Nombre de una función, como cadena | `'abs'` |
| Método estático de una clase | `['Calculadora', 'doble']` |
| Método de un objeto | `[$calculadora, 'triple']` |

```php
<?php
function aplicar(callable $accion, int $n): int {
    return $accion($n);                       // llama a lo que recibió, con $n
}

echo aplicar(fn($n) => $n * 2, 4);            // muestra 8
echo aplicar('abs', -3);                      // muestra 3 (valor absoluto)
aplicar('funcion_inexistente', 1);            // TypeError: esta cadena no es invocable
// ArgumentCountError, lanzada DENTRO de aplicar()
aplicar(fn($a, $b) => $a + $b, 1);
?>
```

> **Nota:** PHP solo comprueba que el valor sea invocable cuando entra en `aplicar()`. **No** comprueba cuántos parámetros espera ni sus tipos: una función que quiere dos solo falla cuando `aplicar()` la llama con uno (ver [Las excepciones](/?c=langages&s=php&p=exceptions) para `TypeError` y `ArgumentCountError`).

Un uso habitual: una función que prepara algo, deja que una función recibida como parámetro haga su trabajo y luego termina limpiamente. La sección siguiente da un ejemplo completo.

## Bloquear un archivo compartido entre peticiones: `flock()`

Un servidor PHP atiende varias peticiones **al mismo tiempo**, cada una en su propio proceso (ver [PHP-FPM](/?c=langages&s=php&p=php-fpm)). Si dos peticiones leen y luego reescriben el mismo archivo (por ejemplo un pequeño archivo JSON que sirve de mini base de datos), una puede borrar el cambio de la otra:

```
Petición A                         Petición B
lee visitas = 5
                                   lee visitas = 5
escribe visitas = 6
                                   escribe visitas = 6   <- la visita de A se pierde
```

Es el mismo problema que entre dos threads que comparten una variable (ver [Memoria compartida](/?c=langages&s=c&p=threads#memoria-compartida-una-ventaja-y-un-peligro)). La solución: **un bloqueo**. `flock()` pone un bloqueo sobre un archivo ya abierto con `fopen()`, y solo una petición a la vez puede tenerlo.

| Llamada | Efecto |
|---|---|
| `flock($archivo, LOCK_EX)` | bloqueo **exclusivo**: espera a que nadie más tenga el bloqueo y luego lo toma |
| `flock($archivo, LOCK_SH)` | bloqueo **compartido**: varios lectores a la vez, pero ningún bloqueo exclusivo mientras tanto |
| `flock($archivo, LOCK_EX \| LOCK_NB)` | como `LOCK_EX`, pero no espera: devuelve `false` si el bloqueo ya está tomado |
| `flock($archivo, LOCK_UN)` | libera el bloqueo |

El patrón completo, que combina `flock()` y las funciones anónimas de la sección anterior:

```php
<?php
// Abre el archivo, lo bloquea, deja que $modificar cambie los datos y luego los reescribe.
function conStoreCompartido(string $ruta, callable $modificar): void
{
    // lectura/escritura, creado si no existe, nunca vaciado
    $archivo = fopen($ruta, 'c+');
    flock($archivo, LOCK_EX);                  // espera su turno
    $contenido = stream_get_contents($archivo); // lee todo el archivo
    $datos = $contenido === '' ? [] : json_decode($contenido, true);
    $modificar($datos);                        // la función recibida modifica $datos
    ftruncate($archivo, 0);                    // vacía el archivo...
    rewind($archivo);                          // ...vuelve al principio...
    fwrite($archivo, json_encode($datos));     // ...y escribe la nueva versión
    // todo queda escrito ANTES de liberar el bloqueo
    fflush($archivo);
    flock($archivo, LOCK_UN);                  // la petición siguiente puede pasar
    fclose($archivo);
}

$antes = null;
conStoreCompartido('store.json', function (array &$d) use (&$antes) {
    $antes = $d['visitas'] ?? 0;               // use (&$antes): el valor sale de la función
    $d['visitas'] = $antes + 1;                // &$d: el cambio se conserva y se reescribe
});
echo $antes;                                   // número de visitas antes de esta
?>
```

Resultado medido con PHP 8.3: 4 procesos lanzados al mismo tiempo, que añaden cada uno 300 visitas al mismo archivo:

| Versión | Visitas contadas al final (esperado: 1 200) |
|---|---|
| Sin `flock()` | 16 |
| Con `flock()` | 1 200 |

Dos sutilezas:

| Trampa | Por qué |
|---|---|
| Abrir con `'w'` en lugar de `'c+'` | `'w'` vacía el archivo **en cuanto se abre**, o sea antes de tener el bloqueo: otra petición puede leer un archivo vacío mientras tanto. |
| Creer que el bloqueo protege contra todo | `flock()` es un bloqueo **consultivo** (*advisory lock*): solo bloquea el código que también llama a `flock()` sobre ese archivo. Un `file_put_contents()` sin bloqueo escribe igualmente. |

> **Nota:** el mismo mecanismo existe en línea de comandos para impedir que dos ejecuciones de un mismo script se solapen (ver [Evitar ejecuciones concurrentes con `flock`](/?c=langages&s=bash&p=automatisation-cron#evitar-ejecuciones-concurrentes-con-flock)). Para muchas escrituras simultáneas, una verdadera base de datos sigue siendo más adecuada que un archivo bloqueado: cada petición espera su turno, lo que ralentiza todo en cuanto sube el tráfico.

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
    // añade un elemento al final (preferido a array_push() para un solo elemento)
    $tab[] = "valor";
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
    // ordena el array según los valores (conservando las claves)
    asort($persona);
    // ["a" => 1, "b" => 2] -> crea un array asociativo a partir de 2 arrays
    array_combine(["a", "b"], [1, 2]);
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
| **Para recordar** | Una función es un bloque de código reutilizable; un método es una función definida dentro de una clase, invocada vía `->`/`::`. PHP comprueba los tipos anotados en tiempo de ejecución, no en compilación. Una función anónima solo ve las variables listadas en `use`: una copia con `use ($x)`, la variable original con `use (&$x)`. |
| **Herramientas utilizables** | Funciones nativas sobre cadenas, arrays, arrays asociativos, matemáticas, comprobación de tipo; `?Tipo` para un tipo anulable; `use`, `&` y `callable` para las funciones anónimas; `fopen(..., 'c+')` y `flock()` para un archivo compartido. |
| **Trampas a evitar** | Usar `@` para ocultar sistemáticamente los warnings: hay que reservarlo para fallos realmente previstos y comprobados justo después. Creer que `use ($x)` sigue los cambios de `$x` (la copia se hace al crear la función). Abrir un archivo compartido con `'w'`, que lo vacía antes incluso de tener el bloqueo. |
| **Buenas prácticas** | Tipar los parámetros y el retorno de una función en cuanto sea posible; usar `$tab[] = valor` en lugar de `array_push()` para un solo elemento; bloquear (`LOCK_EX`) todo archivo leído y luego reescrito por varias peticiones, y llamar a `fflush()` antes de liberar el bloqueo. |
