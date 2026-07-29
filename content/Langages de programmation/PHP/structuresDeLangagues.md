---
order: 5
---

# Les structures de langage

Une **structure de langage** (*language construct*) est une instruction intégrée directement au cœur du langage PHP. Contrairement à une fonction, elle n'est pas définie par du code, elle fait partie de la syntaxe même du langage — au même titre que `if`, `for`, ou `;`.

## Différences avec une fonction

Cette nature particulière donne aux structures de langage certaines libertés d'écriture qu'une fonction classique n'a pas :

```php
<?php
    // Les parenthèses sont optionnelles
    include "bienvenue.php";
    include("bienvenue.php"); // équivalent

    // echo peut prendre plusieurs valeurs séparées par des virgules
    echo "Bonjour ", $prenom, " !";

    // print renvoie toujours 1, et peut donc être utilisé dans une expression
    $resultat = print "Hello"; // affiche "Hello", puis $resultat = 1
?>
```

À l'inverse, une fonction comme `strlen()` doit toujours être appelée avec ses parenthèses, et ne peut pas utiliser ces libertés.

## Pourquoi cette distinction existe-t-elle ?

Les structures de langage sont traitées par PHP au moment de l'analyse du code (avant même son exécution), car elles influencent directement le déroulement du script — par exemple, `include` insère du code à un endroit précis, ou `return` interrompt l'exécution d'une fonction. C'est pour ça qu'elles ne peuvent pas être manipulées comme de simples fonctions : on ne peut pas les stocker dans une variable, ni les passer en argument d'une autre fonction.

```php
<?php
    $f = strlen;     // ❌ ne fonctionne pas tel quel pour les fonctions, sauf via string/callable
    $f = "echo";     // ❌ impossible d'appeler echo comme ça, ce n'est pas une fonction
?>
```

## Liste des structures de langage les plus courantes

| Structure | Rôle |
|---|---|
| `echo` | Affiche une ou plusieurs valeurs |
| `print` | Affiche une valeur, renvoie toujours `1` |
| `include` / `require` | Inclut le contenu d'un autre fichier PHP |
| `if` / `else` / `elseif` | Exécute du code selon une condition |
| `for` / `foreach` / `while` / `do-while` | Répète un bloc de code |
| `switch` | Compare une valeur à plusieurs cas possibles |
| `return` | Renvoie une valeur et arrête l'exécution d'une fonction |
| `break` / `continue` | Arrête ou passe au tour suivant d'une boucle |
| `isset()` / `unset()` | Vérifie l'existence / supprime une variable |
| `list()` | Assigne plusieurs variables en une fois depuis un tableau |

> **Note :** vous avez déjà croisé la plupart de ces structures dans les chapitres précédents (conditions, boucles, variables...) sans que cette notion soit nommée explicitement.
