---
title: L'autoloading des classes en PHP
---

Sans autoloading, chaque fichier qui utilise une classe doit faire un `require` explicite du fichier qui la contient — lourd et fragile dès qu'un projet a beaucoup de classes. `spl_autoload_register()` permet de déléguer ce chargement au moteur PHP lui-même.

## `spl_autoload_register()`

```php
<?php
spl_autoload_register(function (string $classe) {
    $fichier = __DIR__ . '/' . $classe . '.php';
    if (file_exists($fichier)) {
        require $fichier;
    }
});

$obj = new MaClasse(); // PHP appelle automatiquement le résolveur avec "MaClasse"
// -> aucun require manuel nécessaire ailleurs dans le projet
?>
```

`spl_autoload_register()` enregistre **une fois** une fonction "résolveur". Ensuite, chaque fois que le moteur PHP rencontre un nom de classe pas encore chargé, il appelle automatiquement cette fonction en lui passant le nom de la classe (sous forme de string), et attend qu'elle charge le bon fichier. Si aucune fonction enregistrée ne parvient à charger la classe, PHP lève une erreur fatale "Class not found".

## La fonction passée en argument est une closure

L'argument de `spl_autoload_register()` n'est ni un nom de fonction, ni une variable : c'est une **fonction anonyme (closure)**, définie directement à l'endroit où elle est utilisée. Équivalent PHP d'un callback JS (`tableau.map(function(x) { ... })` ou `x => ...`) ou d'un lambda C++11. Elle n'est pas exécutée à la ligne où elle est écrite : elle est stockée, et **rappelée plus tard**, chaque fois qu'une classe inconnue est référencée.

## Faire correspondre un namespace à un dossier

Un résolveur plus réaliste associe chaque **préfixe de namespace** à un dossier de base, et reconstruit le chemin du fichier à partir du nom complet de la classe :

```php
<?php
spl_autoload_register(function (string $classe): void {
    $namespaces = [
        'App\\Modeles\\'  => __DIR__ . '/Modeles/',
        'App\\Services\\' => __DIR__ . '/Services/',
    ];

    foreach ($namespaces as $prefixe => $dossierBase) {
        if (str_starts_with($classe, $prefixe)) {
            $chemin = $dossierBase . str_replace('\\', '/', substr($classe, strlen($prefixe))) . '.php';
            if (file_exists($chemin)) {
                require $chemin;
            }
            return;
        }
    }
});
?>
```

Exemple de résolution, avec `$classe = 'App\Services\Facturation\Calculateur'` :
1. `str_starts_with($classe, 'App\\Services\\')` → `true`, ce préfixe correspond.
2. `substr(...)` retire le préfixe matché → `'Facturation\Calculateur'`.
3. `str_replace('\\', '/', ...)` transforme le séparateur de namespace en séparateur de dossier → `'Facturation/Calculateur'`.
4. Chemin final : `.../Services/Facturation/Calculateur.php` — qui doit correspondre à l'emplacement réel du fichier.

> **Note :** `'App\\Modeles\\'` dans une string à guillemets simples : `\\` représente **un seul** caractère `\` (il doit être doublé pour être écrit littéralement) — c'est la string `App\Modeles\`, le séparateur de namespace.

Le `return;` après le `if` s'exécute que le fichier existe ou non (il est placé après le `if (file_exists(...))`, pas dedans) : les préfixes de namespaces étant mutuellement exclusifs sur leur premier segment, une fois le bon préfixe trouvé, continuer à tester les autres serait toujours inutile.

> **Convention indispensable pour que ça fonctionne :** le nom du namespace + le nom de la classe doivent encoder littéralement le chemin du fichier — un fichier par classe, arborescence de dossiers = arborescence de namespaces.
