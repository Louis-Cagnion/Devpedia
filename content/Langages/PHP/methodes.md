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
> **Note :** contrairement à [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), où une fonction fléchée peut s'écrire avec des accolades et un `return` (`(n) => { return n * 2; }`), PHP n'autorise que la forme courte avec une seule expression, sans accolades ni `return` (`fn($n) => $n * 2;`).

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

> **Note :** `?array` est une déclaration de contrat, pas une simple habitude d'écriture : c'est l'équivalent PHP de [`std::optional<T>`](https://en.cppreference.com/w/cpp/utility/optional) en [C++](/?c=langages-de-programmation&s=cpp&p=cpp) moderne ou de [`Optional[T]`](/?c=langages-de-programmation&s=python&p=typage-avec-annotations) en [Python](/?c=langages-de-programmation&s=python&p=python) : la fonction peut renvoyer ce type précis, OU `null`, rien d'autre.

## Fonctions anonymes : capturer une variable avec `use`

Une **fonction anonyme** (on dit aussi *closure*) est une fonction sans nom : on la range dans une variable, ou on la passe directement à une autre fonction. Elle ne voit **pas** les variables du code qui l'entoure. Pour en utiliser une, il faut la lister dans `use (...)`, de l'une de ces deux façons :

| Écriture | Ce que la fonction reçoit | Si la fonction la modifie... |
|---|---|---|
| `function () use ($x)` | une **copie** de `$x`, faite au moment où la fonction est créée | seule la copie change |
| `function () use (&$x)` | la variable `$x` **elle-même** (une *référence*) | `$x` change aussi à l'extérieur |
| `fn() => ...` (fonction fléchée, voir plus haut) | une copie automatique de chaque variable utilisée | impossible : une seule expression, pas d'instruction |

Analogie : `use ($x)` donne une photocopie d'un document (on peut griffonner dessus, l'original reste intact) ; `use (&$x)` prête l'original lui-même.

```php
<?php
$compteur = 0;

$parValeur = function () use ($compteur) {     // reçoit une copie de $compteur (0)
    $compteur++;                                // incrémente la copie seulement
    return $compteur;                           // renvoie la copie : 1
};

$parReference = function () use (&$compteur) { // reçoit la vraie variable $compteur
    $compteur++;                                // incrémente l'original
    return $compteur;
};

echo $parValeur(), " ", $compteur, "\n";     // affiche "1 0" : l'original n'a pas bougé
echo $parReference(), " ", $compteur, "\n";  // affiche "1 1"
echo $parReference(), " ", $compteur, "\n";  // affiche "2 2"
?>
```

**Piège : la copie est faite à la création de la fonction, pas à son appel.**

```php
<?php
$x = 10;
$lire = function () use ($x) { return $x; };  // copie de $x faite ICI, elle vaut 10
$x = 99;                                      // trop tard : la copie ne suit pas
echo $lire();                                 // affiche 10, pas 99
?>
```

Le même `&` sert aussi pour un **paramètre** : sans lui, une fonction reçoit une copie de ce qu'on lui passe (même un tableau) ; avec lui, elle modifie directement la variable de l'appelant.

```php
<?php
function ajouterUn(array &$tab): void {  // & : la fonction reçoit le tableau de l'appelant
    $tab[] = 1;                          // ajoute un élément à CE tableau
}

$liste = [];
ajouterUn($liste);
echo count($liste);                      // affiche 1 (sans le &, afficherait 0)
?>
```

### Le type `callable` : accepter « quelque chose qu'on peut appeler »

Un paramètre typé `callable` accepte toute valeur que PHP sait appeler comme une fonction :

| Valeur passée | Exemple |
|---|---|
| Fonction anonyme ou fléchée | `fn($n) => $n * 2` |
| Nom d'une fonction, en chaîne de caractères | `'abs'` |
| Méthode statique d'une classe | `['Calculatrice', 'double']` |
| Méthode d'un objet | `[$calculatrice, 'triple']` |

```php
<?php
function appliquer(callable $action, int $n): int {
    return $action($n);                       // appelle ce qu'on a reçu, avec $n
}

echo appliquer(fn($n) => $n * 2, 4);          // affiche 8
echo appliquer('abs', -3);                    // affiche 3 (valeur absolue)
appliquer('fonction_inexistante', 1);         // TypeError : cette chaîne n'est pas appelable
appliquer(fn($a, $b) => $a + $b, 1);          // ArgumentCountError, levée DANS appliquer()
?>
```

> **Note :** PHP vérifie seulement que la valeur est appelable au moment où elle entre dans `appliquer()`. Il ne vérifie **pas** le nombre ni le type de paramètres qu'elle attend : une fonction qui en veut deux n'échoue qu'au moment où `appliquer()` l'appelle avec un seul (voir [Les exceptions](/?c=langages&s=php&p=exceptions) pour `TypeError` et `ArgumentCountError`).

Un usage courant : une fonction qui prépare quelque chose, laisse une fonction reçue en paramètre faire son travail, puis termine proprement. La section suivante en donne un exemple complet.

## Verrouiller un fichier partagé entre requêtes : `flock()`

Un serveur PHP traite plusieurs requêtes **en même temps**, chacune dans son propre processus (voir [PHP-FPM](/?c=langages&s=php&p=php-fpm)). Si deux requêtes lisent puis réécrivent le même fichier (par exemple un petit fichier JSON qui sert de mini-base de données), l'une peut effacer la modification de l'autre :

```
Requête A                          Requête B
lit visites = 5
                                   lit visites = 5
écrit visites = 6
                                   écrit visites = 6   <- la visite de A est perdue
```

C'est le même problème qu'entre deux threads qui partagent une variable (voir [Mémoire partagée](/?c=langages&s=c&p=threads#memoire-partagee-un-avantage-et-un-danger)). La parade : **un verrou**. `flock()` pose un verrou sur un fichier déjà ouvert avec `fopen()`, et une seule requête à la fois peut le tenir.

| Appel | Effet |
|---|---|
| `flock($fichier, LOCK_EX)` | verrou **exclusif** : attend que plus personne ne tienne le verrou, puis le prend |
| `flock($fichier, LOCK_SH)` | verrou **partagé** : plusieurs lecteurs à la fois, mais aucun verrou exclusif pendant ce temps |
| `flock($fichier, LOCK_EX \| LOCK_NB)` | comme `LOCK_EX`, mais n'attend pas : renvoie `false` si le verrou est déjà pris |
| `flock($fichier, LOCK_UN)` | libère le verrou |

Le motif complet, qui combine `flock()` et les fonctions anonymes de la section précédente :

```php
<?php
// Ouvre le fichier, le verrouille, laisse $modifier changer les données, puis les réécrit.
function avecStorePartage(string $chemin, callable $modifier): void
{
    $fichier = fopen($chemin, 'c+');           // lecture/écriture, créé si absent, jamais vidé
    flock($fichier, LOCK_EX);                  // attend son tour
    $contenu = stream_get_contents($fichier);  // lit tout le fichier
    $donnees = $contenu === '' ? [] : json_decode($contenu, true);
    $modifier($donnees);                       // la fonction reçue modifie $donnees
    ftruncate($fichier, 0);                    // vide le fichier...
    rewind($fichier);                          // ...revient au début...
    fwrite($fichier, json_encode($donnees));   // ...et écrit la nouvelle version
    fflush($fichier);                          // tout est écrit AVANT de libérer le verrou
    flock($fichier, LOCK_UN);                  // la requête suivante peut passer
    fclose($fichier);
}

$avant = null;
avecStorePartage('store.json', function (array &$d) use (&$avant) {
    // use (&$avant) : la valeur ressort de la fonction
    $avant = $d['visites'] ?? 0;
    $d['visites'] = $avant + 1;                // &$d : la modification est gardée et réécrite
});
echo $avant;                                   // nombre de visites avant celle-ci
?>
```

Résultat mesuré avec PHP 8.3 : 4 processus lancés en même temps, qui ajoutent chacun 300 visites au même fichier :

| Version | Visites comptées à la fin (attendu : 1 200) |
|---|---|
| Sans `flock()` | 16 |
| Avec `flock()` | 1 200 |

Deux subtilités :

| Piège | Pourquoi |
|---|---|
| Ouvrir avec `'w'` au lieu de `'c+'` | `'w'` vide le fichier **dès l'ouverture**, donc avant d'avoir le verrou : une autre requête peut lire un fichier vide pendant ce temps. |
| Croire que le verrou protège contre tout | `flock()` est un verrou **consultatif** (*advisory lock*) : il ne bloque que le code qui appelle aussi `flock()` sur ce fichier. Un `file_put_contents()` sans verrou écrit quand même. |

> **Note :** le même mécanisme existe en ligne de commande pour empêcher deux exécutions d'un même script de se chevaucher (voir [Éviter les exécutions concurrentes avec `flock`](/?c=langages&s=bash&p=automatisation-cron#eviter-les-executions-concurrentes-avec-flock)). Pour beaucoup d'écritures simultanées, une vraie base de données reste plus adaptée qu'un fichier verrouillé : chaque requête attend son tour, ce qui ralentit tout dès que le trafic monte.

## Supprimer un warning attendu avec `@`

Beaucoup de fonctions natives de PHP renvoient `false` en cas d'échec plutôt que de lever une exception (un style proche du [C](/?c=langages-de-programmation&s=c&p=c), où `fopen()` renvoie un pointeur nul et positionne `errno`). Quand cet échec est déjà prévu et géré par la suite du code, l'opérateur `@` placé devant l'appel supprime le warning que PHP émettrait sinon :

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
    // ajoute un élément à la fin (préféré à array_push() pour un seul élément)
    $tab[] = "valeur";
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
    // trie le tableau selon les valeurs (en gardant les clés)
    asort($personne);
    // ["a" => 1, "b" => 2] -> crée un tableau associatif à partir de 2 tableaux
    array_combine(["a", "b"], [1, 2]);
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
| **À retenir** | Une fonction est un bloc de code réutilisable ; une méthode est une fonction définie dans une classe, appelée via `->`/`::`. PHP vérifie les types annotés à l'exécution, pas à la compilation. Une fonction anonyme ne voit que les variables listées dans `use` : une copie avec `use ($x)`, la variable d'origine avec `use (&$x)`. |
| **Outils utilisables** | Fonctions natives sur les chaînes, tableaux, tableaux associatifs, math, vérification de type ; `?Type` pour un type nullable ; `use`, `&` et `callable` pour les fonctions anonymes ; `fopen(..., 'c+')` et `flock()` pour un fichier partagé. |
| **Pièges à éviter** | Utiliser `@` pour masquer systématiquement les warnings : à réserver aux échecs réellement anticipés et testés juste après. Croire que `use ($x)` suit les changements de `$x` (la copie est faite à la création). Ouvrir un fichier partagé en `'w'`, qui le vide avant même d'avoir le verrou. |
| **Bonnes pratiques** | Typer les paramètres et le retour d'une fonction dès que possible ; utiliser `$tab[] = valeur` plutôt que `array_push()` pour un seul élément ; verrouiller (`LOCK_EX`) tout fichier lu puis réécrit par plusieurs requêtes, et appeler `fflush()` avant de libérer le verrou. |
