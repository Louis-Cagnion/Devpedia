---
order: 1
---

# La syntaxe de PHP

Pour écrire et manipuler du code en PHP, vous aurez besoin d'ouvrir des balises :

```php
<?php
    //code...
?>
```

À l'extérieur de ces balises, ce que vous écrirez sera considéré comme du texte normal, et non comme du code PHP.

> **Note :** dans un fichier contenant uniquement du PHP, il est recommandé d'omettre la balise fermante `?>` à la fin du fichier, afin d'éviter des problèmes d'espaces ou de saut de ligne involontaires en sortie.

## Syntaxe classique et syntaxe alternative

PHP propose deux façons d'écrire les structures de contrôle (`if`, `foreach`, `while`, `for`...).

**Syntaxe classique (avec accolades)** :

```php
<?php
if ($connecte) {
    echo "<p>Bienvenue !</p>";
}
```

**Syntaxe alternative (avec `:` et `end...`)**, pensée pour mélanger plus proprement PHP et HTML :

```php
<?php if ($connecte): ?>
    <p>Bienvenue <?= htmlspecialchars($user) ?>!</p>
<?php endif; ?>
```

> **Note :** `<?= $user ?>` est un raccourci pour `<?php echo $user; ?>`, de cette manière vous pouvez utiliser les variables PHP dans le HTML. Dès que la variable affichée peut provenir d'une saisie utilisateur (un pseudo, par exemple), il faut l'entourer de `htmlspecialchars()` comme ci-dessus — cf. chapitre sur la sécurité pour la faille XSS que ça évite.

Les deux écritures font exactement la même chose :
- Avec les accolades `{ }`, tout est écrit en PHP, et le HTML doit être affiché via `echo`.
- Avec `:` et `end...`, on peut sortir du PHP (`?>`), écrire du HTML normal, puis revenir en PHP (`<?php`) pour fermer la structure.

| Classique | Alternative |
|---|---|
| `if (...) { }` | `if (...): ... endif;` |
| `foreach (...) { }` | `foreach (...): ... endforeach;` |
| `while (...) { }` | `while (...): ... endwhile;` |
| `for (...) { }` | `for (...): ... endfor;` |

La syntaxe classique est la plus utilisée dans le code "pur" PHP. La syntaxe alternative sert surtout dans les templates qui affichent du HTML.

En PHP, vous devez également terminer chaque instruction par un `;`, que ce soit en syntaxe classique ou alternative.

## Les commentaires

Pour écrire des commentaires en PHP, vous avez 2 options :

```php
<?php
    // Commentaire sur une seule ligne
    # Alternative pour une seule ligne

    /*
        Commentaire
        sur
        plusieurs
        lignes.
    */
?>
```

> **Note :** `//` est la convention la plus répandue pour écrire un commentaire sur une seule ligne.
