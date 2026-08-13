---
order: 6
---

# Les fonctions et méthodes les plus utiles

## Qu'est-ce qu'une fonction / méthode ?

Une **fonction** est un bloc de code réutilisable, qui porte un nom, et qui peut recevoir des informations (des *paramètres*) pour effectuer une action ou renvoyer un résultat (une *valeur de retour*).

```php
<?php
    //fonction classique
    function addition($a, $b) {
        return $a + $b;
    }

    echo addition(2, 3); // affiche 5

    //fonction fléchée
    $double = fn($n) => $n * 2;

    echo $double(5); // affiche 10
?>
```
> **Note :** contrairement à JavaScript, où une fonction fléchée peut s'écrire avec des accolades et un `return` (`(n) => { return n * 2; }`), PHP n'autorise que la forme courte avec une seule expression, sans accolades ni `return` (`fn($n) => $n * 2;`).

Une **méthode**, c'est exactement la même chose qu'une fonction, à une différence près : elle est définie **à l'intérieur d'une classe**, et elle s'utilise sur un objet (voir [La programmation orientée objet](/?c=langages-de-programmation&s=php&p=poo)).

```php
<?php
    class Calculatrice {
        public function addition($a, $b) {
            return $a + $b;
        }
    }

    $calc = new Calculatrice();
    echo $calc->addition(2, 3); // affiche 5
?>
```

En résumé : **fonction** = autonome, appelée directement par son nom. **Méthode** = appartient à un objet, appelée via `->` (ou `::` pour une méthode statique).

## Typer les paramètres et le retour d'une fonction

PHP est typé dynamiquement par défaut, mais accepte des annotations de type sur les paramètres et la valeur de retour. Contrairement à un langage compilé, ces types ne sont pas vérifiés avant l'exécution : ils le sont **à l'exécution**, à chaque appel.

```php
<?php
function calculerRemise(float $prix, int $pourcentage): float
{
    return $prix - ($prix * $pourcentage / 100);
}

calculerRemise(100, 10);     // OK -> 90.0
calculerRemise("cent", 10);  // TypeError : "cent" n'est pas un float
?>
```

## Types nullables (`?Type`)

Une fonction déclarée `: array` (sans `?`) n'autorise **pas** `null` comme valeur de retour : le tenter provoque un `TypeError` à l'exécution. Pour autoriser explicitement `null` en plus du type déclaré, on préfixe le type d'un `?` :

```php
<?php
function trouverUtilisateur(int $id): ?array
{
    if ($id <= 0) {
        return null; // OK : ?array autorise explicitement null
    }
    return ['id' => $id, 'nom' => 'Dupont'];
}
?>
```

> **Note :** `?array` est une déclaration de contrat, pas une simple habitude d'écriture : c'est l'équivalent PHP de `std::optional<T>` en C++ moderne ou de [`Optional[T]`](/?c=langages-de-programmation&s=python&p=typage-avec-annotations) en Python : la fonction peut renvoyer ce type précis, OU `null`, rien d'autre.

## Supprimer un warning attendu avec `@`

Beaucoup de fonctions natives de PHP renvoient `false` en cas d'échec plutôt que de lever une exception (un style proche du C, où `fopen()` renvoie un pointeur nul et positionne `errno`). Quand cet échec est déjà prévu et géré par la suite du code, l'opérateur `@` placé devant l'appel supprime le warning que PHP émettrait sinon :

```php
<?php
$mtime = @filemtime('fichier_qui_peut_ne_pas_exister.txt');
$version = $mtime ? "v{$mtime}" : 'v-inconnue';
?>
```

> **Note :** `@` masque le warning, il ne change rien au comportement de la fonction elle-même (`filemtime()` renvoie toujours `false` si le fichier n'existe pas). À réserver aux cas où l'échec est réellement anticipé et testé juste après : l'utiliser partout masquerait aussi de vraies erreurs.

PHP fournit énormément de fonctions natives déjà prêtes à l'emploi, classées ci-dessous par catégorie.

## Fonctions sur les chaînes de caractères

```php
<?php
    strlen("Hello");                 // 5 -> longueur de la chaîne
    strtoupper("Hello");             // "HELLO" -> met en majuscules
    strtolower("Hello");             // "hello" -> met en minuscules
    str_replace("a", "o", "Hello");  // "Hello" -> remplace une sous-chaîne
    trim("  Hello  ");               // "Hello" -> retire les espaces au début/fin
    substr("Hello", 1, 3);           // "ell" -> extrait une portion de chaîne
    explode(",", "a,b,c");           // ["a", "b", "c"] -> découpe une chaîne en tableau
    implode(",", ["a", "b"]);        // "a,b" -> assemble un tableau en chaîne
    str_contains("Hello", "ell");    // true -> vérifie si une chaîne en contient une autre
?>
```

## Fonctions sur les tableaux (`array`)

```php
<?php
    count([1, 2, 3]);                      // 3 -> nombre d'éléments
    $tab[] = "valeur";                     // ajoute un élément à la fin (préféré à array_push() pour un seul élément)
    array_pop($tab);                       // retire et renvoie le dernier élément
    array_merge($tab1, $tab2);             // fusionne deux tableaux
    in_array("pomme", $fruits);            // true/false -> vérifie la présence d'une valeur
    array_search("pomme", $fruits);        // renvoie la clé/l'index trouvé
    sort($tab);                            // trie un tableau (valeurs)
    array_map(fn($n) => $n * 2, $tab);     // applique une fonction à chaque élément
    array_filter($tab, fn($n) => $n > 0);  // filtre les éléments selon une condition
?>
```
## Fonctions sur les tableaux associatifs

```php
<?php
    $personne = ["nom" => "Dupont", "age" => 25];

    array_keys($personne);               // ["nom", "age"] -> renvoie toutes les clés
    array_values($personne);             // ["Dupont", 25] -> renvoie toutes les valeurs
    array_key_exists("nom", $personne);  // true/false -> vérifie qu'une clé existe
    unset($personne["age"]);             // retire une clé (et sa valeur) du tableau
    ksort($personne);                    // trie le tableau selon les clés
    asort($personne);                    // trie le tableau selon les valeurs (en gardant les clés)
    array_combine(["a", "b"], [1, 2]);   // ["a" => 1, "b" => 2] -> crée un tableau associatif à partir de 2 tableaux
    array_flip($personne);               // inverse clés et valeurs
?>
```

> **Note :** `array_key_exists()` vérifie qu'une clé existe, même si sa valeur est `null`. `isset($personne["nom"])` renvoie `false` dans ce cas, car il vérifie en plus que la valeur n'est pas `null`.
ex :
```php
<?php
    $personne = ["nom" => "Dupont", "age" => null];

    array_key_exists("age", $personne);  // true
    isset($personne["age"]);             // false
?>
```

## Fonctions mathématiques

```php
<?php
    abs(-5);          // 5 -> valeur absolue
    round(3.456, 2);  // 3.46 -> arrondit
    rand(1, 10);      // génère un nombre aléatoire entre 1 et 10
    max(1, 5, 3);     // 5 -> valeur maximale
    min(1, 5, 3);     // 1 -> valeur minimale
?>
```

## Fonctions de vérification de type

```php
<?php
    is_string($var);  // true/false
    is_int($var);     // true/false
    is_array($var);   // true/false
    is_null($var);    // true/false
    empty($var);      // true si vide, null, ou non défini
    isset($var);      // true si la variable existe et n'est pas null
?>
```

> **Note :** vous trouverez la liste complète des fonctions natives de PHP dans la documentation officielle : [php.net/manual/fr/funcref.php](https://www.php.net/manual/fr/funcref.php). Pour ajouter un **seul** élément, `$tab[] = "valeur";` est aussi préféré à `array_push($tab, "valeur")` : même résultat, sans le coût d'un appel de fonction : `array_push()` ne devient réellement utile que pour ajouter plusieurs éléments en un seul appel (`array_push($tab, "a", "b", "c")`).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une fonction est un bloc de code réutilisable ; une méthode est une fonction définie dans une classe, appelée via `->`/`::`. PHP vérifie les types annotés à l'exécution, pas à la compilation. |
| **Outils utilisables** | Fonctions natives sur les chaînes, tableaux, tableaux associatifs, math, vérification de type ; `?Type` pour un type nullable. |
| **Pièges à éviter** | Utiliser `@` pour masquer systématiquement les warnings : à réserver aux échecs réellement anticipés et testés juste après. |
| **Bonnes pratiques** | Typer les paramètres et le retour d'une fonction dès que possible ; utiliser `$tab[] = valeur` plutôt que `array_push()` pour un seul élément. |
