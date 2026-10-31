---
order: 15
---

# Le conteneur de services et les fournisseurs de services

Dans une application, la plupart des classes ont besoin d'autres classes : un envoi de courriel a besoin d'un journal, un journal a besoin d'un fichier, etc. Quelqu'un doit construire tous ces objets, dans le bon ordre, une seule fois quand c'est utile, et permettre de les remplacer. Ce chapitre présente l'outil qui s'en charge : le **conteneur de services**, et la manière d'y déclarer des objets (les **fournisseurs de services**) pour les injecter, les remplacer ou les décorer, y compris ceux du **noyau** d'un framework (un **framework** est une bibliothèque de base qui impose la structure de l'application et appelle le code du projet ; son **noyau** est la partie centrale fournie avec lui, que le projet n'écrit pas).

Il suppose connues [les classes et l'injection de dépendances de base](/?c=langages&s=php&p=poo) (recevoir ses dépendances en paramètres du constructeur plutôt que les créer avec `new`), [les fonctions anonymes](/?c=langages&s=php&p=methodes) (une fonction sans nom, rangée dans une variable) et [le chargement automatique des classes](/?c=langages&s=php&p=autoloading). Le pourquoi du faible couplage est dans [responsabilité unique et faible couplage](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage), et le sens d'une dépendance dans [vérifier le sens des dépendances](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sens-des-dependances-avant-de-centraliser). Ces notions ne sont pas répétées ici. Les exemples sont en PHP, avec un exemple en JavaScript à la fin ; [Drupal](https://www.drupal.org/docs/drupal-apis/services-and-dependency-injection) et [Symfony](https://symfony.com/doc/current/service_container.html) (deux frameworks PHP) ne sont cités que comme exemples de la même idée.

## Le problème : qui construit les objets ?

Sans conteneur, chaque classe crée ses propres dépendances, ou le code appelant les assemble à la main à chaque endroit.

```php
<?php
// Notifieur : une classe qui envoie un message à quelqu'un
class Notifieur
{
    // property : la propriété qui garde le journal utilisé par la classe
    private JournalFichier $journal;

    // le constructeur s'exécute à chaque "new Notifieur()"
    public function __construct()
    {
        // new : la classe fabrique elle-même sa dépendance, en dur
        $this->journal = new JournalFichier('/var/log/app.log');
    }
}
```

Pour tester `Notifieur`, il faut un vrai fichier dans `/var/log` ; pour changer de journal, il faut modifier la classe. Le **conteneur de services** résout cela : c'est un objet unique qui connaît la recette de chaque objet partagé et le construit à la demande.

| Mot | Définition | Exemple |
|---|---|---|
| **Service** | Un objet qui rend un service technique au reste de l'application, sans représenter une donnée métier : il agit (envoyer, journaliser, calculer), il ne décrit pas (une commande, un client) | Un journal, un envoi de courriel, un accès à la base |
| **Identifiant** | Le nom unique sous lequel un service est rangé dans le conteneur | `journal`, `notifieur` |
| **Fabrique** | La fonction qui sait construire un service, avec ses propres dépendances | `fn($c) => new Notifieur($c->get('journal'))` |
| **Conteneur** | L'objet qui range les fabriques, construit un service à la première demande et le garde | `$conteneur->get('journal')` |
| **Fournisseur de services** | Un bloc de code (ou de configuration) qui déclare un groupe de services dans le conteneur | Le noyau déclare les siens, chaque module les siens |
| **Injection** | Donner à un objet ses dépendances de l'extérieur, au lieu de le laisser les créer | `new Notifieur($journal)` |

## Un conteneur minimal

Pour comprendre ce que font les conteneurs des frameworks, on en écrit un de moins de quarante lignes. D'abord, deux **interfaces** (une interface est un contrat : la liste des méthodes qu'une classe doit fournir, sans leur code) et les classes qui s'en servent. Les classes ne connaissent pas le conteneur.

```php
<?php
// Journal : le contrat que tout journal doit respecter
interface Journal
{
    // ecrire : prend un texte, ne renvoie rien (void)
    public function ecrire(string $message): void;
}

// JournalEcran : un journal qui affiche chaque message à l'écran
class JournalEcran implements Journal
{
    // implements : cette classe respecte le contrat Journal
    public function ecrire(string $message): void
    {
        // echo : affiche le texte ; "\n" termine la ligne
        echo "[journal] $message\n";
    }
}

// Notifieur : reçoit un Journal, sans savoir lequel
class Notifieur
{
    // private Journal $journal : crée et remplit la propriété (promotion du constructeur)
    public function __construct(private Journal $journal)
    {
    }

    // envoyer : simule l'envoi et le note dans le journal
    public function envoyer(string $destinataire): void
    {
        // $this->journal : le journal reçu à la construction
        $this->journal->ecrire("Message envoyé à $destinataire");
    }
}
```

Le conteneur lui-même : trois tableaux (les recettes, les objets déjà construits, les objets en cours de construction) et trois méthodes.

```php
<?php
// Conteneur : range des recettes et fabrique les services à la demande
class Conteneur
{
    // recettes : identifiant => fonction qui construit le service
    private array $fabriques = [];
    // partages : identifiant => true si le service doit être construit une seule fois
    private array $partages = [];
    // instances : identifiant => service déjà construit
    private array $instances = [];
    // enCours : identifiants en cours de construction (pour détecter un cycle)
    private array $enCours = [];

    // definir : ajoute ou remplace la recette d'un service
    public function definir(string $id, callable $fabrique, bool $partage = true): void
    {
        // la nouvelle recette prend la place de l'ancienne
        $this->fabriques[$id] = $fabrique;
        // on note si le service est partagé
        $this->partages[$id] = $partage;
        // une instance déjà construite avec l'ancienne recette est oubliée
        unset($this->instances[$id]);
    }

    // decorer : enveloppe le service $id dans un autre, sans toucher à son code
    public function decorer(string $id, callable $decorateur): void
    {
        // l'ancienne recette est gardée : elle fournit le service enveloppé
        $interne = $this->fabriques[$id] ?? throw new RuntimeException("Inconnu : $id");
        // la nouvelle recette appelle l'ancienne, puis passe le résultat au décorateur
        $enveloppe = fn(self $c) => $decorateur($interne($c), $c);
        $this->definir($id, $enveloppe, $this->partages[$id]);
    }

    // get : renvoie le service, en le construisant au besoin
    public function get(string $id): object
    {
        // déjà construit et partagé : on renvoie le même objet
        if (isset($this->instances[$id])) {
            return $this->instances[$id];
        }
        // aucune recette sous cet identifiant : erreur claire
        if (!isset($this->fabriques[$id])) {
            throw new RuntimeException("Service inconnu : $id");
        }
        // l'identifiant est déjà en construction : A a besoin de B qui a besoin de A
        if (isset($this->enCours[$id])) {
            $chemin = implode(' -> ', array_keys($this->enCours)) . " -> $id";
            throw new RuntimeException("Dépendance circulaire : $chemin");
        }
        // on marque l'identifiant comme en cours
        $this->enCours[$id] = true;
        try {
            // on appelle la fabrique, en lui donnant le conteneur pour ses dépendances
            $service = ($this->fabriques[$id])($this);
        } finally {
            // quoi qu'il arrive, on retire la marque
            unset($this->enCours[$id]);
        }
        // service partagé : on le garde ; sinon on le renvoie sans le garder
        if ($this->partages[$id]) {
            $this->instances[$id] = $service;
        }
        return $service;
    }
}
```

## Déclarer un service et l'injecter

**Déclarer** un service, c'est enregistrer sa recette sous un identifiant. **L'injecter**, c'est que la recette d'un autre service lui passe ce service au constructeur. Seules les fabriques connaissent le conteneur.

```php
<?php
// on crée le conteneur vide
$conteneur = new Conteneur();
// déclaration : le service "journal" est un JournalEcran (fn : fonction fléchée)
$conteneur->definir('journal', fn() => new JournalEcran());
// déclaration : le "notifieur" demande le "journal" au conteneur et le reçoit en paramètre
$conteneur->definir('notifieur', fn(Conteneur $c) => new Notifieur($c->get('journal')));
// première demande : le conteneur construit le journal, puis le notifieur
$conteneur->get('notifieur')->envoyer('alice@example.org');
// seconde demande du journal : c'est le même objet (=== compare l'identité d'un objet)
var_dump($conteneur->get('journal') === $conteneur->get('journal'));
```

Résultat réel :

```
[journal] Message envoyé à alice@example.org
bool(true)
```

```
get('notifieur')
  |-- recette de notifieur : appelle get('journal')
  |     |-- recette de journal : new JournalEcran()   --> rangé dans instances
  |     '-- renvoie le journal
  '-- new Notifieur($journal)                          --> rangé dans instances
```

L'ordre de construction n'est jamais écrit par le développeur : il se déduit des appels `get` imbriqués. Un framework réel fait la même chose, mais lit les dépendances dans une déclaration au lieu d'une fonction.

| Façon d'obtenir une dépendance | Qui construit | Testable sans vrai service | Verdict |
|---|---|---|---|
| `new JournalFichier(...)` dans la classe | La classe elle-même | Non | À éviter pour un service |
| Injection par le constructeur | Le conteneur (par sa fabrique) | Oui : on passe un faux | La règle par défaut |
| Appel `$conteneur->get('journal')` dans la classe | La classe, via le conteneur | Difficilement | Un dernier recours (voir les pièges) |

## Les fournisseurs de services : regrouper les déclarations

Un projet réel compte des centaines de services. Chaque partie (le noyau, un module, un greffon) les déclare dans son propre **fournisseur de services** : un objet à qui le conteneur est confié pour y enregistrer ses recettes. L'application démarre en appelant chaque fournisseur, dans un ordre précis.

```php
<?php
// FournisseurDeServices : le contrat d'un bloc de déclarations
interface FournisseurDeServices
{
    // enregistrer : reçoit le conteneur et y déclare ses services
    public function enregistrer(Conteneur $c): void;
}

// FournisseurNoyau : les services de base, fournis avec le framework
class FournisseurNoyau implements FournisseurDeServices
{
    public function enregistrer(Conteneur $c): void
    {
        // le noyau déclare un journal qui écrit à l'écran
        $c->definir('journal', fn() => new JournalEcran());
        // et un notifieur qui dépend de ce journal
        $c->definir('notifieur', fn(Conteneur $c) => new Notifieur($c->get('journal')));
    }
}

// Application : appelle chaque fournisseur dans l'ordre donné
function demarrer(array $fournisseurs): Conteneur
{
    // un conteneur neuf pour cette exécution
    $conteneur = new Conteneur();
    // chaque fournisseur déclare ses services (le dernier écrit gagne)
    foreach ($fournisseurs as $fournisseur) {
        $fournisseur->enregistrer($conteneur);
    }
    return $conteneur;
}
```

| Question | Réponse dans l'exemple | Dans un framework réel |
|---|---|---|
| Où est la déclaration ? | Du code PHP (`definir`) | Souvent un fichier de configuration (YAML) : classe, arguments, étiquettes |
| Qui l'appelle ? | La fonction `demarrer` | Le framework, au démarrage, ou à la compilation du conteneur |
| Dans quel ordre ? | Celui de la liste | Noyau d'abord, puis les modules (souvent par priorité) |
| Que se passe-t-il à la fin ? | Le conteneur est prêt | Le conteneur est souvent **compilé** (transformé en une classe PHP optimisée) et mis en cache |

## Remplacer un service du noyau

Pour changer un comportement du noyau, on n'édite pas le noyau (les mises à jour effaceraient la modification) : un fournisseur du projet **redéclare le même identifiant**. Comme le dernier écrit gagne, tous les services qui demandent `journal` reçoivent la nouvelle version, sans qu'une seule ligne de `Notifieur` ne change.

```php
<?php
// JournalMemoire : garde les messages dans un tableau, utile pour les tests
class JournalMemoire implements Journal
{
    // messages : tout ce qui a été écrit, dans l'ordre
    public array $messages = [];

    public function ecrire(string $message): void
    {
        // [] = ajoute en fin de tableau
        $this->messages[] = $message;
    }
}

// FournisseurProjet : le fournisseur du projet, appelé après celui du noyau
class FournisseurProjet implements FournisseurDeServices
{
    public function enregistrer(Conteneur $c): void
    {
        // même identifiant "journal" : la recette du noyau est remplacée
        $c->definir('journal', fn() => new JournalMemoire());
    }
}

// noyau seul : le journal écrit à l'écran
demarrer([new FournisseurNoyau()])->get('notifieur')->envoyer('bob@example.org');
// noyau puis projet : le journal est remplacé, rien ne s'affiche
$app = demarrer([new FournisseurNoyau(), new FournisseurProjet()]);
// on envoie un message avec le journal remplacé
$app->get('notifieur')->envoyer('bob@example.org');
// le message est dans la mémoire du nouveau journal
print_r($app->get('journal')->messages);
```

Résultat réel :

```
[journal] Message envoyé à bob@example.org
Array
(
    [0] => Message envoyé à bob@example.org
)
```

Le remplaçant doit respecter **le même contrat** (ici `Journal`) : sinon les services qui l'utilisent plantent à l'exécution. Dans un framework, cela s'appelle redéfinir une définition de service ; l'exemple de Drupal est une classe de fournisseur du module qui modifie la définition du noyau avant la compilation (voir [la documentation Drupal sur les services](https://www.drupal.org/docs/drupal-apis/services-and-dependency-injection)).

## Décorer un service : l'enrichir au lieu de le remplacer

Remplacer jette l'ancien service. Un **décorateur** (un patron de conception) est un objet qui **enveloppe** l'ancien service, respecte le même contrat, lui délègue le travail et ajoute quelque chose avant ou après. Le noyau et le projet gardent chacun leur part du comportement.

```php
<?php
// JournalNumerote : enveloppe un autre Journal et numérote les messages
class JournalNumerote implements Journal
{
    // compteur : le numéro du prochain message
    private int $compteur = 1;

    // $interne : le journal enveloppé, auquel on délègue
    public function __construct(private Journal $interne)
    {
    }

    public function ecrire(string $message): void
    {
        // on ajoute le numéro, puis on laisse l'ancien journal faire son travail
        $this->interne->ecrire('#' . $this->compteur++ . ' ' . $message);
    }
}

// on repart du noyau seul
$app = demarrer([new FournisseurNoyau()]);
// decorer : le "journal" devient JournalNumerote($ancien_journal)
$app->decorer('journal', fn(Journal $interne) => new JournalNumerote($interne));
// le notifieur du noyau reçoit le journal décoré, sans le savoir
$app->get('notifieur')->envoyer('carole@example.org');
$app->get('notifieur')->envoyer('dave@example.org');
```

Résultat réel :

```
[journal] #1 Message envoyé à carole@example.org
[journal] #2 Message envoyé à dave@example.org
```

Si deux fournisseurs décorent le même service, les décorateurs s'empilent comme des poupées russes : le dernier déclaré est le plus extérieur. Dans les frameworks, on l'écrit en configuration avec une clé de type `decorates` (Symfony et Drupal la connaissent) au lieu de code.

| Technique | Ce qu'elle fait | À choisir quand | Risque |
|---|---|---|---|
| **Remplacer** | Redéclarer l'identifiant avec une autre classe | Le comportement du noyau ne convient plus du tout | Perdre des fonctions que d'autres modules attendaient ; un autre remplaçant l'écrase |
| **Décorer** | Envelopper l'ancien service, qui reste dans la chaîne | On veut ajouter (cache, journal, mesure) sans perdre l'existant | L'ordre des décorateurs compte ; l'interface doit être respectée en entier |
| **Alias** | Donner un second identifiant à un service existant | Plusieurs noms désignent le même service (`logger` et `journal`) | Le service est partagé : le remplacer change tous les noms |
| **Étendre la classe** (`extends`) | Une classe fille redéclarée sous l'ancien identifiant | Un petit changement dans une méthode | Fragile : dépend des détails internes de la classe mère |

## Partagé ou nouveau à chaque demande

Par défaut, un service est **partagé** : le conteneur le construit une seule fois et renvoie le même objet ensuite (comme le montre `===` plus haut). C'est voulu pour un journal ou une connexion à la base. Mais un objet qui garde un état propre à une opération (un panier, un formulaire en cours) ne doit pas être partagé : sinon deux opérations s'y mélangent.

```php
<?php
// service non partagé : le troisième argument false demande un objet neuf à chaque get
$conteneur = new Conteneur();
$conteneur->definir('journal', fn() => new JournalMemoire(), false);
// deux demandes : deux objets différents (!== compare l'identité)
var_dump($conteneur->get('journal') !== $conteneur->get('journal'));
```

Résultat réel : `bool(true)`.

| Mode | Combien d'objets | Convient à | Danger |
|---|---|---|---|
| Partagé (par défaut) | Un seul pour toute l'application | Journal, configuration, connexion | Un état gardé dedans fuit d'une opération à l'autre |
| Non partagé | Un par demande | Objet de travail, à usage unique | Coût de construction répété ; ne peut pas servir de point de réglage commun |

## Tester : remplacer un service par un faux

C'est l'intérêt le plus concret du conteneur : un test déclare, à la place du vrai journal, un faux qui enregistre ce qu'on lui envoie.

```php
<?php
// on construit une application normale
$app = demarrer([new FournisseurNoyau()]);
// le test remplace le journal par un faux qui garde les messages en mémoire
$faux = new JournalMemoire();
$app->definir('journal', fn() => $faux);
// on exécute le comportement à tester
$app->get('notifieur')->envoyer('test@example.org');
// on vérifie ce que le notifieur a écrit : true si les messages sont ceux attendus
var_dump($faux->messages === ['Message envoyé à test@example.org']);
```

Résultat réel : `bool(true)`. Le principe des tests automatiques est dans [les tests unitaires](/?c=tests&p=tests-unitaires) ; l'avantage ici est que le test ne dépend d'aucun fichier ni d'aucun réseau.

## Les erreurs que le conteneur détecte

Deux services qui se demandent l'un l'autre forment une **dépendance circulaire** : la construction de l'un exige l'autre, sans fin. Notre conteneur le repère grâce à `enCours` et nomme le chemin.

```php
<?php
// "a" a besoin de "b", et "b" a besoin de "a"
$c = new Conteneur();
$c->definir('a', fn(Conteneur $c) => $c->get('b'));
$c->definir('b', fn(Conteneur $c) => $c->get('a'));
// try / catch : on attrape l'erreur pour l'afficher
try {
    $c->get('a');
} catch (RuntimeException $e) {
    // getMessage : le texte de l'erreur
    echo $e->getMessage(), "\n";
}
```

Résultat réel : `Dépendance circulaire : a -> b -> a`. La vraie correction n'est pas dans le conteneur : un cycle signale deux classes mal découpées (voir [responsabilité unique et faible couplage](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage)). On extrait la partie commune dans un troisième service dont les deux dépendent.

## La même idée en JavaScript

Rien dans le principe n'est propre à PHP. En JavaScript, un `Map` (un dictionnaire : des paires clé, valeur) tient lieu de tableau de recettes.

```javascript
// Conteneur : même principe qu'en PHP, en dix lignes
class Conteneur {
    // fabriques : identifiant => fonction qui construit le service
    #fabriques = new Map();
    // instances : identifiant => service déjà construit
    #instances = new Map();

    // definir : ajoute ou remplace une recette
    definir(id, fabrique) {
        // la nouvelle recette remplace l'ancienne
        this.#fabriques.set(id, fabrique);
        // l'instance éventuellement construite est oubliée
        this.#instances.delete(id);
    }

    // get : renvoie le service, construit à la première demande
    get(id) {
        // déjà construit : on le renvoie
        if (this.#instances.has(id)) return this.#instances.get(id);
        // pas de recette : erreur claire
        if (!this.#fabriques.has(id)) throw new Error(`Service inconnu : ${id}`);
        // on construit, en passant le conteneur à la fabrique, puis on garde
        const service = this.#fabriques.get(id)(this);
        this.#instances.set(id, service);
        return service;
    }
}

// déclaration d'un journal puis d'un notifieur qui le reçoit
const c = new Conteneur();
c.definir("journal", () => ({ ecrire: (m) => console.log(`[journal] ${m}`) }));
c.definir("notifieur", (cont) => ({ envoyer: (d) => cont.get("journal").ecrire(d) }));
// utilisation : la construction est paresseuse, dans l'ordre voulu
c.get("notifieur").envoyer("erwan@example.org");
```

Résultat réel : `[journal] erwan@example.org`. Les modules ES et les bibliothèques d'injection (par exemple [InversifyJS](https://inversify.io/) ou [tsyringe](https://github.com/microsoft/tsyringe)) ajoutent les mêmes fonctions que celles décrites ici ; la documentation du standard [PSR-11](https://www.php-fig.org/psr/psr-11/) fixe, côté PHP, l'interface minimale d'un conteneur (`get` et `has`).

## Dans un vrai framework

Les frameworks reprennent ce mécanisme et le déclarent en configuration. Le tableau relie chaque notion de ce chapitre à son équivalent habituel (le détail varie d'un framework à l'autre : la page [du conteneur de Symfony](https://symfony.com/doc/current/service_container.html) en donne un exemple complet).

| Notion du chapitre | Équivalent courant dans un framework |
|---|---|
| `definir('id', fabrique)` | Une entrée de fichier `services.yml` : identifiant, classe, liste d'arguments |
| `$c->get('journal')` dans une fabrique | Un argument écrit `@journal` dans la déclaration : le framework résout |
| Fournisseur de services | Un fichier de déclarations par module, plus une classe PHP pour les cas dynamiques |
| `decorer` | Une clé `decorates` dans la déclaration |
| Remplacer | Une classe de fournisseur du module qui modifie la définition avant la compilation |
| Cycle détecté | Une erreur à la compilation du conteneur |

## Les pièges

| Piège | Pourquoi c'est un problème | Correction |
|---|---|---|
| Passer le conteneur entier à une classe (`__construct(Conteneur $c)` puis `$c->get(...)` partout) : on appelle cela le **localisateur de services** | Les dépendances réelles de la classe deviennent invisibles ; un test doit remplir tout un conteneur ; le conteneur est partout | Injecter chaque dépendance, une par paramètre ; ne réserver le conteneur qu'aux fabriques |
| Remplacer un service du noyau par une classe qui ne respecte pas tout son contrat | Un autre service du noyau appelle une méthode manquante : l'erreur surgit loin de la cause | Typer sur l'interface et implémenter toutes ses méthodes ; ou décorer plutôt que remplacer |
| Deux modules remplacent le même identifiant | Le dernier appelé gagne, sans avertissement : le résultat dépend de l'ordre | Décorer plutôt que remplacer ; vérifier l'ordre des fournisseurs |
| Service partagé qui garde un état propre à une opération | Deux opérations se partagent le même état (données d'un utilisateur chez un autre) | Service non partagé, ou état passé en paramètre de méthode |
| Dépendance circulaire entre deux services | Construction impossible, ou contournée par une injection tardive qui masque un mauvais découpage | Extraire la partie commune dans un troisième service |
| Modifier une déclaration sans reconstruire le cache du conteneur compilé | Le framework continue d'utiliser l'ancienne version | Vider le cache du framework après chaque changement de déclaration |
| Construire beaucoup de choses lourdes au constructeur (connexion, lecture de fichier) | Le service est construit dès qu'un autre en dépend, même s'il ne sert pas | Constructeur léger, travail au premier appel de méthode |
| Dépendre d'un identifiant écrit en chaîne (`'journal'`) sans le contrôler | Une faute de frappe n'apparaît qu'à l'exécution | Une constante ou le nom de la classe comme identifiant ; un test qui construit chaque service |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Injecter par le constructeur, jamais par `new` dans la classe, pour tout service | La classe annonce ses besoins et se teste avec des faux |
| Typer chaque dépendance sur une interface (`Journal`), pas sur une classe concrète | Remplacer ou décorer ne casse rien |
| Un fournisseur de services par module, qui ne déclare que ses propres services | Chaque module reste indépendant et retirable |
| Préférer **décorer** à **remplacer** quand on veut ajouter un comportement | On garde le travail du noyau et celui des autres modules |
| Documenter dans le projet tout service du noyau remplacé, et pourquoi | Une mise à jour du noyau peut casser un remplaçant sans que rien ne le signale |
| Ne passer le conteneur qu'aux fabriques, jamais aux classes métier | Les dépendances restent visibles dans les signatures |
| Garder les services sans état, sinon les déclarer non partagés | Pas de fuite de données entre opérations |
| Tester un démarrage complet : construire chaque service déclaré | Un cycle, une classe absente ou une faute d'identifiant se détectent avant la mise en ligne |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un conteneur de services range des recettes (fabriques) sous des identifiants et construit chaque objet à la demande, une fois s'il est partagé. Un fournisseur de services regroupe les déclarations d'une partie de l'application. Injecter, c'est qu'une fabrique passe ses dépendances au constructeur. Pour modifier un service du noyau sans éditer le noyau : le redéclarer sous le même identifiant (remplacer) ou l'envelopper (décorer, qui garde l'ancien comportement). Le remplaçant ou le décorateur respecte le même contrat. Un test remplace un service par un faux. Un cycle entre services se corrige en découpant autrement. |
| **Pièges à éviter** | Le localisateur de services (conteneur passé aux classes) ; un remplaçant qui ne respecte pas tout le contrat ; deux remplaçants du même identifiant ; un service partagé qui garde un état ; une dépendance circulaire ; un cache de conteneur oublié ; un constructeur lourd ; un identifiant en chaîne non contrôlé. |
| **Bonnes pratiques** | Injecter par le constructeur ; typer sur une interface ; un fournisseur par module ; décorer plutôt que remplacer ; documenter les remplacements du noyau ; conteneur réservé aux fabriques ; services sans état ; test qui construit chaque service. |

Deux sujets voisins ne sont pas traités ici : l'inversion de contrôle et les hooks (le framework appelle le code du projet à des points prévus) et l'architecture à plugins (des classes découvertes par le framework grâce à une annotation ou un attribut).
