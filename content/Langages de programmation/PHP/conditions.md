---
order: 3
---

# Les conditions

Les conditions permettent d'exécuter un bloc de code uniquement si une expression est vraie (ou fausse). En PHP, on utilise principalement `if`, `else`, `elseif` et `switch`.

## La condition `if`

```php
<?php
    $age = 18;

    if ($age >= 18) {
        echo "Vous êtes majeur.";
    }
?>
```

## Comparer des valeurs : `==` et `===`

PHP propose deux opérateurs d'égalité, et le choix entre les deux n'est pas cosmétique.

| Opérateur | Nom | Comportement |
|---|---|---|
| `==` | égalité **lâche** | convertit les types avant de comparer |
| `===` | égalité **stricte** | compare le type **et** la valeur, sans conversion |

```php
<?php
    $a = "10";
    $b = "1e1";   // notation scientifique : vaut 10
    $c = 10;

    var_dump($a == $b);    // true  -> les deux chaines sont numeriques : 10 == 10
    var_dump($a === $b);   // false -> meme type (string) mais contenu litteral different
    var_dump($a == $c);    // true  -> "10" convertie en entier
    var_dump($a === $c);   // false -> string et int sont des types differents
?>
```

Cette conversion automatique s'appelle le **type juggling**. Elle est commode quand on traite des données de formulaire (toujours reçues sous forme de chaînes), mais elle produit des résultats difficiles à prévoir dès que les types se mélangent.

**Règle pratique :** utilisez `===` par défaut, et réservez `==` aux cas où vous voulez explicitement une conversion.

> Attention, le `switch` de PHP compare avec `==` (comparaison lâche), pas avec `===`. Pour une comparaison stricte, préférez une chaîne de `if`/`elseif`, ou `match` (PHP 8+) qui utilise `===`.

Le type juggling a aussi une conséquence directe en sécurité lors de la comparaison de chaînes de hachage — voir le chapitre [Sécuriser vos données](/?c=langages-de-programmation&s=php&p=securite).

## `if` / `else`

Le bloc `else` permet d'exécuter du code lorsque la condition du `if` est fausse :

```php
<?php
    $age = 16;

    if ($age >= 18) {
        echo "Vous êtes majeur.";
    } else {
        echo "Vous êtes mineur.";
    }
?>
```

## `elseif`

Pour tester plusieurs conditions à la suite, on utilise `elseif` :

```php
<?php
    $note = 12;

    if ($note >= 16) {
        echo "Mention Très Bien";
    } elseif ($note >= 14) {
        echo "Mention Bien";
    } elseif ($note >= 10) {
        echo "Admis";
    } else {
        echo "Recalé";
    }
?>
```

> **Note :** vous pouvez aussi écrire `else if` (en deux mots), le comportement est identique à `elseif`.

## Syntaxe alternative

Comme pour les autres structures de contrôle, les conditions peuvent s'écrire avec `:` et `end...`, pratique pour mélanger avec du HTML :

```php
<?php if ($age >= 18): ?>
    <p>Vous êtes majeur.</p>
<?php elseif ($age >= 13): ?>
    <p>Vous êtes adolescent.</p>
<?php else: ?>
    <p>Vous êtes enfant.</p>
<?php endif; ?>
```

| Classique | Alternative |
|---|---|
| `if (...) { }` | `if (...): ... endif;` |
| `if (...) { } else { }` | `if (...): ... else: ... endif;` |
| `if (...) { } elseif (...) { }` | `if (...): ... elseif (...): ... endif;` |

## L'opérateur ternaire

Pour des conditions courtes qui retournent une valeur, on peut utiliser l'opérateur ternaire à la place d'un `if`/`else` :

```php
<?php
    $age = 20;
    $statut = ($age >= 18) ? "majeur" : "mineur";

    echo $statut;
?>
```

Il existe aussi une version raccourcie, utile pour donner une valeur par défaut :

```php
<?php
    $pseudo = $pseudo ?? "Invité";
?>
```

Ici, `??` (opérateur de coalescence nulle) renvoie `$pseudo` s'il existe et n'est pas `null`, sinon il renvoie `"Invité"`.

## Le `switch`

Lorsque vous devez comparer une même variable à plusieurs valeurs possibles, `switch` est souvent plus lisible qu'une longue chaîne de `elseif` :

```php
<?php
    $jour = 3;

    switch ($jour) {
        case 1:
            echo "Lundi";
            break;
        case 2:
            echo "Mardi";
            break;
        case 3:
            echo "Mercredi";
            break;
        default:
            echo "Autre jour";
            break;
    }
?>
```

> **Note :** n'oubliez pas le `break;` à la fin de chaque `case`, sinon l'exécution se poursuit dans le `case` suivant (comportement appelé *fall-through*).

Le `switch` a également sa syntaxe alternative, qui utilise `:` à la place des accolades, mais conserve `case` et `break` :

```php
<?php switch ($jour):
    case 1:
        echo "Lundi";
        break;
    default:
        echo "Autre jour";
        break;
endswitch; ?>
```

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `if`/`elseif`/`else` et `switch` structurent le contrôle de flux. `switch` compare avec `==` (lâche), contrairement à `match` (PHP 8+) qui utilise `===`. |
| **Outils utilisables** | Opérateur ternaire `? :`, coalescence nulle `??`, syntaxe alternative (`:`/`end...`) pour les templates. |
| **Pièges à éviter** | Utiliser `==` par habitude (type juggling) ; oublier `break;` dans un `case` (*fall-through*). |
| **Bonnes pratiques** | Utiliser `===` par défaut ; préférer `match` à `switch` quand une comparaison stricte est nécessaire. |
