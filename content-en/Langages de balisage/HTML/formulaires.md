---
order: 5
---

# Forms

An HTML form collects data entered by the user, to send it to a server (via `GET` or `POST`, see [Data Exchange: API and HTTP](/?c=infrastructure&p=api-et-http)): it's the main entry point for all user data in a web application.

## Basic structure

```html
<form action="/signup" method="POST">
    <label for="email">Email address</label>
    <input type="email" id="email" name="email" required>

    <button type="submit">Sign up</button>
</form>
```

- `action`: the URL the data is sent to on submission.
- `method`: `GET` (data visible in the URL, for a search for example) or `POST` (data in the request body, for sensitive or large amounts of data; see [Data Exchange: API and HTTP](/?c=infrastructure&p=api-et-http) for the full difference).
- `name` on each field: it's this value, **not** `id`, that identifies the field server-side (`$_POST['email']` in PHP, for example).

## `<label>`: essential, not decorative

```html
<label for="email">Email address</label>
<input type="email" id="email" name="email">
```

The `<label>`'s `for` attribute must match the field's `id`: clicking the label then automatically activates/focuses the associated field, and a screen reader announces this label when the user reaches the field. A field **without** an associated `<label>` is a major accessibility problem, even if it remains visually understandable to a sighted user.

## Field types (`<input>`)

```html
<input type="text" name="name">
<input type="email" name="email">          <!-- basic email format validation by the browser -->
<input type="password" name="password">   <!-- masks the input -->
<input type="number" name="age" min="0" max="120">
<input type="date" name="birthdate">
<input type="checkbox" name="accepts" value="yes">
<input type="radio" name="gender" value="m"> <input type="radio" name="gender" value="f">
<input type="file" name="document">
<input type="hidden" name="token" value="abc123">
```

> **Note (security):** a hidden field carrying a token (like `token` above) is the usual mechanism for protecting against **CSRF** (*Cross-Site Request Forgery*); see [Security](/?c=langages-de-programmation&s=php&p=securite) for the details of this attack and its protection. The field is invisible to the user, but is indeed sent along with the rest of the form on submission.

> **Note:** two radio buttons sharing the same `name` form a **group**: only one of them can be selected at a time, unlike checkboxes, which are independent of each other even with the same `name`.

## `<textarea>` and `<select>`

```html
<textarea name="message" rows="5" cols="30"></textarea>

<select name="country">
    <option value="fr">France</option>
    <option value="be" selected>Belgium</option>
</select>
```

## Browser-side validation

```html
<input type="email" name="email" required>
<input type="text" name="username" minlength="3" maxlength="20" pattern="[A-Za-z0-9]+">
```

| Attribute | Role |
|---|---|
| `required` | The field cannot be empty on submission |
| `minlength` / `maxlength` | Minimum/maximum length of the input |
| `min` / `max` | Minimum/maximum value (for `number`, `date`...) |
| `pattern` | A [regular expression](/?c=domain-specific-languages-dsl&p=regex) the value must match |

> **Note (security):** this validation happens **browser-side**, before the data is even sent; it improves the user experience (immediate feedback), but **never** replaces server-side validation (see [Security](/?c=langages-de-programmation&s=php&p=securite)). A malicious user can bypass the browser entirely (direct HTTP request): any data received server-side must be revalidated, without exception.

## Submission and method

```html
<button type="submit">Send</button>              <!-- submits the form -->
<button type="reset">Reset</button>               <!-- clears all fields -->
<button type="button">Does nothing on its own</button>  <!-- useful for behavior handled in JavaScript -->
```

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A form collects user data and sends it via `GET` (URL) or `POST` (request body). `name` (not `id`) identifies each field server-side; `<label>` is essential for accessibility. |
| **Available Tools** | Browser validation attributes (`required`, `minlength`/`maxlength`, `min`/`max`, `pattern`); field types (`email`, `password`, `number`, `date`...). |
| **Pitfalls to Avoid** | Relying solely on browser-side validation: a malicious user can bypass it entirely; a field with no associated `<label>`. |
| **Best Practices** | Always revalidate every piece of received data server-side, without exception; use a CSRF token on any form that modifies data. |
