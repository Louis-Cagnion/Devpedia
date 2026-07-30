---
order: 11
---

# Realizar llamadas HTTP de forma nativa

PHP ofrece al menos dos formas nativas de realizar peticiones HTTP salientes (por ejemplo, consultar una API externa), sin depender de ninguna biblioteca de terceros: la extensión cURL y los flujos (streams).

## cURL

API en 4 pasos: crear un identificador, configurar opciones, ejecutar y liberar.

```php
<?php
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $corpsJson,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'], // Imprescindible para un cuerpo JSON
    CURLOPT_RETURNTRANSFER => true, // Devolver la respuesta como cadena, en lugar de mostrarla directamente.
    CURLOPT_TIMEOUT        => 10,
]);

$respuesta  = curl_exec($ch);        // false en caso de fallo de red (estilo de error «al estilo C»)
$codeHttp = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
?>
```

`CURLOPT_*` Son constantes enteras predefinidas por la extensión cURL (como los indicadores de `open()`o en C): cada una de ellas configura un aspecto concreto de la solicitud.

### Convertir un salto de línea «al estilo C» en una excepción

`curl_exec()` Devuelve «`false`» en caso de fallo de red, en lugar de lanzar una excepción; un punto de entrada puede absorber este detalle y permitir que solo se propaguen las excepciones al resto del programa:

```php
<?php
if ($respuesta === false || $codeHttp !== 200) {
    throw new \RuntimeException("HTTP $codeHttp");
}
?>
```

Una vez realizada esta conversión en un único lugar, el resto del proyecto ya no necesita saber que `curl_exec()` puede devolver `false`: simplemente puede utilizar `try` / `catch`, como con cualquier otro error moderno de PHP.

## Los flujos PHP (streams): otra API para la misma necesidad

PHP trata las URL como una variante de «archivo» que `file_get_contents()` sabe leer directamente. `stream_context_create()` configura este comportamiento (método HTTP, encabezados, cuerpo, SSL...):

```php
<?php
$options = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => $corpsJson,
    ],
];
$contexte = stream_context_create($options);
$respuesta  = file_get_contents($url, false, $contexte); // «false» en caso de error, al igual que en `curl_exec`.
?>
```

> **Nota:** en una tabla asociativa literal, cuando hay una clave duplicada, su **último** valor se aplica de forma silenciosa; la primera entrada es código muerto, que nunca se utiliza. Una buena razón para que un linter revise este tipo de tablas (opciones HTTP, configuración...) o para revisarlas uno mismo línea por línea preguntándose «¿cuál es el último valor asignado a esta clave?».

## `json_decode()` : un valor de retorno «`null`» ambiguo

```php
<?php
$datos = json_decode($respuesta, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    throw new \RuntimeException('Réponse JSON invalide');
}
?>
```

`json_decode()` Si se aplica a una cadena no válida, devuelve «`null`», pero una cadena JSON **válida** que contenga literalmente «`"null"`» también se decodifica como «`null`». Por lo tanto, un simple «`if ($datos === null)`» no permitiría distinguir entre «JSON no válido» y «JSON que en realidad era `null`». De ahí `json_last_error()`: una función independiente que indica si la última conversión ha fallado realmente, independientemente del valor obtenido —la misma lógica que `isset()` / `empty()` ante una clave de matriz (véase el capítulo sobre las variables): nunca confiar en un valor ambiguo cuando existe un mecanismo específico para despejar la duda.

`json_encode()` / `json_decode(..., true)` son el equivalente en PHP de `JSON.stringify()` / `JSON.parse()` en JavaScript (el `true` requiere un array asociativo, en lugar de un objeto `stdClass`).

## Para profundizar

Quedan por analizar dos aspectos relacionados con la seguridad y la solidez de las llamadas HTTP:

- `verify_peer` / `verify_peer_name` a `false` en el bloque `ssl` de un contexto de flujo: esto desactiva la verificación del certificado SSL del servidor remoto. ¿Por qué se querría hacer esto y cuál es la contrapartida?
- `ignore_errors` (streams): ¿cómo influye este ajuste en el comportamiento de `file_get_contents()` ante una respuesta HTTP de error (4xx/5xx)?
