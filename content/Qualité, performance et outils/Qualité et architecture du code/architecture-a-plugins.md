---
order: 16
---

# L'architecture à plugins

Une application grandit : on lui ajoute sans cesse de nouveaux types de blocs d'affichage, de règles de validation, d'adresses d'API. Si chaque ajout oblige à ouvrir le même fichier central pour y ajouter une ligne, ce fichier devient un point de friction. L'**architecture à plugins** (*plugin* se traduit par « module d'extension ») règle ce problème : le programme définit une fois un **point d'extension**, puis chaque nouvelle fonctionnalité arrive sous la forme d'une classe indépendante, que le programme retrouve tout seul, sans qu'on modifie son code central.

Ce chapitre s'appuie sur les classes, les interfaces et les namespaces de la [programmation orientée objet en PHP](/?c=langages&s=php&p=poo), et sur le principe de [responsabilité unique](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage). Des systèmes de gestion de contenu comme Drupal (un logiciel PHP qui permet de construire et d'administrer un site web) s'organisent largement ainsi : leurs blocs d'affichage, leurs contraintes de validation et leurs ressources d'API sont tous des plugins. Les exemples ci-dessous restent génériques et n'utilisent aucun code de ce logiciel.

## Le problème : le `switch` qui grossit

Sans plugins, la création d'un objet selon un nom s'écrit souvent avec une longue suite de cas. Chaque nouveau bloc oblige à modifier cette fonction, qui doit connaître **toutes** les classes existantes.

```php
<?php
function creerBloc(string $type): object      // reçoit le nom du bloc demandé
{
    switch ($type) {                          // compare le nom à chaque cas connu
        case 'bienvenue':                     // premier bloc connu
            return new BlocBienvenue();       // crée un objet de cette classe
        case 'horloge':                       // deuxième bloc connu
            return new BlocHorloge();         // crée un objet de cette classe
        default:                              // tout autre nom
            throw new InvalidArgumentException("Bloc inconnu : $type");
    }
}
```

| Défaut du `switch` central | Conséquence |
|---|---|
| Il liste toutes les classes | Ajouter un bloc oblige à modifier un fichier qui n'a rien à voir avec ce bloc |
| Il est partagé par toute l'équipe | Conflits de fusion fréquents, risque d'oublier une ligne |
| Il ne peut pas être étendu de l'extérieur | Une extension livrée à part ne peut pas s'y ajouter |

## L'idée : déclarer, découvrir, instancier

Le plugin inverse la responsabilité : ce n'est plus le code central qui connaît les classes, c'est chaque classe qui **se déclare** auprès de lui. Trois étapes se suivent.

```
   Classes du projet                 Gestionnaire de plugins
  +-----------------+     1. découvrir     +---------------------------+
  | #[Plugin(...)]  |  ------------------> |  catalogue (id => classe) |
  | BlocBienvenue   |     lire l'étiquette |  bienvenue => BlocBienvenue
  +-----------------+                      |  horloge   => BlocHorloge |
  | #[Plugin(...)]  |                      +---------------------------+
  | BlocHorloge     |                                  |
  +-----------------+          2. choisir par identifiant ('horloge')
  | (sans étiquette)|                                  |
  | ignorée         |                      3. instancier (new BlocHorloge)
  +-----------------+                                  v
                                            objet prêt à l'emploi
```

| Étape | Rôle | Question à laquelle elle répond |
|---|---|---|
| Déclaration | Une étiquette collée sur la classe donne son identifiant et ses informations | « Qui suis-je ? » |
| Découverte | Le gestionnaire parcourt les classes candidates et lit les étiquettes | « Quels plugins existent ? » |
| Instanciation | Le gestionnaire crée l'objet à la demande à partir de son identifiant | « Donne-moi le plugin `horloge` » |

Les trois ingrédients à fournir sont donc : un **contrat** (une interface), une **étiquette** (la déclaration) et un **gestionnaire** (le chef d'orchestre).

| Ingrédient | Définition | Exemple dans ce chapitre |
|---|---|---|
| Contrat | Une [interface](https://www.php.net/manual/fr/language.oop5.interfaces.php) : la liste des méthodes que toute classe qui la signe doit offrir | `PluginDeBloc` avec la méthode `rendre()` |
| Étiquette | Une information attachée à la classe elle-même, lisible par un autre programme | `#[Plugin(id: 'horloge', ...)]` |
| Gestionnaire | Un objet qui tient le catalogue des plugins et les fabrique | `GestionnaireDePlugins` |

## Le contrat et l'étiquette en PHP

Un **attribut** est, depuis PHP 8, une étiquette écrite entre `#[` et `]` juste avant une classe, une méthode ou une propriété. Il ne fait rien par lui-même : il porte des informations qu'un autre code lira plus tard, grâce à la **réflexion** ([Reflection](https://www.php.net/manual/fr/book.reflection.php)), c'est-à-dire la capacité d'un programme à examiner ses propres classes pendant son exécution.

```php
<?php
// Contrat : tout plugin de bloc sait produire son texte
interface PluginDeBloc                        // déclare l'interface (le contrat)
{
    public function rendre(): string;         // méthode obligatoire, renvoie un texte
}

#[Attribute(Attribute::TARGET_CLASS)]         // cet attribut ne se pose que sur une classe
final class Plugin                            // la classe qui représente l'étiquette
{
    public function __construct(              // les valeurs données entre parenthèses
        public readonly string $id,           // identifiant unique du plugin, lecture seule
        public readonly string $libelle,      // nom lisible pour un écran d'administration
    ) {
    }
}

#[Plugin(id: 'bienvenue', libelle: 'Message de bienvenue')]  // l'étiquette du plugin
final class BlocBienvenue implements PluginDeBloc            // signe le contrat
{
    public function rendre(): string          // implémente la méthode exigée
    {
        return 'Bonjour et bienvenue !';      // le texte produit par ce bloc
    }
}

#[Plugin(id: 'horloge', libelle: 'Heure du serveur')]        // l'étiquette du second plugin
final class BlocHorloge implements PluginDeBloc              // signe le même contrat
{
    public function rendre(): string          // implémente la méthode exigée
    {
        return 'Il est ' . date('H:i');       // l'heure courante, au format heures:minutes
    }
}

// Cette classe n'a pas d'étiquette : le gestionnaire l'ignorera
final class ClasseSansEtiquette implements PluginDeBloc
{
    public function rendre(): string          // le contrat est respecté
    {
        return 'invisible';                   // mais personne ne la découvrira
    }
}
```

`final` interdit d'hériter d'une classe, `readonly` interdit de modifier une propriété après sa création : ces deux mots rendent les plugins plus prévisibles. Le nom `Plugin` de l'attribut est un choix d'exemple, rien n'impose ce mot.

## Le gestionnaire de plugins

Le gestionnaire fait deux choses : il **découvre** (il lit les étiquettes pour remplir un catalogue, un tableau qui associe chaque identifiant à sa classe) puis il **instancie** (il crée un objet à partir d'une classe). Il vérifie aussi que chaque classe étiquetée respecte bien le contrat attendu.

```php
<?php
final class GestionnaireDePlugins
{
    /** @var array<string, array{classe: class-string, libelle: string}> */
    private array $catalogue = [];            // le catalogue : identifiant => informations

    /** @param class-string $contrat interface que chaque plugin doit respecter */
    public function __construct(private readonly string $contrat)  // retient le contrat
    {
    }

    /** @param list<class-string> $classes classes candidates à examiner */
    public function decouvrir(array $classes): void
    {
        foreach ($classes as $classe) {       // examine chaque classe candidate
            $etiquettes = (new ReflectionClass($classe))   // ouvre la classe en réflexion
                ->getAttributes(Plugin::class);            // récupère ses attributs Plugin
            if ($etiquettes === [] || !is_subclass_of($classe, $this->contrat)) {
                continue;                     // sans étiquette ou mauvais contrat : on saute
            }
            $definition = $etiquettes[0]->newInstance();   // crée l'objet Plugin lu
            $this->catalogue[$definition->id] = [          // enregistre dans le catalogue
                'classe' => $classe,          // la classe à instancier plus tard
                'libelle' => $definition->libelle,         // le nom lisible
            ];
        }
    }

    /** @return array<string, string> identifiant => libellé */
    public function definitions(): array
    {
        return array_map(                     // transforme chaque entrée du catalogue
            static fn (array $entree): string => $entree['libelle'],  // garde le libellé
            $this->catalogue,                 // le tableau à transformer
        );
    }

    public function creer(string $id): object
    {
        if (!isset($this->catalogue[$id])) {  // l'identifiant n'est pas dans le catalogue
            throw new InvalidArgumentException("Plugin inconnu : $id");  // erreur claire
        }
        return new $this->catalogue[$id]['classe']();   // crée l'objet de la classe trouvée
    }
}
```

Une [exception](/?c=langages&s=php&p=exceptions) est levée pour un identifiant inconnu : sans elle, le programme planterait avec un message obscur plus loin. L'utilisation s'écrit en quelques lignes :

```php
<?php
$gestionnaire = new GestionnaireDePlugins(PluginDeBloc::class);  // un gestionnaire de blocs
$gestionnaire->decouvrir([                    // donne la liste des classes à examiner
    BlocBienvenue::class,                     // plugin étiqueté
    BlocHorloge::class,                       // plugin étiqueté
    ClasseSansEtiquette::class,               // ignorée faute d'étiquette
]);

print_r($gestionnaire->definitions());        // affiche le catalogue : 2 entrées
echo $gestionnaire->creer('bienvenue')->rendre(), "\n";   // crée le bloc puis l'affiche
try {                                         // tente de créer un plugin inexistant
    $gestionnaire->creer('absent');           // l'identifiant n'existe pas
} catch (InvalidArgumentException $erreur) {  // attrape l'erreur annoncée
    echo $erreur->getMessage(), "\n";         // affiche « Plugin inconnu : absent »
}
```

Résultat obtenu à l'exécution : le catalogue contient `bienvenue` et `horloge` (la classe sans étiquette est absente), puis `Bonjour et bienvenue !`, puis `Plugin inconnu : absent`.

## Où chercher les plugins : les stratégies de découverte

Le gestionnaire reçoit ici une liste de classes écrite à la main, ce qui reproduit le défaut du `switch`. En pratique, on automatise la recherche.

| Stratégie | Principe | Avantage | Limite |
|---|---|---|---|
| Liste explicite | Le code fournit les noms de classes | Simple, rapide | Il faut penser à l'actualiser |
| Parcours de dossier | Le gestionnaire charge tous les fichiers d'un dossier convenu | Déposer un fichier suffit | Charger tous les fichiers coûte du temps |
| Correspondance avec l'[autoloading](/?c=langages&s=php&p=autoloading) | Un namespace est associé à un dossier, les classes se chargent à la demande | Aucun `require` à écrire | Dépend des conventions de nommage |
| Fichier de configuration | Un fichier (YAML, JSON) liste les plugins | Lisible sans lire le code | Deux endroits à tenir synchronisés |

Voici le parcours de dossier, testé avec un fichier déposé dans un dossier `plugs/` :

```php
<?php
function classesDuDossier(string $dossier): array       // renvoie les classes d'un dossier
{
    $avant = get_declared_classes();          // photographie des classes déjà connues
    foreach (glob($dossier . '/*.php') as $fichier) {   // chaque fichier .php du dossier
        require_once $fichier;                // le charge une seule fois
    }
    return array_values(array_diff(get_declared_classes(), $avant));  // classes nouvelles
}
```

Appeler `$gestionnaire->decouvrir(classesDuDossier(__DIR__ . '/plugs'))` suffit alors : ajouter un plugin revient à déposer un fichier dans le dossier, sans modifier une seule ligne du code central.

## Annotation ou attribut

Avant PHP 8, il n'existait pas d'étiquette native : les bibliothèques lisaient des commentaires spéciaux (des **annotations**), par exemple `@Block(id="horloge")` dans un commentaire de documentation. Un attribut est la version native de cette idée.

| Critère | Annotation (commentaire) | Attribut (`#[...]`) |
|---|---|---|
| Nature | Du texte dans un commentaire | Du code reconnu par le langage |
| Lecture | Une bibliothèque doit analyser le texte | La réflexion de PHP le fournit directement |
| Erreur de frappe | Silencieuse : le commentaire est ignoré | Détectée à l'exécution (classe d'attribut introuvable) |
| Outils | Complétion limitée | Complétion et analyse statique complètes |
| Versions concernées | Anciennes bases de code | Code récent |

Les attributs se lisent à l'exécution : pour ne pas les relire à chaque requête, un gestionnaire sérieux garde son catalogue en **cache** (une copie conservée pour ne pas recalculer), sinon la lecture par réflexion de centaines de classes ralentit chaque page.

## Le même mécanisme en JavaScript

Les classes JavaScript n'ont pas d'attributs natifs de ce type. Une propriété statique (une valeur attachée à la classe elle-même, pas à ses objets) joue alors le rôle d'étiquette. Voir les [classes JavaScript](/?c=langages&s=javascript&p=poo).

```javascript
// Chaque classe porte sa déclaration dans une propriété statique
class RessourceUtilisateurs {
  static definition = { id: 'utilisateurs', chemin: '/api/utilisateurs' }; // l'étiquette

  lister() {                                  // méthode attendue de toute ressource
    return ['Alice', 'Bruno'];                // les données renvoyées
  }
}

class RessourceArticles {
  static definition = { id: 'articles', chemin: '/api/articles' };         // l'étiquette

  lister() {                                  // même méthode, autre donnée
    return ['Premier article'];               // les données renvoyées
  }
}

class GestionnaireDePlugins {
  #catalogue = new Map();                     // dictionnaire privé : identifiant => classe

  decouvrir(classes) {
    for (const classe of classes) {           // examine chaque classe candidate
      const definition = classe.definition;   // lit l'étiquette, absente si non déclarée
      if (definition === undefined) continue; // sans étiquette : on ignore la classe
      this.#catalogue.set(definition.id, classe);  // enregistre dans le catalogue
    }
  }

  creer(id) {
    const classe = this.#catalogue.get(id);   // cherche la classe par identifiant
    if (classe === undefined) throw new Error(`Plugin inconnu : ${id}`); // inconnu : erreur
    return new classe();                      // crée l'objet
  }
}

const gestionnaire = new GestionnaireDePlugins();   // crée le gestionnaire
gestionnaire.decouvrir([RessourceUtilisateurs, RessourceArticles, class Autre {}]);
console.log(gestionnaire.creer('articles').lister());   // affiche [ 'Premier article' ]
try {
  gestionnaire.creer('absent');               // identifiant inconnu
} catch (erreur) {
  console.log(erreur.message);                // affiche « Plugin inconnu : absent »
}
```

## Un gestionnaire, plusieurs types de plugins

Le gestionnaire ne dépend que d'un contrat : pour un autre type de plugin, on change l'interface. Voici une contrainte de validation (une règle qu'une valeur saisie doit respecter), avec les mêmes classes `Plugin` et `GestionnaireDePlugins`.

```php
<?php
// Un second type de plugin : une contrainte de validation
interface Contrainte                          // le contrat d'une contrainte
{
    public function valide(string $valeur): bool;   // vrai si la valeur est acceptée
}

#[Plugin(id: 'non_vide', libelle: 'Valeur obligatoire')]         // son étiquette
final class NonVide implements Contrainte     // signe le contrat Contrainte
{
    public function valide(string $valeur): bool
    {
        return trim($valeur) !== '';          // refuse une chaîne vide ou faite d'espaces
    }
}

#[Plugin(id: 'longueur_max_5', libelle: 'Cinq caractères au plus')]   // son étiquette
final class LongueurMax5 implements Contrainte    // signe le contrat Contrainte
{
    public function valide(string $valeur): bool
    {
        return mb_strlen($valeur) <= 5;       // compte les caractères, accents compris
    }
}

// Le même gestionnaire, un autre contrat
$contraintes = new GestionnaireDePlugins(Contrainte::class);  // gestionnaire de contraintes
$contraintes->decouvrir([NonVide::class, LongueurMax5::class, BlocHorloge::class]);

// Les identifiants viennent d'une configuration (ici un simple tableau)
foreach (['non_vide', 'longueur_max_5'] as $id) {    // contraintes demandées par la config
    $resultat = $contraintes->creer($id)->valide('Bonjour') ? 'ok' : 'refusé';
    echo "$id : $resultat\n";                 // affiche le verdict de chaque contrainte
}
print_r(array_keys($contraintes->definitions()));    // BlocHorloge n'y figure pas
```

À l'exécution, `non_vide : ok`, `longueur_max_5 : refusé` (« Bonjour » compte sept caractères), et le catalogue ne contient que les deux contraintes : `BlocHorloge`, bien qu'étiquetée, ne signe pas le contrat `Contrainte` et est écartée.

| Type de plugin | Contrat typique | Ce que le plugin apporte | Où l'identifiant est utilisé |
|---|---|---|---|
| Bloc d'affichage | `rendre()` renvoie du contenu | Un morceau de page réutilisable | Une configuration de mise en page |
| Contrainte de validation | `valide($valeur)` renvoie vrai ou faux | Une règle de contrôle d'un champ | Les règles d'un formulaire |
| Ressource d'API | Une méthode par verbe HTTP (`get`, `post`) | Les réponses d'une adresse d'API | La table des routes de l'API |

## Ce que le plugin n'est pas

Plusieurs mécanismes voisins se confondent facilement avec lui. Les notions d'inversion de contrôle et de points d'accroche (hooks), ainsi que le conteneur de services qui fournit leurs dépendances aux objets, relèvent d'autres chapitres : on s'en tient ici à la différence de nature.

| Mécanisme | Ce qu'il fait | Différence avec le plugin |
|---|---|---|
| Plugin | Plusieurs variantes d'un même rôle, choisies par identifiant | Une classe par variante, instanciée à la demande |
| Héritage | Une classe mère spécialisée par des classes filles | Lie les variantes à une classe mère, sans catalogue ni découverte |
| `switch` central | Liste les variantes dans un seul fichier | Doit être modifié à chaque ajout |
| Hook ou événement | Appelle toutes les fonctions inscrites, l'une après l'autre | Exécute tout le monde, alors qu'un plugin en choisit un |

## Les pièges

| Piège | Pourquoi c'est un problème | Réflexe |
|---|---|---|
| Deux plugins avec le même identifiant | Le second écrase silencieusement le premier dans le catalogue | Refuser le doublon avec une exception au moment de la découverte |
| Oublier l'interface du contrat | Le plugin est découvert puis plante à l'appel d'une méthode manquante | Vérifier le contrat à la découverte, comme `is_subclass_of` ci-dessus |
| Relire la réflexion à chaque requête | Lenteur proportionnelle au nombre de classes | Mettre le catalogue en cache et l'invalider au déploiement |
| Charger tous les fichiers d'un dossier | Une classe cassée fait planter toute la découverte | Capturer l'erreur par fichier et signaler le plugin fautif |
| Un plugin qui crée lui-même ses dépendances | Plugin difficile à tester, couplé à un détail technique | Lui fournir ses dépendances de l'extérieur, voir l'[injection de dépendances](/?c=langages&s=php&p=poo#injection-de-dependances) |
| Identifiant tapé à la main partout | Une faute de frappe n'est révélée qu'à l'exécution | Constante ou configuration centralisée, voir la [source unique de vérité](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=source-unique-de-verite) |
| Plugin pour deux variantes seulement | Mécanique inutilement lourde | Commencer par un `switch` et passer aux plugins quand les variantes se multiplient |

## Bonnes pratiques

| Pratique | Raison |
|---|---|
| Un contrat clair et petit par type de plugin | Le gestionnaire reste simple et le plugin reste facile à écrire |
| Un identifiant stable, en minuscules, jamais renommé | Les configurations enregistrées pointent dessus |
| Une classe par plugin, une responsabilité par classe | Principe de [responsabilité unique](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) |
| Un gestionnaire par type de plugin | Chaque catalogue reste cohérent, un contrat différent par catalogue |
| Un message d'erreur qui nomme l'identifiant fautif | Le débogage se fait en une lecture |
| Un test qui découvre tous les plugins et vérifie leur contrat | Détecte un plugin mal déclaré avant la mise en ligne |
| Documentation officielle de référence | [Attributs PHP](https://www.php.net/manual/fr/language.attributes.overview.php) et [documentation d'un système de plugins](https://www.drupal.org/docs/drupal-apis/plugin-api) |

## Ce qu'il faut retenir

| Notion | À retenir |
|---|---|
| Plugin | Une classe indépendante qui se déclare elle-même, au lieu d'être listée dans un fichier central |
| Contrat | Une interface qui décrit ce que tout plugin d'un type doit savoir faire |
| Étiquette | Un attribut PHP `#[...]` (ou une annotation en commentaire) porte l'identifiant du plugin |
| Gestionnaire | Découvre les classes étiquetées, remplit un catalogue, instancie à la demande |
| Découverte | Liste, dossier ou autoloading ; un cache évite de relire la réflexion à chaque requête |
| Bénéfice | Ajouter une fonctionnalité sans toucher au code central |
| Piège principal | Doublons d'identifiants et contrat non vérifié, à détecter dès la découverte |
