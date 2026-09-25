---
order: 9
---

# Les exceptions

Une fonction PHP classique signale une erreur en renvoyant une valeur spéciale (`false`, `null`) ou en émettant un avertissement, que le code appelant doit penser à vérifier explicitement à chaque appel. Les **exceptions** proposent un mécanisme différent : une erreur **interrompt** immédiatement le déroulement normal du code et remonte automatiquement jusqu'à ce qu'un bloc prévu pour la traiter l'intercepte, sans qu'aucune vérification manuelle ne soit nécessaire à chaque étape intermédiaire.

## `try` / `catch` : intercepter une erreur

```php
<?php
function diviser(float $a, float $b): float
{
    if ($b === 0.0) {
        throw new DivisionByZeroError("Division par zéro");
    }
    return $a / $b;
}

try {
    echo diviser(10, 0);
} catch (DivisionByZeroError $e) {
    echo "Erreur : " . $e->getMessage();  // "Erreur : Division par zéro"
}
```

- `throw` lève une exception : elle interrompt immédiatement la fonction courante, sans exécuter le reste de son code.
- `try` délimite le code à surveiller ; `catch` reçoit l'exception si l'une d'elles est levée à l'intérieur du bloc `try`, avec un type précis (ici `DivisionByZeroError`) qui détermine quelles exceptions ce bloc intercepte.
- `$e->getMessage()` renvoie le message associé à l'exception, fourni au moment du `throw`.

> **Piège :** oublier qu'une exception non interceptée par aucun `try`/`catch` (à aucun niveau de la chaîne d'appel) fait planter le script entier, avec une erreur fatale affichée à l'utilisateur. Un `throw` sans filet de sécurité quelque part dans le programme n'est pas une gestion d'erreur, juste un plantage différé.
>
> **Bonne pratique :** intercepter une exception à l'endroit où le programme peut réellement réagir (afficher un message clair, réessayer, journaliser), pas nécessairement au plus près du `throw`.

## `Exception` vs `Error` : deux familles sous `Throwable`

PHP distingue deux grandes familles d'objets qu'on peut lancer et intercepter, toutes deux implémentant l'interface **`Throwable`** :

| | `Exception` | `Error` |
|---|---|---|
| Origine typique | Levée explicitement par le code métier (`throw new ...`) | Levée par PHP lui-même pour une erreur de programmation (type invalide, méthode inexistante) |
| Exemple | `InvalidArgumentException`, une exception métier personnalisée | `TypeError`, `DivisionByZeroError`, `ArgumentCountError` |
| Sens habituel | Une situation anormale mais prévisible (donnée invalide, ressource indisponible) | Un bug dans le code lui-même, découvert à l'exécution |

```php
<?php
try {
    strlen();  // appel sans le paramètre obligatoire
} catch (ArgumentCountError $e) {
    echo "Erreur de programmation : " . $e->getMessage();
}
```

> **Piège :** écrire `catch (Exception $e)` en pensant intercepter toute erreur possible. Un `TypeError` ou un `DivisionByZeroError` n'est **pas** une `Exception` : ce sont des `Error`, une branche distincte de `Throwable`. Ce `catch` les laisse filer sans les intercepter.
>
> **Bonne pratique :** intercepter `Throwable` uniquement quand le code doit vraiment réagir à n'importe quelle erreur possible (un point d'entrée global qui journalise tout avant de planter proprement, par exemple) ; dans le reste du code, cibler le type d'exception réellement attendu, pour ne jamais masquer une erreur de programmation qui mériterait d'être vue et corrigée.

### `ValueError` : le bon type, mais une valeur refusée

Depuis PHP 8.0, beaucoup de fonctions internes lèvent un **`ValueError`** quand un argument a le bon type mais une valeur qu'elles n'acceptent pas ([ValueError](https://www.php.net/manual/en/class.valueerror.php)). C'est une troisième situation, distincte des deux autres `Error` liées aux arguments :

| `Error` | Quand | Exemple |
|---|---|---|
| `TypeError` | Argument du mauvais type | `strlen([])` : un tableau au lieu d'une chaîne |
| `ArgumentCountError` | Mauvais nombre d'arguments | `strlen()` |
| `ValueError` | Bon type, valeur hors de ce que la fonction accepte | `array_rand($tableau, 4)` sur un tableau de 3 éléments |

```php
<?php
$couleurs = ["rouge", "vert", "bleu"];
try {
    // demande 4 clés tirées au hasard dans un tableau qui n'en a que 3
    $cles = array_rand($couleurs, 4);
} catch (Exception $e) {
    echo "jamais atteint";  // ValueError n'est pas une Exception
} catch (ValueError $e) {
    echo $e->getMessage();  // Argument #2 ($num) must be between 1 and ...
}
```

> **Piège :** appeler `array_rand($liste, NOMBRE_TIRAGES)` avec une constante de configuration et une liste chargée depuis l'extérieur (fichier, base de données). Le jour où la liste devient plus courte que la constante, ou vide, l'appel lève un `ValueError` qu'un `catch (Exception $e)` laisse filer.
>
> **Bonne pratique :** vérifier la taille réelle avant l'appel : traiter à part une liste vide, puis tirer `min(NOMBRE_TIRAGES, count($liste))` éléments.

## Plusieurs `catch` : du plus précis au plus général

Un `try` peut être suivi de plusieurs blocs `catch`, chacun ciblant un type différent ; PHP exécute le **premier** dont le type correspond, dans l'ordre où ils sont écrits :

```php
<?php
try {
    traiterCommande($donnees);
} catch (StockInsuffisantException $e) {
    echo "Stock insuffisant : " . $e->getMessage();
} catch (PaiementRefuseException $e) {
    echo "Paiement refusé : " . $e->getMessage();
} catch (Exception $e) {
    echo "Erreur inattendue : " . $e->getMessage();
}
```

> **Piège :** placer un `catch` général (`Exception $e`) **avant** un `catch` plus spécifique (`StockInsuffisantException $e`, qui hérite d'`Exception`). Le bloc général intercepte alors tout, y compris les cas que le bloc spécifique était censé traiter en premier : celui-ci ne s'exécute jamais.
>
> **Bonne pratique :** toujours ordonner les blocs `catch` du type le plus spécifique au type le plus général, jamais l'inverse.

## `finally` : exécuter du code dans tous les cas

Un bloc `finally`, placé après le dernier `catch`, s'exécute systématiquement, qu'une exception ait été levée ou non, et même si le `catch` correspondant relance lui-même une exception :

```php
<?php
$connexion = ouvrirConnexion();
try {
    executerRequete($connexion);
} catch (RequeteEchoueeException $e) {
    echo "Requête échouée : " . $e->getMessage();
} finally {
    fermerConnexion($connexion);  // toujours exécutée : succès, échec, ou re-throw
}
```

> **Piège :** libérer une ressource (connexion, fichier ouvert) seulement à la fin du bloc `try`, après le code qui peut échouer. Si une exception interrompt le bloc avant d'atteindre cette ligne, la ressource reste ouverte indéfiniment.
>
> **Bonne pratique :** placer toute libération de ressource dans un bloc `finally`, jamais seulement en fin de `try`, pour garantir qu'elle s'exécute même en cas d'erreur.

## Créer une exception personnalisée

Étendre `Exception` (ou une sous-classe plus précise) permet de créer un type d'erreur propre au métier de l'application, avec ses propres données associées :

```php
<?php
class StockInsuffisantException extends Exception
{
    public function __construct(
        private string $produit,
        private int $quantiteDemandee,
        private int $quantiteDisponible
    ) {
        parent::__construct(
            "Stock insuffisant pour {$produit} : {$quantiteDemandee} demandés, "
            . "{$quantiteDisponible} disponibles"
        );
    }

    public function getProduit(): string
    {
        return $this->produit;
    }
}

throw new StockInsuffisantException("Clavier", 5, 2);
```

`parent::__construct(...)` transmet le message au constructeur d'`Exception` (voir [l'héritage et les classes](/?c=langages-de-programmation&s=php&p=poo) déjà vues) : l'exception personnalisée reste une vraie `Exception`, interceptable comme telle, tout en portant des données supplémentaires propres au cas métier (`getProduit()`).

> **Bonne pratique :** créer une exception personnalisée dès qu'un appelant a besoin de réagir différemment selon le type précis d'erreur (voir la section précédente sur les `catch` multiples), plutôt que de tout regrouper sous une `Exception` générique et analyser son message texte pour deviner la cause.

## Chaîner les exceptions : ne pas perdre la cause d'origine

Relancer une nouvelle exception depuis un bloc `catch` peut faire perdre la trace de l'erreur d'origine, sauf à la transmettre explicitement via le quatrième paramètre du constructeur d'`Exception` :

```php
<?php
try {
    $donnees = json_decode($reponseApi, flags: JSON_THROW_ON_ERROR);
} catch (JsonException $e) {
    throw new ApiIndisponibleException("Réponse API invalide", previous: $e);
}
```

```php
<?php
try {
    appelerApi();
} catch (ApiIndisponibleException $e) {
    echo $e->getMessage();               // "Réponse API invalide"
    echo $e->getPrevious()->getMessage(); // "Syntax error" (l'erreur JSON d'origine)
}
```

> **Piège :** relancer une nouvelle exception sans passer l'exception d'origine en `previous`. La cause réelle du problème (ici, un JSON mal formé) disparaît, ne laissant que le message générique de la nouvelle exception : un débogage bien plus difficile, en particulier en production où l'erreur d'origine n'est visible dans aucun journal.
>
> **Bonne pratique :** toujours transmettre l'exception interceptée via `previous` en relançant une nouvelle exception, pour garder une trace complète de la chaîne de cause à effet.

Voir aussi [La programmation orientée objet](/?c=langages-de-programmation&s=php&p=poo) pour l'héritage de classes réutilisé ici, et [Sécurité](/?c=langages-de-programmation&s=php&p=securite) pour ce qu'il ne faut jamais faire apparaître dans un message d'exception affiché à l'utilisateur (données sensibles, détails d'implémentation).

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | `throw` interrompt le déroulement normal ; `try`/`catch` intercepte une exception par type, `finally` s'exécute dans tous les cas. `Exception` (erreurs métier) et `Error` (erreurs de programmation) sont deux branches distinctes de `Throwable` ; `ValueError` signale un argument du bon type mais d'une valeur refusée. Une exception personnalisée étend `Exception` ; `previous` chaîne une nouvelle exception à sa cause d'origine. |
| **Outils utilisables** | `try`/`catch`/`finally`/`throw`, `getMessage()`/`getCode()`/`getPrevious()`, `extends Exception` pour un type d'erreur métier propre. |
| **Pièges à éviter** | Un `throw` jamais intercepté par aucun `try`/`catch`. `catch (Exception $e)` en pensant intercepter aussi les `Error`. Passer à `array_rand()` un nombre plus grand que le tableau, ou un tableau vide (`ValueError`). Un `catch` général placé avant un `catch` spécifique. Libérer une ressource seulement en fin de `try` sans `finally`. Relancer une exception sans transmettre `previous`. |
| **Bonnes pratiques** | Intercepter là où le programme peut réellement réagir. N'utiliser `Throwable` que pour un point d'entrée global. Ordonner les `catch` du plus spécifique au plus général. Toujours libérer une ressource dans un `finally`. Créer une exception personnalisée dès qu'un appelant doit réagir différemment selon le type d'erreur. Toujours chaîner via `previous` en relançant. |
