---
order: 9
---

# Las excepciones

Una función PHP clásica señala un error devolviendo un valor especial (`false`, `null`) o emitiendo una advertencia, que el código que la llama debe recordar comprobar explícitamente en cada llamada. Las **excepciones** proponen un mecanismo diferente: un error **interrumpe** inmediatamente el desarrollo normal del código y sube automáticamente hasta que un bloque previsto para tratarlo lo intercepta, sin que sea necesaria ninguna comprobación manual en cada paso intermedio.

## `try` / `catch`: interceptar un error

```php
<?php
function dividir(float $a, float $b): float
{
    if ($b === 0.0) {
        throw new DivisionByZeroError("División por cero");
    }
    return $a / $b;
}

try {
    echo dividir(10, 0);
} catch (DivisionByZeroError $e) {
    echo "Error: " . $e->getMessage();  // "Error: División por cero"
}
```

- `throw` lanza una excepción: interrumpe inmediatamente la función actual, sin ejecutar el resto de su código.
- `try` delimita el código a vigilar; `catch` recibe la excepción si se lanza una dentro del bloque `try`, con un tipo preciso (aquí `DivisionByZeroError`) que determina qué excepciones intercepta ese bloque.
- `$e->getMessage()` devuelve el mensaje asociado a la excepción, proporcionado en el momento del `throw`.

> **Trampa:** olvidar que una excepción no interceptada por ningún `try`/`catch` (en ningún nivel de la cadena de llamadas) hace que todo el script falle, con un error fatal mostrado al usuario. Un `throw` sin red de seguridad en algún punto del programa no es una gestión de errores, solo un fallo diferido.
>
> **Buena práctica:** interceptar una excepción en el lugar donde el programa puede reaccionar realmente (mostrar un mensaje claro, reintentar, registrar en un log), no necesariamente lo más cerca posible del `throw`.

## `Exception` vs `Error`: dos familias bajo `Throwable`

PHP distingue dos grandes familias de objetos que se pueden lanzar e interceptar, ambas implementando la interfaz **`Throwable`**:

| | `Exception` | `Error` |
|---|---|---|
| Origen típico | Lanzada explícitamente por el código de negocio (`throw new ...`) | Lanzada por el propio PHP ante un error de programación (tipo inválido, método inexistente) |
| Ejemplo | `InvalidArgumentException`, una excepción de negocio personalizada | `TypeError`, `DivisionByZeroError`, `ArgumentCountError` |
| Sentido habitual | Una situación anormal pero previsible (dato inválido, recurso no disponible) | Un bug en el propio código, descubierto en tiempo de ejecución |

```php
<?php
try {
    strlen();  // llamada sin el parámetro obligatorio
} catch (ArgumentCountError $e) {
    echo "Error de programación: " . $e->getMessage();
}
```

> **Trampa:** escribir `catch (Exception $e)` pensando que se intercepta cualquier error posible. Un `TypeError` o un `DivisionByZeroError` **no** es una `Exception`: son `Error`, una rama distinta de `Throwable`. Este `catch` los deja pasar sin interceptarlos.
>
> **Buena práctica:** interceptar `Throwable` únicamente cuando el código deba reaccionar de verdad ante cualquier error posible (un punto de entrada global que registra todo en un log antes de fallar limpiamente, por ejemplo); en el resto del código, apuntar al tipo de excepción realmente esperado, para no enmascarar nunca un error de programación que merecería ser visto y corregido.

## Varios `catch`: del más específico al más general

Un `try` puede ir seguido de varios bloques `catch`, cada uno apuntando a un tipo diferente; PHP ejecuta el **primero** cuyo tipo coincide, en el orden en que están escritos:

```php
<?php
try {
    procesarPedido($datos);
} catch (StockInsuficienteException $e) {
    echo "Stock insuficiente: " . $e->getMessage();
} catch (PagoRechazadoException $e) {
    echo "Pago rechazado: " . $e->getMessage();
} catch (Exception $e) {
    echo "Error inesperado: " . $e->getMessage();
}
```

> **Trampa:** colocar un `catch` general (`Exception $e`) **antes** de un `catch` más específico (`StockInsuficienteException $e`, que hereda de `Exception`). El bloque general intercepta entonces todo, incluidos los casos que el bloque específico debía tratar primero: este último nunca se ejecuta.
>
> **Buena práctica:** ordenar siempre los bloques `catch` del tipo más específico al más general, nunca al revés.

## `finally`: ejecutar código en todos los casos

Un bloque `finally`, colocado después del último `catch`, se ejecuta sistemáticamente, se haya lanzado una excepción o no, e incluso si el `catch` correspondiente relanza a su vez una excepción:

```php
<?php
$conexion = abrirConexion();
try {
    ejecutarConsulta($conexion);
} catch (ConsultaFallidaException $e) {
    echo "Consulta fallida: " . $e->getMessage();
} finally {
    cerrarConexion($conexion);  // siempre se ejecuta: éxito, fallo, o re-throw
}
```

> **Trampa:** liberar un recurso (conexión, archivo abierto) solo al final del bloque `try`, después del código que puede fallar. Si una excepción interrumpe el bloque antes de llegar a esa línea, el recurso queda abierto indefinidamente.
>
> **Buena práctica:** colocar toda liberación de recurso en un bloque `finally`, nunca solo al final del `try`, para garantizar que se ejecute incluso en caso de error.

## Crear una excepción personalizada

Extender `Exception` (o una subclase más precisa) permite crear un tipo de error propio del negocio de la aplicación, con sus propios datos asociados:

```php
<?php
class StockInsuficienteException extends Exception
{
    public function __construct(
        private string $producto,
        private int $cantidadSolicitada,
        private int $cantidadDisponible
    ) {
        parent::__construct(
            "Stock insuficiente para {$producto}: {$cantidadSolicitada} solicitados, {$cantidadDisponible} disponibles"
        );
    }

    public function getProducto(): string
    {
        return $this->producto;
    }
}

throw new StockInsuficienteException("Teclado", 5, 2);
```

`parent::__construct(...)` transmite el mensaje al constructor de `Exception` (ver [la herencia y las clases](/?c=langages-de-programmation&s=php&p=poo) ya vistas): la excepción personalizada sigue siendo una `Exception` real, interceptable como tal, a la vez que lleva datos adicionales propios del caso de negocio (`getProducto()`).

> **Buena práctica:** crear una excepción personalizada en cuanto quien la llama necesite reaccionar de forma diferente según el tipo preciso de error (ver la sección anterior sobre varios `catch`), en lugar de agruparlo todo bajo una `Exception` genérica y analizar su mensaje de texto para adivinar la causa.

## Encadenar excepciones: no perder la causa original

Relanzar una nueva excepción desde un bloque `catch` puede hacer perder el rastro del error original, salvo que se transmita explícitamente vía el cuarto parámetro del constructor de `Exception`:

```php
<?php
try {
    $datos = json_decode($respuestaApi, flags: JSON_THROW_ON_ERROR);
} catch (JsonException $e) {
    throw new ApiNoDisponibleException("Respuesta de API inválida", previous: $e);
}
```

```php
<?php
try {
    llamarApi();
} catch (ApiNoDisponibleException $e) {
    echo $e->getMessage();               // "Respuesta de API inválida"
    echo $e->getPrevious()->getMessage(); // "Syntax error" (el error JSON original)
}
```

> **Trampa:** relanzar una nueva excepción sin pasar la excepción original en `previous`. La causa real del problema (aquí, un JSON mal formado) desaparece, dejando solo el mensaje genérico de la nueva excepción: una depuración mucho más difícil, sobre todo en producción, donde el error original no es visible en ningún log.
>
> **Buena práctica:** transmitir siempre la excepción interceptada vía `previous` al relanzar una nueva excepción, para conservar un rastro completo de la cadena de causa y efecto.

Ver también [La programación orientada a objetos](/?c=langages-de-programmation&s=php&p=poo) para la herencia de clases reutilizada aquí, y [Protege tus datos](/?c=langages-de-programmation&s=php&p=securite) para lo que nunca debe aparecer en un mensaje de excepción mostrado al usuario (datos sensibles, detalles de implementación).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `throw` interrumpe el desarrollo normal; `try`/`catch` intercepta una excepción por tipo, `finally` se ejecuta en todos los casos. `Exception` (errores de negocio) y `Error` (errores de programación) son dos ramas distintas de `Throwable`. Una excepción personalizada extiende `Exception`; `previous` encadena una nueva excepción a su causa original. |
| **Herramientas utilizables** | `try`/`catch`/`finally`/`throw`, `getMessage()`/`getCode()`/`getPrevious()`, `extends Exception` para un tipo de error de negocio propio. |
| **Trampas a evitar** | Un `throw` nunca interceptado por ningún `try`/`catch`. `catch (Exception $e)` pensando que también intercepta los `Error`. Un `catch` general colocado antes de un `catch` específico. Liberar un recurso solo al final del `try` sin `finally`. Relanzar una excepción sin transmitir `previous`. |
| **Buenas prácticas** | Interceptar donde el programa pueda reaccionar de verdad. Usar `Throwable` solo para un punto de entrada global. Ordenar los `catch` del más específico al más general. Liberar siempre un recurso en un `finally`. Crear una excepción personalizada en cuanto quien llama deba reaccionar de forma diferente según el tipo de error. Encadenar siempre vía `previous` al relanzar. |
