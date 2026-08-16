---
order: 14
---

# Sécuriser vos données

Lorsque vous récupérez des données venant de l'utilisateur (formulaires, URL, cookies...), il faut toujours les considérer comme **non fiables**, même si elles semblent correctes. Un visiteur malveillant peut envoyer n'importe quoi : du code [HTML](/?c=langages-de-balisage&s=html&p=html), du [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), ou des requêtes [SQL](/?c=domain-specific-languages-dsl&p=sql) malformées. PHP fournit plusieurs fonctions pour filtrer, valider et échapper ces données.

Ce chapitre couvre d'abord les protections directement actionnables en PHP (validation, XSS, injection [SQL](/?c=domain-specific-languages-dsl&p=sql), mots de passe), puis situe ces protections dans un panorama plus large des familles d'attaques qu'une application web peut subir : certaines se défendent au niveau du code applicatif, d'autres au niveau du réseau ou de l'infrastructure.

## `filter_input()`

Permet de récupérer **et** valider/filtrer en même temps une donnée venant de `$_GET`, `$_POST`, etc. :

```php
<?php
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    $age = filter_input(INPUT_GET, 'age', FILTER_VALIDATE_INT);

    if ($email === false) {
        echo "Email invalide.";
    }
?>
```

Si la donnée ne correspond pas au filtre demandé, `filter_input()` renvoie `false`. Si le champ n'existe pas du tout, elle renvoie `null`.

Quelques filtres courants :

```php
<?php
    FILTER_VALIDATE_EMAIL;   // vérifie un format d'email
    FILTER_VALIDATE_INT;     // vérifie un nombre entier
    FILTER_VALIDATE_FLOAT;   // vérifie un nombre décimal
    FILTER_VALIDATE_URL;     // vérifie une URL
    FILTER_SANITIZE_STRING;  // nettoie une chaîne (déprécié depuis PHP 8.1)
?>
```

## `htmlspecialchars()` : se protéger des failles XSS

Si vous affichez une donnée utilisateur sur la page (ex: un commentaire, un pseudo), un visiteur pourrait injecter du code [HTML](/?c=langages-de-balisage&s=html&p=html)/[JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) malveillant. C'est une faille appelée **XSS** (*Cross-Site Scripting*).

```php
<?php
    $commentaire = "<script>alert('piraté');</script>";

    echo htmlspecialchars($commentaire);
    // affiche le texte tel quel, sans exécuter le script
?>
```

`htmlspecialchars()` convertit les caractères spéciaux (`<`, `>`, `"`, `'`) en entités [HTML](/?c=langages-de-balisage&s=html&p=html), ce qui empêche le navigateur d'interpréter le contenu comme du code.

> **Note :** affichez toujours les données utilisateur avec `htmlspecialchars()`, sauf si vous avez une raison précise de ne pas le faire.

## Se protéger des injections SQL

Si vous insérez directement une donnée utilisateur dans une requête [SQL](/?c=domain-specific-languages-dsl&p=sql), un visiteur peut manipuler la requête pour accéder à des données qu'il ne devrait pas voir, voire les supprimer. C'est une **injection [SQL](/?c=domain-specific-languages-dsl&p=sql)**, déjà détaillée avec le mécanisme des requêtes préparées PDO dans le chapitre [SQL](/?c=domain-specific-languages-dsl&p=sql) : la protection en PHP reste exactement la même, jamais concaténer une donnée utilisateur dans le texte de la requête.

```php
<?php
    // ❌ Dangereux : la donnée est insérée directement dans la requête
    $requete = "SELECT * FROM users WHERE email = '" . $_POST['email'] . "'";

    // ✅ Sûr : la donnée passe par un espace réservé, jamais interprétée comme du SQL
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute(['email' => $_POST['email']]);
?>
```

## `password_hash()` et `password_verify()` : stocker des mots de passe

Un mot de passe ne doit **jamais** être stocké en clair dans une base de données. PHP fournit des fonctions natives pour le hacher de façon sécurisée :

```php
<?php
    // On hash le mot de passe
    $user['password'] = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // On enregistre le hash en base de données (pas le mot de passe en clair)
    $stmt = $pdo->prepare("INSERT INTO users (email, password) VALUES (:email, :password)");
    $stmt->execute([
        'email' => $_POST['email'],
        'password' => $user['password'],
    ]);

    // On récupère le hash stocké en base, à partir de l'email saisi
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute(['email' => $_POST['email']]);
    $user = $stmt->fetch();

    // On compare le mot de passe saisi avec le hash récupéré de la base
    if (password_verify($_POST['password'], $user['password'])) {
        echo "Connexion réussie.";
    } else {
        echo "Mot de passe incorrect.";
    }
?>
```

`password_hash()` génère un hash différent à chaque appel (même avec le même mot de passe), grâce à un "sel" (*salt*) intégré automatiquement. Il est donc impossible de revenir au mot de passe d'origine à partir du hash.

Ce sel n'est pas perdu : il est inclus directement dans le hash généré, par exemple :

```text
2y $10 N9qo8uLOickgx2ZMRZoMye IjZAgcfl7p92ldGxad68LJZdL17lhWy
```

- `$2y$` → l'algorithme utilisé ([bcrypt](https://en.wikipedia.org/wiki/Bcrypt))
- `$10$` → le coût (la difficulté du calcul)
- Les 22 caractères suivants → le sel utilisé pour ce hash précis
- Le reste → le résultat du hachage, calculé avec ce sel

C'est pour ça que `password_verify($_POST['password'], $user['password'])` fonctionne malgré tout : elle lit le sel déjà présent dans `$user['password']`, hache `$_POST['password']` avec **ce même sel**, puis compare le résultat obtenu au reste de `$user['password']` en utilisant le même algorithme et coût. C'est pour cette raison qu'on utilise toujours `password_verify()` pour comparer, et jamais un nouveau `password_hash()` comparé directement au hash stocké : ce dernier donnerait toujours un résultat différent, même avec le bon mot de passe.

### Comparer des hash : le piège du `==`

Une raison supplémentaire de ne jamais comparer un hash soi-même : la **comparaison lâche** de PHP (voir le chapitre [Les conditions](/?c=langages-de-programmation&s=php&p=conditions)) convertit les chaînes numériques en nombres avant de les comparer.

Or PHP interprète une chaîne comme `"0e123456"` en notation scientifique : `0` élevé à une puissance, donc **zéro**. Deux hash totalement différents commençant par `0e` suivi de chiffres sont donc tous les deux convertis en `0`, et considérés comme égaux :

```php
<?php
    var_dump("0e123456" == "0e999999");   // true !  0 == 0
    var_dump("0e123456" === "0e999999");  // false, comme attendu
?>
```

Ce n'est pas théorique : cette faille (*magic hash*) a permis de contourner de vraies authentifications, en fournissant un mot de passe dont le hash [MD5](https://en.wikipedia.org/wiki/MD5) ou [SHA-1](https://en.wikipedia.org/wiki/SHA-1) tombe sur cette forme. Il suffisait que le code compare avec `==`.

Trois protections, cumulables :

- utiliser `password_verify()`, qui ne fait aucune conversion de type ;
- pour comparer deux chaînes sensibles, utiliser `hash_equals()`, qui compare en **temps constant** et évite en plus les attaques temporelles ;
- ne jamais comparer de données sensibles avec `==`.

```php
if (hash_equals($jeton_attendu, $jeton_recu)) { /* ... */ }
```

## CSRF : Cross-Site Request Forgery

Un site malveillant fait exécuter, à l'insu de l'utilisateur, une action sur un autre site où celui-ci est déjà authentifié, en s'appuyant sur le fait que le navigateur renvoie automatiquement les cookies de session à ce site, quelle que soit la page d'origine de la requête.

```html
<!-- sur un site tiers, piégé -->
<img src="https://banque.example/transfert?montant=1000&vers=attaquant">
```

Si la victime est connectée à sa banque dans le même navigateur, cette requête part avec ses cookies de session valides, sans qu'elle ait rien cliqué sur `banque.example` lui-même. Ce n'est possible que parce que l'action est déclenchée par une simple requête `GET`/`POST` sans autre vérification que la présence d'un cookie de session valide.

**Protection : un jeton CSRF**, une valeur aléatoire générée côté serveur, stockée en session, et exigée dans chaque formulaire/requête sensible :

```php
<?php
session_start();

// à la génération du formulaire
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
?>
<form action="/transfert" method="POST">
    <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
    <!-- ... reste du formulaire ... -->
</form>
```

```php
<?php
// à la réception du formulaire
session_start();

$tokenRecu = $_POST['csrf_token'] ?? '';
if (!hash_equals($_SESSION['csrf_token'] ?? '', $tokenRecu)) {
    http_response_code(403);
    exit('Requête refusée (jeton CSRF invalide).');
}
// traitement normal...
?>
```

Un site tiers n'a aucun moyen de connaître ce jeton (il est stocké en session, jamais accessible depuis un autre domaine) : il ne peut donc pas le glisser dans sa requête piégée. `hash_equals()` plutôt qu'un `===` classique, pour la même raison qu'à la vérification d'un jeton signé (voir [Gérer les connexions](/?c=langages-de-programmation&s=php&p=connexions)) : une comparaison en temps constant, qui évite une attaque par timing.

> **Note :** l'attribut de cookie `samesite` (voir [Gérer les connexions](/?c=langages-de-programmation&s=php&p=connexions)) apporte une protection complémentaire au niveau du navigateur lui-même, mais un jeton CSRF applicatif reste la protection de référence, indépendante du navigateur utilisé.

## Panorama des autres familles d'attaques

Les protections précédentes couvrent le code applicatif PHP lui-même. D'autres attaques visent le réseau, l'infrastructure, ou l'utilisateur directement : les connaître permet de savoir *où* se situe une protection donnée, et ce qu'elle ne couvre pas.

### Attaques réseau

Trois sigles reviennent dans tout ce qui suit :

- **SSL** (*Secure Sockets Layer*) et son successeur **TLS** (*Transport Layer Security*) : les protocoles qui chiffrent une connexion réseau et permettent au client de vérifier l'identité du serveur via un **certificat**. SSL est obsolète depuis longtemps, mais le nom est resté dans l'usage courant : quand on dit "certificat SSL", il s'agit en pratique de TLS.
- **HTTPS** : simplement HTTP transporté dans une connexion chiffrée par TLS. Rien d'autre ne change côté protocole applicatif.
- **DNS** (*Domain Name System*) : l'annuaire qui traduit un nom de domaine en adresse IP. C'est une étape indispensable avant toute connexion, et donc une cible.

- **Man-in-the-middle (MITM)** : l'attaquant s'intercale entre le client et le serveur légitime, et relaie (ou altère) la conversation sans qu'aucune des deux parties ne s'en aperçoive. Le chiffrement seul (TLS) ne suffit pas à l'empêcher : un attaquant peut chiffrer *sa propre* conversation avec le client, pendant qu'il chiffre une autre conversation avec le vrai serveur. **Protection :** la vérification du certificat SSL/TLS présenté par le serveur (`verify_peer`/`verify_peer_name`, voir [Faire des appels HTTP en natif](/?c=langages-de-programmation&s=php&p=http)) : sans elle, un certificat forgé par l'attaquant serait accepté sans broncher.
- **DNS spoofing / cache poisoning** : l'attaquant corrompt la résolution DNS pour qu'un nom de domaine légitime pointe vers son IP à lui. La vérification de certificat reste une protection même si le DNS est compromis, car elle ne dépend pas de la résolution DNS mais de l'identité cryptographique présentée par le serveur.
- **Sniffing (écoute passive)** : simple lecture du trafic réseau non chiffré. Ne nécessite aucune interaction active avec le trafic : juste l'observer, par exemple sur un réseau Wi-Fi public non maîtrisé. **Protection :** HTTPS partout, sans exception pour une donnée jugée "pas si sensible".

### Session hijacking (vol de session)

Voler l'identifiant de session d'un utilisateur (le cookie, voir [Gérer les connexions](/?c=langages-de-programmation&s=php&p=connexions)) pour usurper son identité sans connaître son mot de passe. Un attaquant qui obtiendrait cet identifiant (par XSS : lecture du cookie en JS, d'où l'intérêt de `httponly`, par sniffing sur une connexion non chiffrée, ou par vol physique de l'appareil) peut littéralement se faire passer pour la victime tant que la session reste valide.

### Brute force

Tester un grand nombre de combinaisons (mots de passe, jetons, identifiants) jusqu'à en trouver une valide. `password_verify()` (cf. plus haut) protège contre la lecture directe d'un mot de passe en base, mais pas contre un attaquant qui essaierait des milliers de mots de passe sur le formulaire de connexion lui-même. **Protection typique :** limiter le nombre de tentatives par unité de temps (*rate limiting*), par IP, par compte, ou les deux, avec un délai ou un blocage temporaire après un seuil d'échecs.

### DDoS : Distributed Denial of Service

Submerger un serveur (ou une ressource réseau) de requêtes, depuis de nombreuses sources simultanées, pour le rendre indisponible aux utilisateurs légitimes. Différent du brute force : l'objectif n'est pas de deviner une valeur, mais d'épuiser une ressource (bande passante, CPU, connexions ouvertes). Se protège rarement au niveau du code applicatif seul : plutôt via l'infrastructure (pare-feu, CDN, limitation de débit en amont du serveur).

### Phishing

Faire croire à la victime qu'elle interagit avec un site/service légitime pour lui soutirer des informations (identifiants, coordonnées bancaires), typiquement via un nom de domaine visuellement proche du vrai (*typosquatting*) et un certificat SSL valide, mais délivré pour ce faux domaine. Un certificat valide prouve l'identité **du domaine appelé**, pas que ce domaine soit digne de confiance : une nuance qui explique pourquoi le cadenas du navigateur seul ne garantit jamais qu'un site est légitime.

### SSRF : Server-Side Request Forgery

Forcer un serveur à effectuer, pour le compte d'un attaquant, une requête HTTP vers une destination qu'il ne devrait normalement pas atteindre, typiquement une ressource interne au réseau (base d'administration, métadonnées cloud, service interne non exposé publiquement).

```php
<?php
// dangereux si $_GET['url'] peut cibler une adresse interne (ex: http://169.254.169.254/, http://localhost:6379/...)
$reponse = file_get_contents($_GET['url']);
?>
```

Tout code qui construit une URL/hôte de destination à partir d'une entrée influencée, même indirectement, par l'utilisateur (voir [Faire des appels HTTP en natif](/?c=langages-de-programmation&s=php&p=http)) est un candidat à l'audit SSRF. **Protection :** valider l'hôte cible contre une liste blanche explicite plutôt que de faire confiance à une URL arbitraire fournie par le client.

## Résumé

| Risque | Défense principale |
|---|---|
| Donnée mal formée (email, nombre...) | `filter_input()` |
| Injection de [HTML](/?c=langages-de-balisage&s=html&p=html)/JS (XSS) | `htmlspecialchars()` |
| Injection [SQL](/?c=domain-specific-languages-dsl&p=sql) | Requêtes préparées (PDO) |
| Mot de passe en clair | `password_hash()` / `password_verify()` |
| CSRF | Jeton CSRF en session, vérifié via `hash_equals()` |
| MITM / DNS spoofing | Vérification de certificat SSL (`verify_peer`/`verify_peer_name`) |
| Sniffing | HTTPS systématique |
| Session hijacking | Cookie `httponly`/`secure`, identifiant de session à forte entropie |
| Brute force | Limitation du nombre de tentatives (*rate limiting*) |
| SSRF | Liste blanche des hôtes/URLs autorisés |

> **Note :** aucune de ces protections ne remplace HTTPS, qui chiffre les données échangées entre le navigateur et le serveur.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Toute donnée utilisateur est non fiable par défaut. Les principales failles applicatives (XSS, injection [SQL](/?c=domain-specific-languages-dsl&p=sql), CSRF) se neutralisent par des mécanismes dédiés (`htmlspecialchars`, requêtes préparées, jeton CSRF) : d'autres attaques visent le réseau ou l'infrastructure, hors du code applicatif seul. |
| **Outils utilisables** | `filter_input()`, `htmlspecialchars()`, PDO (requêtes préparées), `password_hash`/`password_verify`, `hash_equals()`. |
| **Pièges à éviter** | Comparer deux hash avec `==` (faille *magic hash*) ; concaténer une donnée utilisateur directement dans une requête [SQL](/?c=domain-specific-languages-dsl&p=sql). |
| **Bonnes pratiques** | Toujours valider/échapper une donnée utilisateur selon son usage (affichage, [SQL](/?c=domain-specific-languages-dsl&p=sql), comparaison) ; HTTPS systématique, sans exception pour une donnée jugée "pas si sensible". |
