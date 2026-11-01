---
order: 17
---

# Afficher une entité : constructeur de rendu, route et contrôle d'accès (31/10/2026)

Une **entité** est une donnée que l'application sait identifier, ranger et retrouver : un article, un utilisateur, un commentaire, une commande. Elle a un **type** (« article »), un **numéro** (le 12) et des champs (titre, texte, auteur). Afficher une entité sur une page web paraît simple : on lit la donnée et on écrit du [HTML](/?c=langages&s=html&p=structure-dun-document) (le langage qui décrit le contenu d'une page web). En réalité, trois questions distinctes se cachent derrière ce geste, et les mélanger produit du code fragile et des failles de sécurité. Ce chapitre les sépare avec un petit programme PHP que vous pouvez lancer, puis montre comment un système de gestion de contenu (CMS, un logiciel qui permet de publier et de gérer des contenus) comme [Drupal](https://www.drupal.org/docs/drupal-apis/entity-api) les réalise avec trois outils : un constructeur de rendu, une route d'entité et un gestionnaire de contrôle d'accès.

Il demande **PHP 8.1 au minimum** (les énumérations `enum` et les propriétés `readonly` n'existent pas avant ; le chapitre a été testé en PHP 8.3). Il suppose connus [le routage sans framework](/?c=langages&s=php&p=routage) (une route associe une adresse à du code), [la POO en PHP](/?c=langages&s=php&p=poo) (classe, constructeur, injection de dépendances) et, pour le paramètre d'adresse transformé en objet, [la conversion de paramètre de route](/?c=langages&s=php&p=alias-d-adresse-et-conversion-de-parametre). Les codes de statut `200`, `403` et `404` sont présentés dans [les échanges de données : API et HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http).

> Dans ce chapitre, Drupal n'est qu'un **exemple** : le principe vaut pour n'importe quel framework (une grande base de code qui fournit le squelette d'une application, voir [l'inversion de contrôle](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension) ; par exemple [Symfony](https://symfony.com/doc/current/index.html) ou [Laravel](https://laravel.com/docs)) ou pour du code écrit à la main. Ce qui est propre à Drupal est principalement regroupé dans la section « Un exemple : comment Drupal 11 réalise ce principe » (quelques mentions « dans Drupal » reviennent dans « Les listes et les requêtes » et dans les récapitulatifs) ; le reste est du PHP pur que le chapitre exécute vraiment.

## Le problème : trois questions mélangées

Quand un visiteur demande l'article 12, le programme doit répondre à trois questions, dans cet ordre.

| Question | Elle concerne | Exemple de réponse | Elle change quand |
|---|---|---|---|
| Quelle est la donnée ? | La **donnée** | « Titre : Salut, auteur : 2, statut : publié » | Le contenu de l'article est modifié |
| A-t-on le droit de la voir ? | Le **droit d'accès** | « Oui » ou « Non » selon le compte du visiteur | Une règle de sécurité change |
| Comment la présenter ? | La **mise en page** | Un titre en gros, puis le texte ; ou seulement le titre dans une liste | Le design du site change |

Voici ce que donne le réflexe de tout écrire au même endroit. Quelques repères de syntaxe pour ce premier bloc (voir [la syntaxe de PHP](/?c=langages&s=php&p=syntaxe) et [les variables](/?c=langages&s=php&p=variables)) : `<?php` ouvre le code PHP ; `function nom(...)` définit une fonction, un bloc de code réutilisable ; `array` et `string` sont les types « tableau » et « texte » ; `echo` écrit un texte à l'écran ; `.` colle deux textes bout à bout ; `!==` veut dire « différent (valeur ou type) » ; `&&` veut dire « et » entre deux conditions.

```php
<?php
// fichier : melange.php
// un article et deux comptes, en tableaux associatifs (paires clé => valeur)
$article = ['titre' => 'Bonjour', 'statut' => 'brouillon', 'auteur' => 2];
$auteur = ['id' => 2];  // le compte qui a écrit l'article
$passant = ['id' => 5]; // un autre compte

// l'affichage d'un article, avec tout mélangé dans une seule fonction
function afficherArticle(array $article, array $compte): string
{
    // règle d'accès : un brouillon n'est visible que par son auteur
    if ($article['statut'] === 'brouillon' && $article['auteur'] !== $compte['id']) {
        return 'Accès interdit';
    }
    // mise en page : le titre est collé tel quel dans le HTML
    return '<h2>' . $article['titre'] . '</h2>';
}

echo afficherArticle($article, $auteur), "\n";  // attendu : le titre en HTML
echo afficherArticle($article, $passant), "\n"; // attendu : le refus
```

Résultat obtenu :

```text
<h2>Bonjour</h2>
Accès interdit
```

Cela fonctionne, mais trois défauts apparaissent dès que le site grandit.

| Défaut | Conséquence |
|---|---|
| La règle d'accès est recopiée dans chaque page qui affiche un article (liste, fil d'actualité, recherche) | Une page oublie la règle et laisse voir un brouillon : c'est un *contrôle d'accès défaillant*, la première famille de failles du [Top 10 de l'OWASP](/?c=securite&s=cybersecurite&p=owasp-top-10) |
| La mise en page est écrite dans la même fonction que la règle | Changer le design oblige à rouvrir du code de sécurité |
| Le titre est collé dans le HTML sans être neutralisé | Un titre contenant `<script>` serait exécuté par le navigateur : une faille XSS (*Cross-Site Scripting*, voir [XSS en détail](/?c=securite&s=cybersecurite&p=xss-en-detail)), voir aussi [sécuriser vos données](/?c=langages&s=php&p=securite) |

La solution est celle de [la responsabilité unique](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) : une pièce par question (la donnée, le droit, la présentation), et une quatrième pièce, la route, qui les enchaîne.

```text
  requête : /article/12
        |
        v
  ROUTE D'ENTITÉ        "cette adresse montre un article, en mode complet,
        |                à condition d'avoir le droit de le voir"
        v
  CONVERSION            "12" devient l'objet Article numéro 12 (sinon 404)
        |
        v
  CONTRÔLE D'ACCÈS ---- refusé ----> réponse 403
        |
     autorisé
        v
  CONSTRUCTEUR DE RENDU    donnée + mode d'affichage = tableau de rendu
        |
        v
  MOTEUR DE RENDU          tableau de rendu = HTML (texte neutralisé)
        |
        v
  réponse 200
```

Chaque étape du schéma est détaillée plus bas. « Constructeur de rendu » et « moteur de rendu » sont deux pièces différentes ; le premier n'a rien à voir avec le `__construct` d'une classe.

## Les pièces du mini-exemple

Le reste du chapitre construit ces pièces une par une, en PHP pur, dans quatre fichiers, puis un script d'essai. Pour les essayer, enregistrez les cinq fichiers dans un même dossier, ouvrez un terminal (voir [le terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal)), placez-vous dans ce dossier et tapez la commande indiquée à la fin.

| Pièce | Rôle | Fichier |
|---|---|---|
| `Article`, `Compte` | La donnée et la personne qui demande à voir | `donnee.php` |
| `Acces` | La réponse d'une règle : autorisé, interdit ou neutre | `acces.php` |
| `RegleAcces` et ses implémentations | Chaque règle donne son avis sur un article | `acces.php` |
| `GestionnaireAcces` | Réunit les avis et rend une réponse unique | `acces.php` |
| `ConstructeurRendu` | Transforme l'article en tableau de rendu, selon un mode | `rendu.php` |
| `MoteurRendu` | Transforme le tableau de rendu en HTML | `rendu.php` |
| `TypesEntite` | Registre : pour un type d'entité, donne ses gestionnaires | `routes.php` |
| `RouteurEntite` | Enchaîne route, conversion, accès et rendu | `routes.php` |

## La donnée : l'article et le compte

La donnée est un objet qui ne contient que des valeurs. Il ignore tout de son affichage et de ses droits. Dans le code ci-dessous, `int`, `string`, `array` et `bool` sont des **types déclarés** (entier, texte, tableau, vrai/faux) : ils disent quelle sorte de valeur une propriété ou un paramètre accepte ; `: bool` après les parenthèses donne le type de la valeur rendue ; `public` rend une propriété lisible de partout, `private` la réserve à sa classe ; `void` signifie « ne rend rien » (voir [la POO en PHP](/?c=langages&s=php&p=poo)).

```php
<?php
// fichier : donnee.php

// la donnée seule : un article n'a aucune idée de son affichage ni de ses droits
final class Article
{
    // le constructeur reçoit les valeurs et les range dans des propriétés
    public function __construct(
        public readonly int $id,        // numéro ; readonly : jamais modifiable ensuite
        public readonly string $titre,  // titre affiché
        public readonly string $corps,  // texte de l'article
        public readonly int $auteur,    // numéro du compte qui l'a écrit
        public readonly string $statut, // "publie" ou "brouillon"
    ) {
    }
}

// la personne qui demande à voir : son numéro et ses permissions
final class Compte
{
    public function __construct(
        public readonly int $id,           // numéro du compte (0 pour un visiteur anonyme)
        public readonly array $permissions // liste de textes, ex. ['voir les articles']
    ) {
    }

    // dit si le compte possède une permission donnée
    public function a(string $permission): bool
    {
        return in_array($permission, $this->permissions, true); // true : comparaison stricte
    }
}
```

| Syntaxe PHP | Signification |
|---|---|
| `final class` | Classe qu'aucune autre classe ne peut étendre (voir [la POO en PHP](/?c=langages&s=php&p=poo)) |
| `public readonly int $id` dans la liste du constructeur | Crée une propriété publique, lisible partout, **en lecture seule** (affectée une fois à la construction, jamais modifiée ensuite), et lui donne la valeur reçue |
| `in_array($x, $liste, true)` | Cherche `$x` dans `$liste` ; le `true` impose une comparaison stricte (sans lui, PHP convertit parfois les textes en nombres : `"1e1"` vaut `"10"`, car `1e1` s'écrit aussi 10 ; avec lui, non), à toujours mettre pour des textes |

Un visiteur non connecté est un compte comme un autre, ici de numéro `0` et sans permission : le code n'a pas besoin d'un cas particulier. Une **permission** est un droit nommé qu'on accorde à un compte (« voir les articles »). Qui possède quelle permission est géré ailleurs (voir [RBAC et ABAC](/?c=securite&s=fondamentaux&p=rbac-et-abac)) ; ici, `Compte` se contente de la lister.

## Une réponse d'accès à trois valeurs

La question « a-t-on le droit ? » ne se résume pas à oui ou non. Une règle peut aussi **ne pas avoir d'avis** : la règle « un brouillon est visible par son auteur » n'a rien à dire sur un article publié. Il faut donc trois réponses.

| Réponse | Sens | Exemple |
|---|---|---|
| `Autorise` | Cette règle dit oui | L'auteur ouvre son propre brouillon |
| `Interdit` | Cette règle dit non, **et ce non l'emporte sur tous les oui** | L'article est bloqué par la modération |
| `Neutre` | Cette règle n'a pas d'avis | La règle des brouillons face à un article publié |

Quand plusieurs règles répondent, on les combine. Pour l'écrire en PHP, on utilise une **énumération** (`enum`), qui est un type dont les seules valeurs possibles sont listées d'avance, ici les trois réponses.

```php
<?php
// fichier : acces.php

// une réponse d'accès a trois valeurs possibles, pas deux : c'est une énumération
enum Acces
{
    case Autorise; // une règle dit oui
    case Interdit; // une règle dit non, et ce non est définitif
    case Neutre;   // la règle n'a pas d'avis sur ce cas

    // "ou" : une voix favorable suffit, mais un Interdit l'emporte toujours
    public function ou(Acces $autre): Acces
    {
        if ($this === self::Interdit || $autre === self::Interdit) {
            return self::Interdit; // un seul veto suffit
        }
        if ($this === self::Autorise || $autre === self::Autorise) {
            return self::Autorise; // au moins un oui, aucun veto
        }
        return self::Neutre; // personne n'a d'avis
    }

    // "et" : il faut l'accord des deux ; un veto ou un silence bloque
    public function et(Acces $autre): Acces
    {
        if ($this === self::Interdit || $autre === self::Interdit) {
            return self::Interdit; // un veto reste un veto
        }
        if ($this === self::Autorise && $autre === self::Autorise) {
            return self::Autorise; // les deux disent oui
        }
        return self::Neutre; // l'un des deux n'a pas dit oui
    }

    // la décision finale : seul un Autorise ouvre la porte (le Neutre refuse)
    public function estAutorise(): bool
    {
        return $this === self::Autorise;
    }
}
```

| Syntaxe PHP | Signification |
|---|---|
| `enum Acces { case Autorise; ... }` | Déclare le type `Acces` et ses seules valeurs possibles, appelées *cases* |
| `self::Interdit` | La valeur `Interdit` de l'énumération courante |
| `$this` | L'objet sur lequel la méthode est appelée : ici, la première des deux réponses comparées |
| `===` | Égalité stricte : même valeur **et** même type |
| `\|\|` et `&&` | « ou » et « et » entre deux conditions (à ne pas confondre avec les méthodes `ou` et `et` de l'énumération, qui combinent des réponses d'accès) |
| `if (...) { return ...; }` | Si la condition est vraie, on rend la réponse tout de suite et la suite de la méthode n'est pas lue (voir [les conditions](/?c=langages&s=php&p=conditions)) |

La combinaison `ou` s'utilise quand plusieurs règles se partagent la décision ; `et` quand deux conditions doivent être réunies. Voici ce que donne chaque paire de réponses, relevé en exécutant `Acces::cases()` (la liste des trois valeurs) :

| Réponse A | Réponse B | `A->ou(B)` | `A->et(B)` |
|---|---|---|---|
| Autorise | Autorise | Autorise | Autorise |
| Autorise | Interdit | Interdit | Interdit |
| Autorise | Neutre | Autorise | Neutre |
| Interdit | Autorise | Interdit | Interdit |
| Interdit | Interdit | Interdit | Interdit |
| Interdit | Neutre | Interdit | Interdit |
| Neutre | Autorise | Autorise | Neutre |
| Neutre | Interdit | Interdit | Interdit |
| Neutre | Neutre | Neutre | Neutre |

Deux faits à retenir : un `Interdit` gagne toujours, quel que soit l'opérateur ; et la décision finale n'ouvre la porte que pour un `Autorise`. Un `Neutre` final signifie « aucune règle n'a dit oui » : l'accès est refusé. C'est le principe du **refus par défaut** : en l'absence de règle favorable, la porte reste fermée.

## Les règles d'accès et leur gestionnaire

Une **interface** est un contrat : elle liste les méthodes qu'une classe promet d'offrir, sans écrire leur contenu. Toutes les règles respectent la même interface, donc le gestionnaire peut les appeler sans savoir ce qu'elles font. À la suite de `acces.php` :

```php
// le contrat d'une règle d'accès : un avis sur un article, une opération et un compte
interface RegleAcces
{
    public function verifier(Article $article, string $operation, Compte $compte): Acces;
}
```

La première règle est celle de l'article lui-même.

```php
// la règle propre aux articles (opération "voir" seulement)
final class RegleAccesArticle implements RegleAcces
{
    public function verifier(Article $article, string $operation, Compte $compte): Acces
    {
        if ($operation !== 'voir') {
            return Acces::Neutre; // opération inconnue : pas d'avis
        }
        if ($compte->a('administrer les articles')) {
            return Acces::Autorise; // l'administrateur voit tout
        }
        if ($article->statut === 'brouillon') {
            // un brouillon n'est visible que par son auteur
            return $article->auteur === $compte->id ? Acces::Autorise : Acces::Neutre;
        }
        return $compte->a('voir les articles') ? Acces::Autorise : Acces::Neutre;
    }
}
```

La seconde règle est ajoutée « de l'extérieur ». Elle n'appartient pas aux règles de l'article : on peut imaginer qu'un **module** (une extension qui ajoute des fonctions à l'application) de modération la fournisse. Elle ne dit jamais oui, seulement non quand l'article est bloqué.

```php
// une règle ajoutée "de l'extérieur" : elle interdit tout article au numéro bloqué
final class RegleBlocage implements RegleAcces
{
    public function __construct(private array $numerosBloques) // numéros d'articles bloqués
    {
    }

    public function verifier(Article $article, string $operation, Compte $compte): Acces
    {
        $bloque = in_array($article->id, $this->numerosBloques, true); // dans la liste ?
        return $bloque ? Acces::Interdit : Acces::Neutre; // bloqué : interdit à tous
    }
}
```

Le **gestionnaire de contrôle d'accès** réunit les règles et rend une seule réponse. Les autres pièces du programme n'appellent jamais une règle directement : elles interrogent le gestionnaire.

```php
// le gestionnaire de contrôle d'accès : il réunit les règles et rend UNE réponse
final class GestionnaireAcces
{
    public function __construct(private array $regles) // liste d'objets RegleAcces
    {
    }

    public function acces(Article $article, string $operation, Compte $compte): Acces
    {
        $reponse = Acces::Neutre; // on part du silence
        foreach ($this->regles as $regle) {
            // on combine chaque avis avec "ou" : un veto l'emporte, un oui suffit
            $reponse = $reponse->ou($regle->verifier($article, $operation, $compte));
        }
        return $reponse;
    }
}
```

| Syntaxe PHP | Signification |
|---|---|
| `class X implements Y` | La classe `X` promet d'offrir toutes les méthodes de l'interface `Y` |
| `condition ? a : b` | Vaut `a` si la condition est vraie, sinon `b` |
| `private array $regles` dans la liste du constructeur | Crée une propriété cachée de l'extérieur et lui donne la valeur reçue |
| `foreach ($this->regles as $regle)` | Répète le bloc pour chaque élément du tableau, sous le nom `$regle` |
| `$reponse->ou(...)` | Appelle la méthode `ou` de l'énumération sur la valeur contenue dans `$reponse` |

Voici ce que donne chaque combinaison de règles pour trois situations.

| Cas | `RegleAccesArticle` | `RegleBlocage` | Réponse du gestionnaire |
|---|---|---|---|
| Article publié, lecteur ayant la permission | Autorise | Neutre | Autorise |
| Brouillon, un autre compte | Neutre | Neutre | Neutre (donc refus) |
| Article bloqué, administrateur | Autorise | Interdit | Interdit (le veto l'emporte sur l'administrateur) |

## Le constructeur de rendu et le tableau de rendu

Le **constructeur de rendu** (en anglais *view builder*) répond à la question « comment présenter cette donnée ? ». Il ne produit pas encore du HTML. Il produit un **tableau de rendu** : un tableau PHP qui décrit ce qu'il faut afficher (quels champs, avec quelles valeurs, dans quel mode). Un autre composant, le **moteur de rendu**, le transformera en HTML. Cette étape intermédiaire a un intérêt : le tableau peut être complété ou modifié par d'autres morceaux de code avant d'être écrit en HTML, et il se teste sans analyser du texte.

Un **mode d'affichage** est une manière de montrer la même donnée : l'article en entier sur sa page, son seul titre dans une liste.

| Mode | Champs montrés | Où on le voit |
|---|---|---|
| `complet` | titre et corps | La page de l'article |
| `apercu` | titre | Une ligne dans une liste d'articles |

```php
<?php
// fichier : rendu.php

// le contrat d'un constructeur de rendu : de la donnée à un tableau de rendu
interface ConstructeurRendu
{
    public function voir(Article $article, string $mode = 'complet'): array;
}

// constructeur de rendu des articles : il choisit les champs selon le mode d'affichage
final class ConstructeurRenduArticle implements ConstructeurRendu
{
    // pour chaque mode d'affichage, la liste des champs à montrer
    private const MODES = [
        'complet' => ['titre', 'corps'], // la page de l'article
        'apercu' => ['titre'],           // la ligne d'une liste
    ];

    public function voir(Article $article, string $mode = 'complet'): array
    {
        // throw dans un ?? : si le mode n'existe pas, on lance une erreur
        $champs = self::MODES[$mode]
            ?? throw new InvalidArgumentException("Mode inconnu : $mode");
        // clés "#" : métadonnées
        $tableau = ['#mode' => $mode, '#article' => $article->id];
        foreach ($champs as $champ) {
            $tableau[$champ] = $article->$champ; // $article->$champ : propriété nommée $champ
        }
        return $tableau;
    }
}
```

| Syntaxe PHP | Signification |
|---|---|
| `string $mode = 'complet'` | Valeur par défaut d'un paramètre : si l'appelant ne donne pas de mode, `$mode` vaut `'complet'` |
| `"Mode inconnu : $mode"` | Texte entre guillemets doubles : PHP y remplace `$mode` par sa valeur |
| `throw new InvalidArgumentException(...)` | Lance une erreur, ici de la classe `InvalidArgumentException` (« argument invalide ») ; voir [les exceptions en PHP](/?c=langages&s=php&p=exceptions) |
| `private const MODES = [...]` | Constante de la classe, cachée de l'extérieur : la liste des modes connus |
| `self::MODES[$mode]` | Lit la constante de la classe courante, à la clé `$mode` |
| `$a ?? throw new ...` | Si `$a` n'existe pas, lance une erreur au lieu de continuer avec une valeur vide |
| `'#mode'` | Clé commençant par `#` : par convention, une métadonnée (information sur le tableau) et non un champ à afficher |
| `$article->$champ` | Lit la propriété dont le nom est dans la variable `$champ` |

Pour un article numéro 1, de titre `T` et de corps `C`, le constructeur rend en mode `complet` (résultat de `print_r`, qui affiche un tableau) :

```text
Array
(
    [#mode] => complet
    [#article] => 1
    [titre] => T
    [corps] => C
)
```

Un mode inconnu lance une exception (voir [les exceptions en PHP](/?c=langages&s=php&p=exceptions)) dont le message est `Mode inconnu : inconnu`.

Le moteur de rendu s'ajoute à la suite de `rendu.php`. C'est lui, et lui seul, qui écrit du HTML, donc lui qui neutralise le texte.

```php
// le moteur de rendu : il transforme un tableau de rendu en HTML, et protège le texte
final class MoteurRendu
{
    public function html(array $tableau): string
    {
        $html = '<article>'; // balise ouvrante
        foreach (['titre' => 'h2', 'corps' => 'p'] as $champ => $balise) {
            if (isset($tableau[$champ])) { // seulement les champs présents dans ce mode
                // htmlspecialchars neutralise < > & et " : le texte ne devient pas du HTML
                $html .= "<$balise>" . htmlspecialchars($tableau[$champ]) . "</$balise>";
            }
        }
        return $html . '</article>'; // balise fermante
    }
}
```

| Syntaxe PHP | Signification |
|---|---|
| `foreach (['titre' => 'h2', ...] as $champ => $balise)` | Parcourt une liste de paires clé => valeur : à chaque tour, `$champ` reçoit la clé et `$balise` la valeur |
| `isset($tableau[$champ])` | Vrai si la clé existe dans le tableau et n'est pas `null` |
| `$html .= "..."` | Ajoute le texte à la fin de `$html` |
| `"<$balise>"` | Texte entre guillemets doubles : `$balise` est remplacé par sa valeur, par exemple `h2` |
| `htmlspecialchars(...)` | Remplace `<`, `>`, `&` et les guillemets par des codes que le navigateur affiche tels quels |

`htmlspecialchars` remplace `<` par `&lt;` (une *entité HTML*, un code qui s'affiche comme le caractère) : le navigateur affiche alors le texte `<b>` au lieu de l'interpréter comme du gras. Écrire cette protection dans le moteur, et non dans chaque page, évite qu'une page l'oublie.

## Le registre de types et la route d'entité

Reste à relier les pièces. Le **registre de types d'entité** associe à un type (« article ») ses gestionnaires : son constructeur de rendu et son gestionnaire d'accès. Le routeur ne connaît alors aucun type précis : il demande au registre.

```php
<?php
// fichier : routes.php

// registre des types d'entité : pour un type, il fournit ses gestionnaires
final class TypesEntite
{
    private array $gestionnaires = []; // type => ['rendu' => ..., 'acces' => ...]

    public function declarer(string $type, array $gestionnaires): void
    {
        $this->gestionnaires[$type] = $gestionnaires; // le type s'enregistre lui-même
    }

    public function constructeurRendu(string $type): ConstructeurRendu
    {
        return $this->gestionnaires[$type]['rendu'];
    }

    public function controleAcces(string $type): GestionnaireAcces
    {
        return $this->gestionnaires[$type]['acces'];
    }
}
```

Une **route d'entité** est une route qui ne désigne pas un morceau de code précis, mais une **entité et un mode d'affichage** : `article.complet` veut dire « l'entité de type `article`, en mode `complet` ». Elle désigne aussi l'opération à autoriser : `article.voir`. Le routeur lit ces deux textes et cherche les gestionnaires correspondants dans le registre.

```php
// le routeur d'entité : il ne connaît AUCUN type précis, seulement les gestionnaires
final class RouteurEntite
{
    public function __construct(
        private TypesEntite $types, // registre des types
        private array $routes,      // modèle d'adresse => ['vue' => ..., 'acces' => ...]
        private array $entites      // [type => [numéro => objet]] : faux stockage en mémoire
    ) {
    }

    // renvoie [code HTTP, corps de la réponse]
    public function repondre(string $chemin, Compte $compte): array
    {
        foreach ($this->routes as $modele => $route) {
            // {article} devient une capture nommée : (?<article>[^/]+) = tout sauf "/"
            $capture = preg_replace('#\{(\w+)\}#', '(?<$1>[^/]+)', $modele);
            $motif = '#^' . $capture . '$#'; // le motif complet, de ^ (début) à $ (fin)
            if (preg_match($motif, $chemin, $trouve) === 1) {
                return $this->traiter($route, $trouve, $compte); // première route trouvée
            }
        }
        return [404, 'Page inconnue']; // aucune route ne correspond
    }

    private function traiter(array $route, array $trouve, Compte $compte): array
    {
        [$type, $mode] = explode('.', $route['vue']); // "article.complet" -> type et mode
        $numero = (int) ($trouve[$type] ?? 0); // le texte de l'adresse devient un nombre
        $entite = $this->entites[$type][$numero] ?? null; // conversion en objet, ou null
        if ($entite === null) {
            return [404, 'Introuvable']; // le numéro ne désigne aucune entité
        }
        [, $operation] = explode('.', $route['acces']); // "article.voir" -> "voir"
        $acces = $this->types->controleAcces($type)->acces($entite, $operation, $compte);
        if (!$acces->estAutorise()) {
            return [403, 'Accès interdit']; // Interdit ou Neutre : la porte reste fermée
        }
        $tableau = $this->types->constructeurRendu($type)->voir($entite, $mode);
        return [200, (new MoteurRendu())->html($tableau)];
    }
}
```

| Élément du routeur | Rôle |
|---|---|
| `{article}` dans `/article/{article}` | Un **paramètre** de route : la partie de l'adresse qui change (voir [le routage](/?c=langages&s=php&p=routage)). Son nom est celui du type d'entité, ce qui permet de savoir quoi charger |
| `preg_replace` et `preg_match` | Transforment le modèle en **expression régulière** (un motif de recherche dans du texte, syntaxe voisine de [celle du chapitre sur les regex](/?c=langages&s=domain-specific-languages-dsl&p=regex)) puis testent l'adresse |
| Piège du modèle | Le modèle d'adresse est lu comme du regex sans être échappé : un `.` ou un `+` dans `/article.html/{article}` serait interprété comme un symbole du motif. Les modèles de ce chapitre n'en contiennent pas ; sinon, protéger la partie fixe avec `preg_quote` (fonction PHP qui échappe ces symboles) |
| `(?<article>[^/]+)` | Capture nommée : « un ou plusieurs caractères qui ne sont pas `/` », rangés sous le nom `article` |
| `#\{(\w+)\}#` | Motif qui cherche une accolade ouvrante, un mot (`\w+` : lettres, chiffres et `_`), puis une accolade fermante ; les `#` aux deux bouts délimitent le motif, et `$1` dans le remplacement redonne le mot trouvé |
| `'#^' . $capture . '$#'` | `^` signifie « début du texte » et `$` « fin du texte » : toute l'adresse doit correspondre, pas un morceau |
| `explode('.', 'article.complet')` | Coupe le texte à chaque point : on obtient `['article', 'complet']` |
| `[$type, $mode] = ...` | Range les deux morceaux dans deux variables à la fois |
| `(int) $texte` | Convertit en nombre entier ; un texte comme `abc` donne `0`, qui ne désigne aucune entité. Piège : `1abc` donne `1`, donc `/article/1abc` afficherait l'article 1 (adresse en double) ; pour être strict, tester d'abord avec `ctype_digit($texte)` (vrai seulement si le texte n'a que des chiffres) ou écrire `\d+` au lieu de `[^/]+` dans le motif |
| `$tableau[$cle] ?? null` | Donne `null` quand la clé n'existe pas : ici, une entité absente, qui mène au `404` |
| `[, $operation] = ...` | Range le **second** morceau seulement : la virgule seule saute le premier |
| `preg_match($motif, $chemin, $trouve)` | Teste l'adresse et range les captures dans `$trouve` ; renvoie `1` si l'adresse correspond |
| `(new MoteurRendu())->html(...)` | Crée un objet et appelle tout de suite l'une de ses méthodes |

L'ordre des vérifications compte : d'abord l'existence (`404`), puis le droit (`403`), puis seulement la construction du rendu. Le constructeur de rendu n'est donc jamais appelé pour un visiteur qui n'a pas le droit.

## Assembler et essayer

Le fichier `essai.php` crée trois articles, quatre comptes et deux routes, puis demande chaque adresse avec chaque compte.

```php
<?php
// fichier : essai.php
require __DIR__ . '/donnee.php';  // Article et Compte
require __DIR__ . '/acces.php';   // Acces, règles et gestionnaire d'accès
require __DIR__ . '/rendu.php';   // constructeur de rendu et moteur de rendu
require __DIR__ . '/routes.php';  // registre des types et routeur

// trois articles : publié, brouillon de l'auteur 2, publié mais bloqué
$articles = [
    1 => new Article(1, 'Salut', 'Un <i>mot</i>.', 2, 'publie'),
    2 => new Article(2, 'Idée en cours', 'Pas fini.', 2, 'brouillon'),
    3 => new Article(3, 'Sujet litigieux', 'Retiré.', 2, 'publie'),
];

// on déclare le type "article" avec son constructeur de rendu et son contrôle d'accès
$types = new TypesEntite();
$types->declarer('article', [
    'rendu' => new ConstructeurRenduArticle(),
    'acces' => new GestionnaireAcces([new RegleAccesArticle(), new RegleBlocage([3])]),
]);

// deux routes : la même entité vue en mode complet, puis en aperçu
$routes = [
    '/article/{article}' => ['vue' => 'article.complet', 'acces' => 'article.voir'],
    '/apercu/{article}' => ['vue' => 'article.apercu', 'acces' => 'article.voir'],
];
$routeur = new RouteurEntite($types, $routes, ['article' => $articles]);

// quatre comptes : anonyme, lecteur, auteur du brouillon, administrateur
$comptes = [
    'anonyme' => new Compte(0, []),
    'lecteur' => new Compte(5, ['voir les articles']),
    'auteur' => new Compte(2, []),
    'admin' => new Compte(1, ['administrer les articles']),
];

// chaque ligne : le compte, l'adresse demandée, le code obtenu et le corps
foreach (['/article/1', '/apercu/1', '/article/2', '/article/3', '/article/99'] as $adresse) {
    foreach ($comptes as $nom => $compte) {
        [$code, $corps] = $routeur->repondre($adresse, $compte);
        printf("%-8s %-11s %d %s\n", $nom, $adresse, $code, $corps);
    }
}
```

Quelques éléments de syntaxe de ce script :

| Syntaxe PHP | Signification |
|---|---|
| `require __DIR__ . '/donnee.php'` | Charge un autre fichier, situé dans le même dossier que celui-ci (voir [include et require](/?c=langages&s=php&p=include)) |
| `new Article(1, 'Salut', ...)` | Crée un article ; les valeurs suivent l'ordre du constructeur : numéro, titre, corps, auteur, statut |
| `foreach ($comptes as $nom => $compte)` | Parcourt une liste en gardant la clé (`$nom`) et la valeur (`$compte`) |
| `printf("%-8s %-11s %d %s\n", ...)` | Écrit une ligne selon un format : `%-8s` et `%-11s` un texte complété à droite par des espaces jusqu'à 8 puis 11 caractères, `%d` un entier, `%s` un texte |

Résultat obtenu avec `php essai.php` :

```text
anonyme  /article/1  403 Accès interdit
lecteur  /article/1  200 <article><h2>Salut</h2><p>Un &lt;i&gt;mot&lt;/i&gt;.</p></article>
auteur   /article/1  403 Accès interdit
admin    /article/1  200 <article><h2>Salut</h2><p>Un &lt;i&gt;mot&lt;/i&gt;.</p></article>
anonyme  /apercu/1   403 Accès interdit
lecteur  /apercu/1   200 <article><h2>Salut</h2></article>
auteur   /apercu/1   403 Accès interdit
admin    /apercu/1   200 <article><h2>Salut</h2></article>
anonyme  /article/2  403 Accès interdit
lecteur  /article/2  403 Accès interdit
auteur   /article/2  200 <article><h2>Idée en cours</h2><p>Pas fini.</p></article>
admin    /article/2  200 <article><h2>Idée en cours</h2><p>Pas fini.</p></article>
anonyme  /article/3  403 Accès interdit
lecteur  /article/3  403 Accès interdit
auteur   /article/3  403 Accès interdit
admin    /article/3  403 Accès interdit
anonyme  /article/99 404 Introuvable
lecteur  /article/99 404 Introuvable
auteur   /article/99 404 Introuvable
admin    /article/99 404 Introuvable
```

Le même résultat, présenté en tableau (les lignes `/apercu/1` et `/article/1` ne diffèrent que par le mode) :

| Adresse | Anonyme | Lecteur | Auteur (sans permission) | Administrateur |
|---|---|---|---|---|
| `/article/1` (publié) | 403 | 200 | 403 | 200 |
| `/apercu/1` (publié, mode aperçu) | 403 | 200 | 403 | 200 |
| `/article/2` (brouillon de l'auteur) | 403 | 403 | 200 | 200 |
| `/article/3` (bloqué) | 403 | 403 | 403 | 403 |
| `/article/99` (inexistant) | 404 | 404 | 404 | 404 |

Trois observations. L'auteur voit son brouillon mais pas l'article publié (il n'a pas la permission générale). L'administrateur voit tout, sauf l'article bloqué : le veto de `RegleBlocage` l'emporte. Et le texte `<i>mot</i>` du corps est écrit sous la forme `&lt;i&gt;mot&lt;/i&gt;` : le navigateur l'affiche tel quel, sans le mettre en italique.

## `403` ou `404` : que révéler au visiteur ?

Le mini-exemple répond `403` (interdit) pour un refus et `404` (introuvable) pour une entité qui n'existe pas. Ce choix a une conséquence : un visiteur peut **deviner** quels numéros existent, puisqu'un brouillon répond `403` et un numéro vide répond `404`.

| Choix | Ce que le visiteur apprend | À utiliser quand |
|---|---|---|
| `403` pour un refus, `404` pour l'absence | Le numéro existe mais lui est fermé | L'existence de l'entité n'est pas un secret (un article publié du site) |
| `404` dans les deux cas | Rien : le refus et l'absence sont indiscernables | L'existence même est sensible (un dossier de santé, le brouillon d'un concurrent) |

Dans le mini-exemple, passer au second choix tient en une ligne du routeur : renvoyer `[404, 'Introuvable']` au lieu de `[403, 'Accès interdit']`. Le code d'état `403` est décrit dans [authentification et autorisation](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation) ; la [documentation MDN](https://developer.mozilla.org/fr/docs/Web/HTTP/Status/403) détaille son usage.

## Un exemple : comment Drupal 11 réalise ce principe

> Les noms d'API Drupal de cette section sont vérifiés sur le code source de Drupal 11.x ; la référence est la [documentation officielle](https://www.drupal.org/docs/drupal-apis/entity-api).

Drupal appelle **type d'entité** (*entity type*) la définition d'une sorte de donnée (un article, un utilisateur), et **gestionnaire** (*handler*) un objet rattaché à ce type pour une tâche précise. Le **noyau** (*core*) est la partie de Drupal commune à tous les sites. Le principe est celui du registre `TypesEntite` du mini-exemple.

| Notion du mini-exemple | Équivalent dans Drupal |
|---|---|
| `TypesEntite` | Le gestionnaire de types d'entité, obtenu par `\Drupal::entityTypeManager()` |
| `declarer('article', [...])` | La définition du type d'entité, dans l'en-tête de sa classe (annotation, un commentaire spécial lu par Drupal, ou attribut `#[...]`, une étiquette native de PHP 8, selon la version, voir [l'architecture à plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins)), avec une clé `handlers` |
| `'rendu' => ConstructeurRenduArticle` | Le gestionnaire `view_builder`, par défaut la classe `Drupal\Core\Entity\EntityViewBuilder` |
| `'acces' => GestionnaireAcces` | Le gestionnaire `access`, une classe qui étend `Drupal\Core\Entity\EntityAccessControlHandler` |
| `Acces::Autorise`, `Interdit`, `Neutre` | `AccessResult::allowed()`, `forbidden()`, `neutral()` |
| `ou`, `et` | `orIf()`, `andIf()` sur un résultat d'accès |
| Mode `complet`, `apercu` | Mode d'affichage (*view mode*) : `full`, `teaser`, ou un mode créé par le site |
| Tableau de rendu | *Render array* : tableau PHP dont les propriétés (`#theme`, `#cache`...) commencent par `#` |
| Route `article.complet` | Valeur `_entity_view: 'type.mode'` dans les valeurs par défaut de la route |
| Droit `article.voir` | Exigence `_entity_access: 'type.view'` sur la route |
| `RouteurEntite` | Le système de routage du noyau, avec un contrôleur générique pour `_entity_view` |

### Déclarer les gestionnaires du type

La clé `handlers` d'un type d'entité nomme une classe par tâche. Seul le contenu de la clé est montré ici : la syntaxe qui l'entoure (annotation ou attribut) dépend de la version de Drupal.

```php
<?php

// contenu de la clé "handlers" : une tâche => la classe qui s'en charge
$handlers = [
  // le gestionnaire de rendu : la classe du noyau suffit souvent
  'view_builder' => 'Drupal\Core\Entity\EntityViewBuilder',
  // le gestionnaire de contrôle d'accès : notre classe
  'access' => 'Drupal\exemple_articles\ArticleAccessControlHandler',
  // le fournisseur de routes : il génère les routes standard du type
  'route_provider' => [
    'html' => 'Drupal\Core\Entity\Routing\DefaultHtmlRouteProvider',
  ],
];
```

`exemple_articles` et `exemple_article` sont des noms inventés pour ce chapitre : un module (un paquet de code que Drupal charge) du même nom contiendrait le type d'entité. Un type d'entité qui ne déclare pas `view_builder` ou `access` reçoit en général une classe par défaut du noyau ; le détail dépend du type (contenu ou configuration).

### Le constructeur de rendu

Le gestionnaire de rendu s'obtient auprès du gestionnaire de types, puis rend un tableau de rendu. Le contrôle d'accès s'interroge directement sur l'entité.

```php
<?php

// $article est une entité chargée, $compte le compte du visiteur (obtenus ailleurs)
// le gestionnaire de rendu du type d'entité, demandé au gestionnaire de types
$constructeur = \Drupal::entityTypeManager()->getViewBuilder('exemple_article');
// le tableau de rendu de cet article en mode "teaser" (aperçu)
$tableau = $constructeur->view($article, 'teaser');

// le résultat d'accès pour l'opération "view" ; TRUE demande l'objet, pas un booléen
$reponse = $article->access('view', $compte, TRUE);
// vrai seulement si le résultat est "allowed" (un "neutral" donne faux)
$autorise = $reponse->isAllowed();
```

| Appel | Rôle |
|---|---|
| `getViewBuilder('exemple_article')` | Retourne le gestionnaire de rendu du type |
| `view($entite, 'teaser')` | Retourne le tableau de rendu d'**une** entité dans un mode |
| `viewMultiple($entites, 'teaser')` | Même chose pour plusieurs entités à la fois |
| `$entite->access('view', $compte, TRUE)` | Retourne un objet résultat (`TRUE` en troisième argument) ; sans lui, un simple booléen |
| `$resultat->isAllowed()` | Vrai seulement pour `allowed` : `neutral` donne faux, comme notre `estAutorise()` |

Un point mérite l'attention : dans Drupal, le choix des champs montrés dans chaque mode n'est pas écrit en PHP comme notre constante `MODES`. Il est **configuré** (par l'administrateur du site, dans une configuration d'affichage rattachée au type et au mode), et le constructeur de rendu lit cette configuration. Le tableau de rendu contient aussi des **métadonnées de cache** (sous la clé `#cache`). Un **cache** est une copie d'un résultat gardée pour ne pas le recalculer ; ces métadonnées disent de quoi dépend le résultat, ce qui évite de reconstruire la page à chaque visite, sans la servir au mauvais visiteur. Ce sujet de cache est à part et n'est pas détaillé ici.

Le moteur de rendu de Drupal s'appuie sur des gabarits ([Twig](https://twig.symfony.com/doc/), un langage de modèles de pages) qui échappent les variables par défaut (le texte est rendu inoffensif pour le HTML) : c'est l'équivalent de notre `htmlspecialchars`, appliqué automatiquement.

### La route d'entité

Une route se déclare dans un fichier de configuration du module, au format YAML (un format de fichier de réglages fait de clés et de valeurs, où l'indentation exprime l'imbrication ; spécification sur [yaml.org](https://yaml.org/)). Voici l'esprit d'une route d'entité :

```yaml
# nom de la route : le type d'entité, puis le rôle "canonical" (la page de l'entité)
entity.exemple_article.canonical:
  # l'adresse ; {exemple_article} est le paramètre, nommé comme le type d'entité
  path: '/article/{exemple_article}'
  defaults:
    # affiche l'entité dans le mode "full" (en entier)
    _entity_view: 'exemple_article.full'
  requirements:
    # exige que l'opération "view" soit autorisée sur cette entité
    _entity_access: 'exemple_article.view'
```

| Clé | Rôle |
|---|---|
| `path` | L'adresse, avec le paramètre `{exemple_article}` nommé comme le type d'entité |
| `defaults._entity_view` | « Affiche l'entité de ce type dans ce mode » : le noyau fournit le **contrôleur** (le code qui répond à la route) |
| `requirements._entity_access` | « Exige que l'accès `view` soit autorisé sur cette entité » |

Le paramètre `{exemple_article}`, nom de type d'entité, est converti en objet par le convertisseur de paramètres du noyau, comme dans [la conversion de paramètre de route](/?c=langages&s=php&p=alias-d-adresse-et-conversion-de-parametre) : un numéro inexistant donne en principe une `404` avant que le contrôle d'accès ne soit appelé. Pour les types d'entité courants, Drupal peut aussi **générer** cette route à partir de la clé `route_provider` du type, sans qu'on l'écrive à la main.

### Le gestionnaire de contrôle d'accès

Le gestionnaire étend la classe de base du noyau et implémente `checkAccess()`, qui reçoit l'entité, l'opération (`'view'`, `'update'`, `'delete'`) et le compte.

```php
<?php

// espace de noms (voir la POO en PHP) : le dossier logique où vit la classe
namespace Drupal\exemple_articles;

use Drupal\Core\Access\AccessResult;                 // fabrique des résultats d'accès
use Drupal\Core\Access\AccessResultInterface;        // le type d'un résultat d'accès
use Drupal\Core\Entity\EntityAccessControlHandler;   // la classe de base fournie par le noyau
use Drupal\Core\Entity\EntityInterface;              // le type de toute entité
use Drupal\Core\Session\AccountInterface;            // le type d'un compte

// notre gestionnaire d'accès : il hérite de tout le travail commun du noyau
class ArticleAccessControlHandler extends EntityAccessControlHandler {

  // appelée par le noyau avec l'entité, l'opération demandée et le compte
  protected function checkAccess(
    EntityInterface $entity,
    $operation,
    AccountInterface $account
  ): AccessResultInterface {
    if ($operation === 'view') {
      // autorisé si le compte a la permission, sinon neutre (pas d'avis)
      return AccessResult::allowedIfHasPermission($account, 'view exemple articles');
    }
    return AccessResult::neutral(); // toute autre opération : pas d'avis
  }

}
```

| Élément | Rôle |
|---|---|
| `AccessResult::allowedIfHasPermission($compte, 'texte')` | `allowed` si le compte a la permission, sinon `neutral` |
| `AccessResult::neutral()` | « Pas d'avis » : le refus par défaut s'applique si personne ne dit oui |
| `AccessResult::forbidden()` | Veto définitif |
| `checkAccess()` appelée par `access()` | Le noyau l'appelle après avoir consulté les hooks des autres modules, sauf si l'un d'eux interdit |
| Déclaration des permissions | Un fichier du module (`*.permissions.yml`) liste les permissions qui existent |

D'autres modules peuvent donner leur avis sur n'importe quelle entité par des **hooks** (voir [l'inversion de contrôle et les points d'extension](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension)) : `hook_entity_access()` pour tous les types, `hook_ENTITY_TYPE_access()` pour un type précis. Leurs réponses sont combinées à celle du gestionnaire avec une logique du même genre que `ou` (l'ordre est le suivant : les hooks `hook_entity_access()` et `hook_ENTITY_TYPE_access()` sont consultés d'abord ; si l'un d'eux interdit, `checkAccess()` n'est pas appelée ; sinon son résultat est combiné aux leurs par `orIf()`) : c'est exactement le rôle de notre `RegleBlocage`, un module extérieur qui pose un veto sans connaître les règles des articles.

### Où se trouvent les pièces dans l'architecture

| Pièce | Chapitre qui l'explique |
|---|---|
| Le registre des gestionnaires est un **service** du noyau, fabriqué par un conteneur | [Le conteneur de services](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=conteneur-de-services) |
| Les types d'entité sont découverts par le noyau (annotation ou attribut) | [L'architecture à plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins) |
| Les hooks d'accès des autres modules | [Inversion de contrôle et points d'extension](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=inversion-de-controle-et-points-d-extension) |
| Le gestionnaire reçoit ses dépendances par son constructeur | [La POO en PHP](/?c=langages&s=php&p=poo) |

Dans une classe de votre module, on **injecte** le gestionnaire de types d'entité par le constructeur plutôt que d'appeler `\Drupal::entityTypeManager()` : l'appel statique rend la classe difficile à tester (voir [le conteneur de services](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=conteneur-de-services), section « Tester : remplacer un service par un faux »).

## Les listes et les requêtes : l'autre porte d'entrée

Le contrôle d'accès d'une page d'entité ne protège que cette page. Une liste d'articles, un moteur de recherche, un flux d'actualité, une interface de programmation (API) peuvent montrer les mêmes données sans passer par la route.

| Porte d'entrée | Où vérifier l'accès |
|---|---|
| Page de l'entité | La route (`_entity_access`) |
| Liste construite en PHP | Appeler le gestionnaire d'accès pour **chaque** entité de la liste (`$entite->access('view')` dans Drupal) |
| Requête en [base de données](/?c=domain-specific-languages-dsl&p=sql) filtrée | La requête elle-même doit appliquer le filtre ; dans Drupal, une requête d'entité demande `->accessCheck(TRUE)` (ou `FALSE` quand on sait pourquoi) |
| Sortie [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) d'une API | Le même contrôle que la page, avant de transformer les données en texte JSON |
| Mode aperçu dans une page d'un autre type | Le même gestionnaire de rendu, donc le même contrôle d'accès avant |

Dans notre mini-exemple, la parade est de ne produire des listes qu'à partir de `GestionnaireAcces` : une fonction `lister(Compte $compte)` filtrerait les articles avec `estAutorise()` avant de les passer au constructeur de rendu en mode `apercu`.

## Les pièges

| Piège | Conséquence | Parade |
|---|---|---|
| Vérifier l'accès dans la page mais pas dans la liste ou l'API | Un brouillon apparaît dans une liste : contrôle d'accès défaillant | Un seul point de décision (le gestionnaire), appelé par toutes les portes |
| Traiter `Neutre` comme `Autorise` | Une entité sans règle applicable devient publique | Refus par défaut : seul `Autorise` ouvre |
| Traiter `Neutre` comme `Interdit` pour combiner | Une règle qui n'a pas d'avis bloque les autres : plus aucun module extérieur ne peut ouvrir un accès | Trois valeurs distinctes, `ou` qui laisse gagner un oui sur un silence |
| Un veto qui peut être écrasé par un oui | Un administrateur voit un article bloqué | `Interdit` l'emporte toujours dans la combinaison |
| Écrire du HTML dans le constructeur de rendu ou dans la route | Le design et la sécurité du texte se mélangent, et un autre mode doit tout recopier | Constructeur : un tableau ; moteur : le HTML et la neutralisation |
| Oublier de neutraliser le texte d'un champ | Faille XSS (voir [XSS en détail](/?c=securite&s=cybersecurite&p=xss-en-detail)) | Le moteur de rendu neutralise tout, sans exception champ par champ |
| Construire le rendu avant de vérifier l'accès | Du travail inutile, et des actions secondaires (lectures en base, écritures dans un journal) pour un visiteur refusé | D'abord existence, puis accès, puis rendu |
| Répondre `403` quand l'existence est sensible | Le visiteur devine quels numéros existent | `404` identique pour « absent » et « interdit » |
| Mettre en cache un rendu sans tenir compte du visiteur | Un visiteur reçoit la page préparée pour un autre, brouillon compris | Indiquer de quoi dépend le rendu (le compte, ses permissions) dans les métadonnées de cache |
| Tester les droits uniquement avec un compte administrateur | Tous les refus passent inaperçus | Un test par type de compte : anonyme, lecteur, auteur, administrateur |
| Remplacer un gestionnaire du noyau par une classe incomplète | Une page du noyau appelle une méthode manquante | Étendre la classe de base, ne redéfinir que `checkAccess()` |

## Bonnes pratiques

| Bonne pratique | Raison |
|---|---|
| Trois pièces séparées : donnée, rendu, accès | Chaque raison de changer a son fichier |
| Une réponse d'accès à trois valeurs et une combinaison où le veto gagne | Les modules extérieurs peuvent interdire ou autoriser sans se connaître |
| Refus par défaut | Une règle oubliée ferme au lieu d'ouvrir |
| Passer par le gestionnaire pour chaque porte d'entrée (page, liste, API) | Une règle modifiée une fois s'applique partout |
| Un tableau de rendu, puis un moteur qui écrit le HTML | Le texte est neutralisé en un seul endroit, le rendu se teste sans HTML |
| Un mode d'affichage par usage (page, liste, aperçu) | Le même objet se présente de plusieurs façons sans dupliquer de code |
| Une route d'entité qui désigne un type, un mode et une opération | Ajouter un type d'entité ne demande pas de réécrire le routeur |
| Vérifier existence, puis droit, puis construire | Rien n'est produit pour un visiteur refusé |
| Décider du `403` ou `404` selon la sensibilité de l'existence | Pas de fuite d'information sur ce qui existe |
| Tester chaque règle avec un compte de chaque type | Les cas de refus sont vérifiés, pas seulement les cas heureux |
| Injecter le gestionnaire de types plutôt que l'appeler en statique | La classe se teste avec un faux gestionnaire |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Afficher une entité répond à trois questions que l'on sépare : quelle donnée (l'entité), comment la présenter (constructeur de rendu, qui produit un tableau de rendu selon un mode d'affichage, puis moteur de rendu qui écrit le HTML), a-t-on le droit (gestionnaire de contrôle d'accès). Une route d'entité désigne un type, un mode et une opération, sans connaître l'entité. Une règle d'accès répond autorisé, interdit ou neutre ; un interdit l'emporte toujours, un neutre final refuse. Dans Drupal 11, ces pièces sont le `view_builder`, la route avec `_entity_view` et `_entity_access`, et le gestionnaire d'accès qui renvoie des `AccessResult`. |
| **Pièges à éviter** | Vérifier l'accès seulement sur la page et oublier les listes et les API ; traiter un neutre comme un oui ; laisser un oui écraser un veto ; mettre du HTML dans le constructeur ; oublier de neutraliser le texte ; construire le rendu avant le contrôle ; révéler l'existence par un `403` ; mettre en cache sans tenir compte du visiteur ; ne tester qu'avec un administrateur. |
| **Bonnes pratiques** | Un seul point de décision d'accès ; refus par défaut ; un veto qui gagne ; un tableau de rendu puis un moteur ; un mode par usage ; existence, droit, rendu dans cet ordre ; `404` quand l'existence est sensible ; un test par type de compte ; gestionnaires injectés. |

Pour aller plus loin : la [documentation de l'API des entités de Drupal](https://www.drupal.org/docs/drupal-apis/entity-api), celle du [système de routage](https://www.drupal.org/docs/drupal-apis/routing-system), et le manuel PHP sur les [énumérations](https://www.php.net/manual/fr/language.enumerations.php).
