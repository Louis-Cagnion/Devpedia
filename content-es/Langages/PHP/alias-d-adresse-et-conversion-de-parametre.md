---
order: 16
---

# Alias de dirección, redirección 301 y conversión de parámetro de ruta

Una **dirección** (también llamada **URL**, la línea que se lee en la parte superior del navegador, por ejemplo `/blog/mi-articulo`) puede tener dos caras: la que lee el visitante y la que el programa usa realmente. Este capítulo construye, en PHP mínimo y sin framework, un pequeño enrutador que gestiona esas dos caras, las redirecciones que evitan romper los enlaces antiguos, y la conversión automática de un trozo de dirección (`12`) en un objeto (el artículo número 12). Continúa [el enrutamiento sin framework](/?c=langages&s=php&p=routage): la noción de ruta, el punto de entrada único y `php -S` se explican allí, así que no se repiten aquí. Los códigos de estado HTTP (`200`, `404`...) se presentan en [los intercambios de datos: API y HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http), y los objetos PHP (clase, constructor) en [la POO en PHP](/?c=langages&s=php&p=poo).

> Los sistemas de gestión de contenido (CMS) como [Drupal](https://www.drupal.org/docs) ofrecen estos mecanismos ya hechos: un módulo de alias, un módulo de redirecciones y un convertidor de parámetros de ruta. El capítulo muestra cómo funcionan por dentro, con código que usted mismo puede ejecutar.

## Un alias: una dirección legible para una dirección interna

Un programa identifica a menudo una página por un número: `/node/12` significa «el contenido número 12». Es práctico para la máquina, ilegible para una persona, y sin interés para un motor de búsqueda (un sitio que indexa las páginas web para proponerlas en sus resultados). Un **alias de dirección** es una dirección legible (`/blog/mi-articulo`) que designa la misma página que la **dirección interna** (`/node/12`). El visitante solo ve y comparte el alias.

| Noción | Ejemplo | Quién la ve | Función |
|---|---|---|---|
| Dirección interna | `/node/12` | El programa (rutas, base de datos) | Identificar la página de forma estable, por su número |
| Alias | `/blog/mi-articulo` | El visitante, los motores de búsqueda | Ser legible, memorizable, compartible |
| Alias antiguo | `/blog/antiguo-titulo` | Los enlaces antiguos, favoritos, motores de búsqueda | Seguir llevando a la página tras un cambio de nombre |

¿Dónde guardar la correspondencia? En una base de datos, en realidad. Aquí, un simple arreglo asociativo de PHP (una lista de pares «clave => valor») basta para entender el principio.

## El procesador entrante y el procesador saliente

Dos funciones, llamadas **procesadores de dirección**, trabajan en sentido inverso:

| Procesador | Cuándo se ejecuta | Sentido | Ejemplo |
|---|---|---|---|
| Entrante | En cada petición recibida, **antes** del enrutamiento | alias hacia dirección interna | `/blog/mi-articulo` se convierte en `/node/12` |
| Saliente | Cuando el programa escribe un enlace en una página | dirección interna hacia alias | `/node/12` se convierte en `/blog/mi-articulo` |

```text
  Visitante escribe        Procesador              Enrutador
/blog/mi-articulo  --->  entrante (alias   --->  /node/12  --->  controlador
                         hacia interna)          (ruta)

  Página HTML escrita      Procesador
<a href="/blog/...">  <---  saliente (interna  <--- el programa conoce /node/12
                           hacia alias)
```

El enrutador ([capítulo sobre el enrutamiento](/?c=langages&s=php&p=routage)) solo necesita conocer las direcciones internas: ni siquiera sabe que existen los alias. El código siguiente es el archivo `alias.php`: cada línea está comentada.

```php
<?php
// archivo: alias.php
// tabla de alias: dirección legible => dirección interna
$alias = [
    '/blog/mi-articulo' => '/node/12',
    '/blog/otro-tema' => '/node/13',
];

// pone una dirección en una forma única: minúsculas, una "/" al inicio, ninguna al final
function normalizar(string $ruta): string
{
    // strtolower pone en minúsculas, trim quita las "/" en ambos extremos
    return '/' . trim(strtolower($ruta), '/');
}

// procesador entrante: alias -> dirección interna
function tratarEntrante(string $ruta, array $alias): string
{
    $ruta = normalizar($ruta); // "/Blog/Mi-Articulo/" se convierte en "/blog/mi-articulo"
    // el operador ?? da el valor de la derecha cuando el de la izquierda no existe
    return $alias[$ruta] ?? $ruta; // alias desconocido: la dirección no cambia
}

// procesador saliente: dirección interna -> alias
function tratarSaliente(string $interno, array $alias): string
{
    $inverso = array_flip($alias); // array_flip intercambia claves y valores
    return $inverso[$interno] ?? $interno; // sin alias: se conserva la dirección interna
}
```

Un pequeño script de prueba, ejecutado en la línea de comandos (`php ensayo-alias.php`), muestra los dos sentidos.

```php
<?php
// archivo: ensayo-alias.php
require __DIR__ . '/alias.php'; // carga la tabla $alias y las funciones

echo tratarEntrante('/blog/mi-articulo', $alias), "\n"; // esperado: /node/12
echo tratarEntrante('/Blog/Mi-Articulo/', $alias), "\n"; // esperado: /node/12
echo tratarEntrante('/contacto', $alias), "\n"; // esperado: /contacto
echo tratarSaliente('/node/12', $alias), "\n"; // esperado: /blog/mi-articulo
```

Resultado obtenido:

```text
/node/12
/node/12
/contacto
/blog/mi-articulo
```

> **Trampa:** `array_flip` supone una sola clave por valor. Si dos alias llevan a `/node/12`, el sentido saliente solo retiene uno (el último del arreglo): elija siempre un alias **oficial** por página, los demás son alias antiguos (sección siguiente).

## Redirección 301 o 302

Una **redirección** es una respuesta del servidor que dice al navegador: «lo que busca está en otro lugar, vaya a esta dirección». Se escribe con un código de estado (un número que resume la respuesta) y una cabecera `Location` (la nueva dirección). El código indica si el desplazamiento es definitivo.

| Código | Nombre | Sentido | Caché del navegador | Uso típico |
|---|---|---|---|---|
| `301` | Moved Permanently (movida definitivamente) | La antigua dirección ya no sirve, use la nueva | Se conserva mucho tiempo | Página renombrada, dirección interna hacia su alias |
| `302` | Found (encontrada, desplazamiento temporal) | La página está en otro lugar por ahora | No se conserva de forma duradera | Promoción, página de mantenimiento, prueba |
| `308` | Permanent Redirect | Igual que `301`, pero se conserva el método HTTP | Se conserva mucho tiempo | Redirección permanente de un formulario enviado con `POST` |
| `307` | Temporary Redirect | Igual que `302`, pero se conserva el método HTTP | No se conserva | Redirección temporal de un formulario enviado con `POST` |

Un **método HTTP** es el verbo de la petición (`GET` para leer, `POST` para enviar un formulario), visto en [los intercambios de datos](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). Con `301` y `302`, los navegadores transforman históricamente un `POST` en `GET` tras la redirección; `307` y `308` lo prohíben. El funcionamiento completo se describe en la [documentación de MDN sobre las redirecciones](https://developer.mozilla.org/es/docs/Web/HTTP/Redirections).

Lo que realmente distingue `301` y `302` es lo que hace el lector con ella. Un navegador o un motor de búsqueda que recibe un `301` sustituye la antigua dirección por la nueva en sus favoritos y en su índice; con un `302`, conserva la antigua.

## Conservar el alias anterior tras un cambio de nombre

Un artículo cambia de título: su alias pasa de `/blog/antiguo-titulo` a `/blog/mi-articulo`. Si el alias antiguo desaparece, todos los enlaces ya publicados (correos, favoritos, otros sitios) llevan a un error `404` (página no encontrada). La solución: **conservar el alias antiguo** en una tabla aparte, y responder con un `301` hacia el alias actual.

El archivo `redireccion.php` hace tres cosas: enviar una redirección, guardar la tabla de alias antiguos y decidir qué redirección aplicar a una dirección pedida.

```php
<?php
// archivo: redireccion.php
require_once __DIR__ . '/alias.php'; // una sola vez: hace falta tratarSaliente()

// envía una redirección y después detiene el script
function redirigir(string $destino, int $codigo = 301): void
{
    header('Location: ' . $destino, true, $codigo); // true: reemplaza un Location ya enviado
    exit; // sin exit, el resto del script seguiría ejecutándose
}

// alias antiguos conservados tras un cambio de nombre: alias antiguo => dirección interna
$anteriores = [
    '/blog/antiguo-titulo' => '/node/12',
];

// redirecciones temporales deseadas: dirección pedida => destino
$temporales = [
    '/promocion' => '/blog/otro-tema',
];

// devuelve [destino, código] si la dirección debe redirigirse, si no null
function buscarRedireccion(
    string $ruta,
    array $alias,
    array $anteriores,
    array $temporales
): ?array {
    if (isset($temporales[$ruta])) { // isset: verdadero si la clave existe
        return [$temporales[$ruta], 302]; // desplazamiento temporal: 302
    }
    if (isset($anteriores[$ruta])) { // alias antiguo conocido
        return [tratarSaliente($anteriores[$ruta], $alias), 301]; // hacia el alias actual
    }
    $haciaAlias = tratarSaliente($ruta, $alias); // ¿/node/12 escrito a mano?
    if ($haciaAlias !== $ruta) {
        return [$haciaAlias, 301]; // la dirección oficial es el alias, no la interna
    }
    return null; // ?array: el resultado es un arreglo o null (nada que redirigir)
}
```

La tercera regla es importante: si alguien escribe directamente `/node/12`, lo redirigimos a `/blog/mi-articulo`. Sin ella, la misma página existiría con dos direcciones, y los motores de búsqueda la contarían como dos páginas en competencia (un «contenido duplicado»).

| Dirección pedida | Caso | Respuesta |
|---|---|---|
| `/blog/antiguo-titulo` | Alias antiguo conservado | `301` hacia `/blog/mi-articulo` |
| `/node/12` | Dirección interna que tiene un alias | `301` hacia `/blog/mi-articulo` |
| `/promocion` | Redirección temporal deseada | `302` hacia `/blog/otro-tema` |
| `/blog/mi-articulo` | Alias actual | Ninguna redirección: la página se muestra |

## Convertir un parámetro de ruta en objeto

Una ruta puede contener una parte variable, escrita entre llaves: `/article/{article}`. Para `/article/12`, la parte variable (el **parámetro de ruta**) vale el texto `12`. Cada controlador (la función que construye la respuesta de la página) debería entonces buscar el artículo en la base de datos y responder `404` si no existe: el mismo código repetido en todas partes. Un **convertidor de parámetro** (en inglés *param converter*) hace este trabajo una sola vez, antes del controlador, que recibe directamente el objeto artículo.

```text
/article/12  --->  parámetro "12" (texto)
                        |
                        v
               convertidor: busca el artículo 12
                  |                       |
      encontrado  |                       | no encontrado
                  v                       v
      controlador(objeto Article)     respuesta 404, controlador nunca llamado
```

Este es el archivo `convertidor.php`. Un **objeto** es un valor que agrupa datos (aquí un número y un título) y que se manipula en bloque; la clase `Article` (ver [la POO en PHP](/?c=langages&s=php&p=poo)) describe su forma.

```php
<?php
// archivo: convertidor.php
// la clase Article describe un artículo: un número y un título
class Article
{
    // "public int $id" en el constructor crea directamente la propiedad $id
    public function __construct(public int $id, public string $titulo)
    {
    }
}

// base de datos imitada: número => objeto Article
$articulos = [
    12 => new Article(12, 'Mi artículo'),
    13 => new Article(13, 'Otro tema'),
];

// convertidor: texto de la dirección -> objeto Article, o null si no existe
function convertirArticle(string $valor, array $articulos): ?Article
{
    if (!ctype_digit($valor)) { // ctype_digit: verdadero si el texto solo tiene cifras
        return null; // "abc" o "-1" no son números válidos
    }
    return $articulos[(int) $valor] ?? null; // (int) convierte el texto "12" en el número 12
}
```

El enrutador `enrutador.php` localiza los parámetros en la dirección con una **expresión regular** (un patrón que describe una forma de texto, explicada en [el capítulo sobre las expresiones regulares](/?c=langages&s=domain-specific-languages-dsl&p=regex)), llama al convertidor de cada parámetro y después al controlador.

```php
<?php
// archivo: enrutador.php
// busca la ruta que coincide, convierte los parámetros, llama al controlador
function despachar(string $ruta, array $rutas, array $convertidores): void
{
    foreach ($rutas as $modelo => $controlador) {
        // "/article/{article}" se convierte en la expresión "#^/article/(?P<article>[^/]+)$#"
        $patron = preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $modelo);
        $regex = '#^' . $patron . '$#';
        // preg_match guarda los fragmentos encontrados en $encontrados
        if (!preg_match($regex, $ruta, $encontrados)) {
            continue; // esta ruta no sirve: se prueba la siguiente
        }
        $parametros = []; // los objetos que se darán al controlador
        foreach ($encontrados as $nombre => $texto) {
            if (is_int($nombre)) {
                continue; // preg_match añade entradas numeradas: se ignoran
            }
            $objeto = $convertidores[$nombre]($texto); // convertidor del mismo nombre
            if ($objeto === null) {
                http_response_code(404); // objeto no encontrado: la página no existe
                echo "No encontrado\n";
                return; // el controlador nunca se llama
            }
            $parametros[] = $objeto; // objeto listo para el controlador
        }
        $controlador(...$parametros); // los tres puntos dan cada objeto como argumento
        return; // una sola ruta tratada
    }
    http_response_code(404); // ninguna ruta coincide
    echo "Página desconocida\n";
}
```

| Valor en la dirección | Resultado del convertidor | Respuesta |
|---|---|---|
| `12` | Objeto `Article` número 12 | `200`, el controlador recibe el objeto |
| `999` | `null` (ningún artículo) | `404`, controlador no llamado |
| `abc` | `null` (no es un número) | `404`, controlador no llamado |
| `-1` | `null` (el signo `-` no es una cifra) | `404`, controlador no llamado |

## Ensamblar todo

El punto de entrada `index.php` carga los cuatro archivos, declara el controlador y las rutas, y después trata la petición en este orden: redirección eventual, traducción del alias, enrutamiento.

```php
<?php
// archivo: index.php
require __DIR__ . '/alias.php'; // alias y procesadores
require __DIR__ . '/redireccion.php'; // redirecciones 301 y 302
require __DIR__ . '/convertidor.php'; // clase Article y convertidor
require __DIR__ . '/enrutador.php'; // función despachar()

// controlador: recibe directamente el objeto Article, nunca un número
function mostrarArticle(Article $articulo): void
{
    // htmlspecialchars neutraliza los caracteres < y > de un texto mostrado en la página
    echo '<h1>' . htmlspecialchars($articulo->titulo) . "</h1>\n";
}

// rutas: modelo de dirección => controlador llamado
$rutas = [
    '/node/{article}' => 'mostrarArticle',
    '/article/{article}' => 'mostrarArticle',
];

// convertidores: nombre del parámetro => función de conversión
$convertidores = [
    'article' => fn(string $texto): ?Article => convertirArticle($texto, $articulos),
];

// dirección pedida, sin la parte posterior a "?"
$ruta = normalizar(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');

// 1) ¿hay que redirigir?
$redireccion = buscarRedireccion($ruta, $alias, $anteriores, $temporales);
if ($redireccion !== null) {
    redirigir(...$redireccion); // [destino, código] se convierte en dos argumentos
}

// 2) el alias se convierte en dirección interna, 3) el enrutador toma el relevo
despachar(tratarEntrante($ruta, $alias), $rutas, $convertidores);
```

Se lanza con el servidor integrado de PHP (`php -S 127.0.0.1:5611 index.php`, ver [el capítulo sobre el enrutamiento](/?c=langages&s=php&p=routage) para su funcionamiento). Resultados tomados con `curl -i` (la opción `-i` muestra también las cabeceras de la respuesta):

| Dirección pedida | Código | Cabecera `Location` | Cuerpo |
|---|---|---|---|
| `/blog/mi-articulo` | `200` | ninguna | `<h1>Mi artículo</h1>` |
| `/blog/mi-articulo/` (barra final) | `200` | ninguna | `<h1>Mi artículo</h1>` |
| `/article/12` | `200` | ninguna | `<h1>Mi artículo</h1>` |
| `/node/12` | `301` | `/blog/mi-articulo` | vacío |
| `/blog/antiguo-titulo` | `301` | `/blog/mi-articulo` | vacío |
| `/promocion` | `302` | `/blog/otro-tema` | vacío |
| `/article/999` | `404` | ninguna | `No encontrado` |
| `/article/abc` | `404` | ninguna | `No encontrado` |
| `/blog/desconocido` | `404` | ninguna | `Página desconocida` |

## Las trampas

| Trampa | Consecuencia | Remedio |
|---|---|---|
| Redirigir con `301` por error o para una prueba | El navegador conserva la redirección mucho tiempo: incluso tras corregirla, algunos visitantes siguen siendo redirigidos | Probar con `302` y pasar a `301` solo cuando esté seguro |
| Borrar el alias antiguo al cambiar el nombre | Todos los enlaces antiguos dan `404` | Conservar cada alias antiguo con un `301` hacia el alias actual |
| Olvidar `exit` tras `header('Location: ...')` | El script continúa y puede producir contenido o efectos tras la redirección | Aislar la redirección en una función que llame a `exit` |
| Cadena de redirecciones (A hacia B hacia C) | Lentitud, riesgo de bucle | Redirigir directamente al alias **actual**, nunca a un alias antiguo |
| Dos alias idénticos para páginas distintas | Una página es inaccesible (o se muestra la incorrecta) | Hacer el alias único en el momento del registro |
| Página accesible por el alias y por la dirección interna sin redirección | Contenido duplicado para los motores de búsqueda | Redirigir la dirección interna hacia el alias con `301` |
| Mayúsculas y barra final sin normalizar | `/Blog/Mi-Articulo/` y `/blog/mi-articulo` son dos direcciones para un mismo contenido | Normalizar (aquí `normalizar()`) y redirigir hacia la forma oficial |
| Redirigir hacia una dirección procedente de la petición (`?next=...`) | Desvío del sitio para suplantación de identidad (*open redirect*) | Redirigir solo hacia direcciones de su tabla, ver [las vulnerabilidades del lado del navegador](/?c=securite&s=cybersecurite&p=failles-de-navigateur) |
| Convertidor sin validación (`(int) "abc"` vale `0`) | Un texto no válido se toma por un número válido | Validar el formato (`ctype_digit`) antes de buscar |
| Controlador que recibe un objeto posiblemente vacío | Error fatal con `null` | El convertidor responde `404` antes de llamar al controlador |
| Mostrar un título sin escaparlo | Vulnerabilidad XSS (código inyectado en la página) | `htmlspecialchars()` al mostrar |

## Buenas prácticas

| Práctica | Razón |
|---|---|
| Un solo alias oficial por página, los demás son alias antiguos con `301` | Una página, una dirección: sin contenido duplicado |
| Crear automáticamente el alias antiguo al cambiar el nombre | Ningún enlace publicado se rompe |
| `301` para un cambio definitivo, `302` para un cambio temporal | El navegador y los motores de búsqueda saben qué conservar |
| Generar todos los enlaces del sitio con el procesador saliente | Un cambio de alias actualiza cada enlace sin retoques |
| Dar a conocer al enrutador solo las direcciones internas | Las rutas no cambian cuando cambia un alias |
| Un convertidor por tipo de objeto, reutilizado por todas las rutas | La búsqueda y el `404` se escriben una sola vez |
| Validar el texto del parámetro antes de buscar el objeto | Los valores absurdos se rechazan limpiamente |
| Comparar direcciones normalizadas (minúsculas, sin barra final) | Ningún duplicado por una simple diferencia de mayúsculas |

## Lo que hay que recordar

| Noción | Qué recordar |
|---|---|
| Alias de dirección | Dirección legible para una dirección interna (`/blog/mi-articulo` para `/node/12`) |
| Procesador entrante | Traduce el alias en dirección interna antes del enrutamiento |
| Procesador saliente | Traduce la dirección interna en alias cuando el programa escribe un enlace |
| Redirección `301` | Definitiva: el navegador y los motores de búsqueda la conservan |
| Redirección `302` | Temporal: la antigua dirección sigue siendo válida |
| Alias antiguo conservado | Mantiene vivos los enlaces antiguos tras un cambio de nombre gracias a un `301` |
| Convertidor de parámetro | Transforma el texto de la dirección en objeto antes del controlador, `404` si no existe |
| Controlador | Recibe directamente el objeto, sin buscar ni verificar él mismo |

Para ir más lejos con el mismo principio en un framework, ver la [documentación de Laravel sobre el enrutamiento](https://laravel.com/docs/routing) (vinculación automática de un parámetro de ruta con un modelo) y la [especificación oficial de las redirecciones HTTP](https://www.rfc-editor.org/rfc/rfc9110).
