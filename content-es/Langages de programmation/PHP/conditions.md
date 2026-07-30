---
order: 3
---

# Condiciones

Las condiciones permiten ejecutar un bloque de código únicamente si una expresión es verdadera (o falsa). En PHP, se utilizan principalmente «`if`», «`else`», «`elseif`» y «`switch`».

## La condición «`if`»

```php
<?php
    $edad = 18;

    if ($edad >= 18) {
        echo "Vous êtes majeur.";
    }
?>
```

## `if` / `else`

El bloque «`else`» permite ejecutar código cuando la condición del «`if`» es falsa:

```php
<?php
    $edad = 16;

    if ($edad >= 18) {
        echo "Vous êtes majeur.";
    } else {
        echo "Vous êtes mineur.";
    }
?>
```

## `elseif`

Para comprobar varias condiciones seguidas, se utiliza «`elseif`»:

```php
<?php
    $note = 12;

    if ($note >= 16) {
        echo "Mention Très Bien";
    } elseif ($note >= 14) {
        echo "Mention Bien";
    } elseif ($note >= 10) {
        echo "Admis";
    } else {
        echo "Recalé";
    }
?>
```

> **Nota:** también puedes escribir «`else if`» (en dos palabras); el comportamiento es idéntico al de «`elseif`».

## Sintaxis alternativa

Al igual que con el resto de estructuras de control, las condiciones se pueden escribir con `:` y `end...`, lo cual resulta práctico para combinarlas con HTML:

```php
<?php if ($edad >= 18): ?>
    <p>Vous êtes majeur.</p>
<?php elseif ($edad >= 13): ?>
    <p>Vous êtes adolescent.</p>
<?php else: ?>
    <p>Vous êtes enfant.</p>
<?php endif; ?>
```

| Clásica | Alternativa |
|---|---|
| `if (...) { }` | `if (...): ... endif;` |
| `if (...) { } else { }` | `if (...): ... else: ... endif;` |
| `if (...) { } elseif (...) { }` | `if (...): ... elseif (...): ... endif;` |

## El operador ternario

Para condiciones breves que devuelven un valor, se puede utilizar el operador ternario en lugar de un «`if`» / «`else`»:

```php
<?php
    $edad = 20;
    $statut = ($edad >= 18) ? "majeur" : "mineur";

    echo $statut;
?>
```

También existe una versión abreviada, útil para establecer un valor por defecto:

```php
<?php
    $pseudo = $pseudo ?? "Invité";
?>
```

En este caso, «`??`» (operador de coalescencia nula) devuelve «`$pseudo`» si existe y no es «`null`»; en caso contrario, devuelve «`"Invité"`».

## El e`switch`

Cuando hay que comparar una misma variable con varios valores posibles, `switch` suele ser más legible que una larga cadena de `elseif`:

```php
<?php
    $jour = 3;

    switch ($jour) {
        case 1:
            echo "Lundi";
            break;
        case 2:
            echo "Mardi";
            break;
        case 3:
            echo "Mercredi";
            break;
        default:
            echo "Autre jour";
            break;
    }
?>
```

> **Nota:** no olvides incluir el «`break;`» al final de cada «`case`», ya que, de lo contrario, la ejecución continuará en el siguiente «`case`» (comportamiento denominado *«fall-through»*).

El lenguaje «`switch`» también cuenta con una sintaxis alternativa, que utiliza «`:`» en lugar de llaves, pero conserva «`case`» y «`break`»:

```php
<?php switch ($jour):
    case 1:
        echo "Lundi";
        break;
    default:
        echo "Autre jour";
        break;
endswitch; ?>
```
