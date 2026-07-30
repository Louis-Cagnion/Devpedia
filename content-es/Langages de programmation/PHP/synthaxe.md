---
order: 1
---

# La sintaxis de PHP

Para escribir y manipular código en PHP, tendrás que abrir etiquetas:

```php
<?php
    // código...
?>
```

Fuera de estas etiquetas, lo que escribas se considerará texto normal, y no código PHP.

> **Nota:** en un archivo que contenga únicamente código PHP, se recomienda omitir la etiqueta de cierre `?>` al final del archivo, para evitar problemas de espacios o saltos de línea involuntarios en la salida.

## Sintaxis clásica y sintaxis alternativa

PHP ofrece dos formas de escribir las estructuras de control (`if`, `foreach`, `while`, `for`...).

**Sintaxis clásica (con llaves)**:

```php
<?php
if ($connecte) {
    echo "<p>Bienvenue !</p>";
}
```

**Sintaxis alternativa (con `:` y `end...`)**, diseñada para combinar PHP y HTML de forma más limpia:

```php
<?php if ($connecte): ?>
    <p>Bienvenue <?= htmlspecialchars($user) ?>!</p>
<?php endif; ?>
```

> **Nota:** «`<?= $user ?>`» es un atajo para «`<?php echo $user; ?>`», de esta forma puedes utilizar las variables de PHP en el HTML. Siempre que la variable que se muestra pueda proceder de una entrada del usuario (un nombre de usuario, por ejemplo), hay que rodearla de `htmlspecialchars()` como se ha indicado anteriormente; véase el capítulo sobre seguridad para conocer la vulnerabilidad XSS que esto evita.

Ambas sintaxis hacen exactamente lo mismo:
- Con las llaves `{ }`, todo está escrito en PHP, y el HTML debe visualizarse a través de `echo`.
- Con `:` y `end...`, se puede salir de PHP (`?>`), escribir HTML normal y, a continuación, volver a PHP (`<?php`) para cerrar la estructura.

| Clásica | Alternativa |
|---|---|
| `if (...) { }` | `if (...): ... endif;` |
| `foreach (...) { }` | `foreach (...): ... endforeach;` |
| `while (...) { }` | `while (...): ... endwhile;` |
| `for (...) { }` | `for (...): ... endfor;` |

La sintaxis clásica es la más utilizada en el código PHP «puro». La sintaxis alternativa se utiliza sobre todo en las plantillas que muestran código HTML.

En PHP, también debes terminar cada instrucción con un «`;`», tanto si utilizas la sintaxis clásica como la alternativa.

## Los comentarios

Para escribir comentarios en PHP, tienes dos opciones:

```php
<?php
    // Comentario de una sola línea
    # Alternative pour une seule ligne

    /*
        Commentaire
        sur
        plusieurs
        lignes.
    */
?>
```

> **Nota:** «`//`» es la convención más extendida para escribir un comentario en una sola línea.
