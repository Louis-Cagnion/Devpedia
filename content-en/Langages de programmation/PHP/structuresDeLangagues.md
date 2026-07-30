---
order: 5
---

# Language Structures

**A language*** ***construct** is a **feature** built directly into the core of the PHP language. Unlike a function, it is not defined by code; rather, it is part of the language's syntax itself—just like `if`, `for`, or `;`.

## Differences from a function

This particular nature gives language structures certain writing freedoms that a classical function does not have:

```php
<?php
    // Parentheses are optional
    include "bienvenue.php";
    include("bienvenue.php"); // equivalent

    // echo can accept multiple values separated by commas
    echo "Bonjour ", $prenom, " !";

    // print always returns 1, so it can be used in an expression
    $result = print "Hello"; // prints "Hello", then $result = 1
?>
```

Conversely, a function like `strlen()` must always be called with parentheses and cannot take advantage of these flexibilities.

## Why does this distinction exist?

Language constructs are processed by PHP during code parsing (even before execution), because they directly influence the flow of the script—for example, `include` inserts code at a specific location, or `return` interrupts the execution of a function. That is why they cannot be treated like ordinary functions: they cannot be stored in a variable or passed as an argument to another function.

```php
<?php
    $f = strlen;     // ❌ Does not work as-is for functions, except via string/callable
    $f = "echo";     // ❌ You can't call `echo` like that—it's not a function.
?>
```

## List of the Most Common Language Structures

| Structure | Role |
|---|---|
| `echo` | Displays one or more values |
| `print` | Displays a value; always returns `1` |
| `include` / `require` | Includes the contents of another PHP file |
| `if` / `else` / `elseif` | Executes code based on a condition |
| `for` / `foreach` / `while` / `do-while` | Repeat a block of code |
| `switch` | Compares a value to several possible cases |
| `return` | Returns a value and stops the execution of a function |
| `break` / `continue` | Stop or proceed to the next iteration of a loop |
| `isset()` / `unset()` | Checks for the existence of / deletes a variable |
| `list()` | Assigns multiple variables at once from an array |

> **Note:** You have already encountered most of these constructs in previous chapters (conditions, loops, variables, etc.) without the concept being explicitly named.
