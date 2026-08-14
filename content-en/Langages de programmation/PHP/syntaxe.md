---
order: 1
---

# PHP Syntax

To write and work with PHP code, you'll need to open tags:

```php
<?php
    // code...
?>
```

Outside these tags, whatever you write will be treated as regular text, not as PHP code.

> **Note:** In a file containing only PHP code, it is recommended to omit the closing `?>` tag at the end of the file to avoid unintended spaces or line breaks in the output.

## Standard Syntax and Alternative Syntax

PHP offers two ways to write control structures (`if`, `foreach`, `while`, `for`...).

**Standard syntax (with curly braces)**:

```php
<?php
if ($connecte) {
    echo "<p>Bienvenue !</p>";
}
```

**Alternative syntax (using `:` and `end...`)**, designed to blend PHP and HTML more seamlessly:

```php
<?php if ($connecte): ?>
    <p>Bienvenue <?= htmlspecialchars($user) ?>!</p>
<?php endif; ?>
```

> **Note:** `<?= $user ?>` is a shorthand for `<?php echo $user; ?>`; this allows you to use PHP variables in HTML. Whenever the displayed variable could come from user input (a username, for example), you must enclose it in `htmlspecialchars()` as shown above: see the chapter on security for the XSS vulnerability this prevents.

Both lines of code do exactly the same thing:
- With the curly braces `{ }`, everything is written in PHP, and the HTML must be displayed via `echo`.
- With `:` and `end...`, you can exit PHP (`?>`), write regular HTML, and then return to PHP (`<?php`) to close the structure.

| Classic | Alternative |
|---|---|
| `if (...) { }` | `if (...): ... endif;` |
| `foreach (...) { }` | `foreach (...): ... endforeach;` |
| `while (...) { }` | `while (...): ... endwhile;` |
| `for (...) { }` | `for (...): ... endfor;` |

The standard syntax is the most commonly used in "pure" PHP code. The alternative syntax is mainly used in templates that render HTML.

In PHP, you must also end each statement with a `;`, whether you're using standard or alternative syntax.

## Comments

To write comments in PHP, you have two options:

```php
<?php
    // Single-line comment
    # Alternative pour une seule ligne

    /*
        Commentaire
        sur
        plusieurs
        lignes.
    */
?>
```

> **Note:** `//` is the most common convention for writing a single-line comment.
