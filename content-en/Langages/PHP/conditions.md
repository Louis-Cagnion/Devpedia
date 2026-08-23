---
order: 3
---

# Conditions

Conditional statements allow a block of code to be executed only if an expression is true (or false). In PHP, the most commonly used conditional operators are `if`, `else`, `elseif`, and `switch`.

## `if`'s Condition

```php
<?php
    $age = 18;

    if ($age >= 18) {
        echo "Vous êtes majeur.";
    }
?>
```

## `if` / `else`

The `else` block allows you to execute code when the condition in `if` is false:

```php
<?php
    $age = 16;

    if ($age >= 18) {
        echo "Vous êtes majeur.";
    } else {
        echo "Vous êtes mineur.";
    }
?>
```

## `elseif`

To test multiple conditions in sequence, use `elseif`:

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

> **Note:** You can also write "`else if`" (as two separate words); the behavior is the same as "`elseif`".

## Alternative Syntax

As with other control structures, conditions can be written using `:` and `end...`, which is useful for mixing with [HTML](/?c=langages-de-balisage&s=html&p=html):

```php
<?php if ($age >= 18): ?>
    <p>Vous êtes majeur.</p>
<?php elseif ($age >= 13): ?>
    <p>Vous êtes adolescent.</p>
<?php else: ?>
    <p>Vous êtes enfant.</p>
<?php endif; ?>
```

| Classic | Alternative |
|---|---|
| `if (...) { }` | `if (...): ... endif;` |
| `if (...) { } else { }` | `if (...): ... else: ... endif;` |
| `if (...) { } elseif (...) { }` | `if (...): ... elseif (...): ... endif;` |

## The ternary operator

For short expressions that return a value, you can use the ternary operator instead of a `if` or `else`:

```php
<?php
    $age = 20;
    $statut = ($age >= 18) ? "majeur" : "mineur";

    echo $statut;
?>
```

There is also a shortened version, which is useful for setting a default value:

```php
<?php
    $pseudo = $pseudo ?? "Invité";
?>
```

Here, `??` (the null coalescing operator) returns `$pseudo` if it exists and is not `null`; otherwise, it returns `"Invité"`.

## 

When you need to compare a single variable to several possible values, `switch` is often more readable than a long string of `elseif`:

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

> **Note:** Don't forget to include the `break;` at the end of each `case`; otherwise, execution will continue into the next `case` (a behavior known as *"fall-through"*).

`switch` also has an alternative syntax, which uses `:` instead of curly braces, but retains `case` and `break`:

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
