---
order: 9
---

# Serveurs web (31/10/2026)

Quand vous tapez une adresse dans un navigateur, une page s'affiche : quelque part, un programme a reçu votre demande et a renvoyé le contenu. Ce programme est un **serveur web**. Ce chapitre explique ce qu'il fait, comment on le configure, comment il gère plusieurs visiteurs à la fois, et comment lire ce qu'il écrit dans ses journaux. Il suppose que vous savez ouvrir un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (la fenêtre où l'on tape des commandes au clavier).

Le mot « serveur » a deux sens qu'il faut distinguer dès maintenant :

| Sens | Ce que c'est | Exemple |
|---|---|---|
| La machine | Un ordinateur allumé en permanence, relié à Internet, qui rend des services | Un ordinateur dans un centre de données |
| Le programme | Un logiciel qui attend des demandes et y répond | nginx, Apache, Caddy (présentés plus bas) |

Dans ce chapitre, « serveur web » désigne le **programme**. Une même machine peut en exécuter un, plusieurs, ou aucun. Le **navigateur** (le logiciel qui affiche les pages : [Firefox](https://www.mozilla.org/fr/firefox/), [Chrome](https://www.google.com/chrome/)...) joue l'autre rôle, celui de **client** : il demande, le serveur répond. Les règles de ce dialogue s'appellent **HTTP** (*HyperText Transfer Protocol*) ; ses méthodes (`GET`, `POST`...) et ses codes de statut (`200`, `404`...) sont expliqués dans [les échanges de données : API et HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) et ne sont pas répétés ici.

## Un programme qui écoute un port

Une machine reliée à un réseau possède une **adresse IP** (un numéro qui l'identifie, voir [l'adressage réseau](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau)). Mais plusieurs programmes peuvent tourner sur la même machine : comment savoir à qui s'adresse un message ? Grâce au **port**, un numéro entre 0 et 65535 qui désigne un programme précis sur la machine.

> **Analogie :** l'adresse IP est l'adresse d'un immeuble, le port est le numéro de l'appartement. Le courrier arrive à l'immeuble, puis va à la bonne porte.

Un serveur web **écoute** un port : il le réserve auprès du système, puis attend qu'un client s'y connecte. C'est le mécanisme de la [socket serveur](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante) (le point de communication réseau d'un programme) décrit dans son propre chapitre.

```text
 CLIENT (navigateur, curl...)               MACHINE SERVEUR (IP 203.0.113.10)

                                            port 25   : un autre programme
 1. ouvre une connexion vers le port 80     port 80   : [ serveur web ]  <- écoute
    ---------------------------------------->      |
 2. envoie la requête                              | 3. cherche la ressource
    "GET /contact.html"                            |    (un fichier ou un calcul)
    ---------------------------------------->      |
                                                   | 4. construit la réponse
 5. reçoit la réponse                              |    statut + en-têtes + corps
    <----------------------------------------      v
 6. l'affiche (page, image, données...)
```

L'adresse `203.0.113.10` est une adresse réservée à la documentation : elle n'existe pas sur le vrai Internet.

Les numéros de port ne sont pas libres. Certains sont une convention mondiale :

| Port | Usage | Remarque |
|---|---|---|
| `80` | HTTP, sans chiffrement | Port par défaut : le navigateur le sous-entend pour une adresse en `http://` |
| `443` | HTTPS, avec chiffrement (expliqué dans la section HTTPS plus bas) | Port par défaut pour une adresse en `https://` |
| `8080`, `8000`, `3000`... | [Serveurs de développement](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement) | Simple habitude, aucune règle |

Quand l'adresse ne contient pas de port, le navigateur choisit `80` ou `443` selon le début de l'adresse. `http://exemple.test:8080/` force le port `8080`.

## Voir le cycle requête/réponse en vrai

Rien ne vaut un serveur minuscule que l'on peut lire en entier. Le fichier `serveur.js` ci-dessous fait tourner un serveur web en une quarantaine de lignes. Il est écrit en [JavaScript](/?c=langages&s=javascript&p=javascript) et exécuté par **Node.js** (un programme qui exécute du JavaScript en dehors du navigateur). Pour l'installer, suivez les instructions du [site officiel](https://nodejs.org) puis vérifiez dans le terminal avec `node --version` : un numéro de version s'affiche. Copiez ensuite le code ci-dessous dans un fichier nommé `serveur.js`, créé avec un [éditeur de code](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide). Le module `http` utilisé est décrit dans la [documentation de Node.js](https://nodejs.org/api/http.html). Inutile de maîtriser le langage (voir [les fonctions JavaScript](/?c=langages&s=javascript&p=fonctions) pour la notation `=>`) : chaque ligne est commentée, et ce qui compte est le déroulement.

```javascript
// http est le module de Node.js qui sait parler le protocole HTTP
// require("...") charge un module ; const nomme le résultat (une valeur qui ne change pas)
const http = require("node:http");

// Une table : à chaque valeur de l'en-tête Host correspond le texte du site
// (\n est un retour à la ligne dans le texte)
const sites = {
  "a.exemple.test": "Bienvenue sur le site A\n",
  "b.exemple.test": "Bienvenue sur le site B\n",
};

// createServer reçoit une fonction appelée à CHAQUE requête reçue
// ((requete, reponse) => { ... } est une fonction fléchée : paramètres, flèche, corps)
const serveur = http.createServer((requete, reponse) => {
  // requete.method : la méthode (GET...) ; requete.url : le chemin demandé
  console.log(requete.method, requete.url, requete.headers.host);

  // /lent : on attend une seconde avant de répondre (sert plus bas)
  // setTimeout(fonction, 1000) exécute la fonction après 1000 millisecondes (1 seconde)
  // reponse.end(texte) envoie le texte puis termine la réponse
  if (requete.url === "/lent") {
    setTimeout(() => reponse.end("fini\n"), 1000);
    return;
  }

  // /heure : une réponse calculée à chaque requête (contenu dynamique)
  // toISOString donne la date au format 2026-10-31T20:10:43.333Z : T sépare la date
  // de l'heure, Z signifie « heure UTC » (le temps universel, sans décalage)
  if (requete.url === "/heure") {
    reponse.end(new Date().toISOString() + "\n");
    return;
  }

  // On cherche le site demandé grâce à l'en-tête Host, sans le numéro de port
  // « a || b » vaut a s'il existe, sinon b ; split(":")[0] garde ce qui précède le « : »
  const nom = (requete.headers.host || "").split(":")[0];
  const texte = sites[nom];

  // Aucun site de ce nom : statut 404 (« introuvable ») et un court message
  if (texte === undefined) {
    reponse.statusCode = 404;
    reponse.setHeader("Content-Type", "text/plain; charset=utf-8");
    reponse.end("Aucun site à ce nom\n");
    return;
  }

  // Sinon : statut 200 (« succès »), un en-tête décrivant le contenu, puis le corps
  reponse.statusCode = 200;
  reponse.setHeader("Content-Type", "text/plain; charset=utf-8");
  reponse.end(texte);
});

// listen : le programme réserve le port 8081 et attend les connexions
serveur.listen(8081, "127.0.0.1", () => console.log("à l'écoute sur 8081"));
```

L'adresse `127.0.0.1` est l'adresse de **la machine elle-même** : le serveur n'est donc joignable que depuis votre ordinateur. Lancez-le dans un premier terminal avec `node serveur.js` (`Ctrl+C` dans ce terminal l'arrête), puis interrogez-le depuis un second avec **curl**, un outil de ligne de commande qui envoie une requête HTTP et affiche la réponse (voir [sa documentation](https://curl.se/docs/)). L'option `-i` affiche aussi les en-têtes de la réponse. L'option `-H` ajoute un en-tête à la requête, ici `Host` (son rôle est expliqué dans la section sur les sites virtuels).

```bash
# -i : affiche la ligne de statut et les en-têtes de la réponse avant son corps
# -H : envoie l'en-tête « Host: a.exemple.test » dans la requête
curl -i http://127.0.0.1:8081/ -H 'Host: a.exemple.test'
```

Sortie obtenue :

```text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Date: Sat, 31 Oct 2026 20:10:22 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 24

Bienvenue sur le site A
```

L'option `-v` (*verbose*, « bavard ») montre en plus la requête envoyée, précédée du signe `>` ; la réponse est précédée de `<`. Voici ces lignes pour la même demande :

```text
> GET / HTTP/1.1
> Host: a.exemple.test
> User-Agent: curl/8.5.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Content-Type: text/plain; charset=utf-8
< Date: Sat, 31 Oct 2026 20:10:22 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
< Content-Length: 24
<
```

| Ligne | Nom | Rôle |
|---|---|---|
| `GET / HTTP/1.1` | Ligne de requête | La méthode, le chemin demandé, la version du protocole |
| `Host: ...` | En-tête de requête | Le nom du site visé (voir la section sur les sites virtuels) |
| `User-Agent: ...` | En-tête de requête | Le logiciel qui envoie la requête (ici curl, souvent un navigateur) |
| `Accept: */*` | En-tête de requête | Les types de contenu acceptés (`*/*` : tous) |
| ligne vide | Séparateur | Marque la fin des en-têtes ; le corps vient ensuite |
| `HTTP/1.1 200 OK` | Ligne de statut | La version, le code de statut, son texte |
| `Content-Type` | En-tête de réponse | La nature du contenu (texte, image, page [HTML](/?c=langages&s=html&p=html)...) et son encodage (la façon dont les lettres sont codées en octets, l'**octet** étant l'unité de taille d'une donnée) |
| `Content-Length: 24` | En-tête de réponse | La taille du corps en octets (environ un caractère simple par octet : ici 24, retour à la ligne compris) |
| `Connection: keep-alive` | En-tête de réponse | La connexion reste ouverte pour la requête suivante |
| `Keep-Alive: timeout=5` | En-tête de réponse | Elle sera fermée après 5 secondes sans nouvelle requête |

Un **en-tête** (*header*) est une ligne `Nom: valeur` qui donne une information sur l'échange. Le **corps** (*body*) est le contenu lui-même, après la ligne vide. Dernier cas de figure, un site inconnu : le serveur répond `404`.

```bash
# Le nom « inconnu.test » ne figure pas dans la table : attendu, un statut 404
curl -i http://127.0.0.1:8081/ -H 'Host: inconnu.test'
```

```text
HTTP/1.1 404 Not Found
Content-Type: text/plain; charset=utf-8
Date: Sat, 31 Oct 2026 20:10:22 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Content-Length: 21

Aucun site à ce nom
```

Pendant ces essais, le terminal du serveur a affiché ce que fait la ligne `console.log` du code, un **journal** minimal de chaque requête reçue. Voici un extrait, celui des quatre premiers appels (site A, site inconnu, site B, appel avec `-v`) puis des trois appels à `/lent` vus plus bas ; les appels à `/heure` et avec `--resolve` y ajoutent leurs propres lignes :

```text
à l'écoute sur 8081
GET / a.exemple.test
GET / inconnu.test
GET / b.exemple.test
GET / a.exemple.test
GET /lent 127.0.0.1:8081
GET /lent 127.0.0.1:8081
GET /lent 127.0.0.1:8081
```

Quand le serveur n'est pas lancé, personne n'écoute le port : la connexion est refusée avant même qu'une requête existe.

```text
curl: (7) Failed to connect to 127.0.0.1 port 8081 after 0 ms: Couldn't connect to server
```

Ce message (« Impossible de se connecter », en français) n'est donc **pas** une réponse HTTP : il n'y a pas de code de statut. La différence avec une erreur `404` ou `500` est celle que décrit [le chapitre sur HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) entre « pas de réponse » et « réponse d'erreur ».

## Contenu statique et contenu dynamique

Un serveur web peut répondre de deux façons très différentes :

| | Contenu statique | Contenu dynamique |
|---|---|---|
| Ce que c'est | Un fichier tel qu'il est stocké (page [HTML](/?c=langages&s=html&p=html), image, feuille de style, script) | Une réponse calculée au moment de la requête par un programme |
| Qui produit la réponse | Le serveur web seul : il lit le fichier et l'envoie | Un programme d'application ([PHP](/?c=langages&s=php&p=php), [Python](/?c=langages&s=python&p=python), Node.js...) que le serveur appelle |
| Deux visites successives | Même résultat, tant que le fichier ne change pas | Résultat qui peut différer (heure, utilisateur connecté, contenu de la [base de données](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees)) |
| Vitesse | Très rapide | Dépend du calcul |
| Exemple dans ce chapitre | `contact.html` servi par Apache | La route `/heure` du serveur Node |

La route `/heure` de `serveur.js` calcule sa réponse à chaque appel. Deux appels à deux secondes d'écart :

```bash
# -s : mode silencieux (curl n'affiche pas sa barre de progression, seulement la réponse)
curl -s http://127.0.0.1:8081/heure
# Même appel, deux secondes plus tard
curl -s http://127.0.0.1:8081/heure
```

```text
2026-10-31T20:10:43.333Z
2026-10-31T20:10:45.343Z
```

Certains serveurs web, comme nginx, n'exécutent pas eux-mêmes du code PHP. Ils **transmettent** la requête à un programme dédié, puis renvoient au client ce que celui-ci a produit. Pour PHP, ce programme est PHP-FPM, présenté dans le chapitre [Répondre au client puis continuer de travailler (PHP-FPM)](/?c=langages&s=php&p=php-fpm) :

```text
Requête GET /index.php?id=3
        |
        v
 Serveur web ---- fichier .html, .css, .png ? ---> lu sur le disque et envoyé
        |
        +-------- fichier .php ? ----------------> transmis à PHP-FPM
                                                    (qui exécute le script)
                                                           |
        réponse envoyée au client  <-----------------------+
```

C'est aussi ce que fait un [rendu côté serveur](/?c=langages&s=javascript&p=ssr-vs-csr) : la page est construite avant l'envoi, au lieu d'être assemblée dans le navigateur.

## Trois serveurs web courants : nginx, Apache, Caddy

Trois serveurs web libres (leur code est public et leur usage gratuit) sont très répandus, ou en progression pour Caddy. Ils font le même métier (écouter un port, répondre en HTTP) mais diffèrent par leur histoire et leur façon d'être configurés :

| | nginx | Apache HTTP Server | Caddy |
|---|---|---|---|
| Ce que c'est | Serveur web réputé pour gérer beaucoup de connexions avec peu de mémoire | Le plus ancien des trois, très modulaire (on lui ajoute des fonctions par modules) | Serveur web récent qui active le chiffrement HTTPS tout seul |
| Configuration | Fichier unique en blocs `{ }` | Fichiers en blocs `<...>` ; réglages locaux possibles par dossier (`.htaccess`) | Un fichier court, le `Caddyfile` |
| Documentation | [nginx.org](https://nginx.org/en/docs/) | [httpd.apache.org](https://httpd.apache.org/docs/current/) | [caddyserver.com](https://caddyserver.com/docs/) |

Un **module** est un morceau de fonctionnalité qu'on active ou non (chiffrement, compression, redirections). Un fichier **`.htaccess`** est, chez Apache, un petit fichier de réglages placé dans un dossier du site : pratique, mais Apache doit le relire à chaque requête, ce qui ralentit.

Le choix dépend du contexte : aucun n'est « le bon ». Sur une machine fournie par un hébergeur, le serveur est souvent déjà choisi.

## Un fichier de configuration minimal (nginx)

Un serveur web ne devine rien : tout ce qu'il fait (quels sites, quels dossiers, quels ports) est décrit dans un **fichier de configuration**, un fichier texte que le serveur lit à son démarrage. Chaque ligne y est une **directive** (un réglage : un nom suivi de sa valeur, terminé par `;` chez nginx). Les directives se rangent dans des **blocs** délimités par `{ }`, qui s'emboîtent comme des poupées russes.

Voici une configuration complète et minimale pour nginx. Elle sert un dossier de fichiers statiques sur le port 80. Elle se trouve en général dans `/etc/nginx/nginx.conf` (emplacement variable selon l'installation).

```nginx
# Nombre de processus ouvriers (voir plus bas) ; « auto » : un par cœur du processeur
# (un cœur est une unité de calcul de la puce)
worker_processes auto;
# Fichier où nginx écrit ses erreurs, avec le niveau minimal « warn » (avertissement)
error_log /var/log/nginx/error.log warn;

# Bloc « events » : réglages du traitement des connexions
events {
    # Nombre maximal de connexions que chaque ouvrier gère en même temps
    worker_connections 1024;
}

# Bloc « http » : tout ce qui concerne le protocole HTTP
http {
    # Charge la table qui associe une extension (.html, .png) à un type de contenu
    include /etc/nginx/mime.types;
    # Type de contenu utilisé quand l'extension est inconnue
    default_type application/octet-stream;
    # Fichier où nginx note chaque requête reçue
    access_log /var/log/nginx/access.log;

    # Bloc « server » : un site web (un « site virtuel », voir plus bas)
    server {
        # Écoute le port 80
        listen 80;
        # Ce bloc répond aux requêtes dont l'en-tête Host est l'un de ces deux noms
        server_name exemple.test www.exemple.test;
        # Le dossier qui contient les fichiers du site
        root /var/www/exemple;
        # Fichier renvoyé quand l'adresse demandée est un dossier (« / »)
        index index.html;

        # Bloc « location » : règle pour les chemins qui commencent par « / » (tous)
        location / {
            # Cherche le fichier ($uri), puis un dossier du même nom, sinon statut 404
            try_files $uri $uri/ =404;
        }
    }
}
```

`$uri` est une **variable** de nginx : elle contient le chemin demandé par le client (par exemple `/contact.html`). Une fois le fichier écrit, deux commandes suffisent à le contrôler et à l'appliquer sans couper les visiteurs en cours (`sudo` est la commande qui exécute la suivante avec les droits d'administrateur, nécessaires ici) :

```bash
# -t : « test », vérifie la syntaxe du fichier de configuration sans rien démarrer
sudo nginx -t
# -s reload : demande à nginx de relire sa configuration sans s'arrêter
sudo nginx -s reload
```

Pour servir du PHP, on ajoute, à l'intérieur du bloc `server`, un bloc `location` (avec `index index.php;` si l'adresse demandée peut être un dossier) qui transmet les requêtes des fichiers `.php` à PHP-FPM, comme dans le schéma de la section précédente :

```nginx
# Les chemins qui se terminent par .php (le « ~ » introduit une expression régulière)
location ~ \.php$ {
    # Reprend les variables habituelles du protocole FastCGI (le protocole de dialogue
    # entre le serveur web et PHP-FPM)
    include fastcgi_params;
    # Indique à PHP-FPM quel script exécuter
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    # Transmet la requête à PHP-FPM, joignable par ce socket (chemin variable)
    fastcgi_pass unix:/run/php/php-fpm.sock;
}
```

Une **expression régulière** est un motif de recherche dans du texte (voir [le chapitre dédié](/?c=langages&s=javascript&p=regex)). Le protocole FastCGI et le socket de PHP-FPM sont expliqués dans le [chapitre PHP-FPM](/?c=langages&s=php&p=php-fpm).

### La même chose avec Apache et Caddy

Pour comparer, voici le même site chez Apache. Cette configuration est dérivée de celle qui a été **réellement exécutée** pour ce chapitre : un seul des deux sites y figure, les chemins sont abrégés et la ligne `LogFormat` est montrée plus bas, dans la section sur les journaux. Un fichier d'installation courante est, lui, découpé en plusieurs morceaux :

```apache
# Le dossier de travail du serveur (chemins relatifs, fichiers temporaires)
ServerRoot "/chemin/vers/apache"
# Écoute le port 8082 de la machine locale
Listen 127.0.0.1:8082
# Charge le module qui gère les connexions (voir la section sur les ouvriers)
LoadModule mpm_event_module /usr/lib/apache2/modules/mod_mpm_event.so
# Module qui décide qui a le droit d'accéder à quoi
LoadModule authz_core_module /usr/lib/apache2/modules/mod_authz_core.so
# Module qui sert index.html quand l'adresse demandée est un dossier
LoadModule dir_module /usr/lib/apache2/modules/mod_dir.so
# Module qui associe une extension à un type de contenu
LoadModule mime_module /usr/lib/apache2/modules/mod_mime.so
# La table des types de contenu
TypesConfig /etc/mime.types
# Le fichier des erreurs
ErrorLog "/chemin/vers/apache/logs/error.log"
# Le nom du serveur lui-même (évite un avertissement au démarrage)
ServerName localhost

# Un site : le bloc est ouvert pour l'adresse et le port indiqués
<VirtualHost 127.0.0.1:8082>
    # Il répond aux requêtes dont l'en-tête Host est a.exemple.test
    ServerName a.exemple.test
    # Le dossier qui contient les fichiers du site
    DocumentRoot "/chemin/vers/apache/site-a"
    # Le fichier où chaque requête est notée, au format « combined » (voir plus bas)
    CustomLog "/chemin/vers/apache/logs/access-a.log" combined
    # Règles qui s'appliquent à ce dossier
    <Directory "/chemin/vers/apache/site-a">
        # Autorise tout le monde à lire ce dossier
        Require all granted
    </Directory>
</VirtualHost>
```

Le format `combined` est défini dans le fichier de test par une ligne `LogFormat`. Comme pour nginx, on teste avant d'appliquer :

```bash
# -t : vérifie la syntaxe du fichier désigné par -f, sans démarrer le serveur
apache2 -t -f /chemin/vers/apache/httpd.conf
```

```text
Syntax OK
```

Chez Caddy, le même site tient en deux directives (**non vérifié** : Caddy n'est pas installé sur la machine de rédaction). Le fichier s'appelle `Caddyfile` :

```text
# Le site : « :8080 » signifie « le port 8080, sous n'importe quel nom »
:8080 {
    # Le dossier qui contient les fichiers du site (« * » : pour tous les chemins)
    root * /var/www/exemple
    # Active l'envoi des fichiers statiques de ce dossier
    file_server
}
```

| Besoin | nginx | Apache | Caddy |
|---|---|---|---|
| Écouter un port | `listen 80;` | `Listen 80` | `:80 { ... }` |
| Nom du site | `server_name` | `ServerName` | Le nom en tête du bloc |
| Dossier du site | `root` | `DocumentRoot` | `root *` |
| Tester la configuration | `nginx -t` | `apache2 -t` (`httpd -t` sur d'autres distributions) | `caddy validate` |

## Plusieurs sites sur une même machine : les sites virtuels

Un hébergeur peut faire tourner des centaines de sites sur une seule machine, avec **une seule adresse IP** et **un seul port 80**. Comment le serveur sait-il lequel afficher ? Grâce à l'en-tête **`Host`**, que le client envoie dans chaque requête avec le nom de site tapé dans l'adresse : `GET / HTTP/1.1` suivi de `Host: a.exemple.test`. C'est le principe des **sites virtuels** (*virtual hosts* chez Apache, blocs `server` chez nginx) : un même programme se comporte comme plusieurs sites différents selon le nom demandé. La documentation de référence de l'en-tête se trouve sur [MDN](https://developer.mozilla.org/fr/docs/Web/HTTP/Reference/Headers/Host).

```text
                       +---- Host: a.exemple.test ----> site A (dossier site-a)
Requêtes ---> port 80  |
 (une seule IP)        +---- Host: b.exemple.test ----> site B (dossier site-b)
                       |
                       +---- Host: autre-nom.test ----> site par défaut
```

Le serveur Node de la section précédente fait exactement cela avec sa table `sites`. Même adresse, même port, deux réponses différentes selon `Host` :

```bash
# Même adresse et même port, mais un en-tête Host différent à chaque appel
curl -s -H 'Host: a.exemple.test' http://127.0.0.1:8081/
curl -s -H 'Host: b.exemple.test' http://127.0.0.1:8081/
```

```text
Bienvenue sur le site A
Bienvenue sur le site B
```

Avec nginx, deux sites s'écrivent avec deux blocs `server` dans le bloc `http` (**non vérifié**, la syntaxe est celle du fichier de la section précédente) :

```nginx
server {
    # Premier site : répond au nom a.exemple.test
    listen 80;
    server_name a.exemple.test;
    root /var/www/site-a;
}

server {
    # Second site : répond au nom b.exemple.test
    listen 80;
    server_name b.exemple.test;
    root /var/www/site-b;
}
```

Que se passe-t-il quand le nom demandé ne correspond à aucun site ? Chaque serveur a une règle de repli. Avec le test Apache réalisé pour ce chapitre (deux sites virtuels `a.exemple.test` et `b.exemple.test`), une requête avec `Host: inconnu.test` a reçu un statut `200` : c'est le **premier** site déclaré dans le fichier qui répond, le site par défaut. Le même comportement existe chez nginx (le premier bloc `server`, sauf s'il est désigné autrement par `listen 80 default_server;`).

> **Piège :** le site par défaut est servi à quiconque connaît seulement l'adresse IP, ou à un robot qui essaie toutes les adresses. Si c'est un vrai site, il se retrouve exposé sous un nom que personne n'a choisi.
>
> **Bonne pratique :** déclarer en premier un site « poubelle » qui répond une erreur ou une page vide. Chez nginx : `server { listen 80 default_server; return 444; }` (le statut `444` est propre à nginx : il ferme la connexion sans rien répondre).

Pour essayer un site virtuel sans acheter de nom de domaine, deux solutions locales : le [fichier hosts](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server) du système, qui associe un nom à une adresse IP, ou l'option `--resolve` de curl :

```bash
# Dit à curl : le nom a.exemple.test:8081 se trouve à l'adresse 127.0.0.1
curl -s --resolve a.exemple.test:8081:127.0.0.1 http://a.exemple.test:8081/
```

```text
Bienvenue sur le site A
```

Un **nom de domaine** est le nom lisible d'un site (`exemple.test`). Le suffixe `.test` est réservé aux essais, comme l'adresse `203.0.113.10` vue plus haut : il n'existe pas sur le vrai Internet. Résoudre un nom en adresse, c'est le rôle du [**DNS**](https://developer.mozilla.org/fr/docs/Glossary/DNS) (*Domain Name System*) : l'annuaire d'Internet qui traduit `exemple.test` en adresse IP. Le fichier hosts et `--resolve` court-circuitent cet annuaire pour vos essais.

## Les ports 80 et 443, et HTTPS

**HTTPS** est HTTP enveloppé dans une couche de chiffrement, **TLS** (*Transport Layer Security*) : le contenu des échanges devient illisible pour quiconque intercepte le trafic en route, et le client peut vérifier qu'il parle bien au bon serveur. HTTPS écoute traditionnellement le port `443`. Pour le chiffrement lui-même (clés, certificats), voir [la cryptographie appliquée](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) : le même chapitre montre aussi comment fabriquer un certificat auto-signé, avec la commande `openssl`. Un certificat **auto-signé** est un certificat que vous signez vous-même et que personne d'autre ne reconnaît.

Un serveur HTTPS a besoin de deux fichiers :

| Fichier | Contenu | À protéger ? |
|---|---|---|
| Le certificat | La clé publique du serveur, son nom, et la signature d'une autorité de certification qui atteste le lien entre les deux | Non, il est envoyé à chaque visiteur |
| La clé privée | La clé secrète qui prouve que le serveur est bien le propriétaire du certificat | **Oui, strictement** : quiconque la détient peut se faire passer pour le site |

Le test a été fait avec Apache, un certificat auto-signé pour `a.exemple.test` (obtenu avec la commande `openssl req -x509 ...` du chapitre cité plus haut, avec l'option `-addext "subjectAltName=DNS:a.exemple.test"` qui précise le nom couvert) et deux sites : l'un sur le port `8082` qui redirige, l'autre sur `8443` en HTTPS (les ports `80` et `443` exigent des droits spéciaux, voir plus bas). Extrait de la configuration :

```apache
# Port « HTTP » du test : répond par une redirection vers la version chiffrée
<VirtualHost 127.0.0.1:8082>
    ServerName a.exemple.test
    # Redirect permanent : statut 301 « déplacé définitivement » vers la nouvelle adresse
    Redirect permanent / https://a.exemple.test:8443/
</VirtualHost>

# Port « HTTPS » du test : sert le site
<VirtualHost 127.0.0.1:8443>
    ServerName a.exemple.test
    DocumentRoot "/chemin/vers/apache/site-a"
    # Active le chiffrement TLS sur ce site
    SSLEngine on
    # Le certificat, envoyé à chaque visiteur
    SSLCertificateFile "/chemin/vers/tls/certificat.pem"
    # La clé privée, qui ne quitte jamais le serveur
    SSLCertificateKeyFile "/chemin/vers/tls/cle-privee.pem"
</VirtualHost>
```

Première requête, en HTTP simple :

```bash
curl -s -i --resolve a.exemple.test:8082:127.0.0.1 http://a.exemple.test:8082/
```

```text
HTTP/1.1 301 Moved Permanently
Location: https://a.exemple.test:8443/
```

(Extrait : la réponse contient d'autres en-têtes et un court corps HTML.) Le serveur ne sert pas la page : il répond `301` avec un en-tête `Location` qui donne la nouvelle adresse, et le navigateur la suit. Deuxième requête, en HTTPS, avec `-v` pour voir la négociation TLS (**poignée de main**, *handshake*) et `--cacert` pour dire à curl de faire confiance au certificat auto-signé :

```bash
# --cacert : fait confiance à ce certificat précis, faute d'autorité reconnue
curl -sv --cacert certificat.pem --resolve a.exemple.test:8443:127.0.0.1 \
    https://a.exemple.test:8443/
```

Lignes pertinentes de la sortie (extrait) :

```text
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* TLSv1.3 (IN), TLS handshake, Certificate (11):
* TLSv1.3 (IN), TLS handshake, Finished (20):
*  subject: CN=a.exemple.test
*  subjectAltName: host "a.exemple.test" matched cert's "a.exemple.test"
*  SSL certificate verify ok.
< HTTP/1.1 200 OK
<h1>Site A</h1>
```

Le client salue (*Client hello*), le serveur répond et présente son certificat, les deux se mettent d'accord sur une clé, et seulement ensuite la requête HTTP part, déjà chiffrée. Sans `--cacert`, le même appel échoue :

```text
curl: (60) SSL certificate problem: self-signed certificate
```

C'est le comportement attendu : un certificat que personne de reconnu n'a signé ne prouve rien. Un navigateur afficherait une page d'avertissement.

| Question | Réponse |
|---|---|
| Où obtenir un vrai certificat, gratuit ? | Chez **Let's Encrypt**, une autorité de certification gratuite qui délivre des certificats par un protocole automatique, [ACME](https://datatracker.ietf.org/doc/html/rfc8555) ([documentation](https://letsencrypt.org/docs/)) |
| Qui le renouvelle ? | Un outil (comme [Certbot](https://certbot.eff.org)) qui parle ce protocole et relance le serveur ; les certificats sont de courte durée, donc le renouvellement automatique est indispensable |
| Et chez Caddy ? | Caddy sait demander et renouveler les certificats seul pour un site portant un vrai nom de domaine (**non vérifié** ici, voir sa [documentation](https://caddyserver.com/docs/automatic-https)) |
| Que faire du port 80 ? | Le garder ouvert uniquement pour rediriger vers 443 (et pour la validation du certificat chez certaines méthodes) |

Redirection du port 80 vers le 443 chez nginx (**non vérifié**) :

```nginx
server {
    # Le port HTTP : ne sert aucune page, renvoie seulement vers HTTPS
    listen 80;
    server_name exemple.test;
    # Statut 301 vers la même adresse en https ($host : le nom reçu, $request_uri : le chemin)
    return 301 https://$host$request_uri;
}
```

Un dernier point pratique : sous Linux, un programme ordinaire n'a pas le droit d'écouter un port inférieur à 1024. Cette limite est vérifiable sur la machine de rédaction (`cat /proc/sys/net/ipv4/ip_unprivileged_port_start` affiche `1024`), et le serveur Node, lancé en utilisateur ordinaire après avoir remplacé 8081 par 80 dans `listen`, se plaint :

```text
Error: listen EACCES: permission denied 127.0.0.1:80
```

C'est pourquoi, d'après leur documentation, les serveurs web de production démarrent avec des droits d'administrateur le temps d'ouvrir les ports `80` et `443`, puis confient le travail à des processus aux droits réduits (**non vérifié** : il faudrait les droits d'administrateur pour le reproduire). Le **pare-feu** de la machine doit aussi laisser passer ces ports : voir [le chapitre sur UFW et firewalld](/?c=infrastructure-devops&s=administration-systeme&p=pare-feu-ufw-firewalld). Dans [Docker](/?c=infrastructure-devops&s=docker&p=docker), le port est publié avec `-p 8080:80`, expliqué dans [le chapitre sur les volumes et les réseaux](/?c=infrastructure-devops&s=docker&p=volumes-et-reseaux).

## Processus ouvriers et connexions simultanées

Un site populaire reçoit des milliers de demandes à la seconde. Le serveur ne peut pas traiter les visiteurs un par un en faisant attendre tous les autres. Deux idées se combinent :

- **Plusieurs ouvriers** (*workers*) : un **processus** est un programme en cours d'exécution ; un serveur web en démarre plusieurs qui partagent le travail (voir [les processus](/?c=langages&s=c&p=processus) pour leur fonctionnement). Un processus **maître** (*master*) les lance et les surveille ; les ouvriers traitent les requêtes.
- **Plusieurs connexions par ouvrier** : un ouvrier ne bloque pas en attendant un client lent. Il surveille beaucoup de connexions à la fois et ne s'occupe que de celles qui ont quelque chose à faire. C'est la [boucle d'événements](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante) décrite dans le chapitre sur les sockets.

```text
               +--------------------------+
               |   processus maître       |  lance, surveille, recharge la configuration
               +--------------------------+
                   |        |        |
              +--------+ +--------+ +--------+
              |ouvrier1| |ouvrier2| |ouvrier3|   chacun : une boucle d'événements
              +--------+ +--------+ +--------+
               /  |  \     /  |  \     /  |  \
          connexions   connexions   connexions    (des centaines chacun)
```

> **Analogie :** un serveur de restaurant qui prend une commande, la transmet à la cuisine, puis passe à la table suivante au lieu de rester planté devant la cuisine à attendre le plat.

Le serveur Node de ce chapitre en est un exemple minuscule : il tourne dans un seul processus, mais la route `/lent` attend une seconde avant de répondre. Trois clients la demandent en même temps :

```bash
# time : mesure la durée de la commande entre parenthèses
# for i in 1 2 3; do ... done : répète ce qui est entre do et done pour i = 1, 2, 3
# (voir le chapitre sur les boucles Bash)
# Le & lance chaque requête en parallèle ; wait attend leur fin
time (for i in 1 2 3; do curl -s http://127.0.0.1:8081/lent & done; wait)
```

```text
fini
fini
fini

real    0m1,01s
```

Le temps total mesuré par `time` est de **1,01 seconde**, et non 3 secondes : le serveur n'a pas attendu la fin de la première réponse pour accepter la deuxième. Les trois requêtes ont attendu ensemble.

Chez nginx, deux directives du fichier de configuration donnent la capacité :

| Directive | Rôle | Valeur dans l'exemple |
|---|---|---|
| `worker_processes` | Nombre d'ouvriers (en pratique, un par cœur du processeur, c'est-à-dire par unité de calcul de la puce) | `auto` |
| `worker_connections` | Nombre maximal de connexions par ouvrier | `1024` |

Le plafond théorique de connexions simultanées est leur produit : 4 cœurs × 1024 connexions = 4096 (**non vérifié**, nginx n'est pas installé ; le plafond réel dépend aussi du système, voir ci-dessous). Chaque connexion ouverte consomme un [descripteur de fichier](/?c=langages&s=c&p=appels-systeme-et-descripteurs), et le système en limite le nombre par processus (voir [les garde-fous de ressources](/?c=infrastructure-devops&s=administration-systeme&p=garde-fous-de-ressources) pour les limites). Une valeur de `worker_connections` supérieure à cette limite ne sert donc à rien.

Apache offre au choix plusieurs façons de travailler, appelées **MPM** (*Multi-Processing Module*), c'est-à-dire un module qui décide comment les processus et les **threads** (des fils d'exécution parallèles à l'intérieur d'un même processus) se répartissent les connexions :

| MPM | Fonctionnement (d'après la documentation d'Apache) | Remarque |
|---|---|---|
| `prefork` | Un processus par connexion, sans thread | Robuste, gourmand en mémoire ; imposé par certains modules anciens |
| `worker` | Plusieurs processus, chacun avec plusieurs threads | Moins de mémoire que `prefork` |
| `event` | Comme `worker`, mais les connexions inactives sont gérées à part pour libérer les threads | Choix courant aujourd'hui |

Sur la machine de rédaction, la commande `apache2 -f httpd.conf -V` rapporte `Server MPM: event`, et la commande `ps -o pid,ppid,comm` (qui liste les processus) montre, pendant le test, un parent et plusieurs enfants. Le PID est le numéro d'identification d'un processus, le PPID celui de son processus parent :

```text
    PID    PPID COMMAND
  84277   84275 apache2
  84278   84277 apache2
  84279   84277 apache2
  84354   84277 apache2
```

Les processus 84278, 84279 et 84354 sont les enfants du processus 84277. Les descriptions de `prefork` et `worker` ci-dessus sont **non vérifiées** ici : seul `event` était disponible dans ce test.

> **Piège :** régler `worker_connections` très haut sans regarder la mémoire disponible : chaque connexion en consomme un peu, et une machine saturée ralentit tout le site. Pour les attaques qui visent précisément à saturer un serveur, voir [la surcharge et le déni de service applicatif](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif).

## Les journaux d'accès et d'erreur

Un serveur web écrit en continu ce qu'il fait dans des fichiers texte, les **journaux** (*logs*). Ils répondent à la question « que s'est-il passé, et pour qui ? ». Il y en a toujours deux :

| Journal | Contenu | Quand le lire |
|---|---|---|
| Journal d'**accès** (*access log*) | Une ligne par requête reçue : qui, quand, quoi, quel statut | Voir qui visite, repérer les `404`, mesurer le trafic |
| Journal d'**erreurs** (*error log*) | Les problèmes rencontrés par le serveur lui-même et son démarrage | Un site qui répond `500`, un serveur qui ne démarre pas |

Emplacement habituel (celui d'Apache est vérifié sur la machine de rédaction, les deux autres sont **non vérifiés**) :

| Serveur | Accès | Erreurs |
|---|---|---|
| Apache (Debian, Ubuntu) | `/var/log/apache2/access.log` | `/var/log/apache2/error.log` |
| nginx | `/var/log/nginx/access.log` | `/var/log/nginx/error.log` |
| Caddy | Désactivé par défaut, configurable dans le `Caddyfile` | Affichées dans le terminal où Caddy tourne |

### Lire une ligne du journal d'accès

nginx et Apache (Debian) écrivent par défaut au format **combined** (« combiné »), Caddy écrit en JSON. Voici dix lignes obtenues pendant les essais de ce chapitre : dix requêtes envoyées à un site Apache de deux pages (`/` et `/contact.html`), dont trois vers des pages qui n'existent pas. Le format est défini dans la configuration de test par :

```apache
# Définit un format nommé « combined » : chaque % est une variable remplacée par une valeur
LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\"" combined
```

```text
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET / HTTP/1.1" 200 16 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /contact.html HTTP/1.1" 200 9 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET / HTTP/1.1" 200 16 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /contact.html HTTP/1.1" 200 9 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /absent.html HTTP/1.1" 404 196 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /wp-login.php HTTP/1.1" 404 196 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET / HTTP/1.1" 200 16 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /contact.html HTTP/1.1" 200 9 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET /.env HTTP/1.1" 404 196 "-" "testeur"
127.0.0.1 - - [31/Oct/2026:21:14:30 +0100] "GET / HTTP/1.1" 200 16 "https://x.test/" "Mozilla"
```

Découpage de la dernière ligne :

| Morceau | Variable | Signification |
|---|---|---|
| `127.0.0.1` | `%h` | L'adresse IP du client |
| `-` (premier) | `%l` | Identité du client selon un ancien protocole, presque toujours absente (`-`) |
| `-` (second) | `%u` | Nom d'utilisateur, si le site demande une authentification (sinon `-`) |
| `[31/Oct/2026:21:14:30 +0100]` | `%t` | Date et heure de la requête, avec le décalage horaire |
| `"GET / HTTP/1.1"` | `%r` | La ligne de requête : méthode, chemin, version |
| `200` | `%>s` | Le code de statut de la réponse |
| `16` | `%b` | La taille du corps envoyé, en octets (`-` si aucun) |
| `"https://x.test/"` | `%{Referer}i` | La page d'où vient le visiteur (`-` si inconnue) |
| `"Mozilla"` | `%{User-Agent}i` | Le logiciel du client |

L'en-tête s'écrit `Referer`, avec un seul `r` central : c'est une faute d'orthographe présente dès l'origine de la norme, conservée depuis.

Notez les lignes `404` : `/wp-login.php` (la page de connexion de [WordPress](https://wordpress.org), un logiciel très répandu pour créer des sites) et `/.env` (un fichier qui contient souvent les mots de passe et clés d'accès d'une application, voir [la gestion des secrets](/?c=securite&s=cybersecurite&p=gestion-des-secrets)) n'existent pas sur ce site, mais des robots les demandent partout sur Internet, en espérant tomber sur une page d'administration ou un fichier de secrets mal protégé. Ces `404` sont donc **normales** et sans conséquence. Une ligne `/.env` avec un statut `200` serait au contraire grave : un fichier qui ne devait pas être publié l'est.

### Lire une ligne du journal d'erreurs

Pour voir plus de détails, Apache accepte un **niveau de journalisation** (`LogLevel info`) : plus le niveau est proche de `debug`, plus le journal est bavard. Les niveaux, du plus grave au plus bavard, sont `emerg`, `alert`, `crit`, `error`, `warn`, `notice`, `info`, `debug` (nginx les reprend de la même façon : **non vérifié**). Deux requêtes provoquent deux lignes du journal d'erreurs ; la première correspond à un fichier absent, la seconde à une adresse contenant `../` (une tentative de sortir du dossier du site pour atteindre `/etc/passwd`, le fichier qui liste les comptes d'un système Linux) :

```text
[Sat Oct 31 21:07:24.865848 2026] [core:info] [pid 81231:tid 134962096056000]
    [client 127.0.0.1:52190] AH00128: File does not exist: [...]/site-a/absent.html
[Sat Oct 31 21:07:24.871139 2026] [core:error] [pid 81320:tid 134962096056000]
    [client 127.0.0.1:52192] AH10244: invalid URI path (/../../etc/passwd)
```

(Chaque entrée tient sur une seule ligne dans le vrai fichier ; elle est coupée ici pour la lecture, et le chemin d'un dossier temporaire est abrégé en `[...]`.) Les morceaux, de gauche à droite : l'heure, `[module:niveau]`, le numéro du processus (`pid`) et du fil d'exécution (`tid`) qui a traité la requête, le client, un code propre à Apache (`AH...`), puis le message. Ce code est précieux : on le cherche tel quel dans la [documentation](https://httpd.apache.org/docs/current/) ou sur Internet.

### Fouiller un journal avec des commandes

Un journal peut contenir des millions de lignes : on ne le lit pas à l'œil. Les outils du [traitement de texte en Bash](/?c=langages&s=bash&p=traitement-de-texte) (`grep`, `awk`, `sort`, `uniq`) et les [pipes](/?c=langages&s=bash&p=redirections-et-pipes) (`|`, qui envoie la sortie d'une commande à l'entrée de la suivante) suffisent. Dans le format `combined`, `awk` numérote les colonnes séparées par des espaces : `$7` est le chemin, `$9` le statut.

```bash
# Suit le journal en direct (Ctrl+C pour arrêter) : voir les requêtes arriver
tail -f /var/log/apache2/access.log
# Compte les requêtes par statut : extrait la colonne 9, trie, compte les doublons
# sort -rn : -n trie par valeur numérique, -r inverse l'ordre (le plus grand d'abord)
awk '{print $9}' access-a.log | sort | uniq -c | sort -rn
```

```text
      7 200
      3 404
```

```bash
# Quels chemins ont provoqué un 404 ? (colonne 9 égale à 404, on affiche le chemin)
awk '$9==404 {print $7}' access-a.log | sort | uniq -c | sort -rn
```

```text
      1 /wp-login.php
      1 /.env
      1 /absent.html
```

```bash
# Les trois pages les plus demandées (head -n 3 : garde les trois premières lignes)
awk '{print $7}' access-a.log | sort | uniq -c | sort -rn | head -3
```

```text
      4 /
      3 /contact.html
      1 /wp-login.php
```

| Commande | Rôle |
|---|---|
| `tail -f fichier` | Affiche la fin du fichier et la met à jour en direct (*follow*) |
| `tail -n 50 fichier` | Affiche les 50 dernières lignes |
| `grep ' 500 ' fichier` | Garde les lignes qui contiennent le statut `500` |
| `awk '{print $1}' fichier \| sort \| uniq -c` | Compte les requêtes par adresse IP |
| `sort -rn` | Trie par nombre décroissant (le plus fréquent en premier) |
| `head -n 3` | Garde les 3 premières lignes |

Quand les journaux de dizaines de machines doivent être lus ensemble, on les centralise dans un outil dédié : voir [l'agrégation de logs avec ELK](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs).

### Les journaux grossissent : la rotation

Un journal ne fait que grandir. Sans précaution, il finit par remplir le disque, et un disque plein arrête le site. La **rotation** consiste à renommer régulièrement le fichier courant (`error.log` devient `error.log.1`), à en démarrer un neuf, à compresser les anciens (`.gz` : fichier compressé avec gzip) et à supprimer les plus vieux. Sur la machine de rédaction, le dossier d'Apache montre le résultat de cette opération :

```text
access.log   error.log   error.log.1   error.log.2.gz   error.log.3.gz
error.log.4.gz   other_vhosts_access.log
```

Sous Linux, c'est le programme [`logrotate`](https://github.com/logrotate/logrotate) qui s'en charge d'après ses propres fichiers de configuration (comportement général ; sa configuration n'est pas détaillée ici). Les journaux d'accès contiennent des adresses IP de visiteurs, qui sont des **données personnelles** au sens du [**RGPD**](https://www.cnil.fr/fr/reglement-europeen-protection-donnees) (le règlement européen sur la protection des données personnelles) : on ne les garde pas indéfiniment et on n'en donne l'accès qu'à ceux qui en ont besoin.

## Les pièges

| Piège | Pourquoi c'est un problème | Que faire |
|---|---|---|
| Modifier la configuration puis recharger sans tester | Une erreur de syntaxe peut empêcher le redémarrage et couper le site | Toujours lancer `nginx -t` ou `apache2 -t` avant le rechargement |
| Oublier le point-virgule final d'une directive nginx | Le fichier est refusé, le serveur ne démarre pas | Relire le message d'erreur : il donne le numéro de ligne |
| Servir un dossier trop large | `root /var/www` publie tout ce qui s'y trouve, y compris des fichiers de sauvegarde ou de secrets | Ne publier que le dossier du site, et ne jamais y laisser de `.env` ni d'archive |
| Un site par défaut qui sert un vrai site | Quelqu'un qui connaît seulement l'adresse IP voit un site qu'il ne devait pas voir | Déclarer un premier site « poubelle » (réponse vide ou erreur) |
| `EADDRINUSE` au démarrage | Le port est déjà pris par un autre programme (souvent l'ancienne instance du même serveur) | Arrêter l'autre programme ou changer de port |
| Confondre un message de curl et un statut HTTP | `Failed to connect` n'est pas un statut : personne n'écoute | Vérifier d'abord que le serveur tourne et écoute le bon port |
| Journal qui grossit sans fin | Un disque plein arrête le site | Mettre en place la rotation, surveiller l'espace disque |
| Clé privée lisible par tous ou envoyée dans un dépôt | Quiconque la lit peut se faire passer pour le site | Droits restreints au seul compte du serveur, jamais dans un dépôt Git |
| Certificat expiré | Les navigateurs affichent un avertissement ou bloquent le site | Renouvellement automatique et surveillance de la date d'expiration |

Le message `EADDRINUSE` se reproduit en lançant deux fois le serveur de ce chapitre :

```text
Error: listen EADDRINUSE: address already in use 127.0.0.1:8081
```

## Bonnes pratiques

| Pratique | Raison |
|---|---|
| Tester la configuration avant de recharger (`nginx -t`, `apache2 -t`) | Une erreur est détectée avant d'avoir des effets |
| Recharger plutôt que redémarrer (`nginx -s reload`) | Les visiteurs en cours ne sont pas coupés |
| Rediriger systématiquement le port 80 vers le 443 | Aucune page n'est jamais servie sans chiffrement |
| Automatiser le renouvellement des certificats | Un certificat qui expire coupe le site, et personne ne pense à le refaire à la main |
| Garder la configuration dans un dépôt [Git](/?c=qualite-performance-et-outils&s=git&p=concepts-de-base) | On voit qui a changé quoi et on peut revenir en arrière |
| Lire le journal d'erreurs en premier quand un site répond `500` | Il dit pourquoi, alors que le navigateur ne dit rien |
| Faire écouter le serveur d'application sur `127.0.0.1` quand il n'a pas à être public | Seule la machine peut le joindre ; le serveur web, placé devant, relaie les requêtes (voir [le proxy inverse](/?c=infrastructure-devops&s=serveurs-web&p=proxy-inverse-et-limitation-de-debit)) |
| Garder le serveur web à jour | Un serveur exposé à Internet est scanné en permanence |
| Ajouter un filtre en amont si le site est exposé | Voir [le pare-feu applicatif (WAF)](/?c=securite&s=cybersecurite&p=waf-pare-feu-applicatif), qui s'ajoute au code sécurisé sans le remplacer |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un serveur web est un programme qui écoute un port (`80` pour HTTP, `443` pour HTTPS), reçoit une requête, renvoie une réponse (statut, en-têtes, corps). Il sert des fichiers (statique) ou transmet à un programme d'application (dynamique, par exemple PHP-FPM). L'en-tête `Host` lui permet d'héberger plusieurs sites sur une même adresse. Il répartit le travail entre plusieurs processus ouvriers qui gèrent chacun beaucoup de connexions. Il écrit un journal d'accès (une ligne par requête) et un journal d'erreurs. |
| **Pièges à éviter** | Recharger sans tester la configuration. Laisser un site par défaut qui sert un vrai contenu. Publier un dossier trop large. Exposer une clé privée. Oublier la rotation des journaux. Prendre un `404` de robot pour un bug. |
| **Bonnes pratiques** | Tester puis recharger. Tout passer en HTTPS avec un renouvellement automatique du certificat. Lire le journal d'erreurs avant de chercher ailleurs. Surveiller l'espace disque et conserver la configuration dans Git. |

## Dans cette sous-section

Cette sous-section, « Serveurs web », compte ce chapitre d'introduction et deux chapitres qui le complètent :

| Chapitre | Sujet |
|---|---|
| [Codes de statut et en-têtes de contrôle](/?c=infrastructure-devops&s=serveurs-web&p=codes-de-statut-et-en-tetes-de-controle) | Les statuts HTTP en détail et les en-têtes qui pilotent le comportement du client, comme `Retry-After` |
| [Proxy inverse et limitation de débit](/?c=infrastructure-devops&s=serveurs-web&p=proxy-inverse-et-limitation-de-debit) | Placer un serveur devant d'autres serveurs, et limiter le nombre de requêtes acceptées |
