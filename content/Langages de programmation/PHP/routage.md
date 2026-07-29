---
order: 12
---

# Le routage sans framework (front controller)

Sans framework (Laravel, Symfony...), PHP ne fournit aucun routeur intégré comparable à Express (`app.get('/chemin', callback)`). Un projet "PHP pur" doit organiser lui-même la correspondance entre une URL demandée et le code à exécuter.

## Le front controller et la table de dispatch

Un pattern courant consiste à faire passer **toutes** les requêtes par un point d'entrée unique (souvent `index.php`), qui consulte un tableau associatif "route → fichier" :

```php
<?php
$routes = [
    'accueil' => '/pages/accueil.php',
    'contact' => '/pages/contact.php',
];

$uri  = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$file = $routes[$uri] ?? null;

if ($file && file_exists(__DIR__ . $file)) {
    require __DIR__ . $file; // le "handler" est un fichier exécuté, pas une fonction rappelée
} else {
    http_response_code(404);
    echo "Page introuvable";
}
?>
```

Différence clé avec un routeur JS (Express) : chaque route pointe vers un **chemin de fichier**, pas une fonction. Il n'y a pas de callback à appeler — le fichier lui-même produit la réponse HTTP (`echo`, `header()`...) en lisant directement les superglobales.

- `$_SERVER['REQUEST_URI']` contient le chemin **et** la query string collés (`/contact?ref=pub`). `parse_url(..., PHP_URL_PATH)` extrait uniquement le chemin, en jetant la query string.
- `trim(..., '/')` retire les `/` de début/fin, pour que `'contact'` corresponde à la clé du tableau `$routes` (sans slash initial).

## Le modèle "filesystem = URLs"

Sur un serveur PHP classique (sans configuration particulière), **tout fichier physiquement présent sous la racine web est accessible via son chemin en URL** — un `.php` y est exécuté, un fichier statique y est servi tel quel. C'est l'inverse d'Express/Node, où une route n'existe que si elle est explicitement déclarée : en PHP "à l'ancienne", **tout est accessible par défaut, sauf ce qu'on bloque explicitement**.

Conséquence concrète : un dossier contenant des classes ou des données sensibles (identifiants de connexion à une base, clés d'API...) doit être **bloqué explicitement**, même si aucune route ne le référence jamais dans le code applicatif — sinon rien n'empêche un visiteur de taper directement son chemin dans le navigateur.

## Le contrat du serveur de développement intégré (`php -S`)

`php -S host:port routeur.php` n'a pas les capacités d'un vrai serveur web (pas de fichier `.htaccess`, pas de configuration Apache/nginx). Le fichier passé en argument s'exécute sur **chaque** requête, et pilote le comportement via sa valeur de `return` :

- `return false;` → "je n'ai rien fait, sers cette requête toi-même normalement" (le serveur sert alors le fichier physique demandé s'il existe, sinon 404).
- `return true;` → "j'ai déjà géré cette requête moi-même (réponse déjà produite), ne fais rien de plus".

```php
<?php
// routeur.php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1) blocages explicites en premier
$dossiersBloques = ['/data/', '/src/'];
foreach ($dossiersBloques as $dossier) {
    if (str_starts_with($uri, $dossier)) {
        http_response_code(403);
        echo 'Accès interdit.';
        return true; // déjà répondu, ne rien faire de plus
    }
}

// 2) fichier statique existant -> laisser le serveur le servir lui-même
if (is_file(__DIR__ . $uri)) {
    return false;
}

// 3) sinon, dispatch applicatif
require __DIR__ . '/index.php';
return true;
?>
```

> **Note :** l'ordre des blocs compte. Si le test `is_file()` était placé **avant** les blocages, une requête sur un fichier sensible mais physiquement présent (ex. `/data/config.php`) passerait ce test avec `true` et retournerait `false` — laissant le serveur intégré **exécuter** ce fichier directement, sans passer par les protections.

> **Note (sécurité) :** `$uri` vient directement de la requête (`$_SERVER['REQUEST_URI']`) — sans normalisation, une valeur contenant des remontées de répertoire (`/../../etc/passwd`) pourrait faire échapper `is_file(__DIR__ . $uri)` à la racine web. En pratique, il faut résoudre le chemin réel (ex. `realpath()`) et vérifier qu'il reste bien à l'intérieur de `__DIR__` avant de le servir, plutôt que de faire confiance à `$uri` tel quel.

## Rediriger et arrêter l'exécution

`header('Location: ...')` ne fait qu'ajouter une information à la réponse HTTP — elle n'interrompt **pas** le script. Sans `exit` juste après, le code suivant continue de s'exécuter (et de produire du contenu) même après une redirection :

```php
<?php
if (!$utilisateurConnecte) {
    header('Location: /connexion');
    exit; // indispensable : sans ça, le reste du script s'exécute quand même
}
?>
```
