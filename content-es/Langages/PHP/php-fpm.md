---
order: 15
---

# Responder al cliente y luego seguir trabajando (PHP-FPM)

A veces una petición debe responder de inmediato mientras dispara un cálculo pesado por detrás (refrescar una [caché caducada](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant), por ejemplo). **PHP-FPM**, el motor de ejecución más habitual en producción, permite justamente eso: cortar la conexión con el cliente sin detener el script. La respuesta sale de inmediato, el resto del código sigue ejecutándose, invisible para el usuario. Este capítulo explica cómo, y dónde están las trampas.

## PHP-FPM: un pool de procesos, cada uno con una petición a la vez

Un script PHP necesita un programa que lo ejecute. Ese programa se llama **SAPI** (*Server API*): según cuál se use, PHP se comporta de forma distinta.

| SAPI | Qué es | Uso típico |
|---|---|---|
| CLI | Ejecuta un script desde la línea de comandos, sin petición HTTP | Tareas programadas, herramientas de línea de comandos |
| Servidor integrado (`php -S`) | Un pequeño servidor HTTP incluido con PHP, un solo proceso | Solo desarrollo local (ver [configurar un entorno local](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server)) |
| **PHP-FPM** (*FastCGI Process Manager*) | Un grupo (*pool*) de procesos PHP ya iniciados, cada uno recibe una petición a la vez vía el protocolo **FastCGI** | Producción, detrás de un servidor web como Nginx o Apache |

Cada proceso del pool (un **worker**, la misma noción que en el capítulo sobre el [paralelismo](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)) atiende una petición, y vuelve a estar disponible para la siguiente en cuanto su script termina:

```text
Nginx (recibe la peticion HTTP)
        |
        v  (protocolo FastCGI)
   Pool PHP-FPM
   +---------+  +---------+  +---------+
   | worker1 |  | worker2 |  | worker3 |   <- N procesos, iniciados de antemano
   | ocupado |  | libre   |  | ocupado |
   +---------+  +---------+  +---------+
```

Un worker ocupado solo atiende una petición hasta que su script termina: precisamente el detalle que la técnica de este capítulo esquiva.

## `register_shutdown_function()`: ejecutar código justo al final del script

Esta función registra un callback que se ejecuta justo después de que el script termina: ya sea un final normal, un `exit()`/`die()`, o la mayoría de errores fatales. Funciona en cualquier SAPI, no solo en PHP-FPM.

```php
<?php
register_shutdown_function(function () {
    error_log('Script terminado a las ' . date('H:i:s'));
});

echo 'Hola';   // el mensaje de log solo aparece después de esta línea, al final del script
```

> **Nota:** un callback registrado así no recibe ningún parámetro automáticamente; para pasarle datos del contexto circundante, se usa una función anónima con `use (...)`, como en el ejemplo anterior.

## `fastcgi_finish_request()`: cerrar la conexión sin detener el script

Específica de PHP-FPM (ausente en las demás SAPI), esta función envía de inmediato al cliente todo lo ya producido (`echo`...) y cierra la conexión, sin por ello detener el script: el worker sigue ejecutando el resto del código, pero el cliente ya se ha ido.

```text
Sin fastcgi_finish_request() :         Con fastcgi_finish_request() :

peticion -> calculo (6 min) -> respuesta  peticion -> respuesta inmediata
   el cliente espera 6 minutos               |
                                              v
                                      calculo (6 min), invisible para
                                      un cliente que ya se fue
```

```php
<?php
echo 'Procesamiento iniciado, vuelve más tarde.';

if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
}

generarInformeCostoso();
```

> **Trampa:** todo lo que se escriba después de `fastcgi_finish_request()` (`echo`, cabecera HTTP) se pierde sin el menor error: la conexión ya está cerrada, esa salida simplemente se descarta.

> **Trampa:** llamar a `fastcgi_finish_request()` sin comprobar antes `function_exists()`. El mismo código ejecutado en CLI o con el servidor integrado (`php -S`) lanza un error fatal, ya que la función directamente no existe en esas SAPI.

## Combinar ambas: responder y luego refrescar una caché caducada en segundo plano

El caso de uso típico: servir de inmediato una caché en disco caducada, y planificar su refresco para después de la respuesta.

```php
<?php
public function obtenerCatalogo(): array
{
    $fresco = $this->leerCache();
    if ($fresco !== null) return $fresco;   // caché aún válida: nada más que hacer

    $caducado = $this->leerCache(ignorarTtl: true);
    if ($caducado !== null) {
        $this->planificarActualizacionEnSegundoPlano($this->archivoCache);
        return $caducado;                   // responde con el valor caducado mientras se recalcula
    }

    return $this->actualizarAhora($this->archivoCache);   // primera llamada: no hay más remedio que esperar
}

private function planificarActualizacionEnSegundoPlano(string $archivo): void
{
    $bloqueo = $archivo . '.en_curso';

    if (is_file($bloqueo) && (time() - (int) @filemtime($bloqueo)) < 600) {
        return;                          // ya hay una actualización en curso, no hace falta otra
    }

    $identificador = @fopen($bloqueo, 'x');   // 'x': falla si el archivo ya existe (creación atómica)
    if ($identificador === false) return;     // otro worker ya ganó la carrera
    fclose($identificador);

    ignore_user_abort(true);             // llega hasta el final aunque el cliente ya se haya ido

    register_shutdown_function(function () use ($archivo, $bloqueo) {
        if (function_exists('fastcgi_finish_request')) {
            fastcgi_finish_request();    // el cliente recibe aquí su respuesta, la conexión se cierra
        }
        try {
            $this->actualizarAhora($archivo);
        } finally {
            @unlink($bloqueo);           // siempre se libera, incluso si el cálculo lanzó una excepción
        }
    });
}
```

- El archivo `.en_curso` actúa como bloqueo anti-concurrencia: sin él, cada petición que ve la caché caducada dispararía su propio recálculo en paralelo (la misma trampa ya detallada en [stale-while-revalidate](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant)).
- `fopen(..., 'x')` crea el archivo de forma atómica: si dos workers llegan a la vez, solo uno obtiene un identificador real, el otro recibe `false`.
- El `finally` (ver [manejar errores en PHP](/?c=langages&s=php&p=exceptions)) garantiza que el bloqueo se libera incluso si `actualizarAhora()` lanza una excepción; de lo contrario, el bloqueo quedaría atascado hasta que expire el margen de 10 minutos.

## `ignore_user_abort()`: no depender de un cliente que ya se fue

Por defecto, si el cliente se desconecta (cierra la pestaña, corta la conexión) antes de que el script termine, PHP puede interrumpir la ejecución en el camino. `ignore_user_abort(true)` desactiva esa interrupción: el script llega hasta el final pase lo que pase del lado del cliente, algo indispensable aquí ya que todo el sentido de la técnica es justamente que el cliente no espera el final.

> **Trampa:** olvidar `ignore_user_abort(true)` antes de registrar el callback. El trabajo en segundo plano puede entonces detenerse a mitad de camino si el cliente ya cerró la página, algo que a estas alturas ya no tiene nada que ver con él.

## Un límite a tener presente

Esta técnica acelera la respuesta percibida por el cliente, no la capacidad total del pool: el worker permanece ocupado hasta que el script termina realmente, trabajo en segundo plano incluido. Una actualización frecuente o pesada puede por tanto saturar igualmente el pool, exactamente como si hubiera bloqueado la respuesta. Para un verdadero procesamiento asíncrono desacoplado del pool de workers, la respuesta correcta es una [cola de mensajes](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=system-design-lexercice) dedicada, no este truco, reservado a un trabajo de fondo ocasional y razonablemente corto.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | PHP-FPM atiende cada petición en un worker dedicado, liberado al final del script. `fastcgi_finish_request()` cierra la conexión del cliente sin detener el script; `register_shutdown_function()` ejecuta código justo después del final normal del script, en cualquier SAPI. |
| **Herramientas utilizables** | `register_shutdown_function()`, `fastcgi_finish_request()`, `ignore_user_abort()`, `function_exists()` para comprobar la disponibilidad de una función específica de una SAPI. |
| **Trampas a evitar** | Llamar a `fastcgi_finish_request()` sin `function_exists()` (error fatal fuera de PHP-FPM); escribir después de esa llamada pensando que llegará al cliente; olvidar `ignore_user_abort(true)`; olvidar el bloqueo anti-concurrencia en una caché compartida; creer que esta técnica aumenta la capacidad del pool en lugar de la latencia percibida. |
| **Buenas prácticas** | Comprobar `function_exists('fastcgi_finish_request')` antes de cualquier llamada; liberar un recurso (bloqueo, archivo) en un `finally` dentro del callback de cierre; reservar la técnica a un trabajo de fondo ocasional y corto, una cola real para el resto. |
