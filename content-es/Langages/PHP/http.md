---
order: 12
---

# Realizar llamadas HTTP de forma nativa

PHP ofrece al menos dos formas nativas de hacer peticiones HTTP salientes (consultar una API externa, por ejemplo), sin depender de ninguna biblioteca de terceros: la extensión cURL, y los flujos (streams).

> Una **API** (*Application Programming Interface*, interfaz de programación) es el contrato mediante el cual un software expone sus funcionalidades a otro: qué peticiones enviar, en qué formato, y qué respuestas esperar. El término designa tanto un servicio web consultable por HTTP (el caso aquí) como el conjunto de funciones públicas de una biblioteca.
>
> Las respuestas de una API web suelen estar en formato **JSON** (*JavaScript Object Notation*): un formato de texto de representación de datos estructurados, legible por un humano, nacido en JavaScript pero hoy independiente de cualquier lenguaje. PHP lo convierte con `json_encode()` / `json_decode()`.

## cURL

API en 4 pasos: crear un handle, configurar opciones, ejecutar, liberar.

```php
<?php
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $cuerpoJson,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],  // indispensable para un cuerpo JSON
    CURLOPT_RETURNTRANSFER => true,                                // devolver la respuesta como string, en lugar de mostrarla directamente
    CURLOPT_TIMEOUT        => 10,
]);

$respuesta  = curl_exec($ch);        // false en caso de fallo de red (estilo de error "a la C")
$codigoHttp = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
?>
```

`CURLOPT_*` son constantes enteras predefinidas por la extensión cURL (como los flags de `open()` en C): cada una configura un aspecto preciso de la petición.

### Convertir un retorno "a la C" en excepción

`curl_exec()` devuelve `false` en caso de fallo de red, en lugar de lanzar una excepción: un punto de entrada puede absorber este detalle y dejar que solo suban excepciones al resto del programa:

```php
<?php
if ($respuesta === false || $codigoHttp !== 200) {
    throw new \RuntimeException("HTTP $codigoHttp");
}
?>
```

Una vez hecha esta conversión en un único lugar, el resto del proyecto ya no necesita saber nunca que `curl_exec()` puede devolver `false`: puede simplemente usar `try`/`catch`, como con cualquier otro error moderno de PHP.

## Los flujos PHP (streams): otra API para la misma necesidad

PHP trata las URL como una variante de "archivo" que `file_get_contents()` sabe leer directamente. `stream_context_create()` configura este comportamiento (método HTTP, cabeceras, cuerpo, SSL...):

```php
<?php
$options = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => $cuerpoJson,
    ],
];
$contexto  = stream_context_create($options);
$respuesta = file_get_contents($url, false, $contexto); // false en caso de fallo, mismo estilo que curl_exec
?>
```

> **Nota:** en un array asociativo literal, una clave duplicada hace que gane silenciosamente su **última** valor: la primera escritura es código muerto, nunca usado. Una buena razón para hacer revisar este tipo de arrays (opciones HTTP, configuración...) por un linter, o para leerlos uno mismo línea por línea preguntándose "¿cuál es el último valor asignado a esta clave?".

## `json_decode()`: un retorno `null` ambiguo

```php
<?php
$datos = json_decode($respuesta, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    throw new \RuntimeException('Respuesta JSON inválida');
}
?>
```

`json_decode()` sobre un string inválido devuelve `null`, pero un string JSON **válido** que contenga literalmente `"null"` también se decodifica en `null`. Un simple `if ($datos === null)` no permitiría por tanto distinguir "JSON inválido" de "JSON que valía efectivamente `null`". De ahí `json_last_error()`: una función separada que informa si la última conversión falló realmente, independientemente del valor obtenido, misma lógica que `isset()`/`empty()` frente a una clave de array (ver [Las variables](/?c=langages-de-programmation&s=php&p=variables)): nunca fiarse de un valor ambiguo cuando existe un mecanismo dedicado para despejar la duda.

`json_encode()` / `json_decode(..., true)` son el equivalente PHP de `JSON.stringify()` / `JSON.parse()` en JavaScript (el `true` pide un array asociativo, en lugar de un objeto `stdClass`).

## `verify_peer` / `verify_peer_name`: verificar el certificado del servidor remoto

El bloque `ssl` de un contexto de flujo (cf. ejemplo más arriba) controla dos verificaciones **independientes**, no lo mismo dos veces:

```php
<?php
$options = [
    'ssl' => [
        'verify_peer'      => false,  // ¿el certificado está firmado por una autoridad reconocida?
        'verify_peer_name' => false,  // ¿el nombre del certificado corresponde al dominio llamado?
    ],
];
?>
```

- `verify_peer`: ¿el certificado presentado por el servidor está firmado por una autoridad de certificación (CA) reconocida? Desactivado, un certificado autofirmado (fabricado en unos segundos con `openssl`) se acepta sin problema.
- `verify_peer_name`: ¿el nombre inscrito en ese certificado corresponde al nombre de dominio realmente llamado? Un certificado perfectamente válido (firmado por una CA real) pero emitido para *otro* dominio falla esta prueba.

Desactivar `verify_peer` es la falla más amplia de las dos: abre la puerta a un ataque **man-in-the-middle** sin el menor esfuerzo por parte de un atacante, que ni siquiera necesita obtener un certificado firmado por una CA real (ver [Protege tus datos](/?c=langages-de-programmation&s=php&p=securite) para el detalle de este ataque). `verify_peer_name` solo, desactivado, es un escalón menos grave (aun así haría falta un certificado firmado por una CA, solo que para el dominio equivocado), pero sigue siendo una falla.

> **Nota:** desactivar ambos es un compromiso habitual en desarrollo local (una API autoalojada con un certificado autofirmado, por ejemplo), pero vuelve a ser un riesgo de seguridad real si el mismo código corre en producción sin distinción de entorno. cURL tiene el equivalente exacto vía `CURLOPT_SSL_VERIFYPEER` y `CURLOPT_SSL_VERIFYHOST`.

## `ignore_errors`: ¿qué hace `file_get_contents()` ante una respuesta HTTP de error?

Por defecto (sin `ignore_errors`), si el servidor responde con un código HTTP de error (4xx/5xx), `file_get_contents()` devuelve `false` y descarta el cuerpo de la respuesta, **incluso si PHP recibió realmente ese cuerpo**. Con `ignore_errors => true`, la función devuelve el cuerpo real de la respuesta, sea cual sea el código HTTP:

```php
<?php
$options = ['http' => ['ignore_errors' => true]];
$contexto = stream_context_create($options);

$respuesta = file_get_contents($url, false, $contexto);
// con ignore_errors: $respuesta contiene el cuerpo incluso para un 404/500
// sin ignore_errors:  $respuesta vale false para un 404/500, aunque el servidor haya respondido
```

Consecuencia directa sobre una conversión "valor de retorno → excepción" como la vista más arriba (`if ($respuesta === false) { throw ... }`): con `ignore_errors => true`, esta prueba ya no se dispara **en absoluto** para un error HTTP (4xx/5xx): solo para un fallo de comunicación más radical (servidor inalcanzable, DNS que no resuelve, timeout de red, un caso donde PHP no recibe nada, ni siquiera cabeceras).

> **Nota:** los dos mecanismos son complementarios, no redundantes. Una vez activado `ignore_errors`, cada llamador debe volver a comprobar él mismo el código HTTP real (`$http_response_header`, ver la documentación de PHP) para distinguir "comunicación exitosa pero respuesta de error aplicativa" de "todo fue bien": lo que el `throw` inicial (reservado al fallo de red) ya no cubre.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | PHP hace peticiones HTTP salientes de forma nativa vía cURL o los flujos (streams), sin biblioteca de terceros. Ambos devuelven `false` en caso de fallo de red, estilo de error "a la C" en lugar de una excepción. |
| **Herramientas utilizables** | `curl_init`/`curl_setopt_array`/`curl_exec`, `stream_context_create`/`file_get_contents`, `json_encode`/`json_decode`, `json_last_error()`. |
| **Trampas a evitar** | Desactivar `verify_peer`/`verify_peer_name` en producción (abre la puerta a un MITM); confundir un `json_decode()` que devuelve `null` por fallo con un JSON válido que contiene literalmente `null`. |
| **Buenas prácticas** | Convertir un retorno "a la C" (`false`) en excepción en un único lugar del código; comprobar `json_last_error()` en lugar de probar directamente el valor decodificado. |
