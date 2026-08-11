---
order: 8
---

# La programmation orientée objet (POO)

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
- `$this` fait toujours référence à l'instance courante, et s'utilise **toujours** avec `->`, y compris pour lire une propriété (`$this->marque`) ou appeler une méthode (`$this->description()`). La seule différence visuelle entre les deux est la présence de `()`.
- `private` = accessible uniquement depuis l'intérieur de la classe ; `public` = accessible aussi depuis l'extérieur.

> **Note :** contrairement à un tableau, où l'on peut créer une nouvelle clé à la volée (`$arr['nouvelle_cle'] = 5;`, sans aucune déclaration), une propriété d'objet **typée** refuse une valeur du mauvais type : assigner un `int` à une propriété déclarée `string` déclenche un `TypeError`. Les propriétés typées définissent un vrai contrat : elles fixent quelles propriétés existent et quel type chacune doit toujours contenir.

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

`use` ne charge pas le fichier lui-même : il indique seulement au moteur PHP à quel nom complet correspond le nom court utilisé plus bas. C'est un mécanisme d'[autoloading](/?c=langages-de-programmation&s=php&p=autoloading) qui se charge de retrouver et charger le fichier correspondant, au moment où la classe est réellement utilisée.

> **Note :** `Classe::methode()` (avec `::`) ressemble à `Classe->methode()` mais ne s'utilise jamais avec une instance : c'est l'équivalent quasi direct d'un namespace + méthode statique en C++.

## Injection de dépendances

Plutôt que de créer elle-même les objets dont elle a besoin (`new`), une classe peut les recevoir "de l'extérieur", en paramètres de son constructeur : c'est l'**injection de dépendances**. La classe qui les reçoit n'a pas besoin de savoir comment ces objets sont construits, seulement quel contrat (quelles méthodes) ils respectent.

```php
<?php
class ServiceNotification
{
    private Mailer $mailer;
    private Logger $logger;

    public function __construct(?Mailer $mailer = null, ?Logger $logger = null)
    {
        $this->mailer = $mailer ?? new SmtpMailer();  // valeur par défaut si rien n'est fourni
        $this->logger = $logger ?? new FileLogger();
    }
}

// usage normal : dépendances par défaut
$service = new ServiceNotification();

// pour les tests, ou un besoin ponctuel : dépendances remplacées explicitement
$service = new ServiceNotification(new MailerDeTest(), new LoggerEnMemoire());
```

Les paramètres nullables avec un repli `??` (voir [Les fonctions et méthodes les plus utiles](/?c=langages-de-programmation&s=php&p=methodes)) rendent chaque dépendance **optionnelle** : le code appelant peut soit laisser le comportement par défaut, soit fournir explicitement une implémentation différente, typiquement une version simulée (*mock*) dans un test automatisé, sans jamais toucher au code de `ServiceNotification` lui-même.

> **Note :** cette technique est ce qui rend une classe *testable* sans dépendre d'un vrai service externe (envoi d'email réel, écriture de vrais fichiers de log) à chaque exécution des tests.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une classe regroupe propriétés et méthodes ; `new` en crée une instance. Un namespace évite les collisions de noms entre modules. L'injection de dépendances reçoit les objets nécessaires en paramètre plutôt que de les créer soi-même. |
| **Outils utilisables** | `__construct`, propriétés typées, méthodes `static`, `namespace`/`use`. |
| **Pièges à éviter** | Créer directement (`new`) les dépendances d'une classe plutôt que de les recevoir en paramètre : rend la classe difficile à tester isolément. |
| **Bonnes pratiques** | Typer les propriétés pour qu'elles définissent un vrai contrat ; injecter les dépendances plutôt que de les instancier en dur, pour faciliter les tests. |
