---
order: 16
---

# Alias d'adresse, redirection 301 et conversion de paramètre de route

Une **adresse** (aussi appelée **URL**, la ligne qu'on lit en haut du navigateur, par exemple `/blog/mon-article`) peut avoir deux visages : celle que le visiteur lit, et celle que le programme utilise vraiment. Ce chapitre construit, en PHP minimal et sans framework, un petit routeur qui gère ces deux visages, les redirections qui évitent de casser les anciens liens, et la conversion automatique d'un morceau d'adresse (`12`) en objet (l'article numéro 12). Il prolonge [le routage sans framework](/?c=langages&s=php&p=routage) : la notion de route, le point d'entrée unique et `php -S` y sont expliqués, on ne les répète pas ici. Les codes de statut HTTP (`200`, `404`...) sont présentés dans [les échanges de données : API et HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http), et les objets PHP (classe, constructeur) dans [la POO en PHP](/?c=langages&s=php&p=poo).

> Des systèmes de gestion de contenu (CMS) comme [Drupal](https://www.drupal.org/docs) proposent ces mécanismes tout faits : un module d'alias, un module de redirections, et un convertisseur de paramètres de route. Le chapitre montre comment ils fonctionnent à l'intérieur, avec du code que vous pouvez lancer vous-même.

## Un alias : une adresse lisible pour une adresse interne

Un programme identifie souvent une page par un numéro : `/node/12` veut dire « le contenu numéro 12 ». C'est pratique pour la machine, illisible pour un humain, et sans intérêt pour un moteur de recherche (un site qui indexe les pages web pour les proposer dans ses résultats). Un **alias d'adresse** est une adresse lisible (`/blog/mon-article`) qui désigne la même page que l'**adresse interne** (`/node/12`). Le visiteur ne voit et ne partage que l'alias.

| Notion | Exemple | Qui la voit | Rôle |
|---|---|---|---|
| Adresse interne | `/node/12` | Le programme (routes, base de données) | Identifier la page de façon stable, par son numéro |
| Alias | `/blog/mon-article` | Le visiteur, les moteurs de recherche | Être lisible, mémorisable, partageable |
| Ancien alias | `/blog/ancien-titre` | Les anciens liens, favoris, moteurs de recherche | Continuer à mener à la page après un renommage |

Où stocker la correspondance ? Dans une base de données, en vrai. Ici, un simple tableau associatif PHP (une liste de paires « clé => valeur ») suffit pour comprendre le principe.

## Le processeur entrant et le processeur sortant

Deux fonctions, appelées **processeurs d'adresse**, travaillent en sens inverse :

| Processeur | Quand il s'exécute | Sens | Exemple |
|---|---|---|---|
| Entrant | À chaque requête reçue, **avant** le routage | alias vers adresse interne | `/blog/mon-article` devient `/node/12` |
| Sortant | Quand le programme écrit un lien dans une page | adresse interne vers alias | `/node/12` devient `/blog/mon-article` |

```text
  Visiteur tape            Processeur              Routeur
/blog/mon-article  --->  entrant (alias   --->  /node/12  --->  contrôleur
                         vers interne)           (route)

  Page HTML écrite         Processeur
<a href="/blog/...">  <---  sortant (interne  <--- le programme connaît /node/12
                           vers alias)
```

Le routeur ([chapitre sur le routage](/?c=langages&s=php&p=routage)) n'a donc besoin de connaître que les adresses internes : il ne sait même pas que les alias existent. Le code ci-dessous est le fichier `alias.php` : chaque ligne est commentée.

```php
<?php
// fichier : alias.php
// table des alias : adresse lisible => adresse interne
$alias = [
    '/blog/mon-article' => '/node/12',
    '/blog/autre-sujet' => '/node/13',
];

// met une adresse sous une forme unique : minuscules, un "/" au début, aucun à la fin
function normaliser(string $chemin): string
{
    // strtolower met en minuscules, trim retire les "/" aux deux bouts
    return '/' . trim(strtolower($chemin), '/');
}

// processeur entrant : alias -> adresse interne
function traiterEntrant(string $chemin, array $alias): string
{
    $chemin = normaliser($chemin); // "/Blog/Mon-Article/" devient "/blog/mon-article"
    // l'opérateur ?? donne la valeur de droite quand celle de gauche n'existe pas
    return $alias[$chemin] ?? $chemin; // alias inconnu : l'adresse reste inchangée
}

// processeur sortant : adresse interne -> alias
function traiterSortant(string $interne, array $alias): string
{
    $inverse = array_flip($alias); // array_flip échange clés et valeurs
    return $inverse[$interne] ?? $interne; // pas d'alias : on garde l'adresse interne
}
```

Un petit script d'essai, lancé en ligne de commande (`php essai-alias.php`), montre les deux sens.

```php
<?php
// fichier : essai-alias.php
require __DIR__ . '/alias.php'; // charge la table $alias et les fonctions

echo traiterEntrant('/blog/mon-article', $alias), "\n"; // attendu : /node/12
echo traiterEntrant('/Blog/Mon-Article/', $alias), "\n"; // attendu : /node/12
echo traiterEntrant('/contact', $alias), "\n"; // attendu : /contact
echo traiterSortant('/node/12', $alias), "\n"; // attendu : /blog/mon-article
```

Résultat obtenu :

```text
/node/12
/node/12
/contact
/blog/mon-article
```

> **Piège :** `array_flip` suppose une seule clé par valeur. Si deux alias mènent à `/node/12`, le sens sortant n'en retient qu'un seul (le dernier du tableau) : choisissez toujours un alias **officiel** par page, les autres sont des anciens alias (section suivante).

## Redirection 301 ou 302

Une **redirection** est une réponse du serveur qui dit au navigateur : « ce que tu cherches est ailleurs, va à cette adresse ». Elle s'écrit avec un code de statut (un nombre qui résume la réponse) et un en-tête `Location` (la nouvelle adresse). Le code dit si le déplacement est définitif.

| Code | Nom | Sens | Cache du navigateur | Usage typique |
|---|---|---|---|---|
| `301` | Moved Permanently (déplacée définitivement) | L'ancienne adresse ne sert plus, utilisez la nouvelle | Retenue longtemps | Page renommée, adresse interne vers son alias |
| `302` | Found (trouvée, déplacement temporaire) | La page est ailleurs pour le moment | Non retenue durablement | Promotion, page de maintenance, essai |
| `308` | Permanent Redirect | Comme `301`, mais la méthode HTTP est conservée | Retenue longtemps | Redirection permanente d'un formulaire envoyé en `POST` |
| `307` | Temporary Redirect | Comme `302`, mais la méthode HTTP est conservée | Non retenue | Redirection temporaire d'un formulaire envoyé en `POST` |

Une **méthode HTTP** est le verbe de la requête (`GET` pour lire, `POST` pour envoyer un formulaire), vue dans [les échanges de données](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). Avec `301` et `302`, les navigateurs transforment historiquement un `POST` en `GET` après la redirection ; `307` et `308` l'interdisent. Le fonctionnement complet est décrit dans la [documentation de MDN sur les redirections](https://developer.mozilla.org/fr/docs/Web/HTTP/Redirections).

Ce qui différencie vraiment `301` et `302`, c'est ce que le lecteur en fait. Un navigateur ou un moteur de recherche qui reçoit un `301` remplace l'ancienne adresse par la nouvelle dans ses favoris et son index ; avec un `302`, il garde l'ancienne.

## Conserver l'ancien alias après un renommage

Un article change de titre : son alias passe de `/blog/ancien-titre` à `/blog/mon-article`. Si l'ancien alias disparaît, tous les liens déjà publiés (mails, favoris, autres sites) mènent à une erreur `404` (page introuvable). La solution : **conserver l'ancien alias** dans une table à part, et répondre par un `301` vers l'alias actuel.

Le fichier `redirection.php` fait trois choses : envoyer une redirection, garder la table des anciens alias, et décider quelle redirection appliquer à une adresse demandée.

```php
<?php
// fichier : redirection.php
require_once __DIR__ . '/alias.php'; // une seule fois : besoin de traiterSortant()

// envoie une redirection puis arrête le script
function rediriger(string $cible, int $code = 301): void
{
    header('Location: ' . $cible, true, $code); // true : remplace un Location déjà posé
    exit; // sans exit, le reste du script continuerait de s'exécuter
}

// anciens alias conservés après un renommage : ancien alias => adresse interne
$anciens = [
    '/blog/ancien-titre' => '/node/12',
];

// redirections temporaires voulues : adresse demandée => destination
$temporaires = [
    '/promo' => '/blog/autre-sujet',
];

// renvoie [destination, code] si l'adresse doit être redirigée, sinon null
function chercherRedirection(
    string $chemin,
    array $alias,
    array $anciens,
    array $temporaires
): ?array {
    if (isset($temporaires[$chemin])) { // isset : vrai si la clé existe
        return [$temporaires[$chemin], 302]; // déplacement temporaire : 302
    }
    if (isset($anciens[$chemin])) { // ancien alias connu
        return [traiterSortant($anciens[$chemin], $alias), 301]; // vers l'alias actuel
    }
    $versAlias = traiterSortant($chemin, $alias); // /node/12 tapé à la main ?
    if ($versAlias !== $chemin) {
        return [$versAlias, 301]; // l'adresse officielle est l'alias, pas l'adresse interne
    }
    return null; // ?array : le résultat est un tableau ou null (rien à rediriger)
}
```

La troisième règle est importante : si quelqu'un tape directement `/node/12`, on le redirige vers `/blog/mon-article`. Sans elle, la même page existerait sous deux adresses, et les moteurs de recherche la compteraient comme deux pages concurrentes (un « contenu dupliqué »).

| Adresse demandée | Cas | Réponse |
|---|---|---|
| `/blog/ancien-titre` | Ancien alias conservé | `301` vers `/blog/mon-article` |
| `/node/12` | Adresse interne qui a un alias | `301` vers `/blog/mon-article` |
| `/promo` | Redirection temporaire voulue | `302` vers `/blog/autre-sujet` |
| `/blog/mon-article` | Alias actuel | Aucune redirection : la page s'affiche |

## Convertir un paramètre de route en objet

Une route peut contenir une partie variable, écrite entre accolades : `/article/{article}`. Pour `/article/12`, la partie variable (le **paramètre de route**) vaut le texte `12`. Chaque contrôleur (la fonction qui construit la réponse de la page) devrait alors chercher l'article en base, et répondre `404` s'il n'existe pas : le même code répété partout. Un **convertisseur de paramètre** (en anglais *param converter*) fait ce travail une fois, avant le contrôleur, qui reçoit directement l'objet article.

```text
/article/12  --->  paramètre "12" (texte)
                        |
                        v
               convertisseur : cherche l'article 12
                  |                       |
          trouvé  |                       | introuvable
                  v                       v
      contrôleur(objet Article)     réponse 404, contrôleur jamais appelé
```

Voici le fichier `convertisseur.php`. Un **objet** est une valeur qui regroupe des données (ici un numéro et un titre) et que l'on manipule d'un bloc ; la classe `Article` (voir [la POO en PHP](/?c=langages&s=php&p=poo)) décrit sa forme.

```php
<?php
// fichier : convertisseur.php
// la classe Article décrit un article : un numéro et un titre
class Article
{
    // "public int $id" dans le constructeur crée directement la propriété $id
    public function __construct(public int $id, public string $titre)
    {
    }
}

// base de données imitée : numéro => objet Article
$articles = [
    12 => new Article(12, 'Mon article'),
    13 => new Article(13, 'Autre sujet'),
];

// convertisseur : texte de l'adresse -> objet Article, ou null s'il n'existe pas
function convertirArticle(string $valeur, array $articles): ?Article
{
    if (!ctype_digit($valeur)) { // ctype_digit : vrai si le texte n'a que des chiffres
        return null; // "abc" ou "-1" ne sont pas des numéros valides
    }
    return $articles[(int) $valeur] ?? null; // (int) change le texte "12" en nombre 12
}
```

Le routeur `routeur.php` repère les paramètres dans l'adresse avec une **expression régulière** (un motif qui décrit une forme de texte, expliqué dans [le chapitre sur les regex](/?c=langages&s=domain-specific-languages-dsl&p=regex)), appelle le convertisseur de chaque paramètre, puis le contrôleur.

```php
<?php
// fichier : routeur.php
// cherche la route qui correspond, convertit les paramètres, appelle le contrôleur
function repartir(string $chemin, array $routes, array $convertisseurs): void
{
    foreach ($routes as $modele => $controleur) {
        // "/article/{article}" devient l'expression "#^/article/(?P<article>[^/]+)$#"
        $motif = preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $modele);
        $regex = '#^' . $motif . '$#';
        // preg_match range les morceaux trouvés dans $trouves
        if (!preg_match($regex, $chemin, $trouves)) {
            continue; // cette route ne convient pas : on essaie la suivante
        }
        $parametres = []; // les objets à donner au contrôleur
        foreach ($trouves as $nom => $texte) {
            if (is_int($nom)) {
                continue; // preg_match ajoute des entrées numérotées : on les ignore
            }
            $objet = $convertisseurs[$nom]($texte); // convertisseur du même nom
            if ($objet === null) {
                http_response_code(404); // objet introuvable : la page n'existe pas
                echo "Introuvable\n";
                return; // le contrôleur n'est jamais appelé
            }
            $parametres[] = $objet; // objet prêt pour le contrôleur
        }
        $controleur(...$parametres); // les trois points donnent chaque objet comme argument
        return; // une seule route traitée
    }
    http_response_code(404); // aucune route ne correspond
    echo "Page inconnue\n";
}
```

| Valeur dans l'adresse | Résultat du convertisseur | Réponse |
|---|---|---|
| `12` | Objet `Article` numéro 12 | `200`, le contrôleur reçoit l'objet |
| `999` | `null` (aucun article) | `404`, contrôleur non appelé |
| `abc` | `null` (pas un nombre) | `404`, contrôleur non appelé |
| `-1` | `null` (le signe `-` n'est pas un chiffre) | `404`, contrôleur non appelé |

## Assembler le tout

Le point d'entrée `index.php` charge les quatre fichiers, déclare le contrôleur et les routes, puis traite la requête dans cet ordre : redirection éventuelle, traduction de l'alias, routage.

```php
<?php
// fichier : index.php
require __DIR__ . '/alias.php'; // alias et processeurs
require __DIR__ . '/redirection.php'; // redirections 301 et 302
require __DIR__ . '/convertisseur.php'; // classe Article et convertisseur
require __DIR__ . '/routeur.php'; // fonction repartir()

// contrôleur : il reçoit directement l'objet Article, jamais un numéro
function afficherArticle(Article $article): void
{
    // htmlspecialchars neutralise les caractères < et > d'un texte affiché dans la page
    echo '<h1>' . htmlspecialchars($article->titre) . "</h1>\n";
}

// routes : modèle d'adresse => contrôleur appelé
$routes = [
    '/node/{article}' => 'afficherArticle',
    '/article/{article}' => 'afficherArticle',
];

// convertisseurs : nom du paramètre => fonction de conversion
$convertisseurs = [
    'article' => fn(string $texte): ?Article => convertirArticle($texte, $articles),
];

// adresse demandée, sans la partie après "?"
$chemin = normaliser(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');

// 1) faut-il rediriger ?
$redirection = chercherRedirection($chemin, $alias, $anciens, $temporaires);
if ($redirection !== null) {
    rediriger(...$redirection); // [destination, code] devient deux arguments
}

// 2) l'alias devient adresse interne, 3) le routeur prend le relais
repartir(traiterEntrant($chemin, $alias), $routes, $convertisseurs);
```

On le lance avec le serveur intégré de PHP (`php -S 127.0.0.1:5611 index.php`, voir [le chapitre sur le routage](/?c=langages&s=php&p=routage) pour son fonctionnement). Résultats relevés avec `curl -i` (l'option `-i` affiche aussi les en-têtes de la réponse) :

| Adresse demandée | Code | En-tête `Location` | Corps |
|---|---|---|---|
| `/blog/mon-article` | `200` | aucun | `<h1>Mon article</h1>` |
| `/blog/mon-article/` (barre finale) | `200` | aucun | `<h1>Mon article</h1>` |
| `/article/12` | `200` | aucun | `<h1>Mon article</h1>` |
| `/node/12` | `301` | `/blog/mon-article` | vide |
| `/blog/ancien-titre` | `301` | `/blog/mon-article` | vide |
| `/promo` | `302` | `/blog/autre-sujet` | vide |
| `/article/999` | `404` | aucun | `Introuvable` |
| `/article/abc` | `404` | aucun | `Introuvable` |
| `/blog/inconnu` | `404` | aucun | `Page inconnue` |

## Les pièges

| Piège | Conséquence | Parade |
|---|---|---|
| Rediriger en `301` par erreur ou pour un essai | Le navigateur retient la redirection longtemps : même après correction, certains visiteurs continuent d'être renvoyés | Tester avec `302`, ne passer en `301` qu'une fois sûr |
| Supprimer l'ancien alias au renommage | Tous les anciens liens donnent `404` | Garder chaque ancien alias avec un `301` vers l'alias actuel |
| Oublier `exit` après `header('Location: ...')` | Le script continue et peut produire du contenu ou des effets après la redirection | Isoler la redirection dans une fonction qui appelle `exit` |
| Chaîne de redirections (A vers B vers C) | Lenteur, risque de boucle | Rediriger directement vers l'alias **actuel**, jamais vers un ancien alias |
| Deux alias identiques pour des pages différentes | Une page est inaccessible (ou la mauvaise s'affiche) | Rendre l'alias unique à l'enregistrement |
| Page accessible par l'alias et par l'adresse interne sans redirection | Contenu dupliqué pour les moteurs de recherche | Rediriger l'adresse interne vers l'alias en `301` |
| Majuscules et barre finale non normalisées | `/Blog/Mon-Article/` et `/blog/mon-article` sont deux adresses pour un même contenu | Normaliser (ici `normaliser()`), et rediriger vers la forme officielle |
| Rediriger vers une adresse venue de la requête (`?next=...`) | Détournement du site pour du hameçonnage (*open redirect*) | Ne rediriger que vers des adresses de votre table, voir [les failles côté navigateur](/?c=securite&s=cybersecurite&p=failles-de-navigateur) |
| Convertisseur sans validation (`(int) "abc"` vaut `0`) | Un texte invalide est pris pour un numéro valide | Valider le format (`ctype_digit`) avant de chercher |
| Contrôleur qui reçoit un objet possiblement vide | Erreur fatale sur `null` | Le convertisseur répond `404` avant d'appeler le contrôleur |
| Afficher un titre sans l'échapper | Faille XSS (du code injecté dans la page) | `htmlspecialchars()` à l'affichage |

## Bonnes pratiques

| Pratique | Raison |
|---|---|
| Un seul alias officiel par page, les autres sont des anciens alias en `301` | Une page, une adresse : pas de contenu dupliqué |
| Créer automatiquement l'ancien alias au renommage | Aucun lien publié ne casse |
| `301` pour un changement définitif, `302` pour un changement temporaire | Le navigateur et les moteurs de recherche savent quoi retenir |
| Produire tous les liens du site par le processeur sortant | Un changement d'alias met à jour chaque lien sans retouche |
| Ne faire connaître que les adresses internes au routeur | Les routes ne changent pas quand un alias change |
| Un convertisseur par type d'objet, réutilisé par toutes les routes | La recherche et le `404` ne sont écrits qu'une fois |
| Valider le texte du paramètre avant de chercher l'objet | Les valeurs absurdes sont refusées proprement |
| Comparer des adresses normalisées (minuscules, sans barre finale) | Pas de doublon par simple différence de casse |

## Ce qu'il faut retenir

| Notion | À retenir |
|---|---|
| Alias d'adresse | Adresse lisible pour une adresse interne (`/blog/mon-article` pour `/node/12`) |
| Processeur entrant | Traduit l'alias en adresse interne avant le routage |
| Processeur sortant | Traduit l'adresse interne en alias quand le programme écrit un lien |
| Redirection `301` | Définitive : le navigateur et les moteurs de recherche la retiennent |
| Redirection `302` | Temporaire : l'ancienne adresse reste valable |
| Ancien alias conservé | Garde les anciens liens vivants après un renommage grâce à un `301` |
| Convertisseur de paramètre | Transforme le texte de l'adresse en objet avant le contrôleur, `404` si introuvable |
| Contrôleur | Reçoit directement l'objet, sans chercher ni vérifier lui-même |

Pour aller plus loin sur le même principe dans un framework, voir la [documentation de Laravel sur le routage](https://laravel.com/docs/routing) (liaison automatique d'un paramètre de route à un modèle) et la [spécification officielle des redirections HTTP](https://www.rfc-editor.org/rfc/rfc9110).
