---
order: 5
---

# Les formulaires

Un formulaire HTML collecte des données saisies par l'utilisateur, pour les envoyer à un serveur (via `GET` ou `POST`, cf. chapitre sur les variables globales en PHP) — c'est le point d'entrée principal de toute donnée utilisateur dans une application web.

## La structure de base

```html
<form action="/inscription" method="POST">
    <label for="email">Adresse email</label>
    <input type="email" id="email" name="email" required>

    <button type="submit">S'inscrire</button>
</form>
```

- `action` : l'URL vers laquelle les données sont envoyées à la soumission.
- `method` : `GET` (données visibles dans l'URL, pour une recherche par exemple) ou `POST` (données dans le corps de la requête, pour des données sensibles ou volumineuses — cf. chapitre sur les variables globales en PHP pour la différence complète).
- `name` sur chaque champ : c'est cette valeur, **pas** `id`, qui identifie le champ côté serveur (`$_POST['email']` en PHP, par exemple).

## `<label>` : indispensable, pas décoratif

```html
<label for="email">Adresse email</label>
<input type="email" id="email" name="email">
```

L'attribut `for` du `<label>` doit correspondre à l'`id` du champ — cliquer sur le label active/focalise alors automatiquement le champ associé, et un lecteur d'écran annonce ce label quand l'utilisateur atteint le champ. Un champ **sans** `<label>` associé est un problème d'accessibilité majeur, même s'il reste visuellement compréhensible pour un utilisateur voyant.

## Types de champs (`<input>`)

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

> **Note :** deux boutons radio partageant le même `name` forment un **groupe** — un seul peut être sélectionné à la fois parmi eux, contrairement aux cases à cocher (`checkbox`), indépendantes les unes des autres même avec le même `name`.

## `<textarea>` et `<select>`

```html
<textarea name="message" rows="5" cols="30"></textarea>

<select name="pays">
    <option value="fr">France</option>
    <option value="be" selected>Belgique</option>
</select>
```

## Validation côté navigateur

```html
<input type="email" name="email" required>
<input type="text" name="pseudo" minlength="3" maxlength="20" pattern="[A-Za-z0-9]+">
```

| Attribut | Rôle |
|---|---|
| `required` | Le champ ne peut pas être vide à la soumission |
| `minlength` / `maxlength` | Longueur minimale/maximale de la saisie |
| `min` / `max` | Valeur minimale/maximale (pour `number`, `date`...) |
| `pattern` | Une expression régulière (cf. chapitre dédié) que la valeur doit respecter |

> **Note (sécurité) :** cette validation se produit **côté navigateur**, avant même l'envoi — elle améliore l'expérience utilisateur (retour immédiat), mais ne remplace **jamais** une validation côté serveur (cf. chapitre sur la sécurité en PHP). Un utilisateur malveillant peut contourner entièrement le navigateur (requête HTTP directe) — toute donnée reçue côté serveur doit être revalidée, sans exception.

## Soumission et méthode

```html
<button type="submit">Envoyer</button>    <!-- soumet le formulaire -->
<button type="reset">Réinitialiser</button> <!-- vide tous les champs -->
<button type="button">Ne fait rien seul</button>  <!-- utile pour un comportement géré en JavaScript -->
```
