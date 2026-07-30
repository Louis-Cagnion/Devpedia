---
order: 5
---

# Los formularios

Un formulario HTML recoge los datos introducidos por el usuario para enviarlos a un servidor (a través de `GET` o `POST`; véase el capítulo sobre variables globales en PHP); es el principal punto de entrada de todos los datos del usuario en una aplicación web.

## La estructura básica

```html
<form action="/inscription" method="POST">
    <label for="email">Adresse email</label>
    <input type="email" id="email" name="email" required>

    <button type="submit">S'inscrire</button>
</form>
```

- `action` : la URL a la que se envían los datos al realizar el envío.
- `method` : `GET` (datos visibles en la URL, por ejemplo, para una búsqueda) o `POST` (datos en el cuerpo de la solicitud, para datos sensibles o de gran volumen; véase el capítulo sobre variables globales en PHP para conocer la diferencia completa).
- `name` En cada campo: es este valor, y **no** `id`, el que identifica el campo en el servidor (por ejemplo, `$_POST['email']` en PHP).

## `<label>` : imprescindible, no es meramente decorativa

```html
<label for="email">Adresse email</label>
<input type="email" id="email" name="email">
```

El atributo «`for`» del «`<label>`» debe coincidir con el «`id`» del campo: al hacer clic en la etiqueta, el campo asociado se activa o se selecciona automáticamente, y un lector de pantalla anuncia dicha etiqueta cuando el usuario llega al campo. Un campo **sin** un «`<label>`» asociado supone un grave problema de accesibilidad, aunque siga siendo comprensible visualmente para un usuario vidente.

## Tipos de campos (`<input>`)

```html
<input type="text" name="nom">
<input type="email" name="email">          <!-- validation basique du format email par le navigateur -->
<input type="password" name="motdepasse">  <!-- masque la saisie -->
<input type="number" name="age" min="0" max="120">
<input type="date" name="naissance">
<input type="checkbox" name="accepte" value="oui">
<input type="radio" name="genre" value="h"> <input type="radio" name="genre" value="f">
<input type="file" name="document">
<input type="hidden" name="token" value="abc123">
```

> **Nota:** dos botones de opción que comparten el mismo «`name`» forman un **grupo**; solo se puede seleccionar uno de ellos a la vez, a diferencia de las casillas de selección (`checkbox`), que son independientes entre sí incluso cuando comparten el mismo «`name`».

## `<textarea>` y `<select>`

```html
<textarea name="message" rows="5" cols="30"></textarea>

<select name="pays">
    <option value="fr">France</option>
    <option value="be" selected>Belgique</option>
</select>
```

## Validación en el navegador

```html
<input type="email" name="email" required>
<input type="text" name="pseudo" minlength="3" maxlength="20" pattern="[A-Za-z0-9]+">
```

| Atributo | Función |
|---|---|
| `required` | El campo no puede estar vacío al enviar el formulario |
| `minlength` / `maxlength` | Longitud mínima/máxima de la entrada |
| `min` / `max` | Valor mínimo/máximo (para `number`, `date`...) |
| `pattern` | Una expresión regular (véase el capítulo correspondiente) que debe cumplir el valor |

> **Nota (seguridad):** esta validación se realiza **en el navegador**, incluso antes del envío; mejora la experiencia del usuario (respuesta inmediata), pero **nunca** sustituye a una validación del lado del servidor (véase el capítulo sobre seguridad en PHP). Un usuario malintencionado puede eludir por completo el navegador (solicitud HTTP directa); por lo tanto, todos los datos recibidos en el servidor deben volver a validarse, sin excepción.

## Presentación y método

```html
<button type="submit">Envoyer</button>    <!-- soumet le formulaire -->
<button type="reset">Réinitialiser</button> <!-- vide tous les champs -->
<button type="button">Ne fait rien seul</button>  <!-- utile pour un comportement géré en JavaScript -->
```
