---
order: 3
---

# Conditions

Conditions let a block of code run only if an expression is true (or false). In PHP, the main ones used are `if`, `else`, `elseif`, and `switch`.

## The `if` condition

```php
<?php
    $age = 18;

    if ($age >= 18) {
        echo "You are an adult.";
    }
?>
```

## Comparing values: `==` and `===`

PHP offers two equality operators, and the choice between them isn't cosmetic.

| Operator | Name | Behavior |
|---|---|---|
| `==` | **loose** equality | converts the types before comparing |
| `===` | **strict** equality | compares type **and** value, with no conversion |

```php
<?php
    $a = "10";
    $b = "1e1";   // scientific notation: equals 10
    $c = 10;

    var_dump($a == $b);   // true  -> both strings are numeric: 10 == 10
    var_dump($a === $b);  // false -> same type (string) but different literal content
    var_dump($a == $c);   // true  -> "10" converted to an integer
    var_dump($a === $c);  // false -> string and int are different types
?>
```

This automatic conversion is called **type juggling**. It's convenient when handling form data (always received as strings), but it produces results that are hard to predict as soon as types start mixing.

**Rule of thumb:** use `===` by default, and reserve `==` for cases where you explicitly want a conversion.

> Watch out: PHP's `switch` compares with `==` (loose comparison), not `===`. For a strict comparison, prefer a chain of `if`/`elseif`, or `match` (PHP 8+) which uses `===`.

Type juggling also has a direct security consequence when comparing hash strings (see the chapter on [securing your data](/?c=langages&s=php&p=securite)).

## `if` / `else`

The `else` block lets you run code when the `if`'s condition is false:

```php
<?php
    $age = 16;

    if ($age >= 18) {
        echo "You are an adult.";
    } else {
        echo "You are a minor.";
    }
?>
```

## `elseif`

To test several conditions in sequence, `elseif` is used:

```php
<?php
    $grade = 12;

    if ($grade >= 16) {
        echo "Highest Honors";
    } elseif ($grade >= 14) {
        echo "Honors";
    } elseif ($grade >= 10) {
        echo "Pass";
    } else {
        echo "Fail";
    }
?>
```

> **Note:** you can also write `else if` (as two words); the behavior is identical to `elseif`.

## Alternative syntax

As with other control structures, conditions can be written with `:` and `end...`, handy for mixing with [HTML](/?c=langages&s=html&p=html):

```php
<?php if ($age >= 18): ?>
    <p>You are an adult.</p>
<?php elseif ($age >= 13): ?>
    <p>You are a teenager.</p>
<?php else: ?>
    <p>You are a child.</p>
<?php endif; ?>
```

| Classic | Alternative |
|---|---|
| `if (...) { }` | `if (...): ... endif;` |
| `if (...) { } else { }` | `if (...): ... else: ... endif;` |
| `if (...) { } elseif (...) { }` | `if (...): ... elseif (...): ... endif;` |

## The ternary operator

For short conditions that return a value, the ternary operator can be used instead of an `if`/`else`:

```php
<?php
    $age = 20;
    $status = ($age >= 18) ? "adult" : "minor";

    echo $status;
?>
```

There's also a shortened version, handy for giving a default value:

```php
<?php
    $username = $username ?? "Guest";
?>
```

Here, `??` (the null coalescing operator) returns `$username` if it exists and isn't `null`, otherwise it returns `"Guest"`.

## `switch`

When you need to compare the same variable against several possible values, `switch` is often more readable than a long chain of `elseif`:

```php
<?php
    $day = 3;

    switch ($day) {
        case 1:
            echo "Monday";
            break;
        case 2:
            echo "Tuesday";
            break;
        case 3:
            echo "Wednesday";
            break;
        default:
            echo "Other day";
            break;
    }
?>
```

> **Note:** don't forget the `break;` at the end of each `case`, otherwise execution continues into the next `case` (a behavior called *fall-through*).

`switch` also has its alternative syntax, using `:` instead of braces, but keeping `case` and `break`:

```php
<?php switch ($day):
    case 1:
        echo "Monday";
        break;
    default:
        echo "Other day";
        break;
endswitch; ?>
```

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `if`/`elseif`/`else` and `switch` structure control flow. `switch` compares with `==` (loose), unlike `match` (PHP 8+) which uses `===`. |
| **Tools you can use** | Ternary operator `? :`, nullish coalescing `??`, alternative syntax (`:`/`end...`) for templates. |
| **Pitfalls to avoid** | Using `==` out of habit (type juggling); forgetting `break;` in a `case` (*fall-through*). |
| **Best practices** | Use `===` by default; prefer `match` over `switch` when a strict comparison is needed. |
