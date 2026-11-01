---
order: 24
---

# Ressource REST et authentification HTTP Basic (31/10/2026)

Un programme (une application mobile, un script, un autre serveur) qui veut lire ou modifier les données d'un site passe par une [API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) : une porte d'entrée en HTTP, faite pour être utilisée par un programme plutôt que par une personne. Ce chapitre répond à deux questions. Comment décrire proprement ce que la porte expose : c'est la **ressource REST**, que l'on déclare comme un [plugin](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins) (un morceau de code indépendant qui s'inscrit lui-même dans un catalogue central, le **registre** ; le détail vient plus bas). Comment vérifier qui frappe à la porte : c'est l'**authentification HTTP Basic**, la plus simple de toutes, dont il faut connaître précisément les limites.

Il suppose deux acquis : la [méthode, l'adresse et le code de statut](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) d'une requête HTTP, et la différence entre [authentification et autorisation](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation), qui présente déjà HTTP Basic en une section. Ici, on le démonte pièce par pièce, sur un serveur réellement exécuté.

| Notion | Où elle est traitée |
|---|---|
| Méthode, adresse, code de statut | [API et HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) |
| `401` contre `403`, premier aperçu de Basic | [Authentification vs autorisation](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation) |
| Contrat, étiquette et gestionnaire d'un plugin | [L'architecture à plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins) |
| CORS, limitation de débit en général, clé ou jeton | [Sécurité des API web](/?c=securite&s=cybersecurite&p=securite-api-web) |
| Hachage, chiffrement, comparaison d'une signature | [Cryptographie appliquée](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) et [Sécurité des webhooks](/?c=securite&s=cybersecurite&p=securite-des-webhooks) |
| Où ranger un mot de passe ou une clé | [Gestion des secrets](/?c=securite&s=cybersecurite&p=gestion-des-secrets) |
| **Ici** | La ressource et son registre, Basic en détail, la démonstration que Base64 ne protège rien, la comparaison à temps constant, les essais limités, le choix d'une alternative |

## Ce qu'est une ressource REST

**REST** est un style d'organisation d'une API : le serveur expose des **ressources**, chacune désignée par une adresse, et le client agit dessus avec les méthodes HTTP habituelles. Une **ressource** est une « chose » que le serveur sait nommer : la liste des articles, un article précis, un utilisateur. Une **URL** (*Uniform Resource Locator*) est l'adresse web qui la désigne, par exemple `/articles`. Une **représentation** est le texte que le serveur renvoie pour décrire la ressource, le plus souvent en [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) (un format de texte qui décrit des données avec des accolades et des paires nom/valeur).

L'image : la ressource est un classeur étiqueté `/articles` dans une bibliothèque. Les méthodes sont les gestes permis sur ce classeur (consulter, ajouter une fiche, corriger une fiche, retirer une fiche). La représentation est la photocopie que l'on vous remet, jamais le classeur lui-même.

Un **en-tête** (*header*) est une ligne `Nom: valeur` placée avant le contenu d'une requête ou d'une réponse ; elle transporte des métadonnées (le format, l'identité, la date). Par exemple `Accept` indique le format souhaité par le client, et `Content-Type` le format du contenu envoyé. Le schéma suivant montre un échange complet.

```
Client                                      Serveur
  |                                            |
  |  GET /articles                             |   méthode + URL
  |  Accept: application/json                  |   en-tête : format souhaité
  | -----------------------------------------> |
  |                                            |   la ressource « articles »
  |  200 OK                                    |   est retrouvée, la méthode GET
  |  Content-Type: application/json           |   est permise
  |  [{"id":1,"titre":"Premier article"}]      |   représentation (JSON)
  | <----------------------------------------- |
```

| Méthode | Geste | Modifie les données ? | Répétable sans effet de plus (idempotente) ? | Succès typique |
|---|---|---|---|---|
| `GET` | Lire la ressource | Non | Oui | `200` |
| `POST` | Créer un élément dans la collection | Oui | Non : deux envois créent deux éléments | `201` (créé) |
| `PUT` | Remplacer entièrement un élément | Oui | Oui : même état final | `200` ou `204` |
| `PATCH` | Corriger une partie d'un élément | Oui | Selon la façon de l'écrire | `200` ou `204` |
| `DELETE` | Supprimer un élément | Oui | Oui : une fois supprimé, il reste supprimé | `204` (sans contenu) |

Une méthode est **idempotente** quand l'envoyer une fois ou dix fois laisse les données dans le même état final. Cela compte dès qu'un réseau coupe la réponse : le client peut alors renvoyer la requête sans craindre un doublon, sauf pour `POST`.

| Adresse | Désigne | Exemple de méthodes utiles |
|---|---|---|
| `/articles` | La collection (la liste) | `GET` pour lister, `POST` pour ajouter |
| `/articles/2` | Un élément précis de la collection | `GET`, `PATCH`, `DELETE` |
| `/sante` | Une ressource d'état du service | `GET` seulement |

Dernier trait de REST, lourd de conséquences ici : le serveur est **sans état** (*stateless*). Il ne garde pas en mémoire « le client qui vient de se connecter » : chaque requête doit porter tout ce qu'il faut pour être traitée, **identité comprise**. C'est exactement ce que fait HTTP Basic, et la raison pour laquelle il se marie si naturellement avec une API.

## Déclarer une ressource comme un plugin

Sans organisation, un serveur d'API ressemble vite à un fichier central où chaque nouvelle adresse ajoute un cas de plus, avec le défaut décrit dans [le chapitre sur l'architecture à plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins) : le fichier central doit connaître tout le monde. Le **plugin** renverse la responsabilité : chaque ressource est un morceau indépendant qui **se déclare** auprès d'un **registre** (le catalogue central des ressources connues). Le chapitre cité détaille le contrat, l'étiquette et le gestionnaire ; on se contente ici de l'appliquer.

```
   Ressources déclarées                Registre (catalogue)
  +----------------------+           +-----------------------------+
  | articles             |  declarer | id         chemin           |
  |  GET   permission    | --------> | articles   /articles        |
  |  POST  permission    |           | sante      /sante           |
  +----------------------+           +--------------+--------------+
  | sante                |                          |
  |  GET   (publique)    |      requête GET /articles
  +----------------------+                          |
                                          1. chercher la ressource par chemin
                                          2. chercher la méthode dans ses règles
                                          3. contrôler l'identité et la permission
                                          4. exécuter la règle, renvoyer la réponse
```

| Élément de la déclaration | Rôle | Dans l'exemple de ce chapitre |
|---|---|---|
| Identifiant | Nom stable de la ressource dans le registre | `articles` |
| Chemin | L'URL qui la désigne | `/articles` |
| Méthodes | Liste **blanche** des méthodes permises (tout le reste est refusé) | `GET`, `POST` |
| Permission par méthode | Ce dont l'appelant doit disposer pour cette méthode | `lire`, `ecrire` |
| Règle d'exécution | La fonction qui produit la réponse | `repondre` |

Deux conséquences sont à retenir. D'abord, ajouter une ressource ne modifie aucune ligne du code central : on déclare, c'est tout. Ensuite, la liste des méthodes est un **contrat explicite** : une méthode absente de la déclaration reçoit la réponse [`405 Method Not Allowed`](https://developer.mozilla.org/fr/docs/Web/HTTP/Reference/Status/405) (« méthode non permise »), accompagnée d'un en-tête `Allow` qui énumère les méthodes acceptées. Ce qui n'est pas déclaré n'existe pas, ce qui réduit la **surface d'attaque** (l'ensemble des points par lesquels on peut attaquer le service).

## Le serveur d'exemple

Pour refaire les manipulations, il faut un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) Bash (Linux, macOS ou WSL, voir [les commandes de base](/?c=langages&s=bash&p=commandes-de-base)), [Node.js](https://nodejs.org/en/download) installé (la commande `node --version` doit afficher un numéro) et `curl`, un programme livré avec Linux et macOS qui envoie des requêtes HTTP. On crée un dossier de travail, on y enregistre le code ci-dessous dans un fichier `serveur-rest.mjs` (les cinq parties à la suite, dans l'ordre), puis on lance le serveur dans un premier terminal. Les commandes `curl` se tapent dans un **second** terminal, le premier restant occupé par le serveur.

Tout ce qui suit est tiré d'un petit serveur écrit en [JavaScript](/?c=langages&s=javascript&p=javascript) avec le module `node:http` de [Node.js](https://nodejs.org/api/http.html) (l'environnement qui exécute du JavaScript hors d'un navigateur). Il écoute sur le port `7312` (un **port** est le numéro de la porte d'un ordinateur sur laquelle un programme écoute) de l'adresse `127.0.0.1` : l'adresse de votre propre machine, aussi nommée `localhost`, comme dans [le serveur local](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement). Le fichier est découpé en cinq parties ; chaque notation du code est expliquée dans un commentaire à sa première apparition, avec un renvoi vers le chapitre qui la détaille quand il existe : [les variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [les fonctions](/?c=langages&s=javascript&p=fonctions), [les objets](/?c=langages&s=javascript&p=objets), [les tableaux](/?c=langages&s=javascript&p=tableaux), [les erreurs](/?c=langages&s=javascript&p=gestion-des-erreurs), [la programmation asynchrone](/?c=langages&s=javascript&p=asynchrone) et [les regex](/?c=langages&s=javascript&p=regex) (les expressions régulières).

**Partie 1 : les comptes.** Le serveur ne conserve jamais un mot de passe lisible : il garde un **sel** (une valeur aléatoire propre à chaque compte, qui rend chaque résultat unique) et une **empreinte** (le résultat du hachage par `scrypt`, une fonction de hachage volontairement lente, voir [mots de passe et hachage](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage)). Sel et empreinte se mesurent en **octets** (un octet est un groupe de 8 bits, voir [les entiers et les bits](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements)). `alice` n'a que la permission de lire, `bruno` peut lire et écrire.

```javascript
// Un module est un fichier de code réutilisable (d'où l'extension .mjs) ; import le charge.
import http from 'node:http';                       // serveur HTTP intégré à Node
// Un octet est un groupe de 8 bits (un bit vaut 0 ou 1), donc une valeur de 0 à 255.
// Un Buffer est une suite d'octets bruts.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'; // hachage

// ---------- Partie 1 : les comptes ----------
// const nomme une valeur ; (a, b) => { ... } est une fonction ; return renvoie son résultat.
const creerCompte = (motDePasse, permissions) => {  // fabrique un compte enregistré
  const sel = randomBytes(16);                       // sel : 16 octets aléatoires du compte
  // Le suffixe Sync de scryptSync : le programme attend la fin du calcul avant de continuer.
  const empreinte = scryptSync(motDePasse, sel, 32); // hachage lent, 32 octets
  return { sel, empreinte, permissions };            // { a, b } est l'objet { a: a, b: b }
};                                                   // jamais le mot de passe lui-même

// new Map([...]) crée un dictionnaire : il associe une clé à une valeur.
// Chaque [clé, valeur] est un tableau (une liste) de deux cases.
const COMPTES = new Map([                            // identifiant => compte
  ['alice', creerCompte('lecture-ok', ['lire'])],    // alice peut seulement lire
  ['bruno', creerCompte('ecriture-ok', ['lire', 'ecrire'])], // bruno lit et écrit
]);
const COMPTE_FACTICE = creerCompte('inutilise', []); // sert si l'identifiant est inconnu
```

**Partie 2 : l'authentification HTTP Basic.** `lireIdentifiants` décode l'en-tête ; `authentifier` vérifie le mot de passe. Chaque ligne sera reprise dans les sections suivantes.

```javascript
// ---------- Partie 2 : l'authentification HTTP Basic ----------
// function nom(paramètre) { ... } déclare une fonction ; null veut dire « aucune valeur ».
function lireIdentifiants(entete) {                  // entete : valeur de Authorization
  // L'expression régulière /.../i est un motif de recherche : ^ début du texte, \s+ des
  // espaces, (\S+) un groupe de caractères non blancs, $ fin du texte, i casse libre.
  // exec renvoie null si le texte ne correspond pas au motif.
  // a ?? b vaut a, sauf si a est null ou undefined (absent) : alors b.
  const trouve = /^basic\s+(\S+)$/i.exec(entete ?? ''); // schéma « Basic », casse libre
  if (trouve === null) return null;                  // autre schéma, ou en-tête absent
  // trouve[1] est le texte du groupe (\S+). Base64 est une écriture d'octets avec 64
  // caractères (voir plus bas) : Buffer.from(texte, 'base64') la décode en octets, puis
  // .toString('utf8') relit ces octets comme du texte.
  const decode = Buffer.from(trouve[1], 'base64').toString('utf8'); // base64 -> texte
  const position = decode.indexOf(':');              // rang du PREMIER « : » (-1 si absent)
  if (position < 0) return null;                     // pas de « : » : en-tête mal formé
  return {
    // slice(a, b) extrait le texte de la position a (comprise) à la position b (exclue)
    identifiant: decode.slice(0, position),          // avant le premier « : »
    motDePasse: decode.slice(position + 1),          // le reste, autres « : » compris
  };
}

function authentifier(entete) {                      // renvoie le compte, ou null
  const lu = lireIdentifiants(entete);               // identifiant et mot de passe reçus
  if (lu === null) return null;                      // en-tête inutilisable
  const connu = COMPTES.has(lu.identifiant);         // has : la clé existe-t-elle ?
  // get lit la valeur associée à la clé ; sinon, le compte factice
  const compte = COMPTES.get(lu.identifiant) ?? COMPTE_FACTICE;
  const candidate = scryptSync(lu.motDePasse, compte.sel, 32); // même coût dans tous les cas
  // timingSafeEqual compare deux Buffer en temps constant (expliqué plus bas)
  const egal = timingSafeEqual(candidate, compte.empreinte);
  // a && b : « a et b » ; test ? x : y vaut x si test est vrai, sinon y ;
  // ...compte recopie dans le nouvel objet toutes les propriétés de compte.
  return connu && egal ? { identifiant: lu.identifiant, ...compte } : null;
}
```

**Partie 3 : limiter les tentatives.** Un compteur d'échecs par [adresse IP](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau) (le numéro qui identifie une machine sur un réseau), tenu côté serveur, dans une fenêtre de soixante secondes.

```javascript
// ---------- Partie 3 : limiter les tentatives ----------
const ECHECS = new Map();                            // adresse IP => { nombre, debut }
const MAX_ECHECS = 3;                                // échecs tolérés par fenêtre
const FENETRE_MS = 60_000;                           // 60 s en ms (le _ est un séparateur)

function bloque(adresse) {                           // cette adresse a-t-elle trop échoué ?
  const e = ECHECS.get(adresse);                     // historique, sinon undefined
  // Date.now() est l'heure actuelle en millisecondes ; !== signifie « différent de ».
  const recent = e !== undefined && Date.now() - e.debut < FENETRE_MS; // dans la fenêtre ?
  return recent && e.nombre >= MAX_ECHECS;           // vrai si le plafond (>=) est atteint
}

function noterEchec(adresse) {                       // enregistre un échec de plus
  const e = ECHECS.get(adresse);                     // son historique, s'il existe
  if (e === undefined || Date.now() - e.debut >= FENETRE_MS) {
    ECHECS.set(adresse, { nombre: 1, debut: Date.now() }); // set : nouvelle fenêtre
  } else {
    e.nombre += 1;                                   // += 1 : ajoute 1 au compteur
  }
}
```

**Partie 4 : le registre de ressources.** Deux ressources se déclarent : `articles` (protégée, deux méthodes) et `sante` (publique, une méthode).

```javascript
// ---------- Partie 4 : le registre de ressources ----------
const REGISTRE = new Map();                          // identifiant => ressource déclarée
// r.id lit la propriété id de l'objet r ; set(clé, valeur) ajoute une entrée au dictionnaire.
const declarer = (r) => REGISTRE.set(r.id, r);       // ajoute une ressource au registre
// [ ... ] est un tableau (une liste) ; { clé: valeur } est un objet.
const ARTICLES = [{ id: 1, titre: 'Premier article' }]; // données en mémoire (démo)

declarer({
  id: 'articles',                                    // identifiant stable de la ressource
  chemin: '/articles',                               // l'URL qui la désigne
  methodes: {                                        // méthode HTTP => règle
    // () => ARTICLES : fonction sans paramètre qui renvoie ARTICLES
    GET: { permission: 'lire', repondre: () => ARTICLES }, // lecture : permission « lire »
    POST: {
      permission: 'ecrire',                          // création : permission « ecrire »
      repondre: (corps) => {                         // corps : le JSON reçu
        const titre = String(corps.titre ?? '');     // String(x) force un texte
        const article = { id: ARTICLES.length + 1, titre }; // length : nombre d'éléments
        ARTICLES.push(article);                      // push ajoute l'article en fin de liste
        return article;                              // renvoie l'article créé
      },
    },
  },
});
declarer({
  id: 'sante',                                       // ressource d'état du service
  chemin: '/sante',                                  // son URL
  methodes: { GET: { permission: null, repondre: () => ({ etat: 'ok' }) } }, // publique
});
```

**Partie 5 : le serveur.** `controler` enchaîne les contrôles d'identité ; le gestionnaire principal cherche la ressource, la méthode, puis exécute la règle ; les codes de statut comme `404` (ressource introuvable) sont présentés dans [API et HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). Le format [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) sert pour les corps : `JSON.stringify` transforme un objet en texte JSON, `JSON.parse` fait l'inverse.

```javascript
// ---------- Partie 5 : le serveur ----------
// entetes = {} : valeur par défaut si omis ; ...entetes recopie ses propriétés.
function repondre(res, statut, corps, entetes = {}) { // écrit une réponse JSON
  res.writeHead(statut, { 'Content-Type': 'application/json', ...entetes }); // code, en-têtes
  res.end(JSON.stringify(corps));                    // end envoie le corps en texte JSON
}

// async : la fonction peut attendre (await) un résultat qui n'est pas encore arrivé,
// sans bloquer le programme ; for await lit le flux de la requête morceau par morceau.
// Piège : aucune limite de taille ici ; un vrai serveur refuse un corps trop gros.
async function lireCorps(req) {                      // lit le corps JSON d'une requête
  let texte = '';                                    // let : valeur modifiable (texte lu)
  for await (const morceau of req) texte += morceau; // lit le flux jusqu'au bout
  return texte === '' ? {} : JSON.parse(texte);      // texte vide : objet vide
}

function controler(req, res, regle) {                // renvoie true si la requête passe
  const adresse = req.socket.remoteAddress;          // adresse IP de l'appelant
  if (bloque(adresse)) {                             // trop d'échecs récents
    // 429 : trop de requêtes ; Retry-After : combien de secondes attendre
    repondre(res, 429, { erreur: 'trop de tentatives' }, { 'Retry-After': '60' });
    return false;
  }
  // Node écrit les noms d'en-têtes en minuscules : authorization est l'en-tête Authorization.
  const compte = authentifier(req.headers.authorization); // vérifie l'en-tête
  if (compte === null) {                             // absent ou invalide : le défi
    if (req.headers.authorization !== undefined) noterEchec(adresse); // vrai essai
    repondre(res, 401, { erreur: 'authentification requise' },
      { 'WWW-Authenticate': 'Basic realm="demo", charset="UTF-8"' });
    return false;
  }
  // includes : le tableau contient-il cette permission ? ! signifie « non ».
  if (!compte.permissions.includes(regle.permission)) { // identifié, mais pas autorisé
    repondre(res, 403, { erreur: 'permission manquante' });
    return false;
  }
  return true;                                       // identifié et autorisé
}

// createServer reçoit la fonction à appeler à chaque requête ; req est la requête reçue,
// res la réponse à écrire.
const serveur = http.createServer(async (req, res) => {
  // new URL(adresse, base) découpe une adresse ; pathname est son chemin, sans paramètres.
  const chemin = new URL(req.url, 'http://x').pathname;
  // res.on('finish', f) appelle f quand la réponse est envoyée ; console.log écrit une ligne
  // dans le terminal ; `...${x}...` (accents graves) insère la valeur de x dans le texte.
  res.on('finish', () => console.log(`${req.method} ${chemin} -> ${res.statusCode}`));
  // [...REGISTRE.values()] fabrique une liste des ressources ; find(f) renvoie le premier
  // élément pour lequel f est vraie, sinon undefined.
  const ressource = [...REGISTRE.values()].find((r) => r.chemin === chemin);
  // 404 : ressource introuvable
  if (ressource === undefined) return repondre(res, 404, { erreur: 'ressource inconnue' });
  const regle = ressource.methodes[req.method];      // la règle de cette méthode
  if (regle === undefined) {                         // méthode non déclarée
    // Object.keys liste les noms des propriétés ; join(', ') les assemble en un texte
    const permises = Object.keys(ressource.methodes).join(', ');
    return repondre(res, 405, { erreur: 'méthode refusée' }, { Allow: permises });
  }
  if (regle.permission !== null && !controler(req, res, regle)) return; // protégée
  // try { ... } catch { ... } : si une erreur survient dans try, le programme saute au catch
  try {
    const corps = req.method === 'POST' ? await lireCorps(req) : {}; // corps des écritures
    repondre(res, req.method === 'POST' ? 201 : 200, regle.repondre(corps));
  } catch {
    repondre(res, 400, { erreur: 'JSON invalide' }); // corps illisible
  }
});

serveur.listen(7312, '127.0.0.1');                   // port local uniquement
```

Le serveur se lance dans le premier terminal avec `timeout 100 node serveur-rest.mjs`, la commande `timeout` (livrée avec Linux) l'arrêtant seule au bout de cent secondes ; sans `timeout` (sous macOS par exemple), on lance `node serveur-rest.mjs` et on l'arrête avec Ctrl+C. Il journalise une ligne par requête (méthode, chemin, code de réponse) et **jamais** l'en-tête d'identité, un choix qui compte, on y revient.

## Le dialogue HTTP Basic, requête par requête

La méthode est décrite par la norme [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617) (une **RFC**, *Request for Comments*, est un document de référence qui définit un standard d'Internet). Le client utilisé est `curl`, le programme de terminal qui envoie des requêtes HTTP (voir la [documentation de curl](https://curl.se/docs/manpage.html)). Dans les blocs qui suivent, le `$` en début de ligne est l'invite du terminal : il se lit mais ne se tape pas, et les lignes sans `$` sont la réponse affichée. Les lignes `Date`, `Connection`, `Keep-Alive` et `Transfer-Encoding`, sans intérêt ici, ont été retirées des sorties recopiées.

| Option de `curl` | Effet |
|---|---|
| `-i` | Affiche les en-têtes de la réponse avant son contenu |
| `-s` | Silencieux : supprime la barre de progression |
| `-u identifiant:motdepasse` | Fournit les identifiants (curl fabrique l'en-tête `Authorization`) |

D'autres options sont expliquées là où elles servent pour la première fois (`-v`, `-o`, `-X`, `-d`, `-w`, `--anyauth`, `--netrc-file`).

```
Client                                         Serveur
  |  GET /articles                                |
  | --------------------------------------------> |  pas d'en-tête Authorization
  |  401 Unauthorized                             |
  |  WWW-Authenticate: Basic realm="demo"         |  le défi : « prouvez votre identité »
  | <-------------------------------------------- |
  |  GET /articles                                |
  |  Authorization: Basic YWxpY2U6bGVj...         |  identifiant:mot de passe en Base64
  | --------------------------------------------> |
  |  200 OK  + représentation                     |  identité vérifiée, permission présente
  | <-------------------------------------------- |
```

**Sans identifiants.** La requête ne porte pas d'en-tête `Authorization` :

```
$ curl -i http://127.0.0.1:7312/articles
HTTP/1.1 401 Unauthorized
Content-Type: application/json
WWW-Authenticate: Basic realm="demo", charset="UTF-8"

{"erreur":"authentification requise"}
```

Le code `401` est la réponse « je ne sais pas qui vous êtes ». L'en-tête `WWW-Authenticate` est le **défi** : il nomme la méthode attendue (`Basic`), le `realm` (le nom de la zone protégée, que le navigateur affiche dans sa fenêtre de connexion) et le jeu de caractères des identifiants (`UTF-8`, la norme qui encode les lettres accentuées, voir [l'encodage des textes](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)).

**Avec un mauvais mot de passe.**

```
$ curl -i -u alice:faux http://127.0.0.1:7312/articles
HTTP/1.1 401 Unauthorized
Content-Type: application/json
WWW-Authenticate: Basic realm="demo", charset="UTF-8"

{"erreur":"authentification requise"}
```

La réponse est **identique** à la précédente, et c'est voulu : elle ne dit pas si l'identifiant existe, si le mot de passe est faux ou si l'en-tête est mal formé. Un message plus bavard (« mot de passe incorrect pour alice ») confirmerait à un attaquant que `alice` est un compte réel : c'est l'**énumération de comptes**, qui consiste à dresser la liste des identifiants valides pour concentrer ensuite les attaques dessus.

**Avec les bons identifiants.**

```
$ curl -i -u alice:lecture-ok http://127.0.0.1:7312/articles
HTTP/1.1 200 OK
Content-Type: application/json

[{"id":1,"titre":"Premier article"}]
```

Voici l'anatomie de l'en-tête que `curl` vient d'envoyer :

| Étape | Résultat pour `alice` et `lecture-ok` |
|---|---|
| 1. Assembler `identifiant:mot de passe` avec deux-points | `alice:lecture-ok` |
| 2. Encoder ce texte en octets (UTF-8) puis en Base64 | `YWxpY2U6bGVjdHVyZS1vaw==` |
| 3. Préfixer par le mot `Basic` et une espace | `Basic YWxpY2U6bGVjdHVyZS1vaw==` |
| 4. Placer le tout dans l'en-tête `Authorization` | `Authorization: Basic YWxpY2U6bGVjdHVyZS1vaw==` |

Le premier deux-points sépare l'identifiant du mot de passe, d'où une règle de la norme : **un identifiant ne peut pas contenir de deux-points**, alors qu'un mot de passe le peut. C'est la raison de `decode.indexOf(':')` dans la partie 2, qui coupe au premier deux-points seulement.

### Qui envoie l'en-tête, et quand

Dans la sortie ci-dessus, `curl -u` a envoyé l'en-tête **d'emblée**, sans attendre le défi. Un navigateur, lui, ne connaît pas encore les identifiants : il envoie une requête nue, reçoit le `401` et son `WWW-Authenticate`, affiche sa fenêtre de connexion, puis renvoie la requête avec l'en-tête. L'option `--anyauth` de `curl` reproduit ce comportement. Pour voir les échanges, on ajoute `-v` (*verbose*, « bavard » : affiche chaque ligne envoyée et reçue ; `-sv` regroupe `-s` et `-v`) et `-o /dev/null` (`-o` écrit le contenu de la réponse dans un fichier, et `/dev/null` est le fichier-poubelle de Linux qui jette tout, pour ne garder que la trace). La trace montre les deux allers-retours :

```
$ curl -sv --anyauth -u bruno:ecriture-ok http://127.0.0.1:7312/articles -o /dev/null
> GET /articles HTTP/1.1
< HTTP/1.1 401 Unauthorized
< WWW-Authenticate: Basic realm="demo", charset="UTF-8"
> GET /articles HTTP/1.1
> Authorization: Basic YnJ1bm86ZWNyaXR1cmUtb2s=
< HTTP/1.1 200 OK
```

(Les lignes commençant par `>` sont envoyées par le client, celles en `<` reçues. Seules les lignes utiles ont été gardées.)

| Client | Premier envoi | Conséquence |
|---|---|---|
| `curl -u` | Avec l'en-tête `Authorization` | Un seul aller-retour, mais le mot de passe part même vers un serveur qui n'en demandait pas |
| `curl --anyauth`, navigateur | Sans en-tête, puis renvoi après le `401` | Deux allers-retours, le mot de passe ne part que si le serveur le réclame |

## Base64 n'est pas du chiffrement

Le chapitre sur [l'authentification et l'autorisation](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation) l'affirme ; voici la preuve. **Base64** est une façon d'écrire des octets avec seulement 64 caractères sûrs (les lettres, les chiffres, `+` et `/`), pour qu'ils traversent sans dommage des protocoles faits pour du texte. Trois octets deviennent quatre caractères ; un ou deux `=` en fin de texte complètent le dernier groupe (le **bourrage**). Il n'y a ni clé, ni secret, ni calcul difficile : c'est une table de correspondance.

Ce qu'un observateur voit passer, en rejouant la requête avec `curl -v` :

```
$ curl -sv -u alice:lecture-ok http://127.0.0.1:7312/articles -o /dev/null
> GET /articles HTTP/1.1
> Authorization: Basic YWxpY2U6bGVjdHVyZS1vaw==
```

Et ce qu'il fait ensuite, sans aucune clé, avec la commande `base64` (livrée avec Linux ; `-d` signifie *decode*, décoder). `echo 'texte'` affiche le texte ; `printf` fait de même sans ajouter de retour à la ligne final, qui changerait le Base64 ; le **tube** `|` envoie ce que la commande de gauche affiche à la commande de droite (voir [les redirections et pipes](/?c=langages&s=bash&p=redirections-et-pipes)) :

```
$ echo 'YWxpY2U6bGVjdHVyZS1vaw==' | base64 -d
alice:lecture-ok
$ printf 'alice:lecture-ok' | base64
YWxpY2U6bGVjdHVyZS1vaw==
```

L'identifiant **et** le mot de passe apparaissent en clair, et le chemin inverse redonne exactement le texte transmis. Le même décodage s'écrit en Node avec `Buffer.from(texte, 'base64').toString('utf8')`, ce que fait la ligne `Buffer.from(trouve[1], 'base64')` de la partie 2 : le serveur lui-même n'a besoin d'aucun secret pour lire l'en-tête, donc n'importe qui non plus.

| | Encodage (Base64) | Hachage | Chiffrement |
|---|---|---|---|
| Réversible ? | Oui, par n'importe qui | Non | Oui, avec la clé seulement |
| Clé ou secret ? | Aucun | Aucun (parfois un sel) | Oui |
| But | Faire passer des octets dans du texte | Vérifier ou comparer sans stocker la donnée | Rendre illisible pour qui n'a pas la clé |
| Protège un mot de passe en transit ? | **Non** | Non (le serveur doit recevoir le mot de passe) | Oui, c'est le rôle de TLS |

La distinction hachage / chiffrement est développée dans [Cryptographie appliquée](/?c=securite&s=cybersecurite&p=cryptographie-appliquee).

### La seule protection : HTTPS

**HTTPS** est HTTP à l'intérieur d'un tunnel chiffré par **TLS** (*Transport Layer Security*, le protocole qui chiffre la connexion entre le client et le serveur ; voir [le certificat TLS](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)). Avec HTTPS, l'en-tête `Authorization` est chiffré avec le reste de la requête. Le **certificat** est la carte d'identité numérique du serveur, que le client vérifie : sans cette vérification, un intermédiaire peut se faire passer pour le serveur et lire ce que le client lui envoie.

```
HTTP (port 80)                                  HTTPS (port 443)

Client -- Authorization: Basic YWxp... -->      Client -- octets illisibles (TLS) -->
          ^                                               ^
   lisible par chaque machine du trajet            seul le serveur peut les lire
   (Wi-Fi public, routeur, proxy...)               (si le certificat est vérifié)
```

> **Piège :** rediriger `http://` vers `https://` en croyant le problème réglé. Un client comme `curl -u` envoie l'en-tête dès la **première** requête, donc en clair, avant même de lire la redirection. Le mot de passe a déjà voyagé.
>
> **Bonne pratique :** ne pas écouter du tout en HTTP sur une API qui accepte Basic (ou refuser toute requête qui porte un `Authorization` hors TLS), et considérer comme compromis un mot de passe qui a un jour circulé sans TLS.

Le serveur d'exemple écoute en HTTP simple parce qu'il ne répond que sur `127.0.0.1` (votre propre machine), où rien ne circule sur un réseau : c'est un compromis de démonstration, jamais un modèle de déploiement.

## Les limites propres à HTTP Basic

Ces limites ne sont pas des défauts d'une implémentation : elles découlent du principe de Basic.

| Limite | Pourquoi | Conséquence concrète |
|---|---|---|
| Pas de déconnexion | Le serveur ne garde aucune session à fermer ; le client renvoie les identifiants tant qu'il les connaît | Fermer un onglet ne suffit pas toujours, et le serveur ne peut pas « expulser » un client sans changer le mot de passe |
| Identifiants renvoyés à **chaque** requête | Serveur sans état : l'identité accompagne chaque envoi | Chaque requête est une occasion de fuite, et chaque requête relance un calcul de vérification |
| Aucune expiration | Le mot de passe vaut tant qu'on ne le change pas | Un identifiant volé reste utilisable des mois |
| Secret principal exposé | C'est le vrai mot de passe du compte qui voyage, pas un jeton jetable | Une fuite compromet aussi les autres usages du compte |
| Aucun second facteur | Un seul secret, envoyé en un seul message | Impossible d'exiger un code temporaire (voir [l'authentification multifacteur](/?c=securite&s=renforcer-lauthentification&p=authentification-multifacteur)) |
| Traces involontaires | L'en-tête peut être copié par des outils intermédiaires | Voir le schéma ci-dessous |

```
 Poste du développeur            Réseau                    Serveur
+--------------------+     +----------------+     +----------------------+
| historique shell   |     | proxy, pare-   |     | journal d'accès      |
| (curl -u a:mdp)    | --> | feu d'entre-   | --> | (si l'en-tête y est  |
| outil de débogage  |     | prise qui      |     | copié), outil de     |
| capture d'écran    |     | journalise     |     | surveillance, copie  |
+--------------------+     +----------------+     | de sauvegarde        |
                                                  +----------------------+
 Chaque case peut garder une copie du mot de passe.
```

Un **proxy** est un serveur intermédiaire par lequel passent les requêtes (souvent dans une entreprise), un **pare-feu** un dispositif qui filtre le trafic réseau ; un **journal** (*log*) est le fichier où un programme note ce qui s'est passé, voir [les journaux centralisés](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs). Le serveur d'exemple n'écrit que `GET /articles -> 401` : il n'y a rien à fuir. Un serveur configuré pour copier tous les en-têtes dans ses journaux, lui, y dépose des mots de passe valides.

Le terminal est le cas le plus négligé : taper `curl -u alice:lecture-ok ...` écrit le mot de passe dans l'historique des commandes, et le laisse aussi visible un instant dans la liste des programmes en cours (la commande `ps` l'affiche, avec les arguments de chacun). Un fichier d'identifiants lu par `curl` évite les deux. Son format est celui des fichiers **netrc** (voir l'option [`--netrc-file`](https://curl.se/docs/manpage.html#--netrc-file) de curl) : `machine` est le nom ou l'adresse du serveur concerné, `login` l'identifiant et `password` le mot de passe. On crée ce fichier avec un éditeur de texte (le créer avec `echo` remettrait le mot de passe dans l'historique) :

```
$ cat netrc-demo
machine 127.0.0.1 login alice password lecture-ok
$ chmod 600 netrc-demo
$ curl -si --netrc-file netrc-demo http://127.0.0.1:7312/articles | head -1
HTTP/1.1 200 OK
```

`cat` affiche le contenu d'un fichier. `chmod 600` réserve le fichier à son propriétaire (voir [les permissions de fichiers](/?c=langages&s=bash&p=permissions-et-fichiers)). `head -1` ne garde que la première ligne de la réponse, ici la ligne de statut (voir [les commandes de base](/?c=langages&s=bash&p=commandes-de-base) et [les pipes](/?c=langages&s=bash&p=redirections-et-pipes)). Pour un vrai déploiement, le secret ne reste dans aucun fichier du dépôt : voir [la gestion des secrets](/?c=securite&s=cybersecurite&p=gestion-des-secrets).

## Authentification et autorisation : deux contrôles distincts

Le serveur enchaîne ses vérifications dans un ordre précis, que la fonction `controler` de la partie 5 matérialise :

```
requête
   |
   v
ressource connue ?  -- non --> 404 Not Found (introuvable)
   |
   v
méthode déclarée ?  -- non --> 405 Method Not Allowed (+ Allow)
   |
   v
ressource protégée ? -- non --> exécuter
   |
   v
trop d'échecs récents ?  -- oui --> 429 Too Many Requests (+ Retry-After)
   |
   v
identité valide ?   -- non --> 401 Unauthorized (+ WWW-Authenticate)
   |
   v
permission présente ? -- non --> 403 Forbidden
   |
   v
exécuter la règle -> 200 ou 201
```

Les réponses réelles à quatre cas : `alice` (permission `lire` seulement) tente d'écrire, `bruno` (permission `ecrire`) écrit, `bruno` essaie une méthode non déclarée, et un appel sans identifiants vise la ressource publique `/sante`. Nouvelles options de `curl` : `-X METHODE` choisit la méthode HTTP, `-d 'texte'` fournit le corps de la requête. Dans le shell, une `\` en fin de ligne dit que la commande continue sur la ligne suivante, où le terminal affiche alors l'invite `>` (à ne pas taper).

```
$ curl -i -u alice:lecture-ok -X POST -d '{"titre":"Intrus"}' http://127.0.0.1:7312/articles
HTTP/1.1 403 Forbidden
Content-Type: application/json

{"erreur":"permission manquante"}

$ curl -i -u bruno:ecriture-ok -X POST -d '{"titre":"Deuxième article"}' \
>   http://127.0.0.1:7312/articles
HTTP/1.1 201 Created
Content-Type: application/json

{"id":2,"titre":"Deuxième article"}

$ curl -i -u bruno:ecriture-ok -X DELETE http://127.0.0.1:7312/articles
HTTP/1.1 405 Method Not Allowed
Content-Type: application/json
Allow: GET, POST

{"erreur":"méthode refusée"}

$ curl -i http://127.0.0.1:7312/sante
HTTP/1.1 200 OK
Content-Type: application/json

{"etat":"ok"}
```

`alice` est parfaitement authentifiée dans le premier cas (son mot de passe est bon) et pourtant refusée : le `403` signale que le serveur sait qui elle est et lui refuse ce geste. Même avec les droits les plus larges, `bruno` ne peut pas appeler une méthode que la ressource ne déclare pas. Enfin, `/sante` déclare `permission: null` : la ressource est **publique** par un choix écrit noir sur blanc, pas par oubli.

| Code | Question à laquelle il répond | Se corrige en... |
|---|---|---|
| `401` | Qui êtes-vous ? | Fournissant des identifiants valides |
| `403` | Avez-vous le droit de faire ceci ? | Changeant les permissions, jamais le mot de passe |
| `405` | Cette méthode existe-t-elle sur cette ressource ? | Utilisant une méthode de la liste `Allow` |
| `429` | Avez-vous réessayé trop souvent ? | Attendant la durée de `Retry-After` |

Pour regrouper les permissions en profils, voir [RBAC et ABAC](/?c=securite&s=fondamentaux&p=rbac-et-abac). Un point à choisir consciemment : dans cet exemple, les contrôles `404` et `405` passent avant l'authentification, donc un inconnu apprend quelles adresses et quelles méthodes existent. Pour une API où cette information est elle-même sensible, on authentifie d'abord et on répond `401` partout.

## Comparer les secrets en temps constant

Comparer le mot de passe reçu à celui qu'on attend semble trivial : `recu === attendu`. Or l'opérateur d'égalité d'un langage s'arrête **à la première différence**. Plus les deux textes se ressemblent au début, plus la comparaison dure longtemps. Le petit programme suivant compte les caractères examinés par une comparaison classique :

Fichier `comparaison.mjs` (à enregistrer dans le même dossier, puis à lancer avec `node comparaison.mjs`) :

```javascript
import { timingSafeEqual } from 'node:crypto';          // comparaison à temps constant

// Math.min(x, y) est le plus petit des deux nombres ; a[i] est le caractère de rang i
// (le premier a le rang 0) ; a.length est le nombre de caractères du texte a.
function comparerNaif(a, b) {                           // comparaison « classique »
  let comparees = 0;                                    // caractères examinés jusqu'ici
  // for (départ; condition; pas) répète tant que la condition est vraie ; i++ ajoute 1 à i
  for (let i = 0; i < Math.min(a.length, b.length); i++) { // du premier au dernier
    comparees += 1;                                     // un caractère de plus examiné
    if (a[i] !== b[i]) return { egal: false, comparees }; // arrêt à la première différence
  }
  return { egal: a.length === b.length, comparees };    // tout identique : même longueur ?
}

const secret = 'lecture-ok';                            // le secret à deviner
// for (const x of liste) répète le bloc pour chaque élément de la liste
for (const essai of ['xxxxxxxxxx', 'lxxxxxxxxx', 'lecturexxx', 'lecture-ok']) {
  const r = comparerNaif(essai, secret);                // résultat de la comparaison naïve
  console.log(essai, '->', r.egal, '| caractères examinés :', r.comparees);
}

// try { ... } catch (erreur) { ... } : si try lève une erreur, catch la reçoit
try {
  timingSafeEqual(Buffer.from('abcd'), Buffer.from(secret)); // 4 octets contre 10
} catch (erreur) {
  console.log(erreur.code);                             // la fonction refuse de comparer
}
```

Résultat obtenu à l'exécution (les quatre premières lignes pour la comparaison classique, la dernière pour `timingSafeEqual`) :

```
$ node comparaison.mjs
xxxxxxxxxx -> false | caractères examinés : 1
lxxxxxxxxx -> false | caractères examinés : 2
lecturexxx -> false | caractères examinés : 8
lecture-ok -> true | caractères examinés : 10
ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH
```

La durée de la comparaison **raconte** la longueur du préfixe exact. Une **attaque par chronométrage** (*timing attack*) exploite cela : l'attaquant envoie un très grand nombre d'essais, mesure les temps de réponse, et découvre le secret caractère par caractère. À travers un réseau, la mesure est bruitée et l'attaque demande beaucoup d'essais ; elle devient réaliste sur un réseau local ou avec assez de répétitions, et la parade ne coûte presque rien, donc on l'applique toujours.

| Langage | Comparaison à temps constant | Précaution |
|---|---|---|
| Node.js | `crypto.timingSafeEqual(a, b)` (voir la [documentation de Node](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b)) | Exige deux `Buffer` de **même taille**, sinon elle lève une erreur |
| PHP | [`hash_equals($attendu, $recu)`](https://www.php.net/manual/fr/function.hash-equals.php) | Mettre la valeur de confiance en premier argument |
| Python | [`hmac.compare_digest(a, b)`](https://docs.python.org/3/library/hmac.html#hmac.compare_digest) | Deux textes ou deux suites d'octets du même type ; pour des textes, la documentation les limite aux caractères ASCII (lettres sans accent, chiffres, ponctuation de base) |

Le même réflexe sert pour les signatures de [webhooks](/?c=securite&s=cybersecurite&p=securite-des-webhooks) et de [HMAC](/?c=securite&s=cybersecurite&p=cryptographie-appliquee).

Le piège propre à `timingSafeEqual` est son exigence de taille : comparer un mot de passe de 4 caractères à un secret de 10 lève une erreur (la dernière ligne ci-dessus, `ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH`), et cette erreur trahit la longueur du secret.

La parade, appliquée en partie 2 : on ne compare **jamais les mots de passe eux-mêmes**, mais leurs empreintes `scrypt`, toujours de 32 octets. L'attaquant ne maîtrise pas le début de l'empreinte (un caractère de plus dans son essai change toute l'empreinte), si bien que même une comparaison naïve ne lui apprendrait rien ; `timingSafeEqual` ajoute une garantie de plus.

Deuxième détail de la partie 2 : quand l'identifiant est inconnu, le serveur calcule **quand même** une empreinte, contre un `COMPTE_FACTICE`. Sans cela, un identifiant inexistant serait refusé instantanément et un identifiant réel après un calcul lent, ce qui permettrait l'énumération de comptes en mesurant les temps. Cette lenteur voulue de `scrypt` a un coût : chaque tentative consomme du processeur, ce qui nourrit les [attaques par surcharge](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif). C'est pour cela que le contrôle du nombre d'échecs passe **avant** le calcul.

## Limiter les tentatives

Un attaquant qui peut essayer un mot de passe par milliseconde en essaiera des millions : c'est la **force brute** (*brute force*), l'essai méthodique d'un très grand nombre de valeurs jusqu'à tomber juste. Le serveur compte donc les échecs par adresse IP (partie 3) et, au-delà de trois dans une fenêtre de soixante secondes, répond `429 Too Many Requests` (« trop de requêtes ») avec un en-tête `Retry-After: 60` (« réessayez dans soixante secondes »). Trois essais erronés d'affilée, puis le **bon** mot de passe. La première commande est une [boucle](/?c=langages&s=bash&p=boucles) : `for i in 1 2 3; do ...; done` répète ce qui se trouve entre `do` et `done` en donnant à `i` les valeurs 1, 2 puis 3, et `$i` insère cette valeur. L'option `-w "essai $i : %{http_code}\n"` demande à `curl` d'afficher, après la réponse, ce texte où `%{http_code}` est remplacé par le code de statut et `\n` est un retour à la ligne ; `-o /dev/null` jette le contenu de la réponse.

```
$ for i in 1 2 3; do curl -s -o /dev/null -w "essai $i : %{http_code}\n" \
>   -u alice:faux$i http://127.0.0.1:7312/articles; done
essai 1 : 401
essai 2 : 401
essai 3 : 429

$ curl -i -u alice:lecture-ok http://127.0.0.1:7312/articles
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60

{"erreur":"trop de tentatives"}
```

(Un premier essai erroné avait déjà été compté plus haut dans la session : le compteur arrive donc à trois dès le deuxième essai de la rafale, et le troisième est refusé avant toute vérification. Les requêtes **sans** en-tête `Authorization`, premier échange normal du défi, ne comptent pas.) Même le bon mot de passe reste refusé tant que la fenêtre n'est pas écoulée : c'est la règle, et c'est ce qui rend les essais massifs de mots de passe impraticables.

| Clé du compteur | Protège contre | Risque |
|---|---|---|
| Par adresse IP | Un attaquant qui essaie beaucoup de comptes depuis une machine | Plusieurs utilisateurs derrière la même adresse (une entreprise) se bloquent mutuellement ; un attaquant qui change d'adresse contourne |
| Par compte | Un attaquant qui vise un compte depuis beaucoup d'adresses | Il peut **bloquer volontairement** un compte légitime en échouant exprès : c'est un **déni de service** (rendre un service inutilisable pour les autres, voir [surcharge et déni de service](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)) |
| Les deux, avec des plafonds différents | Les deux scénarios | Plus de règles à régler et à surveiller |

Quatre pièges propres à cette implémentation, tous réels en production :

| Piège | Pourquoi | Parade |
|---|---|---|
| Serveur placé derrière un proxy inverse (un serveur frontal qui reçoit les requêtes à sa place et les lui transmet) | `remoteAddress` est alors l'adresse du proxy, pour tous les clients : tout le monde partage un seul compteur | Lire l'adresse d'origine que le proxy transmet dans l'en-tête [`X-Forwarded-For`](https://developer.mozilla.org/fr/docs/Web/HTTP/Reference/Headers/X-Forwarded-For), et seulement si le proxy est de confiance (sinon n'importe quel client peut écrire l'adresse de son choix) |
| Compteur gardé en mémoire du processus | Perdu à chaque redémarrage, et propre à chaque instance si plusieurs tournent | Un stockage partagé : une base de données, ou un **cache** (une mémoire rapide qui garde des données déjà obtenues) |
| Compteur qui ne se vide jamais | Il bloque durablement un utilisateur légitime | Une fenêtre, comme ici, ou un délai qui grandit |
| Compteur tenu côté client | Le client peut simplement l'ignorer | Toujours côté serveur, voir [la sécurité des API web](/?c=securite&s=cybersecurite&p=securite-api-web) |

## Les alternatives à HTTP Basic

| Mécanisme | Ce qui voyage à chaque requête | Expire ? | Révocable seul ? | Convient pour | Chapitre |
|---|---|---|---|---|---|
| HTTP Basic | Identifiant et **mot de passe** | Non | Non (il faut changer le mot de passe) | Script interne, outil d'administration, derrière HTTPS | Ce chapitre |
| Clé d'API | Une longue valeur secrète liée à un compte ou à une application | Rarement | Oui, on supprime la clé | Un service tiers, un accès serveur à serveur | [Sécurité des API web](/?c=securite&s=cybersecurite&p=securite-api-web) |
| Session et cookie | Un identifiant de session choisi par le serveur | Oui | Oui, le serveur oublie la session | Un utilisateur humain dans un navigateur | [Sessions et cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies) |
| Jeton signé (JWT) | Un jeton qui contient ses propres informations | Oui | Difficilement avant l'expiration | Une API consommée par une application | [JWT et tokens](/?c=securite&s=sessions-et-tokens&p=jwt-et-tokens) |
| OAuth 2.0 | Un jeton d'accès délivré par un serveur d'autorisation | Oui | Oui | Donner un accès limité à une application tierce sans partager le mot de passe | [OAuth 2.0 et OpenID Connect](/?c=securite&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) |
| Signature HMAC | Une signature calculée avec un secret partagé | Avec un horodatage (la date et l'heure sont incluses dans la signature) | Oui, on change le secret | Un appel d'un système vers un autre, comme un webhook | [Sécurité des webhooks](/?c=securite&s=cybersecurite&p=securite-des-webhooks) |

| Situation | Choix raisonnable |
|---|---|
| Un script de sauvegarde interne appelle une API d'administration en HTTPS | Basic avec un compte **dédié**, aux permissions minimales, et un mot de passe long tiré au hasard (voir [l'aléatoire](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs)) |
| Une application mobile appelle l'API au nom d'un utilisateur | Jeton à durée limitée, jamais le mot de passe de l'utilisateur dans chaque requête |
| Un site tiers doit lire des données d'un utilisateur | OAuth 2.0 |
| Un partenaire envoie des événements automatiques | Signature HMAC |

## Exemple dans Drupal : le module REST et le fournisseur `basic_auth`

> **Cet exemple est propre à Drupal, et sa forme dépend de la version.** [Drupal](https://www.drupal.org) est un système de gestion de contenu écrit en [PHP](/?c=langages&s=php&p=php) (un logiciel qui permet de construire et d'administrer un site web). Il n'est pas installé dans l'environnement qui a servi à écrire ce chapitre : le code PHP ci-dessous n'a donc pas été exécuté, seulement contrôlé pour sa syntaxe (avec `php -l`, la commande de PHP qui vérifie un fichier sans l'exécuter). Les noms propres à Drupal ont été confrontés à sa documentation officielle ([api.drupal.org](https://api.drupal.org), branche 11.x, et [drupal.org](https://www.drupal.org/docs/drupal-apis/restful-web-services-api)). Le plus sensible aux versions est la façon de déclarer le plugin : un **attribut** PHP `#[RestResource]` dans les versions récentes (la documentation d'API de Drupal 10.3 et 11 le présente), une **annotation** `@RestResource` dans les versions plus anciennes (Drupal 8 à 10). Vérifiez la version de votre site avant de copier. Le reste du chapitre n'en dépend pas.

Drupal propose les mêmes briques, sous d'autres noms. Une ressource y est un **plugin** (voir [l'architecture à plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins), qui cite justement les ressources d'API parmi les types de plugins de ce logiciel) dont l'étiquette est l'attribut `#[RestResource]` posé juste au-dessus de la classe.

| Concept du chapitre | Élément Drupal |
|---|---|
| Le registre de ressources | Le gestionnaire de plugins des ressources REST, alimenté par les classes du dossier `Plugin/rest/resource` d'un module |
| La déclaration d'une ressource | Une classe qui étend `ResourceBase`, étiquetée par l'attribut `#[RestResource(id, label, uri_paths)]` (ou, avant, par l'annotation `@RestResource(...)`) |
| Les méthodes `GET` et `POST` | Les méthodes PHP `get()` et `post()` de la classe (de même `patch()` et `delete()`) |
| Les méthodes et formats activés, l'authentification acceptée | Une configuration `rest.resource.<identifiant>` qui liste `methods`, `formats` et `authentication` ; sans elle, la ressource n'est pas disponible |
| Le fournisseur d'authentification Basic | Le module `basic_auth`, référencé par l'identifiant `basic_auth` |
| Les permissions par méthode | Des permissions que `ResourceBase` génère pour chaque méthode, sous la forme `restful get exemple_articles`, à attribuer aux rôles |

```php
<?php

namespace Drupal\exemple_api\Plugin\rest\resource;

use Drupal\Core\StringTranslation\TranslatableMarkup; // un texte traduisible
use Drupal\rest\Attribute\RestResource;   // l'attribut qui déclare la ressource
use Drupal\rest\Plugin\ResourceBase;      // classe mère des ressources REST
use Drupal\rest\ResourceResponse;         // la réponse renvoyée par une ressource

/**
 * Expose une liste d'articles d'exemple.
 */
#[RestResource(
  id: 'exemple_articles',
  label: new TranslatableMarkup("Articles d'exemple"),
  uri_paths: [
    'canonical' => '/api/exemple/articles',
    'create' => '/api/exemple/articles',
  ],
)]
class ArticlesResource extends ResourceBase {

  /**
   * Répond à GET : renvoie la liste.
   */
  public function get(): ResourceResponse {
    $articles = [['id' => 1, 'titre' => 'Premier article']];  // données d'exemple
    return new ResourceResponse($articles);                   // 200 et la liste en JSON
  }

  /**
   * Répond à POST : crée un article.
   */
  public function post(array $donnees): ResourceResponse {
    // ?? : la valeur de gauche, sauf si elle est absente ; (string) force un texte
    $titre = (string) ($donnees['titre'] ?? '');              // lit le titre reçu
    return new ResourceResponse(['id' => 2, 'titre' => $titre], 201); // 201 : créé
  }

}
```

Un **attribut** PHP est une ligne spéciale `#[...]`, placée juste avant la classe, que le gestionnaire de plugins lit pour découvrir la ressource : `id` la nomme, `label` donne son nom lisible, `uri_paths` associe la ressource à ses adresses (`canonical` pour un élément, `create` pour la création). `namespace` range la classe dans un espace de noms, `use` importe une classe d'un autre espace, et `extends` la fait hériter de `ResourceBase`, voir [la programmation orientée objet en PHP](/?c=langages&s=php&p=poo). Dans une version plus ancienne de Drupal, la même déclaration s'écrit avec une **annotation**, un commentaire spécial au-dessus de la classe, sans le `use` de `RestResource` ni celui de `TranslatableMarkup` (celui-ci devient `@Translation`) :

```php
/**
 * Expose une liste d'articles d'exemple.
 *
 * @RestResource(
 *   id = "exemple_articles",
 *   label = @Translation("Articles d'exemple"),
 *   uri_paths = {
 *     "canonical" = "/api/exemple/articles",
 *     "create" = "/api/exemple/articles"
 *   }
 * )
 */
```

La seconde pièce active la ressource et choisit son authentification. C'est un fichier de configuration au format [YAML](/?c=infrastructure-devops&s=docker&p=docker-compose) (un format de texte à base d'indentation), de la même structure que la configuration de la ressource `entity.node` fournie avec le module REST de Drupal :

```yaml
id: exemple_articles          # identifiant de la configuration
plugin_id: exemple_articles   # le plugin de ressource qu'elle active
status: true                  # la ressource est activée
granularity: resource         # un réglage pour toute la ressource (non par méthode)
configuration:
  methods:                    # liste blanche des méthodes activées
    - GET
    - POST
  formats:                    # représentations acceptées
    - json
  authentication:             # fournisseurs d'authentification acceptés
    - basic_auth
```

Trois remarques de prudence. D'abord, cette configuration ne vaut que si le module `basic_auth` est activé. Ensuite, le fournisseur `basic_auth` de Drupal applique déjà sa propre limitation des essais ratés (le service « flood », réglé par la configuration `user.flood` : plafonds et durées par adresse IP et par compte, dans le code de la branche 11.x) : avant d'écrire à la main la limitation vue plus haut, vérifier ces réglages. Enfin, le format de la réponse se choisit dans l'adresse : la documentation de Drupal indique que l'en-tête `Accept` n'est plus pris en charge et qu'il faut toujours le paramètre `_format`, d'où un appel du type `curl -u identifiant:motdepasse 'https://exemple.test/api/exemple/articles?_format=json'` (`exemple.test` est un nom d'exemple), avec exactement les mêmes limites que plus haut : Base64 transparent, HTTPS obligatoire, mot de passe du compte à chaque requête. Pour la documentation officielle, voir [l'API des services web RESTful de Drupal](https://www.drupal.org/docs/drupal-apis/restful-web-services-api).

## Les pièges

| Piège | Pourquoi c'est un problème | Réflexe |
|---|---|---|
| Croire que Base64 protège les identifiants | N'importe qui le décode en une commande, sans clé | HTTPS obligatoire, jamais Basic en clair |
| Rediriger `http://` vers `https://` | Le premier envoi a déjà exposé le mot de passe | Ne pas écouter en HTTP, ou refuser tout `Authorization` hors TLS |
| Comparer le secret avec `===` ou `==` | La durée de la comparaison révèle le préfixe exact | `timingSafeEqual`, `hash_equals` ou `compare_digest` |
| `timingSafeEqual` sur des tailles différentes | L'erreur levée révèle la longueur | Comparer des empreintes de taille fixe |
| Message d'erreur qui précise « mot de passe incorrect » ou « compte inconnu » | Permet de dresser la liste des comptes valides | Une seule réponse `401` pour tous les échecs |
| Identifiant inconnu refusé sans calcul | La différence de durée révèle les comptes réels | Calculer une empreinte factice dans ce cas |
| Copier l'en-tête `Authorization` dans les journaux | Des mots de passe valides dans des fichiers lus par beaucoup de monde | Journaliser méthode, chemin et code, jamais l'en-tête |
| `curl -u identifiant:motdepasse` tapé dans le terminal | Le mot de passe reste dans l'historique de commandes et peut apparaître dans la liste des processus | `--netrc-file`, ou `-u identifiant` seul qui demande le mot de passe |
| Mot de passe dans l'adresse (`https://id:mdp@hôte/`) | L'adresse se retrouve dans l'historique, les journaux et les liens | Toujours l'en-tête, jamais l'adresse |
| Compteur d'échecs côté client ou en mémoire d'une seule instance | Contournable, perdu au redémarrage | Compteur côté serveur, dans un stockage partagé |
| Verrouiller un compte après trois échecs | Un attaquant bloque exprès un utilisateur légitime | Un délai croissant plutôt qu'un verrou définitif |
| Ressource déclarée sans permission, donc ouverte à tous | Une API entière publique par oubli | Refus par défaut : exiger une permission explicite, `null` seulement pour le public voulu |
| Autoriser toutes les méthodes sur une ressource | `DELETE` ou `PATCH` ouverts alors que personne n'en a besoin | Liste blanche des méthodes par ressource |
| Utiliser un compte administrateur pour un script | La fuite donne tous les droits | Un compte dédié, aux permissions minimales |

## Bonnes pratiques

| Pratique | Raison |
|---|---|
| HTTPS partout où Basic est accepté | Seule protection réelle de l'en-tête `Authorization` |
| Déclarer chaque ressource dans un registre, avec ses méthodes et ses permissions | Surface d'attaque connue et lisible, ajout sans toucher au code central |
| Une permission par méthode, refus par défaut | Le contrôle d'accès ne dépend pas d'un oubli |
| Ne jamais stocker un mot de passe lisible : sel aléatoire et hachage lent | Une base volée ne livre pas les mots de passe |
| Comparer des empreintes de taille fixe à temps constant | Aucune fuite par la durée ni par la taille |
| Même réponse et même coût pour compte inconnu et mot de passe faux | Pas d'énumération de comptes |
| Limiter les essais côté serveur, avant le calcul coûteux | Protège le secret et le processeur |
| Répondre `401` avec `WWW-Authenticate`, `403` pour un droit manquant, `405` avec `Allow` | Le client comprend quelle partie échoue |
| Journaliser sans l'en-tête `Authorization` | Aucune copie du secret à protéger |
| Un compte dédié par usage, mot de passe long et aléatoire, rangé dans un outil de secrets | Fuite limitée, révocation sans conséquence sur les autres usages |
| Choisir un jeton, une clé ou OAuth dès qu'un utilisateur humain ou un tiers est concerné | Expiration, révocation et délégation que Basic ne sait pas offrir |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir : la ressource** | Une **ressource REST** est une chose désignée par une URL, sur laquelle le client agit avec des méthodes HTTP (`GET` lit, `POST` crée, `PUT` remplace, `PATCH` corrige, `DELETE` supprime) et dont le serveur renvoie une représentation, souvent en JSON. On la **déclare comme un plugin** dans un registre : chemin, méthodes permises (liste blanche, sinon `405` avec `Allow`) et permission de chaque méthode. L'API est **sans état** : l'identité accompagne chaque requête. |
| **À retenir : HTTP Basic** | **HTTP Basic** envoie `Authorization: Basic <Base64 de identifiant:mot de passe>` ; sans en-tête, le serveur répond `401` avec `WWW-Authenticate: Basic realm="..."`. **Base64 n'est pas un chiffrement** : `base64 -d` rend le mot de passe en clair, donc HTTPS est obligatoire. |
| **À retenir : ses limites** | Basic n'a ni déconnexion, ni expiration, ni second facteur, et renvoie le vrai mot de passe à chaque requête, avec un risque de copie dans les journaux, les proxys et l'historique du terminal. |
| **À retenir : les contrôles** | Authentification (`401`) et autorisation (`403`) sont deux contrôles distincts. Le secret se compare **en temps constant** (`timingSafeEqual`, `hash_equals`, `compare_digest`) sur des empreintes de taille fixe, un identifiant inconnu coûte le même calcul, et les essais sont limités côté serveur (`429` avec `Retry-After`). |
| **Pièges à éviter** | Croire que Base64 protège ; rediriger du HTTP vers HTTPS en pensant le premier envoi sauvé ; comparer avec `===` ; `timingSafeEqual` sur des tailles différentes ; messages d'erreur trop précis ; identifiant inconnu refusé sans calcul ; `Authorization` copié dans les journaux ; mot de passe tapé dans `curl -u` ou placé dans l'adresse ; compteur d'échecs côté client, en mémoire ou derrière un proxy sans adresse d'origine ; verrouillage définitif d'un compte ; ressource sans permission déclarée donc publique ; méthodes non listées autorisées ; compte administrateur pour un script. |
| **Bonnes pratiques** | HTTPS partout ; un registre de ressources avec liste blanche de méthodes et permission par méthode, refus par défaut ; sel et hachage lent pour stocker les mots de passe ; comparaison à temps constant d'empreintes de taille fixe ; même réponse pour tous les échecs d'authentification ; limitation des essais côté serveur avant le calcul ; journaux sans `Authorization` ; compte dédié, aux droits minimaux, avec un secret long et aléatoire rangé dans un outil de secrets ; jeton, clé d'API ou OAuth 2.0 dès qu'un utilisateur humain ou un tiers est concerné. |
