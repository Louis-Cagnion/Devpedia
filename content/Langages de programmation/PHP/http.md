---
order: 11
---

# Faire des appels HTTP en natif

PHP propose au moins deux façons natives de faire des requêtes HTTP sortantes (interroger une API externe, par exemple), sans dépendre d'aucune bibliothèque tierce : l'extension cURL, et les flux (streams).

> Une **API** (*Application Programming Interface*, interface de programmation) est le contrat par lequel un logiciel expose ses fonctionnalités à un autre : quelles requêtes envoyer, sous quel format, et quelles réponses attendre. Le terme désigne aussi bien un service web interrogeable par HTTP (le cas ici) que l'ensemble des fonctions publiques d'une bibliothèque.
>
> Les réponses d'une API web sont le plus souvent au format **JSON** (*JavaScript Object Notation*) : un format texte de représentation de données structurées, lisible par un humain, né dans JavaScript mais aujourd'hui indépendant de tout langage. PHP le convertit avec `json_encode()` / `json_decode()`.

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

`json_decode()` sur une string invalide renvoie `null` — mais une string JSON **valide** contenant littéralement `"null"` se décode elle aussi en `null`. Un simple `if ($donnees === null)` ne permettrait donc pas de distinguer "JSON invalide" de "JSON valait effectivement `null`". D'où `json_last_error()` : une fonction séparée qui rapporte si la dernière conversion a réellement échoué, indépendamment de la valeur obtenue — même logique que `isset()`/`empty()` face à une clé de tableau (voir [Les variables](/?c=langages-de-programmation&s=php&p=variables)) : ne jamais se fier à une valeur ambiguë quand un mécanisme dédié existe pour lever le doute.

`json_encode()` / `json_decode(..., true)` sont l'équivalent PHP de `JSON.stringify()` / `JSON.parse()` en JavaScript (le `true` demande un tableau associatif, plutôt qu'un objet `stdClass`).

## `verify_peer` / `verify_peer_name` : vérifier le certificat du serveur distant

Le bloc `ssl` d'un contexte de flux (cf. exemple plus haut) contrôle deux vérifications **indépendantes**, pas la même chose deux fois :

```php
<?php
$options = [
    'ssl' => [
        'verify_peer'      => false, // le certificat est-il signé par une autorité reconnue ?
        'verify_peer_name' => false, // le nom du certificat correspond-il au domaine appelé ?
    ],
];
?>
```

- `verify_peer` : le certificat présenté par le serveur est-il signé par une autorité de certification (CA) reconnue ? Désactivé, un certificat auto-signé — fabriqué en quelques secondes avec `openssl` — est accepté sans problème.
- `verify_peer_name` : le nom inscrit dans ce certificat correspond-il au nom de domaine réellement appelé ? Un certificat parfaitement valide (signé par une vraie CA) mais délivré pour un *autre* domaine échoue ce test.

Désactiver `verify_peer` est la faille la plus large des deux : elle ouvre la porte à une attaque **man-in-the-middle** sans le moindre effort de la part d'un attaquant, qui n'a même pas besoin d'obtenir un certificat signé par une vraie CA (voir [Sécuriser vos données](/?c=langages-de-programmation&s=php&p=securite) pour le détail de cette attaque). `verify_peer_name` seul, désactivé, est un cran moins grave — il faudrait quand même un certificat signé par une CA, juste pour le mauvais domaine — mais reste une faille.

> **Note :** désactiver les deux est un compromis courant en développement local (une API auto-hébergée avec un certificat auto-signé, par exemple), mais redevient un vrai risque de sécurité si le même code tourne en production sans distinction d'environnement. cURL a l'équivalent exact via `CURLOPT_SSL_VERIFYPEER` et `CURLOPT_SSL_VERIFYHOST`.

## `ignore_errors` : que fait `file_get_contents()` face à une réponse HTTP d'erreur ?

Par défaut (sans `ignore_errors`), si le serveur répond avec un code HTTP d'erreur (4xx/5xx), `file_get_contents()` renvoie `false` et jette le corps de la réponse — **même si PHP a bien reçu ce corps**. Avec `ignore_errors => true`, la fonction renvoie le corps réel de la réponse, quel que soit le code HTTP :

```php
<?php
$options = ['http' => ['ignore_errors' => true]];
$contexte = stream_context_create($options);

$reponse = file_get_contents($url, false, $contexte);
// avec ignore_errors : $reponse contient le corps même pour un 404/500
// sans ignore_errors  : $reponse vaut false pour un 404/500, alors même que le serveur a répondu
```

Conséquence directe sur une conversion "valeur de retour → exception" comme celle vue plus haut (`if ($reponse === false) { throw ... }`) : avec `ignore_errors => true`, ce test ne se déclenche plus **du tout** pour une erreur HTTP (4xx/5xx) — seulement pour un échec de communication plus radical (serveur injoignable, DNS ne résout pas, timeout réseau — un cas où PHP ne reçoit rien, pas même des en-têtes).

> **Note :** les deux mécanismes sont complémentaires, pas redondants. Une fois `ignore_errors` activé, chaque appelant doit recontrôler lui-même le code HTTP réel (`$http_response_header`, voir la documentation PHP) pour distinguer "communication réussie mais réponse d'erreur applicative" de "tout s'est bien passé" — ce que le `throw` initial (réservé à l'échec réseau) ne couvre plus.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | PHP fait des requêtes HTTP sortantes nativement via cURL ou les flux (streams), sans bibliothèque tierce. Les deux renvoient `false` en cas d'échec réseau, style d'erreur "à la C" plutôt qu'une exception. |
| **Outils utilisables** | `curl_init`/`curl_setopt_array`/`curl_exec`, `stream_context_create`/`file_get_contents`, `json_encode`/`json_decode`, `json_last_error()`. |
| **Pièges à éviter** | Désactiver `verify_peer`/`verify_peer_name` en production (ouvre la porte à un MITM) ; confondre un `json_decode()` qui renvoie `null` par échec avec un JSON valide contenant littéralement `null`. |
| **Bonnes pratiques** | Convertir un retour "à la C" (`false`) en exception à un seul endroit du code ; vérifier `json_last_error()` plutôt que de tester directement la valeur décodée. |
