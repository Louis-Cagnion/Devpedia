---
order: 14
---

# Inversion de contrôle et points d'extension : hooks, événements, dépendance optionnelle

Dans un petit programme, c'est votre code qui décide de tout : il démarre, appelle des fonctions, puis s'arrête. Dans une application construite sur un **framework** (une grande base de code déjà écrite, qui fournit le squelette de l'application : réception des requêtes, affichage, enregistrement des données), c'est l'inverse. Vous n'écrivez que des morceaux, et c'est le framework qui décide quand les exécuter. Ce renversement s'appelle l'**inversion de contrôle**. Ce chapitre l'explique avec de petits programmes que vous pouvez recopier, puis montre comment créer vos propres points d'accroche et comment dépendre d'un autre module sans casser l'application quand il est absent.

## L'idée : ne plus appeler, se faire appeler

Une **bibliothèque** est un lot de fonctions que vous appelez quand vous en avez besoin. Un framework, lui, appelle votre code. On résume souvent cela par la phrase « ne nous appelez pas, nous vous appellerons ».

| | Bibliothèque | Framework |
|---|---|---|
| Qui démarre le programme | Votre code | Le framework |
| Qui décide de l'ordre des appels | Vous | Le framework |
| Ce que vous écrivez | Des appels de fonctions | Des morceaux que le framework rappelle |
| Analogie | Vous cuisinez avec des ustensiles | Vous remettez une recette au restaurant, la cuisine l'exécute quand une commande arrive |

```text
Sans inversion de contrôle           Avec inversion de contrôle

  votre code ──appelle──> outil        framework ──appelle──> votre code
  (vous décidez quand)                 (il décide quand, vous déclarez quoi)
```

Le gain : le framework peut ajouter, remplacer ou enlever des morceaux sans modifier les autres. La contrepartie : pour que le framework connaisse votre code, il faut le lui **déclarer**.

## Ce que l'on déclare : route, hook, service, plugin

Une **déclaration** est une information donnée au framework (dans un fichier de configuration ou par une convention de nommage) qui dit « quand telle situation arrive, appelle ceci ».

| Ce que vous déclarez | Situation qui déclenche l'appel | Exemple générique |
|---|---|---|
| Une **route** | Une adresse est demandée par un visiteur | `/bonjour` appelle la fonction `afficherBonjour` |
| Un **hook** (crochet) | Le framework atteint un moment précis de son travail | « avant d'afficher une page », « chaque nuit » |
| Un **abonné d'événement** | Un événement est annoncé par un autre morceau de code | « une commande vient d'être créée » |
| Un **service** | Un morceau de code a besoin d'une fonctionnalité partagée | Un service d'envoi d'e-mails |
| Un **plugin** | Le framework cherche une brique d'un type précis | Un nouveau type de bloc d'affichage |

Les services (et le conteneur qui les fabrique) et les architectures à plugins font l'objet de chapitres à part : ici, on ne traite que les routes, les hooks, les événements et la dépendance entre modules. Le mécanisme d'[injection de dépendances](/?c=langages&s=php&p=poo) (recevoir un objet de l'extérieur plutôt que de le créer soi-même) est la même idée appliquée aux objets.

## Premier exemple : une route déclarée

Ce petit noyau mémorise des routes (une **route** associe une adresse à la fonction qui y répond) et appelle la bonne fonction. Les éléments de syntaxe PHP utilisés sont décrits juste après.

```php
<?php
final class Noyau
{
    private array $routes = [];  // registre : adresse => fonction à appeler

    public function route(string $adresse, callable $action): void
    {
        $this->routes[$adresse] = $action;  // le projet déclare, le noyau mémorise
    }

    public function traiter(string $adresse): string
    {
        $action = $this->routes[$adresse] ?? fn() => 'Erreur 404';  // repli si inconnue
        return $action();  // c'est le noyau qui appelle le code du projet
    }
}

$noyau = new Noyau();
$noyau->route('/bonjour', fn() => 'Bonjour le monde');  // déclaration côté projet
echo $noyau->traiter('/bonjour'), "\n";  // le noyau trouve et appelle la fonction
echo $noyau->traiter('/absent'), "\n";  // aucune déclaration : repli 404
```

Résultat obtenu à l'exécution :

```text
Bonjour le monde
Erreur 404
```

| Syntaxe PHP | Signification |
|---|---|
| `final class` | Classe qu'aucune autre classe ne peut étendre (voir [la POO en PHP](/?c=langages&s=php&p=poo)) |
| `private array $routes = []` | Propriété cachée de l'extérieur, de type tableau, vide au départ |
| `callable` | Type d'une valeur que l'on peut appeler comme une fonction |
| `fn() => 'texte'` | Fonction anonyme courte : elle n'a pas de nom et renvoie la valeur après la flèche |
| `$a ?? $b` | Vaut `$a` s'il existe, sinon `$b` |
| `$action()` | Appelle la fonction rangée dans la variable `$action` |

Le projet ne contient aucun `traiter()` : il se contente d'appeler `route()`. L'appel de sa fonction est entièrement décidé par le noyau.

## Le hook : une convention de nommage

Un **hook** est un point précis du travail du framework où chaque module peut se brancher. Dans le style le plus simple, le framework cherche des fonctions dont le nom suit une règle : `<nom du module>_<nom du hook>`. Un **module** est ici un paquet de code que l'on active ou désactive.

```php
<?php
function blog_cron(): string { return 'blog : purge des brouillons'; }
function stats_cron(): string { return 'stats : calcul du rapport'; }

$modules = ['blog', 'stats', 'galerie'];  // modules activés (galerie n'a pas de cron)
foreach ($modules as $module) {
    $hook = $module . '_cron';  // nom construit : module + '_' + nom du hook
    if (function_exists($hook)) {  // le module a-t-il écrit cette fonction ?
        echo $hook(), "\n";  // appel d'une fonction dont le nom est dans $hook
    }
}
```

Résultat :

```text
blog : purge des brouillons
stats : calcul du rapport
```

Le hook `cron` (une tâche lancée à intervalle régulier, voir [l'automatisation](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow)) est appelé pour `blog` et `stats`. Le module `galerie` n'a rien écrit : `function_exists` (qui répond `true` si une fonction de ce nom existe) évite l'erreur et le module est ignoré. Aucune déclaration n'était nécessaire : le nom de la fonction suffit.

Le même principe, appliqué aux assistants d'intelligence artificielle, est décrit dans [les hooks d'un agent LLM](/?c=ia&s=configuration-de-llms&p=hooks).

## L'abonné d'événement et sa priorité

Un **événement** est l'annonce « quelque chose vient de se produire » (une commande est créée). Les morceaux de code intéressés s'**abonnent** : ils fournissent une fonction, appelée à chaque annonce. Dans une page web, `addEventListener` joue ce rôle (voir [le DOM et les événements](/?c=langages&s=javascript&p=dom-et-evenements)). Quand plusieurs abonnés écoutent le même événement, l'ordre compte : on le règle avec une **priorité**, un nombre entier. Le plus grand passe en premier.

```js
class Dispatcher {
  constructor() {
    this.listeners = new Map();  // nom d'événement => liste d'abonnés
  }

  subscribe(event, listener, priority = 0) {
    const list = this.listeners.get(event) ?? [];  // liste existante ou vide
    list.push({ listener, priority });  // on ajoute l'abonné avec sa priorité
    list.sort((a, b) => b.priority - a.priority);  // plus grande priorité d'abord
    this.listeners.set(event, list);  // on range la liste triée
  }

  dispatch(event, payload) {
    for (const { listener } of this.listeners.get(event) ?? []) {
      if (listener(payload) === false) {  // un abonné répond false : on s'arrête
        return false;
      }
    }
    return true;  // tous les abonnés sont passés
  }
}

const dispatcher = new Dispatcher();
dispatcher.subscribe('commande.creee', (c) => console.log('journal :', c.id), -10);
dispatcher.subscribe('commande.creee', (c) => console.log('mail à', c.client));
dispatcher.subscribe('commande.creee', (c) => c.client !== 'banni', 100);

console.log(dispatcher.dispatch('commande.creee', { id: 1, client: 'Alice' }));
console.log(dispatcher.dispatch('commande.creee', { id: 2, client: 'banni' }));
```

Résultat :

```text
mail à Alice
journal : 1
true
false
```

| Terme JavaScript | Signification |
|---|---|
| `Map` | Dictionnaire : associe une clé (ici le nom de l'événement) à une valeur |
| `payload` | Charge utile : les données jointes à l'annonce (ici la commande) |
| `list.sort((a, b) => ...)` | Trie la liste ; la fonction compare deux éléments, `b - a` donne l'ordre décroissant |
| `for (const { listener } of ...)` | Parcourt la liste en extrayant le champ `listener` de chaque élément |

Pour Alice, l'abonné de priorité 100 (contrôle) répond `true`, puis celui de priorité 0 envoie le mail, puis celui de priorité -10 écrit le journal. Pour le client banni, le contrôle répond `false` : les deux autres ne sont jamais appelés. Deux abonnés de même priorité s'exécutent dans l'ordre d'abonnement, car le tri de JavaScript est stable (il ne réordonne pas les éléments égaux).

## Hook ou événement : lequel choisir

| | Hook (convention de nom) | Abonné d'événement |
|---|---|---|
| Comment le code est trouvé | Le framework cherche le nom `module_hook` | Le code s'abonne explicitement |
| Ordre d'exécution | Ordre des modules (souvent un poids configurable) | Priorité fixée à l'abonnement |
| Arrêter la suite | Rarement possible | Possible (la propagation s'arrête) |
| Ce qui est transmis | Les arguments de la fonction | Un objet événement, modifiable |
| Forme typique | Fonctions procédurales | Classes ou fonctions anonymes |

Les deux servent la même idée. Un framework ancien utilise souvent des hooks, un framework récent privilégie les événements, et beaucoup proposent les deux.

## Créer son propre point d'extension : `invokeAll` et `alter`

Un framework n'a pas le monopole des points d'accroche : votre propre module peut en déclarer, pour que d'autres modules s'y branchent sans le modifier. Deux formes très courantes :

| Forme | Rôle | Valeur renvoyée |
|---|---|---|
| `invokeAll(hook, args)` | Appelle **toutes** les implémentations du hook et rassemble leurs réponses | Un tableau : une réponse par module |
| `alter(hook, données)` | Donne la donnée **déjà construite** à chaque module, qui peut la modifier | Rien : la donnée est modifiée sur place |

`invokeAll` sert à **collecter** (chaque module apporte des liens de menu). `alter` sert à **retoucher** le résultat final (un module en retire un).

```php
<?php
function blog_menu_links(): array { return ['accueil' => '/', 'blog' => '/blog']; }
function stats_menu_links(): array { return ['stats' => '/stats']; }
function prive_menu_links_alter(array &$liens): void { unset($liens['stats']); }

final class GestionnaireModules
{
    public function __construct(private array $modules) {}  // modules activés

    public function invokeAll(string $hook, array $args = []): array
    {
        $resultats = [];
        foreach ($this->modules as $module) {
            $fonction = $module . '_' . $hook;  // ex. blog_menu_links
            if (function_exists($fonction)) {
                $resultats[$module] = $fonction(...$args);  // ... : déplie $args
            }
        }
        return $resultats;
    }

    public function alter(string $hook, array &$donnees): void
    {
        foreach ($this->modules as $module) {
            $fonction = $module . '_' . $hook . '_alter';  // ex. prive_menu_links_alter
            if (function_exists($fonction)) {
                $fonction($donnees);  // la fonction modifie $donnees sur place
            }
        }
    }
}

$gestionnaire = new GestionnaireModules(['blog', 'stats', 'prive']);
$liens = array_merge(...array_values($gestionnaire->invokeAll('menu_links')));
$gestionnaire->alter('menu_links', $liens);  // les modules retouchent le résultat
echo json_encode($liens), "\n";
```

Résultat (le `\/` est simplement la façon dont `json_encode` écrit `/`) :

```text
{"accueil":"\/","blog":"\/blog"}
```

| Syntaxe PHP | Signification |
|---|---|
| `array &$liens` | Le `&` passe une **référence** : la fonction reçoit la variable elle-même, pas une copie, donc ses modifications se voient dehors |
| `unset($liens['stats'])` | Supprime la clé `stats` du tableau |
| `private array $modules` dans le constructeur | Raccourci : déclare la propriété et la remplit à la création de l'objet |
| `$fonction(...$args)` | Les trois points déplient le tableau `$args` en arguments séparés |
| `array_values`, `array_merge` | Le premier ignore les clés (ici les noms de modules), le second fusionne des tableaux |
| `json_encode` | Transforme un tableau en texte JSON, pratique pour l'afficher |

Le déroulement : `invokeAll` a collecté les liens de `blog` et de `stats`, puis `alter` a laissé le module `prive` retirer le lien `stats`. Les modules `blog`, `stats` et `prive` ne se connaissent pas : seul le point d'extension `menu_links` les relie.

```text
  GestionnaireModules::invokeAll('menu_links')
        │
        ├──> blog_menu_links()   ──> accueil, blog
        └──> stats_menu_links()  ──> stats
                    │
                    ▼  tableau fusionné
  GestionnaireModules::alter('menu_links', $liens)
        └──> prive_menu_links_alter()  ──> retire « stats »
```

## La dépendance entre modules : déclarée, optionnelle ou cachée

Quand le module `export` utilise une fonction du module `stats`, il **dépend** de lui. Trois situations existent.

| Type | Situation | Ce que fait le framework |
|---|---|---|
| Dépendance **obligatoire** déclarée | `export` ne fonctionne pas sans `stats` | Refuse d'activer `export` si `stats` est absent |
| Dépendance **optionnelle** | `export` fonctionne sans `stats`, mais ajoute une information s'il est là | Rien : `export` vérifie lui-même la présence |
| Dépendance **non déclarée** | `export` appelle `stats` sans le dire ni vérifier | Rien, jusqu'à l'erreur fatale en production |

Une déclaration obligatoire s'écrit généralement dans le fichier de description du module. Exemple fictif :

```yaml
name: Export
requires:
  - core      # sans le noyau, rien ne fonctionne
optional:
  - stats     # à utiliser si présent (vérifié dans le code)
```

Pour l'optionnel, on demande au gestionnaire si le module est activé. Dans beaucoup de frameworks, cette méthode s'appelle `moduleExists`.

```php
<?php
$actif = ($argv[1] ?? 'sans') === 'avec';  // simule le module stats activé ou non
if ($actif) {
    function stats_total(): int { return 340; }  // définie seulement si stats est activé
}

final class Modules
{
    public function __construct(private array $actifs) {}

    public function moduleExists(string $nom): bool
    {
        return in_array($nom, $this->actifs, true);  // le module est-il activé ?
    }
}

function rapport_prudent(Modules $modules): string
{
    $texte = '12 articles';
    if ($modules->moduleExists('stats')) {  // dépendance optionnelle : on vérifie
        $texte .= ', ' . stats_total() . ' visites';
    }
    return $texte;
}

function rapport_imprudent(): string
{
    return '12 articles, ' . stats_total() . ' visites';  // dépendance non déclarée
}

$modules = new Modules($actif ? ['export', 'stats'] : ['export']);
echo rapport_prudent($modules), "\n";
try {
    echo rapport_imprudent(), "\n";
} catch (Error $erreur) {
    echo 'Erreur : ', $erreur->getMessage(), "\n";
}
```

Ce script se lance avec `php fichier.php sans` (le module `stats` est désactivé) ou `php fichier.php avec`. Résultats observés :

| Lancement | `rapport_prudent` | `rapport_imprudent` |
|---|---|---|
| `sans` | `12 articles` | `Erreur : Call to undefined function stats_total()` |
| `avec` | `12 articles, 340 visites` | `12 articles, 340 visites` |

La fonction imprudente fonctionne tant que `stats` est activé, ce qui masque le défaut : l'application casse le jour où quelqu'un désactive `stats`, souvent loin de l'endroit de l'erreur. La fonction prudente s'adapte aux deux cas. Les éléments de syntaxe nouveaux : `$argv` contient les mots tapés après le nom du script, `in_array(..., true)` cherche une valeur dans un tableau en comparant aussi le type, `try` / `catch (Error ...)` rattrape une erreur au lieu d'arrêter le programme (voir [les exceptions en PHP](/?c=langages&s=php&p=exceptions)), et `.=` ajoute du texte à la fin d'une chaîne.

Le sens de la dépendance importe aussi : un module de base ne doit jamais dépendre d'un module optionnel, sans quoi on crée un cycle (voir [vérifier le sens des dépendances](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=sens-des-dependances-avant-de-centraliser)).

## Ce que l'inversion de contrôle change pour votre code

| Avantage | Contrepartie |
|---|---|
| Ajouter un comportement sans modifier le code existant | Le chemin d'exécution est plus difficile à suivre : on ne voit pas qui appelle qui |
| Chaque module reste petit et indépendant (voir la [responsabilité unique](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage)) | Un oubli de déclaration se traduit par un silence : rien n'est appelé et aucune erreur n'apparaît |
| Le framework peut changer l'ordre ou le moment des appels | L'ordre d'exécution dépend de priorités ou de poids à surveiller |

## Les pièges

| Piège | Pourquoi c'est un problème | Réaction recommandée |
|---|---|---|
| Faute de frappe dans le nom d'un hook (`blog_cron` écrit `blog_cro`) | La fonction n'est jamais appelée et aucune erreur n'est signalée | Tester que l'effet attendu se produit ; vérifier le nom dans la documentation du hook |
| Deux abonnés de même priorité dont l'ordre compte | L'ordre dépend alors de l'ordre d'abonnement, fragile | Donner des priorités distinctes quand l'ordre est important |
| Un abonné qui arrête la propagation sans le dire | Les autres abonnés ne s'exécutent plus, sans trace | Documenter chaque arrêt et le journaliser |
| Un `alter` qui change la forme de la donnée | Les modules suivants reçoivent une structure inattendue | Garder la même structure, ne modifier que les valeurs |
| Un hook qui fait un travail lourd (requête réseau, boucle sur toute la base) | Il est appelé à chaque passage, il ralentit tout | Confier le gros travail à une tâche différée |
| Appeler un autre module sans le déclarer ni le vérifier | Erreur fatale le jour où ce module est désactivé | Déclarer la dépendance, ou la tester avec `moduleExists` |
| Modifier le noyau du framework pour « ajouter une fonction » | La modification est perdue à la prochaine mise à jour | Passer par un hook, un événement ou un service du projet |

## Bonnes pratiques

| Bonne pratique | Raison |
|---|---|
| Choisir un nom de hook clair et le documenter à côté de sa déclaration | Les autres modules savent quoi implémenter |
| Préférer `invokeAll` pour collecter et `alter` pour retoucher | Chaque forme a un rôle précis, le comportement reste prévisible |
| Déclarer toute dépendance obligatoire dans le fichier du module | Le framework refuse l'activation incohérente plutôt que de casser plus tard |
| Protéger toute dépendance optionnelle par une vérification (`moduleExists`) | L'application survit à l'absence du module |
| Écrire un test par implémentation de hook, avec et sans les modules optionnels | Un hook non appelé ne produit aucune erreur : seul un test le révèle |
| Garder les abonnés courts et sans effet de bord caché | Facilite le débogage d'un chemin déjà indirect |

## Ce qu'il faut retenir

- L'**inversion de contrôle** consiste à déclarer du code (route, hook, abonné, service, plugin) pour que le framework l'appelle au bon moment, au lieu de l'appeler soi-même.
- Un **hook** se repère par une convention de nommage, un **abonné d'événement** s'inscrit explicitement et reçoit une **priorité** qui fixe l'ordre d'exécution.
- On peut créer ses propres points d'extension : `invokeAll` collecte les réponses de tous les modules, `alter` leur laisse modifier une donnée déjà construite.
- Une **dépendance obligatoire** se déclare, une **dépendance optionnelle** se vérifie dans le code (`moduleExists`), une **dépendance non déclarée** est un défaut qui ne casse que le jour où le module disparaît.
- Le prix de l'inversion est un chemin d'exécution moins visible : nommer, documenter et tester chaque point d'extension.
