---
order: 5
---

# Language Constructs

A **language construct** is a statement built directly into the core of the PHP language. Unlike a function, it isn't defined by code: it's part of the language's own syntax, just like `if`, `for`, or `;`.

## Differences from a function

This special nature gives language constructs certain writing freedoms that a regular function doesn't have:

```php
<?php
    // Parentheses are optional
    include "welcome.php";
    include("welcome.php"); // equivalent

    // echo can take several values separated by commas
    echo "Hello ", $firstName, "!";

    // print always returns 1, and can therefore be used in an expression
    $result = print "Hello"; // displays "Hello", then $result = 1
?>
```

By contrast, a function like `strlen()` must always be called with its parentheses, and can't use these freedoms.

## Why does this distinction exist?

Language constructs are handled by PHP while the code is being parsed (even before it runs), because they directly affect how the script proceeds: for example, `include` inserts code at a specific spot, or `return` stops a function's execution. That's why they can't be manipulated like plain functions: they can't be stored in a variable, nor passed as an argument to another function.

```php
<?php
    $f = strlen;     // ❌ doesn't work as-is for functions, except via string/callable
    $f = "echo";     // ❌ can't call echo this way, it's not a function
?>
```

## List of the most common language constructs

| Construct | Role |
|---|---|
| `echo` | Displays one or more values |
| `print` | Displays a value, always returns `1` |
| `include` / `require` | Includes the content of another PHP file |
| `if` / `else` / `elseif` | Runs code based on a condition |
| `for` / `foreach` / `while` / `do-while` | Repeats a block of code |
| `switch` | Compares a value against several possible cases |
| `return` | Returns a value and stops a function's execution |
| `break` / `continue` | Stops or skips to the next iteration of a loop |
| `isset()` / `unset()` | Checks whether a variable exists / deletes it |
| `list()` | Assigns several variables at once from an array |

> **Note:** you've already come across most of these constructs in earlier chapters (conditions, loops, variables...) without this concept being named explicitly.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A language construct (`echo`, `include`, `if`, `return`...) is part of the language's own syntax, unlike a function: it benefits from writing freedoms (optional parentheses, can't be stored in a variable). |
| **Tools you can use** | `echo`/`print`, `include`/`require`, `isset()`/`unset()`, `list()`. |
| **Pitfalls to avoid** | Trying to store a language construct in a variable or pass it as an argument, like a regular function. |
| **Best practices** | Use `include`/`require` rather than a custom function to load a file: it's the native mechanism designed for that. |
