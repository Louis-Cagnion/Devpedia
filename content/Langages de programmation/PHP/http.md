---
title: Faire des appels HTTP en PHP natif
---

PHP propose au moins deux façons natives de faire des requêtes HTTP sortantes (interroger une API externe, par exemple), sans dépendre d'aucune librairie tierce : l'extension cURL, et les flux (streams).

## cURL

API en 4 étapes : créer un handle, configurer des options, exécuter, libérer.

```php
<?php
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $corpsJson,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'], // indispensable pour un corps JSON
    CURLOPT_RETURNTRANSFER => true, // renvoyer la réponse en string, plutôt que l'afficher directement
    CURLOPT_TIMEOUT        => 10,
]);

$reponse  = curl_exec($ch);        // false en cas d'échec réseau (style d'erreur "à la C")
$codeHttp = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
?>
```

`CURLOPT_*` sont des constantes entières prédéfinies par l'extension cURL (comme des flags d'`open()` en C) : chacune configure un aspect précis de la requête.

### Convertir un retour "à la C" en exception

`curl_exec()` renvoie `false` en cas d'échec réseau, plutôt que de lever une exception — un point d'entrée peut absorber ce détail et ne laisser remonter que des exceptions au reste du programme :

```php
<?php
if ($reponse === false || $codeHttp !== 200) {
    throw new \RuntimeException("HTTP $codeHttp");
}
?>
```

Une fois cette conversion faite à un seul endroit, le reste du projet n'a plus jamais besoin de savoir que `curl_exec()` peut renvoyer `false` : il peut simplement utiliser `try`/`catch`, comme avec n'importe quelle autre erreur PHP moderne.

## Les flux PHP (streams) — une autre API pour le même besoin

PHP traite les URLs comme une variante de "fichier" que `file_get_contents()` sait lire directement. `stream_context_create()` configure ce comportement (méthode HTTP, en-têtes, corps, SSL...) :

```php
<?php
$options = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => $corpsJson,
    ],
];
$contexte = stream_context_create($options);
$reponse  = file_get_contents($url, false, $contexte); // false en cas d'échec, même style que curl_exec
?>
```

> **Note :** dans un tableau associatif littéral, une clé dupliquée voit sa **dernière** valeur gagner silencieusement — la première écriture est du code mort, jamais utilisée. Une bonne raison de faire relire ce genre de tableau (options HTTP, configuration...) par un linter, ou de le lire soi-même ligne par ligne en se demandant "quelle est la dernière valeur affectée à cette clé ?".

## `json_decode()` : un retour `null` ambigu

```php
<?php
$donnees = json_decode($reponse, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    throw new \RuntimeException('Réponse JSON invalide');
}
?>
```

`json_decode()` sur une string invalide renvoie `null` — mais une string JSON **valide** contenant littéralement `"null"` se décode elle aussi en `null`. Un simple `if ($donnees === null)` ne permettrait donc pas de distinguer "JSON invalide" de "JSON valait effectivement `null`". D'où `json_last_error()` : une fonction séparée qui rapporte si la dernière conversion a réellement échoué, indépendamment de la valeur obtenue — même logique que `isset()`/`empty()` face à une clé de tableau (cf. chapitre sur les variables) : ne jamais se fier à une valeur ambiguë quand un mécanisme dédié existe pour lever le doute.

`json_encode()` / `json_decode(..., true)` sont l'équivalent PHP de `JSON.stringify()` / `JSON.parse()` en JavaScript (le `true` demande un tableau associatif, plutôt qu'un objet `stdClass`).

## À creuser

Deux points liés à la sécurité et à la robustesse des appels HTTP restent à explorer :

- `verify_peer` / `verify_peer_name` à `false` dans le bloc `ssl` d'un contexte de flux : ça désactive la vérification du certificat SSL du serveur distant. Pourquoi voudrait-on faire ça, et quel est le compromis ?
- `ignore_errors` (streams) : comment ce réglage change le comportement de `file_get_contents()` face à une réponse HTTP d'erreur (4xx/5xx) ?
