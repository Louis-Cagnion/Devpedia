---
title: La programmation orientée objet (POO) en PHP
---

La **programmation orientée objet** (POO) organise le code autour d'objets qui regroupent à la fois des données (propriétés) et des comportements (méthodes), plutôt que de manipuler des tableaux et des fonctions séparément. Une classe joue le rôle de "moule" : elle décrit quelles propriétés existeront et quelles méthodes seront disponibles, et chaque `new` produit une instance indépendante de ce moule.

## Déclarer une classe et des propriétés typées

```php
<?php
class Vehicule
{
    private string $marque;
    private string $modele;
    private int $annee;

    public function __construct(string $marque, string $modele, int $annee)
    {
        $this->marque = $marque;
        $this->modele = $modele;
        $this->annee  = $annee;
    }

    public function description(): string
    {
        return "{$this->marque} {$this->modele} ({$this->annee})";
    }
}

$v = new Vehicule("Peugeot", "308", 2022);
echo $v->description(); // "Peugeot 308 (2022)"
?>
```

- `__construct` est le nom réservé de la méthode appelée automatiquement par `new`.
- `$this` fait toujours référence à l'instance courante, et s'utilise **toujours** avec `->` — y compris pour lire une propriété (`$this->marque`) ou appeler une méthode (`$this->description()`). La seule différence visuelle entre les deux est la présence de `()`.
- `private` = accessible uniquement depuis l'intérieur de la classe ; `public` = accessible aussi depuis l'extérieur.

> **Note :** contrairement à un tableau, où l'on peut créer une nouvelle clé à la volée (`$arr['nouvelle_cle'] = 5;`, sans aucune déclaration), une propriété d'objet **typée** refuse une valeur du mauvais type — assigner un `int` à une propriété déclarée `string` déclenche un `TypeError`. Les propriétés typées définissent un vrai contrat : elles fixent quelles propriétés existent et quel type chacune doit toujours contenir.

## Méthodes statiques et classes utilitaires

Une méthode statique s'appelle directement sur la classe, sans passer par une instance (`new`) :

```php
<?php
class Calculs
{
    public static function moyenne(array $notes): float
    {
        return array_sum($notes) / count($notes);
    }
}

echo Calculs::moyenne([12, 15, 9]); // pas de "new Calculs()"
?>
```

Une classe qui n'a que des méthodes statiques ne sert jamais à faire un `new` : c'est un simple regroupement de fonctions liées entre elles, avec un namespace pour éviter les collisions de noms entre modules ou librairies (voir section suivante).

## Namespaces et `use`

Un **namespace** évite qu'une classe `Repository` d'un module n'entre en collision avec une classe `Repository` d'un autre :

```php
<?php
namespace App\Facturation;

class Repository
{
    public static function trouver(int $id): ?array
    {
        // ...
    }
}
?>
```

Depuis un autre fichier, deux façons d'appeler cette classe :

```php
<?php
// 1) chemin complet, absolu depuis la racine (le \ initial est optionnel mais explicite)
\App\Facturation\Repository::trouver(1);

// 2) import en haut de fichier, puis nom court
use App\Facturation\Repository;

Repository::trouver(1);
?>
```

`use` ne charge pas le fichier lui-même — il indique seulement au moteur PHP à quel nom complet correspond le nom court utilisé plus bas. C'est un mécanisme d'autoloading (cf. chapitre dédié) qui se charge de retrouver et charger le fichier correspondant, au moment où la classe est réellement utilisée.

> **Note :** `Classe::methode()` (avec `::`) ressemble à `Classe->methode()` mais ne s'utilise jamais avec une instance — c'est l'équivalent quasi direct d'un namespace + méthode statique en C++.
