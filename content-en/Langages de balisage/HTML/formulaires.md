---
order: 5
---

# Forms

An HTML form collects data entered by the user and sends it to a server (via `GET` or `POST`; see the chapter on global variables in PHP)—this is the main entry point for all user data in a web application.

## The Basic Structure

```html
<form action="/inscription" method="POST">
    <label for="email">Adresse email</label>
    <input type="email" id="email" name="email" required>

    <button type="submit">S'inscrire</button>
</form>
```

- `action` : The URL to which the data is sent upon submission.
- `method` : `GET` (data visible in the URL, for a search, for example) or `POST` (data in the request body, for sensitive or large amounts of data—see the chapter on global variables in PHP for a full explanation of the difference).
- `name` For each field: it is this value—**not** `id`—that identifies the field on the server side (e.g., `$_POST['email']` in PHP).

## `<label>` : essential, not decorative

```html
<label for="email">Adresse email</label>
<input type="email" id="email" name="email">
```

The "`for`" attribute of the `<label>` must match the field's `id`—clicking on the label automatically activates/focuses the associated field, and a screen reader announces this label when the user reaches the field. A field **without** an associated `<label>` is a major accessibility issue, even if it remains visually understandable to a sighted user.

## 

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

> **Note:** Two radio buttons that share the same `name` form a **group**—only one of them can be selected at a time, unlike checkboxes (`checkbox`), which are independent of one another even when they have the same `name`.

## `<textarea>` and `<select>`

```html
<textarea name="message" rows="5" cols="30"></textarea>

<select name="pays">
    <option value="fr">France</option>
    <option value="be" selected>Belgique</option>
</select>
```

## Browser-side validation

```html
<input type="email" name="email" required>
<input type="text" name="pseudo" minlength="3" maxlength="20" pattern="[A-Za-z0-9]+">
```

| Attribute | Role |
|---|---|
| `required` | This field cannot be left blank when submitting |
| `minlength` / `maxlength` | Minimum/maximum input length |
| `min` / `max` | Minimum/maximum value (for `number`, `date`...) |
| `pattern` | A regular expression (see the relevant chapter) that the value must match |

> **Note (security):** This validation occurs **on the browser side**, even before the data is sent—it improves the user experience (immediate feedback), but should **never** replace server-side validation (see the chapter on PHP security). A malicious user can completely bypass the browser (direct HTTP request)—any data received on the server side must be revalidated, without exception.

## Submission and Method

```html
<button type="submit">Envoyer</button>    <!-- soumet le formulaire -->
<button type="reset">Réinitialiser</button> <!-- vide tous les champs -->
<button type="button">Ne fait rien seul</button>  <!-- utile pour un comportement géré en JavaScript -->
```
