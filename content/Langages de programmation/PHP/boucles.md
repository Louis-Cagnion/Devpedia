---
order: 4
---

# Les boucles

Les boucles permettent de répéter un bloc de code plusieurs fois, tant qu'une condition est vraie ou pour chaque élément d'une collection. En PHP, on utilise principalement `while`, `do while`, `for` et `foreach`.

## La boucle `while`

Le code s'exécute en boucle tant que la condition reste vraie. La condition est testée **avant** chaque tour de boucle :

```php
<?php
    $i = 0;

    while ($i < 5) {
        echo $i;
        $i++;
    }
?>
```

## La boucle `do while`

Variante du `while`, mais la condition est testée **après** chaque tour. Le code s'exécute donc toujours au moins une fois :

```php
<?php
    $i = 0;

    do {
        echo $i;
        $i++;
    } while ($i < 5);
?>
```

## La boucle `for`

Utile lorsque vous connaissez à l'avance le nombre d'itérations. Elle regroupe en une seule ligne : l'initialisation, la condition, et l'incrémentation :

```php
<?php
    for ($i = 0; $i < 5; $i++) {
        echo $i;
    }
?>
```

## La boucle `foreach`

Conçue spécifiquement pour parcourir les éléments d'un tableau (`array`) :

```php
<?php
    $fruits = ["pomme", "banane", "cerise"];

    foreach ($fruits as $fruit) {
        echo $fruit;
    }
?>
```

Si vous avez besoin de l'index (ou de la clé) en plus de la valeur :

```php
<?php
    $fruits = ["pomme", "banane", "cerise"];

    foreach ($fruits as $index => $fruit) {
        echo "{$index} : {$fruit}";
    }
?>
```

## `break` et `continue`

- `break;` arrête complètement la boucle.
- `continue;` passe directement au tour suivant, sans exécuter le reste du code de l'itération en cours.

```php
<?php
    for ($i = 0; $i < 10; $i++) {
        if ($i == 5) {
            break; // arrête la boucle dès que $i vaut 5
        }
        if ($i % 2 == 0) {
            continue; // ignore les nombres pairs
        }
        echo $i;
    }
?>
```

## Syntaxe alternative

Comme pour les conditions, les boucles peuvent s'écrire avec `:` et `end...` :

| Classique | Alternative |
|---|---|
| `while (...) { }` | `while (...): ... endwhile;` |
| `for (...) { }` | `for (...): ... endfor;` |
| `foreach (...) { }` | `foreach (...): ... endforeach;` |

> **Note :** `do while` ne possède pas de syntaxe alternative en PHP. Vous devez toujours utiliser les accolades `{ }` pour cette boucle.


```php
<?php foreach ($fruits as $fruit): ?>
    <p><?= $fruit ?></p>
<?php endforeach; ?>
```

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `while`/`do while`/`for` sont les boucles classiques ; `foreach` est spécifiquement conçue pour parcourir un tableau, avec ou sans sa clé. |
| **Outils utilisables** | `break`/`continue`, la syntaxe alternative (`:`/`end...`) pour les templates. |
| **Pièges à éviter** | Utiliser `for` avec un index manuel là où `foreach` évite tout risque d'erreur d'index. |
| **Bonnes pratiques** | Préférer `foreach` dès qu'on parcourt un tableau, sans avoir besoin de gérer l'index soi-même. |
