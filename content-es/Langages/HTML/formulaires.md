---
order: 5
---

# Los formularios

Un formulario HTML recoge datos introducidos por el usuario, para enviarlos a un servidor (mediante `GET` o `POST`; véase [Los intercambios de datos: API y HTTP](/?c=infrastructure&p=api-et-http)): es el principal punto de entrada de cualquier dato de usuario en una aplicación web.

## La estructura básica

```html
<form action="/registro" method="POST">
    <label for="email">Dirección de correo electrónico</label>
    <input type="email" id="email" name="email" required>

    <button type="submit">Registrarse</button>
</form>
```

- `action`: la URL hacia la que se envían los datos al enviar el formulario.
- `method`: `GET` (datos visibles en la URL, por ejemplo para una búsqueda) o `POST` (datos en el cuerpo de la solicitud, para datos sensibles o voluminosos; véase [Los intercambios de datos: API y HTTP](/?c=infrastructure&p=api-et-http) para la diferencia completa).
- `name` en cada campo: es este valor, **no** `id`, el que identifica el campo del lado del servidor (`$_POST['email']` en [PHP](/?c=langages-de-programmation&s=php&p=php), por ejemplo).

## `<label>`: indispensable, no decorativo

```html
<label for="email">Dirección de correo electrónico</label>
<input type="email" id="email" name="email">
```

El atributo `for` del `<label>` debe corresponder al `id` del campo: al hacer clic en la etiqueta se activa/enfoca entonces automáticamente el campo asociado, y un lector de pantalla anuncia esta etiqueta cuando el usuario llega al campo. Un campo **sin** `<label>` asociado es un problema de accesibilidad grave, incluso si sigue siendo visualmente comprensible para un usuario vidente.

## Tipos de campos (`<input>`)

```html
<input type="text" name="nombre">
<input type="email" name="email">              <!-- validación básica del formato del correo por parte del navegador -->
<input type="password" name="contrasena">      <!-- oculta la entrada -->
<input type="number" name="edad" min="0" max="120">
<input type="date" name="nacimiento">
<input type="checkbox" name="acepta" value="si">
<input type="radio" name="genero" value="h"> <input type="radio" name="genero" value="m">
<input type="file" name="documento">
<input type="hidden" name="token" value="abc123">
```

> **Nota (seguridad):** un campo oculto que lleva un token (como `token` arriba) es el mecanismo habitual de protección contra el **CSRF** (*Cross-Site Request Forgery*); véase [La seguridad](/?c=langages-de-programmation&s=php&p=securite) para el detalle de este ataque y de su protección. El campo es invisible para el usuario, pero se envía junto con el resto del formulario al enviarlo.

> **Nota:** dos botones de opción que comparten el mismo `name` forman un **grupo**: solo se puede seleccionar uno de ellos a la vez, a diferencia de las casillas de verificación (`checkbox`), independientes entre sí incluso con el mismo `name`.

## `<textarea>` y `<select>`

```html
<textarea name="mensaje" rows="5" cols="30"></textarea>

<select name="pais">
    <option value="es">España</option>
    <option value="mx" selected>México</option>
</select>
```

## Validación del lado del navegador

```html
<input type="email" name="email" required>
<input type="text" name="usuario" minlength="3" maxlength="20" pattern="[A-Za-z0-9]+">
```

| Atributo | Función |
|---|---|
| `required` | El campo no puede estar vacío al enviar el formulario |
| `minlength` / `maxlength` | Longitud mínima/máxima de la entrada |
| `min` / `max` | Valor mínimo/máximo (para `number`, `date`...) |
| `pattern` | Una [expresión regular](/?c=domain-specific-languages-dsl&p=regex) que el valor debe respetar |

> **Nota (seguridad):** esta validación ocurre **del lado del navegador**, incluso antes del envío; mejora la experiencia del usuario (respuesta inmediata), pero **nunca** sustituye a una validación del lado del servidor (véase [La seguridad](/?c=langages-de-programmation&s=php&p=securite)). Un usuario malintencionado puede eludir por completo el navegador (solicitud HTTP directa): todo dato recibido del lado del servidor debe volver a validarse, sin excepción.

## Envío y método

```html
<button type="submit">Enviar</button>              <!-- envía el formulario -->
<button type="reset">Restablecer</button>           <!-- vacía todos los campos -->
<button type="button">No hace nada por sí solo</button>  <!-- útil para un comportamiento gestionado en JavaScript -->
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un formulario recoge datos de usuario y los envía mediante `GET` (URL) o `POST` (cuerpo de la solicitud). `name` (no `id`) identifica cada campo del lado del servidor; `<label>` es indispensable para la accesibilidad. |
| **Herramientas utilizables** | Atributos de validación del navegador (`required`, `minlength`/`maxlength`, `min`/`max`, `pattern`); tipos de campo (`email`, `password`, `number`, `date`...). |
| **Trampas a evitar** | Confiar únicamente en la validación del lado del navegador: un usuario malintencionado puede eludirla por completo; un campo sin `<label>` asociado. |
| **Buenas prácticas** | Volver a validar siempre del lado del servidor cualquier dato recibido, sin excepción; usar un token CSRF en todo formulario que modifique datos. |
