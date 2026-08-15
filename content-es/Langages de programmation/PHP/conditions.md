---
order: 3
---

# Condiciones

Las condiciones permiten ejecutar un bloque de código únicamente si una expresión es verdadera (o falsa). En PHP, se usan principalmente `if`, `else`, `elseif` y `switch`.

## La condición `if`

```php
<?php
    $edad = 18;

    if ($edad >= 18) {
        echo "Eres mayor de edad.";
    }
?>
```

## Comparar valores: `==` y `===`

PHP ofrece dos operadores de igualdad, y elegir entre ambos no es algo cosmético.

| Operador | Nombre | Comportamiento |
|---|---|---|
| `==` | igualdad **débil** | convierte los tipos antes de comparar |
| `===` | igualdad **estricta** | compara el tipo **y** el valor, sin conversión |

```php
<?php
    $a = "10";
    $b = "1e1";   // notación científica: vale 10
    $c = 10;

    var_dump($a == $b);   // true  -> ambas cadenas son numéricas: 10 == 10
    var_dump($a === $b);  // false -> mismo tipo (string) pero contenido literal diferente
    var_dump($a == $c);   // true  -> "10" convertida a entero
    var_dump($a === $c);  // false -> string e int son tipos diferentes
?>
```

Esta conversión automática se llama **type juggling**. Es cómoda cuando se procesan datos de formulario (siempre recibidos como cadenas), pero produce resultados difíciles de prever en cuanto los tipos se mezclan.

**Regla práctica:** usa `===` por defecto, y reserva `==` para los casos en que quieras explícitamente una conversión.

> Atención, el `switch` de PHP compara con `==` (comparación débil), no con `===`. Para una comparación estricta, prefiere una cadena de `if`/`elseif`, o `match` (PHP 8+), que usa `===`.

El type juggling también tiene una consecuencia directa en seguridad al comparar cadenas de hash (ver el capítulo [Protege tus datos](/?c=langages-de-programmation&s=php&p=securite)).

## `if` / `else`

El bloque `else` permite ejecutar código cuando la condición del `if` es falsa:

```php
<?php
    $edad = 16;

    if ($edad >= 18) {
        echo "Eres mayor de edad.";
    } else {
        echo "Eres menor de edad.";
    }
?>
```

## `elseif`

Para comprobar varias condiciones seguidas, se usa `elseif`:

```php
<?php
    $nota = 12;

    if ($nota >= 16) {
        echo "Sobresaliente";
    } elseif ($nota >= 14) {
        echo "Notable";
    } elseif ($nota >= 10) {
        echo "Aprobado";
    } else {
        echo "Suspenso";
    }
?>
```

> **Nota:** también puedes escribir `else if` (en dos palabras); el comportamiento es idéntico a `elseif`.

## Sintaxis alternativa

Como con las demás estructuras de control, las condiciones se pueden escribir con `:` y `end...`, práctico para combinar con HTML:

```php
<?php if ($edad >= 18): ?>
    <p>Eres mayor de edad.</p>
<?php elseif ($edad >= 13): ?>
    <p>Eres adolescente.</p>
<?php else: ?>
    <p>Eres un niño.</p>
<?php endif; ?>
```

| Clásica | Alternativa |
|---|---|
| `if (...) { }` | `if (...): ... endif;` |
| `if (...) { } else { }` | `if (...): ... else: ... endif;` |
| `if (...) { } elseif (...) { }` | `if (...): ... elseif (...): ... endif;` |

## El operador ternario

Para condiciones cortas que devuelven un valor, se puede usar el operador ternario en lugar de un `if`/`else`:

```php
<?php
    $edad = 20;
    $estado = ($edad >= 18) ? "mayor de edad" : "menor de edad";

    echo $estado;
?>
```

También existe una versión abreviada, útil para dar un valor por defecto:

```php
<?php
    $apodo = $apodo ?? "Invitado";
?>
```

Aquí, `??` (operador de fusión nula) devuelve `$apodo` si existe y no es `null`, y si no, devuelve `"Invitado"`.

## El `switch`

Cuando hay que comparar una misma variable con varios valores posibles, `switch` suele ser más legible que una larga cadena de `elseif`:

```php
<?php
    $dia = 3;

    switch ($dia) {
        case 1:
            echo "Lunes";
            break;
        case 2:
            echo "Martes";
            break;
        case 3:
            echo "Miércoles";
            break;
        default:
            echo "Otro día";
            break;
    }
?>
```

> **Nota:** no olvides el `break;` al final de cada `case`, si no la ejecución continúa en el `case` siguiente (comportamiento llamado *fall-through*).

El `switch` también tiene su sintaxis alternativa, que usa `:` en lugar de llaves, pero conserva `case` y `break`:

```php
<?php switch ($dia):
    case 1:
        echo "Lunes";
        break;
    default:
        echo "Otro día";
        break;
endswitch; ?>
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `if`/`elseif`/`else` y `switch` estructuran el control de flujo. `switch` compara con `==` (débil), a diferencia de `match` (PHP 8+), que usa `===`. |
| **Herramientas utilizables** | Operador ternario `? :`, fusión nula `??`, sintaxis alternativa (`:`/`end...`) para las plantillas. |
| **Trampas a evitar** | Usar `==` por costumbre (type juggling); olvidar `break;` en un `case` (*fall-through*). |
| **Buenas prácticas** | Usar `===` por defecto; preferir `match` a `switch` cuando se necesita una comparación estricta. |
