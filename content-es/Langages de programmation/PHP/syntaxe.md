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
if ($conectado) {
    echo "<p>¡Bienvenido!</p>";
}
```

**Sintaxis alternativa (con `:` y `end...`)**, pensada para combinar PHP y HTML de forma más limpia:

```php
<?php if ($conectado): ?>
    <p>¡Bienvenido, <?= htmlspecialchars($usuario) ?>!</p>
<?php endif; ?>
```

> **Nota:** `<?= $usuario ?>` es un atajo para `<?php echo $usuario; ?>`, de esta forma puedes usar las variables de PHP dentro del HTML. En cuanto la variable mostrada pueda proceder de una entrada del usuario (un nombre de usuario, por ejemplo), hay que rodearla con `htmlspecialchars()` como arriba (véase [Protege tus datos](/?c=langages-de-programmation&s=php&p=securite) para la vulnerabilidad XSS que esto evita).

Ambas formas de escritura hacen exactamente lo mismo:
- Con las llaves `{ }`, todo se escribe en PHP, y el HTML debe mostrarse mediante `echo`.
- Con `:` y `end...`, se puede salir de PHP (`?>`), escribir HTML normal, y luego volver a PHP (`<?php`) para cerrar la estructura.

| Clásica | Alternativa |
|---|---|
| `if (...) { }` | `if (...): ... endif;` |
| `foreach (...) { }` | `foreach (...): ... endforeach;` |
| `while (...) { }` | `while (...): ... endwhile;` |
| `for (...) { }` | `for (...): ... endfor;` |

La sintaxis clásica es la más utilizada en el código PHP "puro". La sintaxis alternativa se usa sobre todo en las plantillas que muestran HTML.

En PHP, también debes terminar cada instrucción con un `;`, tanto en sintaxis clásica como en sintaxis alternativa.

## Los comentarios

Para escribir comentarios en PHP, tienes 2 opciones:

```php
<?php
    // Comentario en una sola línea
    # Alternativa para una sola línea

    /*
        Comentario
        en
        varias
        líneas.
    */
?>
```

> **Nota:** `//` es la convención más extendida para escribir un comentario en una sola línea.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El código PHP se escribe entre `<?php ?>`; la sintaxis alternativa (`:`/`end...`) facilita la combinación con HTML. Cada instrucción termina con `;`. |
| **Herramientas utilizables** | `<?= $var ?>` (atajo de visualización), comentarios `//`, `#`, `/* */`. |
| **Trampas a evitar** | Mostrar un dato del usuario sin `htmlspecialchars()`: riesgo de vulnerabilidad XSS. |
| **Buenas prácticas** | Omitir la etiqueta de cierre `?>` al final de un archivo 100% PHP; usar la sintaxis alternativa en las plantillas que combinan PHP y HTML. |
