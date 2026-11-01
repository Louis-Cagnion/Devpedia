---
order: 1
---

# Codes de statut HTTP et en-têtes de contrôle

Quand un navigateur ou un programme demande une page à un serveur, la réponse contient bien plus que la page : elle porte un **code de statut** (un nombre qui dit si cela a marché) et des **en-têtes** (des lignes d'instructions du type « garde cette page 60 secondes » ou « reviens dans 5 secondes »). Ce chapitre apprend à lire ces deux éléments, à les produire côté serveur et, surtout, à réagir correctement côté client. Il suppose connus les bases de [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (un **client** envoie une **requête**, un **serveur** renvoie une **réponse**) et l'usage d'un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (la fenêtre où l'on tape des commandes au clavier). Il se place dans la section [Serveurs web](/?c=infrastructure-devops&s=serveurs-web&p=serveurs-web).

Un **serveur web** est un programme qui attend des requêtes HTTP et y répond : c'est lui qui se trouve derrière un site internet ou une API (une interface que d'autres programmes appellent par HTTP pour obtenir ou envoyer des données). Un **en-tête** (*header*) est une ligne `Nom: valeur` placée avant le contenu d'un message HTTP, qui transmet une information sur le message lui-même plutôt que son contenu.

## Une réponse HTTP, ligne par ligne

Une réponse HTTP se découpe toujours en trois parties : une ligne de statut, des en-têtes, puis une ligne vide suivie du contenu (le **corps**).

```text
HTTP/1.1 429 Too Many Requests        <- ligne de statut : version, code, nom du code
Content-Type: text/plain; charset=utf-8   <- en-têtes : un « Nom: valeur » par ligne
Content-Length: 18
Retry-After: 5
                                       <- ligne vide : fin des en-têtes
Trop de requêtes                       <- corps : le contenu proprement dit
```

`Content-Type` (le type du contenu) et `Content-Length` (sa taille en octets) sont expliqués dans [Content-Type et Content-Length](#content-type-et-content-length-lire-le-corps-correctement).

| Partie | Rôle | Qui la lit |
|---|---|---|
| Ligne de statut | Résume le résultat : `429` est le **code**, `Too Many Requests` son nom en anglais | Le programme (le code est fait pour être lu par une machine) |
| En-têtes | Précisent comment traiter le corps et comment se comporter ensuite | Le navigateur, le programme, les caches intermédiaires |
| Corps | Le contenu : page, données [JSON](/?c=infrastructure-devops&s=infrastructure&p=json), message d'erreur... | L'utilisateur ou le programme |

Le code est la partie fiable : le nom qui l'accompagne est une indication pour les humains, et le corps peut être n'importe quoi. Un programme décide donc **d'après le code**, jamais d'après le texte.

## Observer une réponse avec `curl`

Les commandes de ce chapitre sont écrites pour Bash (Linux, macOS, WSL ou Git Bash), pas pour PowerShell ni cmd.

**`curl`** est un programme de terminal qui envoie une requête HTTP et affiche la réponse ([documentation officielle](https://curl.se/docs/manpage.html)). Il est présent sur la plupart des Linux et macOS ; sous Windows PowerShell, le nom `curl` désigne souvent un autre [alias](/?c=langages&s=powershell&p=alias-et-raccourcis-de-commandes), et il faut taper `curl.exe`. Vérifiez sa présence avec `curl --version`.

| Option | Effet |
|---|---|
| `-i` | Affiche les en-têtes de la réponse avant le corps |
| `-I` | Envoie une requête `HEAD` (une [méthode HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http#une-requete-une-methode-une-adresse-parfois-des-donnees) : comme `GET`, mais le serveur ne renvoie que la ligne de statut et les en-têtes, sans corps) |
| `-s` | Silencieux : pas de barre de progression |
| `-o /dev/null` | Jette le corps (`/dev/null` est le « fichier poubelle » de Linux et macOS, voir [les redirections](/?c=langages&s=bash&p=redirections-et-pipes)) |
| `-w '%{http_code}\n'` | Affiche, une fois la requête finie, le code de statut seul (`\n` passe à la ligne) |
| `-L` | Suit les redirections (voir `Location` plus bas) |
| `-H 'Nom: valeur'` | Ajoute un en-tête à la requête |

Pour pouvoir tout essayer chez soi, la section suivante donne un petit serveur de démonstration.

## Un serveur d'essai en Node.js

**Node.js** est un programme qui exécute du JavaScript en dehors du navigateur ([site officiel et installation](https://nodejs.org/en/download)) ; il faut Node 18 ou plus (vérifiez avec `node --version`) ; son module `http` permet de créer un serveur ([documentation](https://nodejs.org/api/http.html)). Le code ci-dessous suppose les bases de [JavaScript](/?c=langages&s=javascript&p=javascript) : [fonctions](/?c=langages&s=javascript&p=fonctions), [conditions](/?c=langages&s=javascript&p=conditions), [objets](/?c=langages&s=javascript&p=objets) et [tableaux](/?c=langages&s=javascript&p=tableaux). Enregistrez-le dans un fichier `serveur.mjs` (l'extension `.mjs` indique à Node que le fichier utilise `import`, voir [l'éditeur de code](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide)).

Il écoute sur `127.0.0.1` (l'adresse de **votre propre machine**, voir [l'adressage réseau](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau)) et sur le **port** 5628 (un numéro qui distingue plusieurs programmes réseau sur une même machine, voir [les sockets](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante)). Si ce port est déjà pris, Node affiche `EADDRINUSE` : changez le nombre dans `PORT` et dans les adresses des exemples.

```javascript
// import charge un module : http est celui de Node qui permet de créer un serveur web
import http from "node:http";

// PORT : le « numéro de porte » sur lequel le serveur écoute
const PORT = 5628;
// LIMITE : nombre de requêtes acceptées par fenêtre de temps
const LIMITE = 3;
// FENETRE_MS : durée d'une fenêtre, en millisecondes (5000 ms = 5 s)
const FENETRE_MS = 5000;

// ROUTES : pour chaque adresse fixe, le statut, les en-têtes et le corps à renvoyer
const ROUTES = {
  // 301 : l'en-tête Location donne la nouvelle adresse de la page
  "/ancien": [301, { Location: "/nouveau" }, ""],
  // 200 : la page peut être gardée 60 secondes par le client (Cache-Control)
  "/nouveau": [200, { "Cache-Control": "max-age=60" }, "Bienvenue\n"],
  // 401 : « qui êtes-vous ? » ; WWW-Authenticate indique comment s'identifier
  // (Basic : un nom et un mot de passe ; realm : le nom de la zone protégée)
  "/prive": [401, { "WWW-Authenticate": 'Basic realm="prive"' }, "Identifiez-vous\n"],
  // 403 : le serveur sait qui vous êtes, mais refuse
  "/interdit": [403, {}, "Accès refusé\n"],
  // 503 : serveur en maintenance ; Retry-After dit de revenir dans 120 secondes
  "/maintenance": [503, { "Retry-After": "120" }, "Maintenance en cours\n"],
};

// debutFenetre : instant (en ms) où la fenêtre en cours a commencé
// (Date.now() donne l'instant présent en millisecondes)
let debutFenetre = Date.now();
// compteur : nombre de requêtes déjà vues dans la fenêtre en cours
let compteur = 0;

// repondre envoie un code de statut, des en-têtes et un corps texte
function repondre(res, statut, enTetes, corps) {
  // Content-Length : taille du corps en octets (un « é » en occupe 2 en UTF-8)
  // Buffer : le type de Node pour manipuler des octets ; byteLength compte ceux du corps
  const taille = Buffer.byteLength(corps);
  // en-têtes communs à toutes les réponses ; ...enTetes recopie ceux de la route
  const tous = {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": taille,
    ...enTetes,
  };
  // writeHead fixe le code de statut et les en-têtes, end envoie le corps
  res.writeHead(statut, tous);
  res.end(corps);
}

// limiter compte la requête et renvoie le délai d'attente en secondes (0 = acceptée)
function limiter(maintenant) {
  // si la fenêtre est terminée, on repart avec un compteur à zéro
  if (maintenant - debutFenetre >= FENETRE_MS) {
    debutFenetre = maintenant;
    compteur = 0;
  }
  // une requête de plus dans la fenêtre
  compteur += 1;
  // sous la limite : acceptée ; sinon, secondes restantes arrondies au-dessus
  if (compteur <= LIMITE) return 0;
  return Math.ceil((debutFenetre + FENETRE_MS - maintenant) / 1000);
}

// servirPage répond à /page : 304 si le client possède déjà la version "v1"
function servirPage(req, res) {
  // if-none-match : l'étiquette (ETag) que le client a gardée de sa visite précédente
  if (req.headers["if-none-match"] === '"v1"') {
    // 304 : rien n'a changé, la réponse n'a volontairement pas de corps
    res.writeHead(304, { ETag: '"v1"' });
    res.end();
    return;
  }
  // première visite : la page entière, avec son étiquette de version
  repondre(res, 200, { ETag: '"v1"', "Cache-Control": "no-cache" }, "Page v1\n");
}

// serveur : la fonction passée à createServer est appelée à chaque requête
// req : la requête reçue, res : la réponse à envoyer
// (req, res) => { ... } est une fonction écrite avec une flèche, sans nom
const serveur = http.createServer((req, res) => {
  // req.url : la partie de l'adresse après le nom de la machine, par exemple /api
  if (req.url === "/api") {
    // attente : 0 si la requête est acceptée, sinon le nombre de secondes à patienter
    const attente = limiter(Date.now());
    // 429 Too Many Requests, avec Retry-After en secondes (String : nombre en texte)
    if (attente > 0) {
      repondre(res, 429, { "Retry-After": String(attente) }, "Trop de requêtes\n");
      return;
    }
    // sinon : 200 avec une réponse au format JSON
    repondre(res, 200, { "Content-Type": "application/json" }, '{"ok":true}\n');
    return;
  }
  // /page gère sa propre logique
  if (req.url === "/page") {
    servirPage(req, res);
    return;
  }
  // route fixe connue : ...ROUTES[req.url] transmet les trois valeurs à repondre
  if (ROUTES[req.url]) {
    repondre(res, ...ROUTES[req.url]);
    return;
  }
  // toute autre adresse n'existe pas : 404
  repondre(res, 404, {}, "Introuvable\n");
});

// listen démarre l'écoute ; 127.0.0.1 = cette machine seulement
serveur.listen(PORT, "127.0.0.1");
```

| Adresse | Ce que le serveur renvoie |
|---|---|
| `/api` | `200` pour les 3 premières requêtes de chaque fenêtre de 5 secondes, puis `429` avec `Retry-After` |
| `/ancien` | `301` et `Location: /nouveau` |
| `/nouveau` | `200` et `Cache-Control: max-age=60` |
| `/page` | `200` avec un `ETag`, ou `304` si le client le connaît déjà |
| `/prive` | `401` |
| `/interdit` | `403` |
| `/maintenance` | `503` avec `Retry-After` |
| toute autre adresse | `404` |

Lancez-le dans un premier terminal avec `node serveur.mjs` : le terminal reste occupé tant que le serveur tourne (arrêt avec `Ctrl+C`). Ouvrez un **second** terminal pour les commandes `curl` suivantes. Un exemple, avec la réponse réellement obtenue :

```bash
# -i : affiche les en-têtes ; /nouveau est la page qui porte Cache-Control
curl -i http://127.0.0.1:5628/nouveau
```

```text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Length: 10
Cache-Control: max-age=60
Date: Sat, 31 Oct 2026 20:09:49 GMT
Connection: keep-alive
Keep-Alive: timeout=5

Bienvenue
```

`Date`, `Connection` et `Keep-Alive` sont ajoutés automatiquement par Node (la date et l'heure de la réponse, puis la consigne de garder la connexion ouverte quelques secondes) ; dans la suite du chapitre, ces trois lignes sont omises des sorties pour les alléger.

## Les cinq familles de codes

Un code de statut a trois chiffres, et **le premier** suffit à connaître la famille :

| Famille | Nom | Sens général | Qui doit agir ensuite |
|---|---|---|---|
| `1xx` | Information | La requête est reçue, la suite arrive (rarement vu par un développeur d'application) | Personne, le protocole gère |
| `2xx` | Succès | La requête a été comprise et traitée | Personne |
| `3xx` | Redirection | La ressource est ailleurs ou n'a pas changé | Le client doit faire une autre requête (ou réutiliser sa copie) |
| `4xx` | Erreur du client | La requête est incorrecte, interdite ou trop fréquente | **Le client** doit modifier sa requête ou son comportement |
| `5xx` | Erreur du serveur | La requête était valide mais le serveur n'a pas pu la traiter | **Le serveur** doit être réparé ; le client peut parfois réessayer plus tard |

L'idée à retenir : le premier chiffre répond à « **qui doit changer quelque chose ?** ». Répéter à l'identique une requête qui a donné un `4xx` ne sert à rien (sauf `429`, voir plus bas) ; répéter une requête qui a donné un `5xx` peut réussir si la panne était passagère.

## Les codes que l'on rencontre le plus

### Succès et redirections

| Code | Nom | Sens | Responsable | Exemple |
|---|---|---|---|---|
| `200` | OK | La requête a réussi, le corps contient le résultat | Personne | Charger une page, lire une liste |
| `201` | Created | Une nouvelle ressource a été créée ; `Location` indique son adresse | Personne | Réponse à un `POST` qui crée un compte |
| `204` | No Content | Succès, volontairement **sans corps** | Personne | Réponse à un `DELETE` réussi |
| `301` | Moved Permanently | La ressource a définitivement changé d'adresse (`Location`) | Serveur (configuration) | Un site qui passe d'une ancienne adresse à une nouvelle |
| `302` | Found | La ressource est **temporairement** ailleurs (`Location`) | Serveur (configuration) | Renvoyer vers la page de connexion puis revenir |
| `304` | Not Modified | Rien n'a changé depuis la copie que possède le client ; **pas de corps** | Personne | Un navigateur qui revérifie une page qu'il a déjà |

`301` et `302` ne conservent pas toujours la méthode d'origine : un navigateur peut transformer un `POST` redirigé en `GET`. Les codes `308` (équivalent permanent) et `307` (équivalent temporaire) imposent de **garder la même méthode** ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) ; une RFC, *Request For Comments*, est un document numéroté qui décrit une norme d'Internet). La `301` peut être mémorisée très longtemps par les navigateurs, ce qui la rend pénible à corriger si elle était une erreur.

### Erreurs du client (4xx)

| Code | Nom | Sens | Responsable | Exemple |
|---|---|---|---|---|
| `400` | Bad Request | La requête est mal formée ou invalide | Client | JSON cassé, champ obligatoire absent |
| `401` | Unauthorized | **Non identifié** : le serveur ne sait pas qui vous êtes (ou l'identification est fausse) | Client | Mot de passe manquant, jeton expiré (un jeton est un code temporaire qui prouve votre identité) |
| `403` | Forbidden | **Identifié mais refusé** : le serveur sait qui vous êtes et ne vous y autorise pas | Client | Un utilisateur simple qui demande une page d'administration |
| `404` | Not Found | La ressource n'existe pas (ou le serveur refuse de dire qu'elle existe) | Client | Faute de frappe dans l'adresse |
| `429` | Too Many Requests | **Trop de requêtes** dans un temps donné ; souvent accompagné de `Retry-After` | Client | Un script qui interroge une API en boucle |

### Erreurs du serveur (5xx)

| Code | Nom | Sens | Responsable | Exemple |
|---|---|---|---|---|
| `500` | Internal Server Error | Le serveur a rencontré une erreur imprévue | Serveur | Bogue dans le code, [base de données](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees) inaccessible |
| `502` | Bad Gateway | Un serveur intermédiaire a reçu une réponse invalide du serveur situé derrière lui | Serveur (chaîne de serveurs) | Le programme d'application a planté derrière un [proxy inverse](/?c=infrastructure-devops&s=serveurs-web&p=proxy-inverse-et-limitation-de-debit) (défini sous le tableau) |
| `503` | Service Unavailable | Le serveur ne peut pas répondre **pour l'instant** (surcharge, maintenance) ; souvent accompagné de `Retry-After` | Serveur | Mise à jour en cours |
| `504` | Gateway Timeout | L'intermédiaire a attendu trop longtemps la réponse du serveur situé derrière lui | Serveur (chaîne de serveurs) | Requête très lente sur un site derrière un proxy inverse |

Un **proxy inverse** est un serveur intermédiaire qui reçoit les requêtes à la place du serveur d'application et les lui transmet : c'est lui qui produit un `502` ou un `504` quand le serveur situé derrière lui est en panne ou trop lent.

Vérifions quelques-uns de ces codes sur le serveur d'essai (les lignes `Date`, `Connection` et `Keep-Alive` sont omises, et une ligne vide sépare ici chaque réponse) :

```bash
# 301 : -i affiche l'en-tête Location ; sans -L, curl ne suit pas la redirection
curl -i http://127.0.0.1:5628/ancien
# 401 : l'en-tête WWW-Authenticate dit comment s'identifier
curl -i http://127.0.0.1:5628/prive
# 403 : aucun en-tête spécial, le serveur refuse simplement
curl -i http://127.0.0.1:5628/interdit
# 404 : adresse inconnue du serveur
curl -i http://127.0.0.1:5628/absent
```

```text
HTTP/1.1 301 Moved Permanently
Content-Type: text/plain; charset=utf-8
Content-Length: 0
Location: /nouveau

HTTP/1.1 401 Unauthorized
Content-Type: text/plain; charset=utf-8
Content-Length: 16
WWW-Authenticate: Basic realm="prive"

Identifiez-vous

HTTP/1.1 403 Forbidden
Content-Type: text/plain; charset=utf-8
Content-Length: 15

Accès refusé

HTTP/1.1 404 Not Found
Content-Type: text/plain; charset=utf-8
Content-Length: 12

Introuvable
```

La première réponse n'a pas de corps (le `Content-Length: 0` l'indique) ; les trois autres en ont un. Pour ne retenir que le code, `-w` suffit :

```bash
# -s silencieux, -o /dev/null jette le corps, -w affiche le code de statut
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5628/absent
```

Ce qui affiche `404`.

### `401` ou `403` : la confusion la plus fréquente

L'**authentification** répond à « qui êtes-vous ? » ; l'**autorisation** répond à « avez-vous le droit de faire cela ? » ([la différence en détail](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation)). Le nom officiel du `401`, *Unauthorized*, est trompeur : il parle bien d'**authentification**.

| Situation | Code | Ce que le client doit faire |
|---|---|---|
| Aucun identifiant envoyé | `401` | S'identifier, puis recommencer |
| Identifiant faux ou jeton expiré | `401` | S'identifier à nouveau |
| Identifié, mais pas le droit (utilisateur simple, page d'administration) | `403` | Rien : se ré-identifier ne change rien, il faut un autre compte ou une autre permission |
| Ressource qu'on préfère ne pas révéler | `404` | Rien (le serveur cache volontairement qu'elle existe) |

## Les en-têtes qui pilotent le client

Certains en-têtes de réponse ne décrivent pas seulement le contenu : ils **disent au client quoi faire**.

| En-tête | Ce qu'il demande | Souvent associé à |
|---|---|---|
| `Retry-After` | Attendre avant de réessayer | `429`, `503` |
| `Cache-Control` | Garder (ou ne pas garder) la réponse en mémoire | `200`, `304` |
| `Location` | Aller à cette adresse | `201`, `301`, `302`, `307`, `308` |
| `Content-Type` | Lire le corps comme tel type de contenu | Presque toutes les réponses avec corps |
| `Content-Length` | Lire exactement ce nombre d'octets de corps | Presque toutes les réponses avec corps |

### `Location` : où aller maintenant

Avec une redirection (`3xx`), `Location` donne la nouvelle adresse ; avec un `201`, il donne l'adresse de la ressource qui vient d'être créée. Un navigateur suit la redirection tout seul. `curl` ne le fait que sur demande :

```bash
# -L : suit la redirection ; -w affiche le code final et l'adresse finale
# (url_effective est le nom que curl donne à l'adresse de la dernière requête)
curl -sL -o /dev/null -w '%{http_code} %{url_effective}\n' http://127.0.0.1:5628/ancien
```

```text
200 http://127.0.0.1:5628/nouveau
```

Sans `-L`, le même appel affiche `301 http://127.0.0.1:5628/ancien`. Deux requêtes ont eu lieu : l'une vers `/ancien` (réponse `301`), l'autre vers `/nouveau` (réponse `200`).

### `Content-Type` et `Content-Length` : lire le corps correctement

| En-tête | Valeur d'exemple | Rôle |
|---|---|---|
| `Content-Type` | `application/json` | Le **type de contenu** (type MIME, du nom de la norme d'origine, *Multipurpose Internet Mail Extensions*) : ici des données [JSON](/?c=infrastructure-devops&s=infrastructure&p=json). `text/html` pour une page web, `text/plain` pour du texte brut |
| `Content-Type` | `text/plain; charset=utf-8` | Le type, suivi du **jeu de caractères** (*charset*) : la table qui associe les octets aux lettres. UTF-8 est la plus courante et gère les accents ([les encodages](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)) |
| `Content-Length` | `18` | La taille du corps en **octets** (un octet est une unité de stockage : une lettre sans accent en occupe 1) |

Dans la réponse `429` de la section [Une réponse HTTP, ligne par ligne](#une-reponse-http-ligne-par-ligne), le corps `Trop de requêtes` suivi d'un retour à la ligne compte 17 caractères mais `Content-Length: 18` : le `ê` s'écrit sur deux octets en UTF-8. Un `Content-Length` compté en caractères au lieu d'octets tronque le corps : le client reçoit un texte dont la fin est perdue (une valeur trop grande, elle, le fait attendre indéfiniment des octets qui ne viennent pas).

Un mauvais `Content-Type` produit des bogues bizarres : un navigateur qui reçoit du JSON étiqueté `text/html` l'affiche comme une page, un client qui s'attend à du JSON étiqueté `text/plain` peut refuser de l'analyser. Le serveur doit aussi étiqueter correctement ce qu'il sert pour éviter que le navigateur « devine » le type (voir `X-Content-Type-Options` dans [les failles de navigateur](/?c=securite&s=cybersecurite&p=failles-de-navigateur)).

### `Cache-Control` : garder ou ne pas garder

Un **cache** est une copie gardée en mémoire (par le navigateur ou par un serveur intermédiaire) pour éviter de redemander la même chose. `Cache-Control` règle ce comportement ([documentation de référence](https://developer.mozilla.org/fr/docs/Web/HTTP/Reference/Headers/Cache-Control)) :

| Valeur | Effet |
|---|---|
| `max-age=60` | La copie est considérée comme valable 60 secondes : pendant ce temps, aucune requête n'est envoyée |
| `no-cache` | La copie peut être gardée, mais le client doit **revérifier** auprès du serveur avant de la réutiliser (malgré son nom, il ne désactive pas le stockage) |
| `no-store` | Ne rien garder du tout (pages bancaires, données personnelles) |
| `private` | Seul le navigateur de l'utilisateur peut garder la copie, pas un cache partagé entre utilisateurs |
| `public` | N'importe quel cache peut la garder |

Avec `no-cache`, la revérification passe par un `ETag` : une **étiquette de version** que le serveur colle à la réponse. Au prochain passage, le client la renvoie dans l'en-tête de requête `If-None-Match` (« donne-moi la page seulement si elle ne correspond plus à cette étiquette »). Si rien n'a changé, le serveur répond `304` **sans corps**, ce qui économise le transfert. Avec la route `/page` du serveur d'essai :

```bash
# première visite : le serveur répond 200 avec le corps et l'ETag
curl -i http://127.0.0.1:5628/page
# seconde visite : -H envoie If-None-Match avec l'ETag reçu ; réponse 304
curl -i -H 'If-None-Match: "v1"' http://127.0.0.1:5628/page
```

```text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Length: 8
ETag: "v1"
Cache-Control: no-cache

Page v1

HTTP/1.1 304 Not Modified
ETag: "v1"
```

`curl` ne garde rien en cache : il montre seulement les en-têtes. C'est le navigateur qui applique `max-age` ou `no-cache`. Le principe voisin « servir tout de suite une copie périmée, puis la mettre à jour derrière » est décrit dans [le recalcul redondant](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant).

## `Retry-After` : « reviens plus tard »

Quand un serveur ne peut pas ou ne veut pas répondre maintenant, il ne dit pas seulement « non » : il peut dire **quand** réessayer. C'est le rôle de `Retry-After`. Il accompagne surtout `429` (le client va trop vite) et `503` (le serveur est surchargé ou en maintenance), et peut aussi figurer dans une redirection `3xx` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), section 10.2.3 ; le code `429` est défini par la [RFC 6585](https://www.rfc-editor.org/rfc/rfc6585)).

### Deux formats possibles

| Format | Exemple | Sens |
|---|---|---|
| Un nombre de secondes | `Retry-After: 120` | Attends 120 secondes à partir de maintenant |
| Une date HTTP | `Retry-After: Wed, 21 Oct 2026 07:28:00 GMT` | Ne reviens pas avant cet instant (heure GMT, équivalente à l'heure UTC, la même pour tout le monde) |

Un client doit savoir lire les deux. Avec le serveur d'essai :

```bash
# attendez 5 s après la commande précédente sur /api ; 3 requêtes passent,
# la 4e dépasse la limite : 429 avec Retry-After en secondes
for i in 1 2 3 4; do curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5628/api; done
# le serveur de maintenance donne aussi un Retry-After, avec le code 503
curl -i http://127.0.0.1:5628/maintenance
```

```text
200
200
200
429
HTTP/1.1 503 Service Unavailable
Content-Type: text/plain; charset=utf-8
Content-Length: 21
Retry-After: 120

Maintenance en cours
```

Le `for i in 1 2 3 4; do ... done` est une [boucle](/?c=langages&s=bash&p=boucles) du shell qui répète la commande quatre fois.

Pour voir une réponse `429` en entier, il suffit d'envoyer trois requêtes à la suite, puis une quatrième avec `-i` (sans pause entre elles ; attendez 5 secondes après la commande précédente pour repartir d'une fenêtre vierge) :

```bash
# les 3 premières requêtes consomment la limite, la 4e affiche la réponse 429 complète
for i in 1 2 3; do curl -s -o /dev/null http://127.0.0.1:5628/api; done
curl -i http://127.0.0.1:5628/api
```

```text
HTTP/1.1 429 Too Many Requests
Content-Type: text/plain; charset=utf-8
Content-Length: 18
Retry-After: 5

Trop de requêtes
```

C'est la forme décrite dans [Une réponse HTTP, ligne par ligne](#une-reponse-http-ligne-par-ligne) : une ligne de statut, des en-têtes, une ligne vide, puis le corps. `Retry-After: 5` signifie « réessaie dans 5 secondes » : le serveur a calculé qu'il reste 5 secondes avant la fin de la fenêtre de 5 secondes en cours, et qu'une requête envoyée avant serait refusée à nouveau. Si l'on attend avant de lancer la quatrième requête, la valeur baisse (4, 3...), puisque la fenêtre avance.

### Ce que fait un client poli

```text
Client                                          Serveur
  | GET /api  (4e requête dans la fenêtre)  ---->  |
  | <----  429 Too Many Requests, Retry-After: 5   |
  |                                                |
  |   le client ATTEND 5 s (+ un peu d'aléa)       |
  |                                                |
  | GET /api  -------------------------------->    |
  | <----  200 {"ok":true}                         |
```

| Règle du client poli | Pourquoi |
|---|---|
| Ne réessayer que `429` et `503` (et d'autres pannes passagères) | `400`, `401`, `403`, `404` ne changeront pas en répétant la même requête |
| Lire `Retry-After` en priorité (secondes **ou** date) | Le serveur connaît mieux que le client la durée de sa propre surcharge |
| Sans `Retry-After` : attendre de plus en plus longtemps (**retrait exponentiel**, *exponential backoff*) | Le délai double à chaque échec : on laisse au serveur le temps de récupérer |
| Y ajouter de l'**aléa** (*jitter*) | Sans aléa, mille clients qui ont reçu le même `Retry-After: 5` reviennent tous à la même seconde et provoquent un nouveau pic |
| Limiter le nombre d'essais et plafonner l'attente | Un `Retry-After` de plusieurs heures ne doit pas bloquer un programme sans fin |
| Ne répéter une requête que si elle est **idempotente** | Une requête idempotente (`GET`, `PUT`, `DELETE`) a le même effet qu'on l'envoie une fois ou dix ; répéter un `POST` peut créer un doublon |

Le même principe est appliqué par les bibliothèques clientes des API professionnelles (voir [le SDK et l'API](/?c=ia&s=modeles-de-decision-structuree&p=sdk-et-api)) et complété par le disjoncteur (arrêter d'appeler une ressource en panne) dans [la robustesse des traitements par lots](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots).

### Le mauvais client : réessayer sans attendre

Voici un script qui ignore la réponse et recommence immédiatement. Il utilise `fetch` (la fonction de JavaScript qui envoie une requête HTTP) avec `await` (attendre le résultat), expliqués dans [la programmation asynchrone](/?c=langages&s=javascript&p=asynchrone). `fetch` est disponible sans installation depuis Node 18, et `await` en dehors d'une fonction exige un fichier `.mjs` : enregistrez le script dans `mauvais.mjs` et lancez `node mauvais.mjs`, après avoir attendu 5 secondes depuis la commande précédente.

```javascript
// compteurs : combien de réponses de chaque code ont été reçues
const compteurs = {};
// vingt requêtes immédiates, sans jamais attendre : le comportement à éviter
for (let i = 0; i < 20; i += 1) {
  // on ne regarde que le code de statut ; { status } extrait la propriété status de la réponse
  const { status } = await fetch("http://127.0.0.1:5628/api");
  // on ajoute 1 au compteur de ce code (?? 0 : s'il n'existait pas encore, on part de 0)
  compteurs[status] = (compteurs[status] ?? 0) + 1;
}
// affiche le bilan
console.log(compteurs);
```

```text
{ '200': 3, '429': 17 }
```

Sur 20 requêtes, 17 ont été inutiles : elles ont chargé le serveur, consommé la limite, et n'ont rien rapporté. Sur un vrai service, cela peut mener à un blocage durable de la clé d'accès (le code secret qui identifie votre programme auprès du service ; voir [la sécurité d'une API web](/?c=securite&s=cybersecurite&p=securite-api-web)).

### Le bon client : respecter `Retry-After`

Le script suivant (à enregistrer dans `client.mjs`) lit l'en-tête, attend, et recommence. La fonction `lireRetryAfter` gère les deux formats ; `delaiCroissant` sert de secours quand l'en-tête manque. La gestion d'erreur avec `throw` est expliquée dans [la gestion des erreurs](/?c=langages&s=javascript&p=gestion-des-erreurs).

```javascript
// URL_API : l'adresse de la route qui limite le débit
const URL_API = "http://127.0.0.1:5628/api";
// MAX_ESSAIS : nombre maximal de tentatives avant d'abandonner
const MAX_ESSAIS = 5;
// ATTENTE_MAX_MS : plafond d'une attente, quelle que soit la demande du serveur
const ATTENTE_MAX_MS = 30000;

// dormir renvoie une promesse qui se termine après ms millisecondes
function dormir(ms) {
  // setTimeout appelle la fonction fini une fois le temps écoulé
  return new Promise((fini) => setTimeout(fini, ms));
}

// lireRetryAfter convertit la valeur de l'en-tête en millisecondes (null si absente)
function lireRetryAfter(valeur) {
  // pas d'en-tête, ou en-tête vide : le client devra décider seul de son délai
  if (valeur === null || valeur.trim() === "") return null;
  // premier format possible : un nombre entier de secondes, par exemple "5"
  const secondes = Number(valeur);
  // Number.isFinite est faux pour NaN (« pas un nombre »), ce qui écarte une date
  if (Number.isFinite(secondes)) return Math.max(0, secondes * 1000);
  // second format : une date HTTP ; Date.parse la lit et la convertit en millisecondes
  // écoulées depuis le 1er janvier 1970 (comme Date.now())
  const date = Date.parse(valeur);
  if (Number.isNaN(date)) return null;
  // Date.now() : instant présent ; Math.max(0, x) garde le plus grand de 0 et x,
  // donc jamais négatif : une date passée veut dire « tout de suite »
  return Math.max(0, date - Date.now());
}

// delaiCroissant : attente au hasard entre 0 et 500 ms x 2^essai (retrait exponentiel)
function delaiCroissant(essai) {
  // Math.random() donne un nombre entre 0 et 1 ; 2 ** essai : 2 puissance essai
  return Math.random() * 500 * 2 ** essai;
}

// appeler envoie la requête et réessaie poliment sur 429 et 503
async function appeler(url) {
  // essai vaut 0 pour la première tentative, 1 pour la deuxième, etc.
  for (let essai = 0; essai < MAX_ESSAIS; essai += 1) {
    // fetch envoie la requête ; reponse.status est le code de statut reçu
    const reponse = await fetch(url);
    // reponse.ok est vrai pour tous les codes 2xx : on rend la main avec la réponse
    if (reponse.ok) return reponse;
    // tout autre code que 429 ou 503 : réessayer ne servirait à rien
    if (reponse.status !== 429 && reponse.status !== 503) {
      throw new Error(`Échec définitif : ${reponse.status}`);
    }
    // consigne du serveur si elle existe ; ?? choisit sinon le délai croissant aléatoire
    const demande = lireRetryAfter(reponse.headers.get("Retry-After"));
    // aléa de 0 à 500 ms ajouté : les clients ne reviennent pas tous au même instant
    const attente = (demande ?? delaiCroissant(essai)) + Math.random() * 500;
    // trop long : on abandonne plutôt que de bloquer le programme
    if (attente > ATTENTE_MAX_MS) throw new Error(`Attente trop longue : ${attente} ms`);
    // Math.round arrondit à l'entier ; les ${...} d'un texte entre accents graves
    // sont remplacés par leur valeur
    const arrondi = Math.round(attente);
    console.log(`essai ${essai + 1} : ${reponse.status}, pause de ${arrondi} ms`);
    // pause avant de recommencer
    await dormir(attente);
  }
  throw new Error("Trop d'essais");
}

// on enchaîne six appels : les trois premiers passent, les suivants subissent la limite
for (let numero = 1; numero <= 6; numero += 1) {
  const reponse = await appeler(URL_API);
  console.log(`appel ${numero} : ${reponse.status} ${(await reponse.text()).trim()}`);
}
```

Avec le serveur d'essai lancé, la sortie réellement obtenue est :

```text
appel 1 : 200 {"ok":true}
appel 2 : 200 {"ok":true}
appel 3 : 200 {"ok":true}
essai 1 : 429, pause de 5302 ms
appel 4 : 200 {"ok":true}
appel 5 : 200 {"ok":true}
appel 6 : 200 {"ok":true}
```

Le quatrième appel a reçu un `429`, a patienté un peu plus de 5 secondes (les 5 de `Retry-After` plus l'aléa de 0 à 500 ms), puis a réussi du premier coup. Aucune requête n'a été gaspillée. La durée de la pause varie légèrement d'une exécution à l'autre à cause de l'aléa.

Voici ce que `lireRetryAfter` renvoie (en millisecondes) pour différentes valeurs de l'en-tête, résultats obtenus en appelant la fonction :

| Valeur de l'en-tête | Résultat | Explication |
|---|---|---|
| `"5"` | `5000` | 5 secondes converties en millisecondes |
| `"120"` | `120000` | 2 minutes |
| `"-5"` | `0` | Un délai négatif n'a pas de sens : pas d'attente |
| Une date déjà passée (`Wed, 21 Oct 2015 07:28:00 GMT`) | `0` | Revenir tout de suite est permis |
| Une date dans 90 secondes | environ `89000` | Le temps restant jusqu'à cette date |
| `"abc"`, `""` ou absent | `null` | Valeur inexploitable : le client utilise `delaiCroissant` |

Sans `Retry-After`, `delaiCroissant` tire un nombre au hasard entre 0 et un plafond qui double à chaque essai :

| Essai (numéro de départ 0) | Plafond de l'attente tirée au hasard |
|---|---|
| 0 | 500 ms |
| 1 | 1 000 ms |
| 2 | 2 000 ms |
| 3 | 4 000 ms |
| 4 | 8 000 ms |

`Retry-After` reste une **demande**, pas une contrainte technique : rien n'empêche un client de l'ignorer. Un serveur sérieux se protège alors tout seul (limitation de débit, blocage des clients qui insistent) ; ce côté serveur est le sujet de [la limitation de débit et du proxy inverse](/?c=infrastructure-devops&s=serveurs-web&p=proxy-inverse-et-limitation-de-debit). Le risque que représente une surcharge est détaillé dans [la surcharge et le déni de service applicatif](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif). Certains services ajoutent leurs propres en-têtes pour annoncer le quota restant ; leurs noms et leur sens se lisent dans la documentation de chaque service.

## Choisir le bon code côté serveur

| Situation | Code à renvoyer |
|---|---|
| La page ou la donnée est renvoyée normalement | `200` |
| Un `POST` a créé une ressource | `201` avec `Location` |
| Un `DELETE` a réussi, rien à afficher | `204` |
| La page a changé d'adresse pour de bon | `301` avec `Location` |
| Le corps de la requête est invalide (JSON cassé, champ manquant) | `400`, avec dans le corps ce qui est faux |
| Aucun identifiant, ou identifiant faux | `401` |
| Identifié mais pas autorisé | `403` |
| La ressource n'existe pas | `404` |
| Le client dépasse sa limite | `429` avec `Retry-After` |
| Bogue ou panne imprévue | `500` (sans détails internes dans le corps) |
| Surcharge ou maintenance planifiée | `503` avec `Retry-After` |

## Les pièges

| Piège | Conséquence | À faire à la place |
|---|---|---|
| Confondre `401` et `403` | Le client s'identifie à nouveau en boucle alors qu'il n'a pas le droit, ou ne s'identifie jamais alors qu'il le faudrait | `401` : pas identifié ; `403` : identifié mais refusé |
| Renvoyer `200` avec un message d'erreur dans le corps (`{"erreur": "introuvable"}`) | Les programmes, les caches et les outils de surveillance croient que tout va bien ; l'erreur est comptée comme un succès | Utiliser le code qui correspond (`404`, `400`...) et garder le message dans le corps comme complément |
| Réessayer immédiatement en boucle | Mesuré plus haut : 17 requêtes perdues sur 20 ; risque de blocage par le serveur | Attendre `Retry-After`, sinon un délai croissant et aléatoire, avec un nombre d'essais limité |
| Ignorer le format date de `Retry-After` | `Number("Wed, 21 Oct 2026...")` donne `NaN` : le client attend `NaN` millisecondes, soit pas du tout | Lire les deux formats (`lireRetryAfter`) |
| Réessayer un `400`, `401`, `403` ou `404` | Même réponse à chaque fois, charge inutile | Corriger la requête, ou s'identifier |
| Réessayer un `POST` non idempotent après un `5xx` | Doublon possible (deux commandes, deux paiements) si le premier avait en fait réussi | Réessayer seulement les requêtes idempotentes, ou ajouter une clé d'unicité (un identifiant unique envoyé avec la requête, qui permet au serveur d'ignorer un doublon ; voir [l'idempotence](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots)) |
| Pas de plafond ni de nombre d'essais maximal | Un programme bloqué pendant des heures sur un `Retry-After` énorme | `ATTENTE_MAX_MS` et `MAX_ESSAIS` |
| `500` pour une erreur du client (JSON invalide, champ manquant) | Les alertes de panne se déclenchent à tort, le client croit à une panne passagère et réessaie | `400` : c'est la requête qui est en cause |
| `404` pour tout (même un refus d'accès) | Le client ne sait pas quoi corriger | Un code précis, sauf volonté de cacher l'existence |
| `301` posée par erreur | Mémorisée par les navigateurs, difficile à annuler | Tester avec `302` d'abord, passer à `301` quand l'adresse est définitive |
| `Content-Length` compté en caractères | Corps tronqué dès qu'il y a un accent | Mesurer en octets (`Buffer.byteLength`) |
| `Content-Type` absent ou faux | Le navigateur devine le type ou affiche mal le contenu | Toujours le déclarer (`application/json` pour du JSON) |
| Mettre une réponse personnelle en `public` | Un cache partagé la sert à un autre utilisateur | `private` ou `no-store` pour les données personnelles |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Décider d'après le **code**, pas d'après le texte du corps | Le code est le contrat entre machines |
| Distinguer `4xx` (corriger la requête) et `5xx` (réessayer plus tard, avec limite) | Chaque famille appelle une réaction différente |
| Toujours lire `Retry-After` sur `429` et `503` | Le serveur sait mieux que vous combien de temps durera la panne |
| Retrait exponentiel, aléa, nombre d'essais et attente maximale bornés | Évite que tous les clients reviennent en même temps, et les attentes interminables |
| Renvoyer le code exact côté serveur, avec `Retry-After` quand on limite | Un client bien écrit pourra alors se comporter poliment |
| Déclarer `Content-Type` (avec `charset=utf-8` pour du texte) et laisser `Content-Length` à la bibliothèque quand c'est possible | Aucun calcul d'octets à la main |
| Choisir `Cache-Control` volontairement : `max-age` pour du statique, `no-cache` avec `ETag` pour du dynamique à revérifier, `no-store` pour du sensible | Le comportement par défaut des caches est rarement celui qu'on veut |
| Tester avec `curl -i` avant d'écrire le client | On voit exactement ce que le serveur envoie |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un code de statut se lit par son premier chiffre : `2xx` succès, `3xx` redirection, `4xx` faute du client, `5xx` faute du serveur. `Retry-After` (secondes ou date HTTP) accompagne `429` et `503` et dit quand revenir ; `Cache-Control`, `Location`, `Content-Type` et `Content-Length` pilotent le cache, la destination et la lecture du corps. `curl -i` permet de tout observer. |
| **Pièges à éviter** | Confondre `401` (pas identifié) et `403` (refusé) ; renvoyer `200` avec une erreur dans le corps ; réessayer en boucle sans attendre ; ne lire que le format en secondes de `Retry-After` ; réessayer un `4xx` ou un `POST` non idempotent ; compter `Content-Length` en caractères. |
| **Bonnes pratiques** | Décider d'après le code ; réessayer seulement les erreurs passagères (`429`, `503`), en respectant `Retry-After`, sinon retrait exponentiel avec aléa, nombre d'essais et attente plafonnés ; renvoyer le code exact et les bons en-têtes côté serveur ; vérifier avec `curl -i`. |
