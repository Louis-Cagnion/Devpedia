---
order: 13
---

# Chargement différé et espace réservé (31/10/2026)

Une **page web** est un document que le **navigateur** (le programme qui affiche les pages) reçoit d'un **serveur** (un ordinateur qui répond aux demandes du navigateur) et affiche ; l'échange est décrit dans [requête et réponse HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). Elle est rarement d'un seul tenant : elle se compose de **blocs**, des morceaux autonomes (un menu, un article, un panier, un message « Bonjour Jean »). La plupart sont identiques pour tous les visiteurs ; quelques-uns sont **lents** à calculer ou **propres à la personne** qui regarde. Ce chapitre explique comment afficher tout de suite ce qui est prêt, sans attendre ces blocs, puis les mettre en place dès qu'ils sont calculés.

Il s'appuie sur ces échanges et sur l'idée de [ne pas recalculer ce qui n'a pas changé](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant). Les exemples exécutés utilisent [Node.js](https://nodejs.org/api/http.html), lancé depuis un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). Un système de gestion de contenu, [Drupal](https://www.drupal.org/) (un logiciel écrit en [PHP](/?c=langages&s=php&p=php) qui permet de construire et d'administrer un site web), sert d'exemple à la fin du chapitre : il n'est qu'une illustration, l'idée vaut pour n'importe quel site.

| Section | Question traitée |
|---|---|
| [Le problème](#le-probleme-un-seul-bloc-lent-bloque-toute-la-page) | Pourquoi un bloc lent ou personnel pénalise toute la page |
| [L'idée](#l-idee-un-espace-reserve-rempli-plus-tard) | Rendre d'abord, remplir ensuite |
| [Trois façons de livrer](#trois-facons-de-livrer-le-bloc-differe) | Synchrone, en flux, par une seconde requête |
| [L'expérience](#l-experience-un-petit-serveur-qui-mesure) | Mesurer le gain avec un vrai serveur |
| [Le décalage](#le-piege-du-decalage-de-mise-en-page) | Réserver la taille de l'espace |
| [L'accessibilité](#l-accessibilite-annoncer-ce-qui-arrive) | Annoncer le contenu qui arrive |
| [Le bloc comme plugin](#le-bloc-comme-plugin) | Où ranger le code d'un bloc |
| [Un exemple Drupal](#un-exemple-dans-drupal-lazy-builder-et-bigpipe) | Le mécanisme dans un logiciel réel |

## Le problème : un seul bloc lent bloque toute la page

Prenons une boutique en ligne. Sa page d'accueil est faite de quatre blocs :

```
+-------------------------------------------------+
|  Menu                  (identique pour tous)    |
+-------------------------------------------------+
|  Articles à la une     (identique pour tous)    |
+-------------------------------------------------+
|  Bonjour Jean, 3 articles dans le panier        |   <- propre à Jean, lent
+-------------------------------------------------+
|  Pied de page          (identique pour tous)    |
+-------------------------------------------------+
```

| Bloc | Même contenu pour tous ? | Coût de calcul | Peut être gardé en cache ? |
|---|---|---|---|
| Menu | Oui | Faible | Oui |
| Articles à la une | Oui | Moyen (requêtes à la [base de données](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees)) | Oui |
| Panier et « Bonjour Jean » | Non, dépend du visiteur | Élevé (base de données, compte connecté) | Seulement pour Jean |
| Pied de page | Oui | Faible | Oui |

Un **cache** est une copie d'un résultat déjà calculé, gardée pour être réutilisée sans refaire le calcul (voir [éviter le recalcul redondant](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant)). Une copie n'est réutilisable que si le résultat est le même pour celui qui la demande. Un cache **partagé** (par exemple celui d'un [CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative), un réseau de serveurs qui garde des copies près des visiteurs) sert la même copie à tout le monde.

Un seul bloc personnel suffit à gâcher la page entière :

| Choix du développeur | Conséquence |
|---|---|
| Page entière en cache partagé | Marie verrait « Bonjour Jean » : faute grave (fuite de données personnelles) |
| Page entière sans cache | Chaque visite recalcule aussi le menu et les articles, qui n'ont pas changé |
| Une copie de la page par visiteur | Autant de copies que de visiteurs, presque jamais réutilisées : le cache ne sert à rien |
| Page en attente du bloc lent | Le visiteur regarde une page blanche pendant tout le calcul du panier |

Le dernier cas est le plus visible : le temps avant que le visiteur voie quelque chose est égal au temps du bloc **le plus lent**, alors que les autres étaient prêts depuis longtemps.

## L'idée : un espace réservé rempli plus tard

Un **espace réservé** (en anglais *placeholder*) est un emplacement vide, ou rempli d'un texte provisoire, laissé à la place d'un bloc qui n'est pas encore calculé. Le serveur procède en deux temps :

1. Il envoie tout de suite la page, avec l'espace réservé à la place du bloc lent.
2. Il calcule le bloc, puis le fait arriver pour remplacer l'espace réservé.

Le **chargement différé** (en anglais *lazy loading*) est ce report du calcul d'un bloc : on le fait **après** l'envoi du reste, pas avant. Ne le confondez pas avec l'attribut `loading="lazy"` des images, qui retarde seulement le téléchargement d'une image tant qu'elle n'est pas visible (voir [les liens et images](/?c=langages&s=html&p=liens-et-images)) : ici, c'est le **calcul d'un bloc par le serveur** qui est différé.

```
Sans différé (synchrone)
  temps ->  0 ms                                  800 ms
            |------ calcul du panier ---------------|
                                                    | envoi de la page entière
            page blanche pendant 800 ms ------------>  tout apparaît d'un coup

Avec différé
  temps ->  0 ms   1 ms                           800 ms
            |      | envoi de la page + espace réservé
            |      | le visiteur lit déjà le menu et les articles
            |------ calcul du panier ---------------|
                                                    | le panier remplace l'espace réservé
```

Cette séparation a une seconde conséquence, plus importante encore pour le cache : la page « squelette » (menu, articles, espace réservé) est la **même pour tout le monde**, donc on peut la garder en cache. Le morceau personnel est calculé à part, pour chaque visiteur, et n'a besoin d'être refait que lui.

| Partie | Contenu | Cachable ? | Qui la calcule |
|---|---|---|---|
| Squelette | Menu, articles, espace réservé | Oui, pour tous | Une fois, puis copie |
| Fragment | « Bonjour Jean, 3 articles » | Non (ou par visiteur) | À chaque visite, sur le seul bloc concerné |

## Trois façons de livrer le bloc différé

Le fragment peut arriver de trois manières. Elles diffèrent par le moment où le calcul commence et par le nombre de requêtes HTTP.

| | Synchrone (sans différé) | Différé en flux | Différé par une seconde requête |
|---|---|---|---|
| Principe | Tout est calculé, puis tout est envoyé | Page et espace réservé envoyés, fragment envoyé plus tard **dans la même réponse** | Page et espace réservé envoyés, le navigateur redemande le fragment par une **autre requête** |
| Nombre de requêtes | 1 | 1 | 2 |
| Début du calcul lent | Avant l'envoi | Pendant que le navigateur affiche le reste | Seulement quand la seconde requête arrive |
| Premier affichage | Après tout le calcul | Immédiat | Immédiat |
| Fragment complet visible | À la fin du calcul | À la fin du calcul | À la fin du calcul, plus un aller-retour réseau |
| Squelette cachable en HTTP ? | Non | Non (la réponse contient le fragment personnel) | Oui, les octets sont identiques pour tous |
| JavaScript nécessaire ? | Non | Oui, pour placer le fragment | Oui, pour demander et placer le fragment |
| Réglage réseau délicat | Aucun | Un intermédiaire qui garde la réponse en mémoire (tampon) jusqu'à la fin annule le gain | Une requête de plus à gérer |

Le **flux** (en anglais *streaming*) consiste à envoyer une réponse HTTP **par morceaux**, sans attendre qu'elle soit terminée : en-têtes et premier morceau partent tout de suite, les suivants partent quand ils sont prêts. Les **en-têtes** sont des lignes d'information envoyées avant le contenu de la réponse (type du contenu, date...). HTTP sait faire ce flux avec l'en-tête `Transfer-Encoding: chunked` (« transfert par morceaux ») : la taille totale n'est pas annoncée d'avance. Un cas voisin, dans un script PHP, est décrit dans [le streaming HTTP progressif](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant#streaming-http-progressif-quand-le-calcul-est-incompressible) ; ici, il sert à une autre fin : livrer en deux temps une page dont une partie est lente.

Dans le flux, le squelette n'est pas cachable **au niveau de HTTP** (la réponse complète contient le fragment personnel), mais l'application peut garder le squelette en cache **chez elle** (en mémoire côté serveur) et ne calculer que le fragment. Avec la seconde requête, la première réponse est identique pour tous : un cache partagé peut la garder telle quelle.

## L'expérience : un petit serveur qui mesure

Rien ne vaut une mesure. Ce serveur Node.js (le moteur qui exécute du JavaScript hors du navigateur, voir [le serveur local de développement](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement)) propose les trois modes sur trois adresses : `/sync`, `/flux` et `/requete`. Le « calcul lent » est simulé par une pause de 800 millisecondes. Enregistrez le code ci-dessous dans un fichier nommé `serveur-differe.mjs` (l'extension `.mjs` dit à Node que le fichier utilise `import`), dans un dossier de votre choix.

Quelques notations du code, définies ici avant de le lire :

| Notation | Sens | Pour approfondir |
|---|---|---|
| `async` et `await` | Attendre un résultat sans bloquer le programme | [la programmation asynchrone](/?c=langages&s=javascript&p=asynchrone) |
| `new Promise(...)` | Une promesse : une valeur qui n'est pas encore là, mais qui arrivera plus tard | [les Promises](/?c=langages&s=javascript&p=asynchrone) |
| `(x) => ...` | Fonction fléchée, une fonction écrite en abrégé | [les fonctions](/?c=langages&s=javascript&p=fonctions) |
| `/.../` | Expression régulière, un motif de texte à retrouver | [les expressions régulières](/?c=langages&s=javascript&p=regex) |
| `process.env.PORT` | Valeur de la variable d'environnement `PORT`, fixée au lancement | [les variables d'environnement](/?c=langages&s=bash&p=variables-denvironnement) |
| `?.` et `??` | Si la donnée est absente, ne rien faire (`?.`) ou prendre une valeur de repli (`??`) | [les conditions](/?c=langages&s=javascript&p=conditions) |
| `` `...${x}...` `` | Texte dans lequel `${x}` est remplacé par la valeur de `x` | [les chaînes de caractères](/?c=langages&s=javascript&p=strings) |

Dans le code, `req` est la requête reçue (`req.url` est l'adresse demandée) et `res` la réponse à envoyer. Le HTML utilisé est décrit dans [la structure d'un document](/?c=langages&s=html&p=structure-dun-document) : `<div>` est un bloc de page, `id` son nom, `style` des réglages d'apparence.

```js
import { createServer } from 'node:http';         // module HTTP fourni par Node

const PORT = Number(process.env.PORT);            // port d'écoute, converti en nombre
const DELAI_MS = 800;                             // durée du calcul lent simulé
// charset=utf-8 : codage des caractères, qui permet d'écrire les accents
const TYPE = { 'content-type': 'text/html; charset=utf-8' }; // la réponse est du HTML
const ATTENTE = 'Chargement du panier…';          // texte provisoire de l'espace réservé

// Pause de `ms` millisecondes : une promesse qui se termine après ce délai
// (setTimeout appelle la fonction `fin` une fois le délai écoulé)
const attendre = (ms) => new Promise((fin) => setTimeout(fin, ms));
// Remplace < > & " ' par leur code HTML (&#60; pour <), pour que le navigateur
// ne prenne jamais un nom pour du HTML (charCodeAt(0) : numéro du caractère)
const echapper = (t) => t.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Le bloc lent et propre à l'utilisateur : retourne du texte brut, sans HTML
async function calculerPanier(nom) {
  await attendre(DELAI_MS);                       // simule une base de données lente
  return `Bonjour ${nom}, 3 articles dans le panier`; // propre à cette personne
}

// Lit le nom dans le cookie « utilisateur » : `exec` cherche le motif, `[1]` prend
// le texte entre parenthèses ; « visiteur » s'il n'y a pas de cookie
const nomDe = (req) =>
  /utilisateur=([^;]+)/.exec(req.headers.cookie ?? '')?.[1] ?? 'visiteur';

const haut = '<h1>Boutique</h1><p>Contenu identique pour tous.</p>'; // partie commune

// L'emplacement du bloc lent. min-height:2em réserve une hauteur d'au moins deux fois
// la taille du texte ; aria-live="polite" fait annoncer le changement aux lecteurs d'écran
const zone = (contenu) =>
  `<div id="panier" style="min-height:2em" aria-live="polite">${contenu}</div>`;

createServer(async (req, res) => {                // appelée à chaque requête reçue
  const nom = nomDe(req);                         // qui demande la page
  if (req.url === '/sync') {                      // mode 1 : tout est calculé avant l'envoi
    const panier = await calculerPanier(nom);     // la page entière attend ce calcul
    // ici le texte est inséré dans du HTML : il doit être échappé
    res.writeHead(200, TYPE).end(haut + zone(echapper(panier))); // envoi après 800 ms
  } else if (req.url === '/flux') {               // mode 2 : espace réservé, puis flux
    res.writeHead(200, TYPE);                     // code 200 (OK) et en-têtes, d'abord
    res.write(haut + zone(ATTENTE));              // 1er morceau : page et espace réservé
    const panier = await calculerPanier(nom);     // le calcul tourne, la page est déjà là
    // JSON.stringify met le texte entre guillemets, comme un texte JavaScript ;
    // \u003c est l'écriture JavaScript de < : un </script> du texte ne ferme pas la balise
    const code = JSON.stringify(panier).replace(/</g, '\\u003c');
    // textContent place du texte pur dans l'élément : aucun échappement HTML à faire
    res.end(`<script>panier.textContent = ${code}</script>`); // 2e morceau : remplit l'espace
  } else if (req.url === '/requete') {            // mode 3 : remplissage par une requête
    const script = "fetch('/fragment').then((r) => r.text())" + // le navigateur demande
      '.then((t) => { panier.textContent = t; })'; // puis le place dans l'espace
    res.writeHead(200, TYPE).end(haut + zone(ATTENTE) + `<script>${script}</script>`);
  } else if (req.url === '/fragment') {           // le bloc lent, servi à part
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }); // simple texte
    res.end(await calculerPanier(nom));           // répond après 800 ms
  } else {                                        // toute autre adresse
    res.writeHead(404).end();                     // introuvable
  }
}).listen(PORT, '127.0.0.1');                     // 127.0.0.1 : n'écoute que cette machine
```

Règle à retenir, appliquée ci-dessus : un texte inséré **comme HTML** (`/sync`) doit être échappé ; un texte placé avec `textContent` (`/flux`, `/requete`) ne l'est **pas**, sinon le visiteur verrait les codes `&#60;` au lieu du caractère.

Les commandes suivantes se tapent dans un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) ouvert dans le dossier du fichier. On lance le serveur, puis on mesure avec [`curl`](https://curl.se/docs/manpage.html) (un programme qui envoie une requête HTTP depuis le terminal). L'option `-w` affiche des durées : `time_starttransfer` est le temps écoulé jusqu'au **premier octet** reçu, `time_total` le temps jusqu'à la fin. Notations du shell utilisées :

| Notation | Sens | Pour approfondir |
|---|---|---|
| `commande &` | Lance la commande en arrière-plan : le terminal reste disponible | [les processus](/?c=langages&s=bash&p=gestion-des-processus) |
| `PORT=7143 commande` | Fixe la variable `PORT` pour cette seule commande | [les variables d'environnement](/?c=langages&s=bash&p=variables-denvironnement) |
| `timeout 300 commande` | Arrête la commande au bout de 300 s : le serveur s'arrête seul | [`timeout`](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout) |
| `for m in a b; do ... done` | Répète pour chaque valeur ; `$m` est la valeur courante | [les boucles](/?c=langages&s=bash&p=boucles) |
| `\` en fin de ligne | La commande continue sur la ligne suivante | [les commandes de base](/?c=langages&s=bash&p=commandes-de-base) |
| `a \| b` | Le résultat de `a` devient l'entrée de `b` (un tube, *pipe*) | [redirections et pipes](/?c=langages&s=bash&p=redirections-et-pipes) |
| `grep`, `sed` | Chercher (`grep`) ou remplacer (`sed`) du texte | [le traitement de texte](/?c=langages&s=bash&p=traitement-de-texte) |

Passé 300 secondes, `curl` ne reçoit plus de réponse : relancez la première commande.

```bash
# Lance le serveur sur le port 7143 en arrière-plan ; « timeout 300 » l'arrête après 300 s
PORT=7143 timeout 300 node serveur-differe.mjs &
# Laisse une seconde au serveur pour commencer à écouter
sleep 1
# Pour chacune des trois adresses, envoie une requête et affiche les deux durées
for m in sync flux requete; do
  # -s : mode silencieux ; -o /dev/null : jette le corps ; -w : format d'affichage des durées
  curl -s -o /dev/null \
    -w "$m : premier octet %{time_starttransfer}s, total %{time_total}s\n" \
    "http://127.0.0.1:7143/$m"
done
```

Sortie obtenue (les durées varient légèrement d'un essai à l'autre, les ordres de grandeur non) :

```text
sync : premier octet 0.809237s, total 0.809291s
flux : premier octet 0.000792s, total 0.803238s
requete : premier octet 0.000685s, total 0.000709s
```

| Mode | Premier octet | Total | Lecture |
|---|---|---|---|
| `/sync` | environ 0,8 s | environ 0,8 s | Rien n'arrive avant la fin du calcul |
| `/flux` | moins de 2 ms | environ 0,8 s | Le squelette arrive presque instantanément ; le fragment arrive 800 ms plus tard dans la même réponse |
| `/requete` | moins de 2 ms | moins de 2 ms | La page est complète tout de suite ; le fragment est une seconde requête |

Pour la seconde requête, la durée à compter est celle de l'adresse `/fragment` :

```bash
# Mesure la seconde requête, celle que le navigateur envoie après avoir reçu la page
curl -s -o /dev/null -w "fragment : premier octet %{time_starttransfer}s\n" \
  http://127.0.0.1:7143/fragment
```

```text
fragment : premier octet 0.802402s
```

Le fragment arrive donc, dans les deux modes différés, environ 800 ms après la demande du fragment : le gain n'est pas de calculer plus vite, mais d'**afficher le reste pendant ce temps**. Pour voir les deux morceaux de `/flux` arriver à des instants différents, on demande à `curl` de tracer chaque réception :

```bash
# --trace-ascii - : écrit la trace sur la sortie ; --trace-time : ajoute l'heure
# grep ne garde que les lignes « Recv data » (données reçues), une par morceau
curl -s -o /dev/null --trace-time --trace-ascii - \
  http://127.0.0.1:7143/flux | grep "Recv data"
```

```text
13:01:42.839034 <= Recv data, 140 bytes (0x8c)
13:01:43.639987 <= Recv data, 83 bytes (0x53)
```

Deux morceaux (140 octets, puis 83), séparés d'environ 0,8 s (801 ms ici) : le premier contient la page et l'espace réservé, le second le petit script qui le remplit. Les en-têtes de la réponse annoncent bien l'envoi par morceaux :

```bash
# -i : affiche les en-têtes de la réponse avant son corps
# sed (GNU, celui de Linux) coupe la ligne entre deux balises : >< devient > puis <
curl -si http://127.0.0.1:7143/flux | sed 's/></>\n</g'
```

```text
HTTP/1.1 200 OK
content-type: text/html; charset=utf-8
Date: Sun, 01 Nov 2026 12:01:43 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

<h1>Boutique</h1>
<p>Contenu identique pour tous.</p>
<div id="panier" style="min-height:2em" aria-live="polite">Chargement du panier…</div>
<script>panier.textContent = "Bonjour visiteur, 3 articles dans le panier"</script>
```

Reste la preuve que le squelette de `/requete` est le même pour tous. `md5sum` calcule une empreinte d'un contenu : deux contenus identiques donnent la même empreinte, deux contenus différents donnent (presque sûrement) deux empreintes différentes. L'option `-b` de `curl` envoie un cookie.

```bash
# Page de /requete demandée par Jean, puis par Marie ; md5sum donne l'empreinte de chaque page
curl -s -b utilisateur=Jean http://127.0.0.1:7143/requete | md5sum
curl -s -b utilisateur=Marie http://127.0.0.1:7143/requete | md5sum
# Même comparaison pour la page synchrone, qui contient le panier
curl -s -b utilisateur=Jean http://127.0.0.1:7143/sync | md5sum
curl -s -b utilisateur=Marie http://127.0.0.1:7143/sync | md5sum
```

```text
6f6037d4e30ec889c487149b2ecb754d  -
6f6037d4e30ec889c487149b2ecb754d  -
c28289fb07e307a0b73b18d9354ad673  -
1ab5e0407fce3721e5402dd2f2d81ebc  -
```

| Page demandée | Jean | Marie | Conclusion |
|---|---|---|---|
| `/requete` | `6f6037d4...` | `6f6037d4...` | Identique : un cache partagé peut la servir à tous |
| `/sync` | `c28289fb...` | `1ab5e040...` | Différente : impossible à partager |

Enfin, le fragment est bien propre à chaque visiteur. `echo` affiche un retour à la ligne, pour que les sorties ne se collent pas. Le cookie piégé `<b>x` contient une balise HTML ; le texte brut du fragment la garde telle quelle, car `textContent` ne l'interprète jamais :

```bash
# Fragment pour Jean
curl -s -b utilisateur=Jean http://127.0.0.1:7143/fragment; echo
# Fragment pour un cookie qui contient du HTML : texte brut, pas d'échappement
curl -s -b 'utilisateur=<b>x' http://127.0.0.1:7143/fragment; echo
```

```text
Bonjour Jean, 3 articles dans le panier
Bonjour <b>x, 3 articles dans le panier
```

Dans la page synchrone, au contraire, le texte est inséré comme HTML : c'est là que `echapper` neutralise le nom piégé (faille décrite dans [le XSS](/?c=securite&s=cybersecurite&p=xss-en-detail)). Dans le mode en flux, un `</script>` dans le nom est écrit `\u003c/script>` pour ne pas fermer la balise :

```bash
# Page synchrone avec le cookie piégé : `<` devient &#60;
curl -s -b 'utilisateur=<b>x' http://127.0.0.1:7143/sync | fold -s -w 90; echo
# Mode flux, cookie avec </script> ; tail -c 120 garde les 120 derniers caractères ;
# fold -s -w 90 coupe la sortie en lignes de 90 caractères au plus (affichage seulement)
curl -s -b 'utilisateur=</script>x' http://127.0.0.1:7143/flux \
  | tail -c 120 | fold -s -w 90; echo
```

```text
<h1>Boutique</h1><p>Contenu identique pour tous.</p><div id="panier"
style="min-height:2em" aria-live="polite">Bonjour &#60;b&#62;x, 3 articles dans le
panier</div>
>Chargement du panier…</div><script>panier.textContent = "Bonjour \u003c/script>x, 3
articles dans le panier"</script>
```

Ces mesures portent sur un serveur local, sans réseau réel ; avec un vrai réseau, chaque aller-retour ajoute sa propre latence (voir [limiter les allers-retours](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours)). Elles mesurent l'arrivée des octets, pas l'affichage : pour voir la page se remplir, ouvrez `http://127.0.0.1:7143/flux` dans un navigateur ([le DOM](/?c=langages&s=javascript&p=dom-et-evenements) explique comment le script modifie la page).

## Pourquoi cela ressemble à du recouvrement

Pendant que le serveur calcule le panier (800 ms), le navigateur n'est pas bloqué : il affiche le squelette. C'est l'application, à l'échelle d'une page, de l'idée du [recouvrement de latence](/?c=qualite-performance-et-outils&s=performance&p=recouvrement-de-latence) : faire avancer des tâches indépendantes au lieu d'attendre la plus lente en premier. Et c'est l'inverse du délai mort décrit dans [attendre sans perdre de temps](/?c=qualite-performance-et-outils&s=performance&p=attentes-et-temps-morts) : l'attente existe toujours, mais elle ne retarde plus rien d'autre.

| Chapitre | Même idée | Ici |
|---|---|---|
| [Recouvrement de latence](/?c=qualite-performance-et-outils&s=performance&p=recouvrement-de-latence) | Faire autre chose pendant une attente | Afficher le squelette pendant le calcul du panier |
| [Attendre sans perdre de temps](/?c=qualite-performance-et-outils&s=performance&p=attentes-et-temps-morts) | Ne pas bloquer sur ce qui n'est pas prêt | Ne pas bloquer toute la page sur un bloc |
| [Éviter le recalcul redondant](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant) | Ne pas refaire ce qui n'a pas changé | Garder le squelette en cache, ne recalculer que le fragment |

## Le piège du décalage de mise en page

Si l'espace réservé est **vide** ou plus petit que le contenu final, tout ce qui se trouve en dessous est **poussé vers le bas** au moment du remplissage : le visiteur qui lisait ou allait cliquer voit le texte bouger sous ses yeux. On parle de **décalage de mise en page** (en anglais *layout shift*). Le même problème existe pour les images, d'où les attributs `width` et `height` décrits dans [les liens et images](/?c=langages&s=html&p=liens-et-images).

```html
<!-- Espace réservé : sa hauteur est fixée avant l'arrivée du contenu -->
<div id="panier" style="min-height: 2em">   <!-- au moins 2 fois la taille du texte -->
  Chargement du panier…                     <!-- texte provisoire -->
</div>
<!-- Le contenu qui suit ne bouge pas, tant que le panier tient dans 2em -->
<p>Pied de page</p>
```

| Situation | Effet | Remède |
|---|---|---|
| Espace réservé vide (hauteur 0) | Tout le contenu suivant saute vers le bas | Réserver une hauteur minimale |
| Hauteur réservée trop grande | Un grand blanc inutile, puis un saut vers le haut | Mesurer la taille moyenne réelle du contenu |
| Contenu final de taille variable (liste) | Saut selon le nombre d'éléments | Réserver la taille du cas courant, ou un cadre à taille fixe avec défilement |
| Texte provisoire plus court que le final | Une ligne en plus au remplissage | Écrire le provisoire sur la même largeur et la même hauteur |
| Bloc qui disparaît quand il est vide | La page remonte | Garder la place, ou ne différer que les blocs toujours présents |

L'unité `em` (ici `2em` : deux fois la taille du texte) et les autres unités de taille sont expliquées dans [les unités et fonctions de taille CSS](/?c=langages&s=css&p=unites-et-fonctions-de-taille), et la manière dont un élément occupe de la place dans [le modèle de boîte](/?c=langages&s=css&p=box-model).

## L'accessibilité : annoncer ce qui arrive

Un lecteur d'écran (un logiciel qui lit la page à voix haute pour les personnes aveugles ou malvoyantes) ne lit qu'un endroit à la fois. Un contenu qui apparaît ailleurs que là où il lit passe **inaperçu**. Il faut donc déclarer l'espace réservé comme une **région live** (`aria-live`) : une zone dont les changements sont annoncés sans déplacer le focus. Le mécanisme est détaillé dans [ARIA dynamique et focus clavier](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier).

```html
<!-- aria-live="polite" : annonce le changement quand le lecteur a fini de parler -->
<div id="panier" aria-live="polite" style="min-height: 2em">
  Chargement du panier…
</div>
```

| Point d'attention | Pourquoi | Pratique |
|---|---|---|
| La région existe **avant** le changement | Un lecteur d'écran surveille une zone déjà présente, pas une zone qui apparaît avec son contenu | Envoyer la région avec l'espace réservé, la remplir ensuite |
| `polite` plutôt qu'`assertive` | `assertive` interrompt tout de suite ce que le lecteur disait ; `polite` attend la fin de la phrase | Réserver `assertive` aux alertes urgentes |
| Ne pas déplacer le focus | L'utilisateur perdrait sa position dans la page | Laisser le focus où il est |
| Texte provisoire clair | « Chargement du panier… » dit ce qui se passe | Éviter un blanc ou un simple symbole |
| Sans JavaScript | Le fragment n'arrive jamais | Prévoir un repli, par exemple un lien vers la page du panier dans un `<noscript>`, balise dont le contenu ne s'affiche que si JavaScript est désactivé ([MDN](https://developer.mozilla.org/fr/docs/Web/HTML/Element/noscript)) |

Le HTML ci-dessus est celui que produit le serveur de l'expérience. L'annonce elle-même dépend du lecteur d'écran et du navigateur utilisés : testez avec ceux de vos visiteurs.

## Le bloc comme plugin

Dans un logiciel construit autour de blocs, chaque bloc est généralement une [classe](/?c=langages&s=php&p=poo) (un modèle d'objet, ici en PHP) indépendante que l'application retrouve toute seule : un **plugin**. Le détail du mécanisme (déclarer, découvrir, instancier) est dans [l'architecture à plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins). Ce qui compte ici :

| Rôle | Ce que fait le plugin de bloc | Lien avec le différé |
|---|---|---|
| Déclaration | Donne un identifiant et un nom au bloc | Le système sait quel bloc il place où |
| Construction | Une méthode retourne la description de l'affichage | C'est ici qu'on décide de calculer tout de suite ou d'**annoncer** un calcul différé |
| Indépendance | Le bloc ne dépend pas des autres | Un bloc lent peut être différé sans toucher aux autres |

Un bloc ne se différencie donc de son voisin que par la façon dont il construit son contenu : le bloc de menu retourne son contenu, le bloc de panier retourne **la promesse de le calculer plus tard** (une description de ce qui sera calculé, comme une [Promise](/?c=langages&s=javascript&p=asynchrone) en JavaScript).

## Un exemple dans Drupal : lazy builder et BigPipe

> **Cette section est un exemple d'un logiciel particulier.** Drupal sert d'illustration ; l'idée du chapitre n'en dépend pas. Les noms d'API ci-dessous viennent de la documentation officielle de Drupal ([tableaux de rendu et lazy builders](https://api.drupal.org/api/drupal/core%21core.api.php/group/theme_render/), [placeholders automatiques et BigPipe](https://www.drupal.org/docs/drupal-apis/render-api/auto-placeholdering)). Ils sont vérifiés sur le code source de Drupal 11.x.

Drupal décrit ce qu'il faut afficher sous forme de **tableaux de rendu** (en anglais *render arrays*) : des tableaux [PHP](/?c=langages&s=php&p=php) dont les clés commençant par `#` sont des instructions. Pour différer un bloc, un de ces tableaux déclare un **lazy builder** (« constructeur paresseux ») : au lieu du contenu, il désigne la fonction qui le calculera plus tard. Le système remplace alors le morceau par un espace réservé. Ce remplacement n'a lieu que sur une requête cacheable (une lecture de page, `GET`, pas l'envoi d'un formulaire, `POST`) : `#create_placeholder => TRUE` ne force rien sur un `POST`.

Notations PHP des exemples (voir [la programmation objet en PHP](/?c=langages&s=php&p=poo)) : `namespace` donne à la classe son « adresse » logique, `use` importe une classe d'un autre namespace, `class A extends B` crée une classe `A` qui reprend tout ce que fait `B`, `implements` annonce qu'une classe respecte un contrat (une *interface*), `public static function f(): array` est une méthode accessible de l'extérieur, appelable sans créer d'objet (`static`), qui retourne un tableau (`: array`), `new X(...)` crée un objet, `string $nombre` déclare un paramètre texte dont `$nombre` insère la valeur dans un texte entre guillemets, `<?php` ouvre le code PHP, `TRUE` est le booléen « vrai » et `#[Block(...)]` est un **attribut**, une étiquette de déclaration que Drupal lit pour reconnaître le plugin.

```php
<?php

namespace Drupal\boutique\Plugin\Block;

use Drupal\Core\Block\Attribute\Block;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\StringTranslation\TranslatableMarkup;

// Déclare le plugin : un identifiant et un nom lisible pour l'administration
#[Block(id: 'boutique_panier', admin_label: new TranslatableMarkup('Panier'))]
class PanierBlock extends BlockBase {

  // Construit le bloc : retourne un « tableau de rendu » (la description de l'affichage)
  public function build(): array {
    return [
      // Au lieu de calculer ici, on désigne la fonction qui calculera plus tard
      '#lazy_builder' => ['boutique.panier_builder:construire', ['3']],
      // Demande un espace réservé à la place de ce morceau (requête cacheable)
      '#create_placeholder' => TRUE,
    ];
  }
}
```

Le premier élément de `#lazy_builder` est le nom du **service** (un objet partagé que le système sait construire, voir [le conteneur de services](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=conteneur-de-services)), deux-points, puis la méthode. Le second est la liste des arguments, qui doivent rester simples (texte, nombre, booléen) d'après la [documentation](https://api.drupal.org/api/drupal/core%21core.api.php/group/theme_render/), pour que le système puisse les mémoriser sans garder d'objets.

```php
<?php

namespace Drupal\boutique;

use Drupal\Core\Security\TrustedCallbackInterface;

// Le service qui calcule le morceau lent, appelé après coup par Drupal
class PanierBuilder implements TrustedCallbackInterface {

  // Reçoit les arguments donnés dans '#lazy_builder' (ici le texte « 3 »)
  public function construire(string $nombre): array {
    // Retourne le tableau de rendu final qui remplacera l'espace réservé
    return ['#markup' => "Panier : $nombre articles"];
  }

  // Liste les méthodes que Drupal a le droit d'appeler ainsi
  public static function trustedCallbacks(): array {
    return ['construire'];
  }
}
```

L'interface `TrustedCallbackInterface` et sa méthode `trustedCallbacks()` autorisent Drupal à appeler `construire`. Depuis Drupal 11.5, l'attribut `#[TrustedCallback]`, posé sur la méthode `construire`, est une alternative à cette interface.

Le service se déclare dans un fichier [YAML](https://yaml.org/spec/1.2.2/) (un format de configuration en texte, où l'indentation exprime l'emboîtement), nommé `boutique.services.yml` et rangé à la racine du module `boutique`, à côté du fichier `boutique.info.yml` qui déclare le module lui-même :

```yaml
services:
  # Nom du service, celui écrit avant les deux-points dans '#lazy_builder'
  boutique.panier_builder:
    # Classe PHP qui sera instanciée pour ce service
    class: Drupal\boutique\PanierBuilder
```

Le module **BigPipe** ([documentation](https://www.drupal.org/docs/drupal-apis/render-api/auto-placeholdering)), livré avec Drupal, se charge ensuite de la livraison : il envoie d'abord la page avec les espaces réservés, puis les fragments au fur et à mesure qu'ils sont calculés, dans la même réponse. C'est le mode « différé en flux » du tableau comparatif, qu'on a reproduit en miniature avec `/flux`.

| Élément | Ce que c'est | Équivalent dans l'expérience |
|---|---|---|
| `#lazy_builder` | Désigne la fonction qui calculera le contenu plus tard | `calculerPanier` |
| `#create_placeholder` | Demande un espace réservé | `zone(ATTENTE)` |
| Service `boutique.panier_builder` | Objet qui détient la méthode appelée | La fonction `calculerPanier` |
| BigPipe | Envoie les fragments en flux dans la même réponse | `res.write` puis `res.end` de `/flux` |
| Tableau de rendu | Description de l'affichage | Le HTML envoyé |

## Quoi différer, et quand

Différer a un coût : une page en plusieurs temps est plus complexe, et l'espace réservé peut gêner si le contenu est essentiel. Le tableau aide à choisir.

| Bloc | À différer ? | Raison |
|---|---|---|
| Menu, pied de page | Non | Rapides et identiques pour tous : cache ordinaire |
| Texte principal de l'article | Non | C'est la raison de la visite, il doit être là dès le début |
| Panier, nom du visiteur, notifications | Oui | Personnels, empêchent le cache de la page |
| Recommandations calculées à la volée | Oui | Lentes, secondaires |
| Contenu rapide (quelques millisecondes) | Non | Le gain ne vaut pas la complexité |
| Bloc que le visiteur n'ira peut-être jamais voir (bas de page) | Oui, et déclenché au défilement | Autant ne pas le calculer s'il n'est jamais regardé |

Avant de différer, on **mesure** : voir [mesurer avant d'optimiser](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser). Un bloc supposé lent peut ne pas l'être, et le temps total n'a pas diminué : c'est le temps avant le premier affichage qui baisse.

## Les pièges

Un **proxy** est un serveur placé entre le visiteur et le site ; un [répartiteur de charge](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) en est une sorte. Un **tampon** est une mémoire où l'on garde des données avant de les transmettre.

| Piège | Conséquence | Remède |
|---|---|---|
| Différer un bloc rapide | Complexité et saut de mise en page pour un gain nul | Mesurer d'abord, ne différer que le lent ou le personnel |
| Espace réservé sans taille | Le contenu suivant saute au remplissage | Réserver une hauteur minimale |
| Fragment personnel dans une page mise en cache partagé | Marie voit les données de Jean | Mettre le personnel dans le fragment, jamais dans le squelette |
| Intermédiaire qui garde la réponse en tampon jusqu'à la fin | Le flux n'arrive qu'à la fin, le gain disparaît | Vérifier toute la chaîne, mesurer le premier octet de bout en bout |
| Insérer le fragment comme HTML sans l'échapper | Faille XSS | Insérer avec `textContent` (sans échapper) ; si le texte entre dans du HTML, l'échapper |
| `</script>` dans le texte du fragment | Le navigateur ferme le script trop tôt | Remplacer `<` par `\u003c` dans le texte du script, comme `replace(/</g, '\\u003c')` dans l'expérience : `\u003c` est l'écriture JavaScript du caractère `<`, qui ne ferme plus la balise |
| Fragment qui échoue ou tarde trop | L'espace reste « Chargement… » pour toujours | Prévoir un délai limite et un message de repli |
| Dépendre de JavaScript sans repli | Le fragment est absent pour qui l'a désactivé | `<noscript>` (voir plus haut) avec un lien vers la page concernée |
| Beaucoup de blocs différés qui demandent chacun une requête | Les allers-retours s'accumulent | Regrouper en une réponse en flux, ou en une seule requête |
| Fragment annoncé en boucle aux lecteurs d'écran | Flot d'annonces | Une région `polite`, un changement unique |

## Bonnes pratiques

| Pratique | Pourquoi |
|---|---|
| Séparer ce qui est commun de ce qui est personnel | Le commun se cache, le personnel se calcule à part |
| Mesurer le premier octet avant et après | La mesure prouve le gain (`curl -w`) |
| Réserver la taille de l'espace | Évite le saut de mise en page |
| Déclarer la zone comme région `aria-live="polite"` dès l'envoi | Le contenu qui arrive est annoncé |
| Échapper tout texte propre à l'utilisateur avant de l'insérer comme HTML (ou utiliser `textContent`) | Évite les failles XSS |
| Choisir le mode selon le besoin | Flux si le squelette reste dans la réponse, seconde requête si on veut le cache partagé |
| Prévoir l'échec et le délai limite | Un fragment qui ne vient pas ne bloque pas la page |
| Garder le code d'un bloc dans un plugin séparé | Un bloc lent peut changer de mode sans toucher aux autres |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un bloc lent ou propre au visiteur empêche de mettre la page entière en cache et retarde son affichage. On envoie d'abord le squelette avec un **espace réservé**, puis on remplit l'espace avec le **fragment** calculé à part : dans la même réponse (flux) ou par une seconde requête. Le squelette devient cachable, le temps jusqu'au premier octet tombe d'environ 0,8 s à quelques millisecondes dans l'expérience, le fragment arrive toujours 800 ms plus tard. Le gain est dans l'affichage du reste pendant l'attente, pas dans un calcul plus rapide. |
| **Pièges à éviter** | Différer un bloc rapide ; oublier de réserver la taille de l'espace (saut de mise en page) ; mettre le fragment personnel dans une page partagée ; laisser un intermédiaire garder le flux en tampon ; insérer comme HTML un texte non échappé ; ne rien prévoir quand le fragment échoue ou que JavaScript est absent ; oublier la région `aria-live`. |
| **Bonnes pratiques** | Mesurer d'abord (`curl -w`, premier octet) ; ne différer que le lent ou le personnel ; réserver une hauteur minimale ; déclarer une région `aria-live="polite"` dès l'envoi ; échapper le texte ; prévoir un délai limite et un repli ; ranger chaque bloc dans son plugin pour changer de mode sans toucher aux autres. |
